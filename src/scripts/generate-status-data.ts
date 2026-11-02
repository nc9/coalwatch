import type { StatusData, UnitStatusInterval } from "@/server/types"
import { ACTIVE_THRESHOLD_MW } from "@/utils/constants"
import { debug, debugError, debugWarn } from "@/utils/debug"
import { TZDate } from "@date-fns/tz"
import { OpenElectricityClient } from "openelectricity"
import { put } from "@vercel/blob"
import { writeFileSync } from "node:fs"

const client = new OpenElectricityClient()

const NETWORKS: { id: "NEM" | "WEM"; timezone: string }[] = [
  { id: "NEM", timezone: "+10:00" },
  { id: "WEM", timezone: "+08:00" },
]
const LOOKBACK_HOURS = 48
const BUCKET_MINUTES = 30

function formatDate(date: Date, timezone: string): string {
  const networkDate = new TZDate(date, timezone)
  return networkDate.toISOString().split(".")[0]
}

function floorTo30Min(date: Date): string {
  const d = new Date(date)
  const minutes = d.getUTCMinutes()
  d.setUTCMinutes(minutes - (minutes % BUCKET_MINUTES), 0, 0)
  return d.toISOString()
}

export async function generateStatusData(): Promise<StatusData> {
  try {
    debug("Starting status data generation...")

    const facilityCodesByNetwork = new Map<string, Set<string>>()
    const unitCapacities: Record<string, number> = {}
    const unitNetwork: Record<string, string> = {}

    for (const { id } of NETWORKS) {
      const facilityResponse = await client.getFacilities({
        network_id: [id],
        status_id: ["operating"],
        fueltech_id: ["coal_black", "coal_brown"],
      })

      const records = facilityResponse.table.getRecords()
      debug(`Found ${records.length} ${id} facility records`)

      const codes = new Set<string>()
      for (const record of records) {
        if (record.facility_code) codes.add(record.facility_code)
        if (record.unit_code && record.unit_capacity) {
          unitCapacities[record.unit_code] = record.unit_capacity
          unitNetwork[record.unit_code] = id
        }
      }
      facilityCodesByNetwork.set(id, codes)
      debug(`Found ${codes.size} ${id} facilities`)
    }

    const now = new Date()
    const endDate = now
    const startDate = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000)

    debug(
      `Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`
    )

    // Fetch in 2 x 24h chunks to be safe
    const allRows: Record<string, unknown>[] = []
    const chunkMs = 24 * 60 * 60 * 1000
    let currentStart = startDate

    while (currentStart < endDate) {
      const currentEnd = new Date(
        Math.min(currentStart.getTime() + chunkMs, endDate.getTime())
      )

      for (const { id, timezone } of NETWORKS) {
        const codes = facilityCodesByNetwork.get(id)
        if (!codes || codes.size === 0) continue

        debug(
          `Fetching ${id} chunk from ${formatDate(currentStart, timezone)} to ${formatDate(currentEnd, timezone)}`
        )

        try {
          const { datatable } = await client.getFacilityData(
            id,
            Array.from(codes),
            ["power"],
            {
              interval: "5m",
              dateStart: formatDate(currentStart, timezone),
              dateEnd: formatDate(currentEnd, timezone),
            }
          )

          if (datatable) {
            const rows = datatable.getRows()
            debug(`Got ${rows.length} ${id} rows for this chunk`)
            allRows.push(...rows)
          }
        } catch (chunkError: unknown) {
          debugWarn(
            `Failed to fetch ${id} chunk: ${chunkError instanceof Error ? chunkError.message : chunkError}`
          )
        }
      }

      currentStart = new Date(currentEnd.getTime() + 60 * 1000)
    }

    debug(`Got ${allRows.length} total rows`)

    // Aggregate 5m rows into 30min buckets per unit
    const buckets: Record<
      string,
      Map<string, { totalPower: number; maxPower: number; count: number }>
    > = {}

    for (const row of allRows) {
      const unitCode = row.unit_code as string
      const power = row.power as number
      const interval = row.interval as Date

      if (!unitCode || !interval) continue
      if (typeof power !== "number" || isNaN(power)) continue

      if (!buckets[unitCode]) buckets[unitCode] = new Map()

      const bucketKey = floorTo30Min(interval)
      const bucket = buckets[unitCode].get(bucketKey) || {
        totalPower: 0,
        maxPower: 0,
        count: 0,
      }

      bucket.totalPower += Math.max(0, power)
      bucket.maxPower = Math.max(bucket.maxPower, power)
      bucket.count += 1
      buckets[unitCode].set(bucketKey, bucket)
    }

    // Build status intervals per unit
    const status: Record<string, UnitStatusInterval[]> = {}
    const expectedIntervals = (LOOKBACK_HOURS * 60) / BUCKET_MINUTES // 96

    // A bucket where NO unit in a network has any data is a feed/backend gap
    // for that network, not an outage
    const bucketsWithData: Record<string, Set<string>> = {}
    for (const [unitCode, bucketMap] of Object.entries(buckets)) {
      const network = unitNetwork[unitCode] ?? "NEM"
      bucketsWithData[network] ??= new Set<string>()
      for (const [key, b] of bucketMap) {
        if (b.count > 0) bucketsWithData[network].add(key)
      }
    }

    for (const [unitCode, bucketMap] of Object.entries(buckets)) {
      const capacity = unitCapacities[unitCode] || 0
      const intervals: UnitStatusInterval[] = []

      // Generate all 96 intervals
      for (let i = 0; i < expectedIntervals; i++) {
        const intervalTime = new Date(
          startDate.getTime() + i * BUCKET_MINUTES * 60 * 1000
        )
        const key = floorTo30Min(intervalTime)
        const bucket = bucketMap.get(key)

        if (bucket && bucket.count > 0) {
          const avgPower = bucket.totalPower / bucket.count
          intervals.push({
            timestamp: key,
            active: bucket.maxPower > ACTIVE_THRESHOLD_MW,
            power: Math.round(avgPower * 10) / 10,
            capacityFactor:
              capacity > 0
                ? Math.min(1, Math.max(0, avgPower / capacity))
                : undefined,
          })
        } else if (!bucketsWithData[unitNetwork[unitCode] ?? "NEM"]?.has(key)) {
          intervals.push({ timestamp: key, active: false, noData: true })
        } else {
          intervals.push({
            timestamp: key,
            active: false,
          })
        }
      }

      status[unitCode] = intervals
    }

    debug(`Generated status for ${Object.keys(status).length} units`)

    const statusData: StatusData = {
      status,
      intervalMinutes: BUCKET_MINUTES,
      lastUpdated: new Date().toISOString(),
    }

    const jsonString = JSON.stringify(statusData, null, 2)

    // Local preview: write to a file instead of the production blob
    if (process.env.DRY_RUN_OUT) {
      writeFileSync(process.env.DRY_RUN_OUT, jsonString)
      debug(`Dry run: wrote ${process.env.DRY_RUN_OUT}`)
      return statusData
    }
    const { url } = await put("data/status.json", jsonString, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    })

    debug(`Status data successfully written to ${url}`)
    return statusData
  } catch (error) {
    debugError("Error generating status data:", error)
    throw error
  }
}

if (require.main === module) {
  generateStatusData()
    .then(() => {
      debug("Status generation complete")
      process.exit(0)
    })
    .catch((error) => {
      debugError("Status generation failed:", error)
      process.exit(1)
    })
}
