import { OpenElectricityClient } from "@openelectricity/client"
import { toZonedTime } from "date-fns-tz"
import { put } from "@vercel/blob"
import type { Facility, FacilityData } from "@/server/types"
import { debug, debugWarn, debugError } from "@/utils/debug"

const client = new OpenElectricityClient()

// Network timezone (Brisbane has no daylight savings and is effectively +10)
const NETWORK_TIMEZONE = "Australia/Brisbane"

/**
 * Converts a UTC date to network time (+10) string
 * For dates from the API that are already in +10 but marked as UTC,
 * just change the timezone marker.
 */
function toNetworkTime(
    date: Date,
    isAlreadyNetworkTime: boolean = false,
): string {
    if (isAlreadyNetworkTime) {
        // For dates already in network time (like unit_last_seen), just change marker
        return date.toISOString().replace("Z", "+10:00")
    }
    // For actual UTC dates (like interval), add 10 hours then mark as +10
    const networkDate = new Date(date.getTime() + 10 * 60 * 60 * 1000)
    return networkDate.toISOString().replace("Z", "+10:00")
}

/**
 * Check if a unit is active based on its last seen time
 * Note: lastSeen is marked as UTC but is actually +10
 */
function isUnitActive(lastSeen: string, currentNetworkTime: Date): boolean {
    // Since lastSeen is already in network time, just parse it directly
    const lastSeenDate = new Date(lastSeen.replace("+10:00", "Z"))
    const oneHourAgo = new Date(currentNetworkTime.getTime() - 60 * 60 * 1000)
    return lastSeenDate > oneHourAgo
}

/**
 * Fetches power data for a facility
 */
async function getFacilityPowerData(stationCode: string, unitLastSeen: string) {
    // Use last seen time just to get a window of data to query
    const lastSeenDate = new Date(unitLastSeen)
    const firstInterval = new Date(lastSeenDate)
    firstInterval.setHours(firstInterval.getHours() - 1)

    try {
        const { datatable } = await client.getFacilityData(
            "NEM",
            stationCode,
            ["power"],
            {
                interval: "5m",
                dateStart: firstInterval.toISOString(),
                dateEnd: lastSeenDate.toISOString(),
            },
        )

        if (!datatable) {
            debugError(`No datatable returned for ${stationCode}`)
            return new Map<string, { power: number; interval: Date }>()
        }

        // Group rows by unit to find most recent valid reading for each
        const unitRows = new Map<string, { power: number; date: Date }[]>()
        const rows = datatable.getRows()

        rows.forEach((row) => {
            if (
                typeof row.unit_code === "string" &&
                typeof row.power === "number" &&
                row.interval instanceof Date
            ) {
                if (!unitRows.has(row.unit_code)) {
                    unitRows.set(row.unit_code, [])
                }
                unitRows.get(row.unit_code)?.push({
                    power: row.power,
                    date: row.interval,
                })
            } else {
                debugWarn(`Invalid row data for ${stationCode}:`, {
                    unit_code: row.unit_code,
                    power: row.power,
                    interval: row.interval,
                })
            }
        })

        // Get most recent valid reading for each unit
        const powerByUnit = new Map<string, { power: number; interval: Date }>()
        unitRows.forEach((readings, unitCode) => {
            // Sort by date descending to get most recent first
            readings.sort((a, b) => b.date.getTime() - a.date.getTime())

            // Take first reading that has a valid power value
            const validReading = readings.find((r) => r.power >= 0)
            if (validReading) {
                powerByUnit.set(unitCode, {
                    power: validReading.power,
                    interval: validReading.date,
                })
            }
        })

        return powerByUnit
    } catch (error) {
        debugError(`Error fetching power data for ${stationCode}:`, error)
        return new Map<string, { power: number; interval: Date }>()
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
                    rawLastSeen: record.unit_last_seen,
                    lastSeen: toNetworkTime(
                        new Date(record.unit_last_seen),
                        true,
                    ),
                    status: record.unit_status,
                    active: false,
                })
            }
        })

        // Second pass: fetch and add power data for each facility
        const facilities = Array.from(facilitiesMap.values())

        // Get current network time to check if units are active
        const now = new Date()
        const currentNetworkTime = toZonedTime(now, NETWORK_TIMEZONE)

        for (const facility of facilities) {
            facility.units = await Promise.all(
                facility.units.map(async (unit) => {
                    // First check if unit is active based on data_last_seen
                    const isActive = isUnitActive(
                        unit.lastSeen,
                        currentNetworkTime,
                    )
                    debug(
                        `${facility.name} - ${unit.code}: Raw data_last_seen ${
                            unit.rawLastSeen
                        }, Converted ${unit.lastSeen} - ${
                            isActive ? "ACTIVE" : "INACTIVE"
                        }`,
                    )

                    if (!isActive) {
                        return {
                            ...unit,
                            active: false,
                        }
                    }

                    const powerData = await getFacilityPowerData(
                        facility.code,
                        unit.lastSeen,
                    )

                    const data = powerData.get(unit.code)
                    if (!data) {
                        debug(
                            `${facility.name} - ${unit.code}: No current power data`,
                        )
                        return {
                            ...unit,
                            active: false,
                        }
                    }

                    const latestInterval = toNetworkTime(data.interval, true)

                    // Warn about excessive power but still show the reading
                    if (data.power > unit.capacity) {
                        debugWarn(
                            `Power reading ${data.power}MW exceeds capacity ${unit.capacity}MW for unit ${unit.code} in ${facility.name}`,
                        )
                    }

                    const capacityFactor = (data.power / unit.capacity) * 100

                    debug(
                        `${facility.name} - ${unit.code}: Latest interval ${latestInterval} (${data.power}MW)`,
                    )

                    return {
                        ...unit,
                        currentPower: data.power,
                        capacityFactor,
                        latestInterval,
                        active: true,
                    }
                }),
            )
        }

        const data: FacilityData = {
            facilities,
            lastUpdated: toNetworkTime(new Date()),
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
