import type { StatusData, UnitStatusInterval } from "@/server/types"
import { debug, debugError, debugWarn } from "@/utils/debug"
import { TZDate } from "@date-fns/tz"
import { OpenElectricityClient } from "openelectricity"
import { put } from "@vercel/blob"

const client = new OpenElectricityClient()

const NETWORK_TIMEZONE = "+10:00"
const LOOKBACK_HOURS = 48
const BUCKET_MINUTES = 30
const ACTIVE_THRESHOLD_MW = 5

function formatDate(date: Date): string {
  const networkDate = new TZDate(date, NETWORK_TIMEZONE)
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

    const facilityResponse = await client.getFacilities({
      network_id: ["NEM"],
      status_id: ["operating"],
      fueltech_id: ["coal_black", "coal_brown"],
    })

    const records = facilityResponse.table.getRecords()
    debug(`Found ${records.length} facility records`)

    const facilityCodes = new Set<string>()
    const unitCapacities: Record<string, number> = {}

    for (const record of records) {
      if (record.facility_code) facilityCodes.add(record.facility_code)
      if (record.unit_code && record.unit_capacity) {
        unitCapacities[record.unit_code] = record.unit_capacity
      }
    }

    debug(`Found ${facilityCodes.size} facilities`)

    const now = new Date()
    const endDate = now
    const startDate = new Date(
      now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000
    )

    debug(
      `Fetching data from ${formatDate(startDate)} to ${formatDate(endDate)}`
    )

    // Fetch in 2 x 24h chunks to be safe
    const allRows: Record<string, unknown>[] = []
    const chunkMs = 24 * 60 * 60 * 1000
    let currentStart = startDate

    while (currentStart < endDate) {
      const currentEnd = new Date(
        Math.min(currentStart.getTime() + chunkMs, endDate.getTime())
      )

      debug(
        `Fetching chunk from ${formatDate(currentStart)} to ${formatDate(currentEnd)}`
      )

      try {
        const { datatable } = await client.getFacilityData(
          "NEM",
          Array.from(facilityCodes),
          ["power"],
          {
            interval: "5m",
            dateStart: formatDate(currentStart),
            dateEnd: formatDate(currentEnd),
          }
        )

        if (datatable) {
          const rows = datatable.getRows()
          debug(`Got ${rows.length} rows for this chunk`)
          allRows.push(...rows)
        }
      } catch (chunkError: unknown) {
        debugWarn(`Failed to fetch chunk: ${chunkError instanceof Error ? chunkError.message : chunkError}`)
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
