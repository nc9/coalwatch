import { OpenElectricityClient } from "@openelectricity/client"
import { subHours, subMinutes, setSeconds, setMilliseconds } from "date-fns"
import { format, toZonedTime } from "date-fns-tz"

const client = new OpenElectricityClient({
    apiKey: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_KEY,
    baseUrl: process.env.NEXT_PUBLIC_OPENELECTRICITY_API_URL || "",
})

const TIMEZONE = "Australia/Sydney"

/**
 * Gets the last complete 5-minute interval in AEST (UTC+10)
 * @returns {Date} Date object representing the start of the last complete 5-minute interval
 */
export function getLastCompleteInterval(): Date {
    // Get current time in Sydney timezone
    const now = new Date()
    const sydneyTime = toZonedTime(now, TIMEZONE)

    // Get minutes and round down to nearest 5
    const minutes = sydneyTime.getMinutes()
    const roundedMinutes = Math.floor(minutes / 5) * 5

    // Create new date with rounded minutes and zeroed seconds/ms
    const result = setMilliseconds(setSeconds(sydneyTime, 0), 0)
    result.setMinutes(roundedMinutes)

    // Subtract 5 minutes to get last complete interval
    return subMinutes(result, 5)
}

/**
 * Fetches facility data for a specific time range
 * @returns {Promise<any>} Facility data response
 */
export async function getFacilityData() {
    const lastInterval = getLastCompleteInterval()
    const firstInterval = subHours(lastInterval, 3)

    console.debug(
        `Fetching facility data for ${format(
            firstInterval,
            "yyyy-MM-dd HH:mm:ss zzz",
            { timeZone: TIMEZONE },
        )} to ${format(lastInterval, "yyyy-MM-dd HH:mm:ss zzz", {
            timeZone: TIMEZONE,
        })}`,
    )

    const response = await client.getFacilityData("NEM", "BAYSW", ["energy"], {
        interval: "5m",
    })

    if (!response.datatable) {
        throw new Error("No data returned from API")
    }

    return response.datatable.getRows()
}

export async function getFacilities() {
    const response = await client.getFacilities({
        status_id: ["operating"],
        fueltech_id: ["coal_black", "coal_brown"],
    })
    return response.table
}
