import type { Facility, FacilityData } from "@/server/types"
import { debug, debugError, debugWarn } from "@/utils/debug"
import { TZDate } from "@date-fns/tz"
import { OpenElectricityClient } from "@openelectricity/client"
import { put } from "@vercel/blob"

const client = new OpenElectricityClient()

// Network timezone (Brisbane has no daylight savings and is effectively +10)
const NETWORK_TIMEZONE = "+10:00"

/**
 * Check if a unit is active based on its last seen time
 */
function isUnitActive(lastSeen: string, currentNetworkTime: Date): boolean {
  // Parse the lastSeen date, which includes timezone info
  const lastSeenDate = new Date(lastSeen)
  // Compare with network time minus one hour
  const oneHourAgo = new Date(currentNetworkTime.getTime() - 60 * 60 * 1000)
  debug(
    `Checking if unit is active: lastSeen=${lastSeen}, oneHourAgo=${oneHourAgo.toISOString()}`
  )
  return lastSeenDate > oneHourAgo
}

/**
 * Format date as timezone-naive (YYYY-MM-DDTHH:mm:ss) in network time
 */
function formatDate(date: Date): string {
  // Convert to network time first
  const networkDate = new TZDate(date, NETWORK_TIMEZONE)
  return networkDate.toISOString().split(".")[0] // Remove milliseconds and timezone
}

/**
 * Get current network time
 */
function getCurrentNetworkTime(): Date {
  const now = new Date()
  const networkDate = new TZDate(now, NETWORK_TIMEZONE)
  return networkDate
}

/**
 * Fetches power data for all facilities
 */
async function getFacilityPowerData(
  facilityCodes: string[],
  lastSeenDates: Map<string, string>
) {
  try {
    // Find the latest lastSeen date to use as the query window
    const latestLastSeen = new Date(
      Math.max(
        ...Array.from(lastSeenDates.values()).map((d) => new Date(d).getTime())
      )
    )
    const firstInterval = new Date(latestLastSeen.getTime() - 60 * 60 * 1000) // One hour before

    debug(
      `Fetching power data for ${facilityCodes.length} facilities from ${formatDate(firstInterval)} to ${formatDate(latestLastSeen)}`
    )

    const { datatable } = await client.getFacilityData(
      "NEM",
      facilityCodes,
      ["power"],
      {
        interval: "5m",
        dateStart: formatDate(firstInterval),
      }
    )

    if (!datatable) {
      debugError(`No datatable returned for facilities`)
      return new Map<string, { power: number; interval: string }>()
    }

    // Get most recent valid reading for each unit
    const powerByUnit = new Map<string, { power: number; interval: string }>()
    const rows = datatable.getRows()

    debug(`Got ${rows.length} rows of power data`)

    // Group by unit and find latest reading
    const unitReadings = rows.reduce(
      (acc, row) => {
        const unitCode = row.unit_code as string
        const power = row.power as number
        const interval = row.interval as Date

        if (!acc[unitCode]) {
          acc[unitCode] = []
        }

        if (typeof power === "number" && !isNaN(power) && interval) {
          acc[unitCode].push({
            power,
            date: interval.toISOString(),
          })
        }
        return acc
      },
      {} as Record<string, { power: number; date: string }[]>
    )

    // Find latest valid reading for each unit
    Object.entries(unitReadings).forEach(([unitCode, readings]) => {
      // Sort by date descending
      readings.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      // Take first reading with positive power
      const validReading = readings.find((r) => r.power >= 0)
      if (validReading) {
        powerByUnit.set(unitCode, {
          power: validReading.power,
          interval: validReading.date,
        })
      }
    })

    debug(`Found power data for ${powerByUnit.size} units`)
    return powerByUnit
  } catch (error) {
    debugError(`Error fetching power data:`, error)
    throw error
  }
}

/**
 * Generates complete facility data including power outputs
 */
export async function generateData(): Promise<FacilityData> {
  try {
    // Get all facilities
    debug("Fetching facility list...")
    const facilityResponse = await client.getFacilities({
      network_id: ["NEM"],
      status_id: ["operating"],
      fueltech_id: ["coal_black", "coal_brown"],
    })

    const records = facilityResponse.table.getRecords()
    debug(`Found ${records.length} facility records`)
    const facilitiesMap = new Map<string, Facility>()
    const lastSeenDates = new Map<string, string>()

    // First pass: create facilities with units
    records.forEach((record) => {
      if (
        record.unit_capacity === null ||
        record.unit_last_seen === null ||
        record.unit_status === null ||
        record.unit_code === null
      ) {
        debugWarn(`Skipping record with null values:`, record)
        return
      }

      if (!facilitiesMap.has(record.facility_code)) {
        facilitiesMap.set(record.facility_code, {
          name: record.facility_name,
          code: record.facility_code,
          region: record.facility_region,
          units: [],
          lastUpdated: new Date().toISOString(),
        })
      }

      const facility = facilitiesMap.get(record.facility_code)
      if (facility) {
        facility.units.push({
          code: record.unit_code,
          capacity: record.unit_capacity,
          lastSeen: record.unit_last_seen,
          status: record.unit_status,
          active: false,
        })
        lastSeenDates.set(record.facility_code, record.unit_last_seen)
      }
    })

    // Second pass: fetch and add power data for all facilities at once
    const facilities = Array.from(facilitiesMap.values())
    const facilityCodes = facilities.map((f) => f.code)

    // Get current network time to check if units are active
    const currentNetworkTime = getCurrentNetworkTime()

    debug(`Current network time: ${currentNetworkTime.toISOString()}`)

    // Fetch power data for all facilities in one request
    const powerData = await getFacilityPowerData(facilityCodes, lastSeenDates)

    // Update each facility's units with power data
    for (const facility of facilities) {
      facility.units = facility.units.map((unit) => {
        // First check if unit is active based on data_last_seen
        const isActive = isUnitActive(unit.lastSeen, currentNetworkTime)
        debug(
          `${facility.name} - ${unit.code}: Last seen ${unit.lastSeen} - ${isActive ? "ACTIVE" : "INACTIVE"}`
        )

        if (!isActive) {
          return {
            ...unit,
            active: false,
            latestInterval: unit.lastSeen, // Use lastSeen as latestInterval for inactive units
          }
        }

        const data = powerData.get(unit.code)
        if (!data) {
          debug(`${facility.name} - ${unit.code}: No current power data`)
          return {
            ...unit,
            active: false,
            latestInterval: unit.lastSeen, // Use lastSeen as latestInterval when no power data
          }
        }

        // Warn about excessive power but still show the reading
        if (data.power > unit.capacity) {
          debugWarn(
            `Power reading ${data.power}MW exceeds capacity ${unit.capacity}MW for unit ${unit.code} in ${facility.name}`
          )
        }

        const capacityFactor = Number(
          ((data.power / unit.capacity) * 100).toFixed(2)
        )

        debug(
          `${facility.name} - ${unit.code}: Latest interval ${data.interval} (${data.power}MW)`
        )

        return {
          ...unit,
          currentPower: data.power,
          capacityFactor,
          latestInterval: data.interval,
          active: true,
        }
      })
    }

    const data: FacilityData = {
      facilities,
      lastUpdated: new Date().toISOString(),
    }

    // Store the data in Vercel Blob
    const jsonString = JSON.stringify(data, null, 2)
    const { url } = await put("data/facilities.json", jsonString, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    })

    debug(`Data successfully written to ${url}`)
    return data
  } catch (error) {
    debugError("Error generating data:", error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  generateData()
}
