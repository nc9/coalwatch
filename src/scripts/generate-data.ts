import { OpenElectricityClient } from "@openelectricity/client"
import { toZonedTime } from "date-fns-tz"
import { put } from "@vercel/blob"
import type { Facility, FacilityData } from "@/server/types"

const client = new OpenElectricityClient({
    apiKey: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_KEY,
    baseUrl: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_URL || "",
})

// Network timezone
const NETWORK_TIMEZONE = "Australia/Sydney"

/**
 * Fetches power data for a facility
 */
async function getFacilityPowerData(stationCode: string, unitLastSeen: string) {
    // Convert the last seen time to a Date (it's already in network time)
    const lastSeenDate = new Date(unitLastSeen)
    const firstInterval = new Date(lastSeenDate)
    firstInterval.setHours(firstInterval.getHours() - 1)

    // Get current network time to check if unit is active
    const now = new Date()
    const currentNetworkTime = toZonedTime(now, NETWORK_TIMEZONE)
    const oneHourAgo = new Date(currentNetworkTime)
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    // If the last seen time is more than an hour ago in network time, unit is down
    if (lastSeenDate < oneHourAgo) {
        return new Map<string, number>()
    }

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
            console.error(`No datatable returned for ${stationCode}`)
            return new Map<string, number>()
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
                console.warn(
                    `Invalid row data for ${stationCode}:`,
                    JSON.stringify({
                        unit_code: row.unit_code,
                        power: row.power,
                        interval: row.interval,
                    }),
                )
            }
        })

        // Get most recent valid reading for each unit
        const powerByUnit = new Map<string, number>()
        unitRows.forEach((readings, unitCode) => {
            // Sort by date descending to get most recent first
            readings.sort((a, b) => b.date.getTime() - a.date.getTime())

            // Take first reading that has a valid power value
            const validReading = readings.find((r) => r.power >= 0)
            if (validReading) {
                powerByUnit.set(unitCode, validReading.power)
            }
        })

        return powerByUnit
    } catch (error) {
        console.error(`Error fetching power data for ${stationCode}:`, error)
        return new Map<string, number>()
    }
}

/**
 * Generates complete facility data including power outputs
 */
export async function generateData(): Promise<FacilityData> {
    try {
        // Get all facilities
        console.log("Fetching facility list...")
        const facilityResponse = await client.getFacilities({
            network_id: ["NEM"],
            status_id: ["operating"],
            fueltech_id: ["coal_black", "coal_brown"],
        })

        const records = facilityResponse.table.getRecords()
        console.log(`Found ${records.length} facility records`)
        const facilitiesMap = new Map<string, Facility>()

        // First pass: create facilities with units
        records.forEach((record) => {
            if (
                record.unit_capacity === null ||
                record.unit_last_seen === null ||
                record.unit_status === null ||
                record.unit_code === null
            ) {
                console.warn(
                    `Skipping record with null values:`,
                    JSON.stringify(record),
                )
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
                })
            }
        })

        // Second pass: fetch and add power data for each facility
        const facilities = Array.from(facilitiesMap.values())

        for (const facility of facilities) {
            facility.units = await Promise.all(
                facility.units.map(async (unit) => {
                    const powerData = await getFacilityPowerData(
                        facility.code,
                        unit.lastSeen,
                    )

                    const power = powerData.get(unit.code)
                    if (power === undefined) {
                        return unit
                    }

                    // Warn about excessive power but still show the reading
                    if (power > unit.capacity) {
                        console.warn(
                            `Power reading ${power}MW exceeds capacity ${unit.capacity}MW for unit ${unit.code} in ${facility.name}`,
                        )
                    }

                    const capacityFactor = (power / unit.capacity) * 100
                    return {
                        ...unit,
                        currentPower: power,
                        capacityFactor,
                    }
                }),
            )
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

        console.log(`Data successfully written to ${url}`)
        return data
    } catch (error) {
        console.error("Error generating data:", error)
        process.exit(1)
    }
}

// Run if called directly
if (require.main === module) {
    generateData()
}
