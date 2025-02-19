import { NetworkCode, OpenElectricityClient } from "@openelectricity/client"
import { subMinutes, setSeconds, setMilliseconds } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { put } from "@vercel/blob"
import type { Facility, FacilityData } from "@/server/types"

const client = new OpenElectricityClient({
    apiKey: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_KEY,
    baseUrl: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_URL || "",
})

const TIMEZONE = "Australia/Sydney"

/**
 * Gets the last complete 5-minute interval in AEST (UTC+10)
 */
function getLastCompleteInterval(): Date {
    const now = new Date()
    const sydneyTime = toZonedTime(now, TIMEZONE)
    const minutes = sydneyTime.getMinutes()
    const roundedMinutes = Math.floor(minutes / 5) * 5
    const result = setMilliseconds(setSeconds(sydneyTime, 0), 0)
    result.setMinutes(roundedMinutes)
    return subMinutes(result, 5)
}

/**
 * Fetches power data for a facility
 */
async function getFacilityPowerData(
    networkId: NetworkCode,
    stationCode: string,
) {
    const lastInterval = getLastCompleteInterval()
    const firstInterval = new Date(lastInterval)
    firstInterval.setHours(firstInterval.getHours() - 1)

    try {
        const { datatable } = await client.getFacilityData(
            networkId,
            stationCode,
            ["power"],
            {
                interval: "5m",
                dateStart: firstInterval.toISOString(),
                dateEnd: lastInterval.toISOString(),
            },
        )

        if (!datatable) return new Map<string, number>()

        const rows = datatable.getRows()
        rows.sort((a, b) => {
            const dateA = a.interval as Date
            const dateB = b.interval as Date
            return dateB.getTime() - dateA.getTime()
        })

        const powerByUnit = new Map<string, number>()
        rows.forEach((row) => {
            if (
                typeof row.unit_code === "string" &&
                typeof row.power === "number" &&
                !powerByUnit.has(row.unit_code)
            ) {
                powerByUnit.set(row.unit_code, row.power)
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
        const facilityResponse = await client.getFacilities({
            status_id: ["operating"],
            fueltech_id: ["coal_black", "coal_brown"],
        })

        const records = facilityResponse.table.getRecords()
        const facilitiesMap = new Map<string, Facility>()

        // First pass: create facilities with units
        records.forEach((record) => {
            if (
                record.unit_capacity === null ||
                record.unit_last_seen === null ||
                record.unit_status === null ||
                record.unit_code === null
            )
                return

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
            const networkId = facility.region === "WEM" ? "WEM" : "NEM"
            const powerData = await getFacilityPowerData(
                networkId as NetworkCode,
                facility.code,
            )

            facility.units = facility.units.map((unit) => {
                const power = powerData.get(unit.code)
                if (power === undefined) return unit

                const capacityFactor = (power / unit.capacity) * 100
                return {
                    ...unit,
                    currentPower: power,
                    capacityFactor,
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

        console.log(`Data written to Vercel Blob: ${url}`)
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
