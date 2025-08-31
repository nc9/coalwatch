import type { HistoryData, UnitHistoryDay } from "@/server/types"
import { debug, debugError, debugWarn } from "@/utils/debug"
import { OpenElectricityClient } from "@openelectricity/client"
import { put } from "@vercel/blob"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

const client = new OpenElectricityClient()

/**
 * Format date as YYYY-MM-DD
 */
function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/**
 * Format date for API request (YYYY-MM-DDTHH:mm:ss)
 */
function formatApiDate(date: Date): string {
  // The API expects dates without timezone, just like in generate-data.ts
  return date.toISOString().split('.')[0]
}

/**
 * Generates historic data for coal facilities over the last 30 days
 */
export async function generateHistoryData(): Promise<HistoryData> {
  try {
    debug("Starting historic data generation...")
    
    // Get all coal facilities
    const facilityResponse = await client.getFacilities({
      network_id: ["NEM"],
      status_id: ["operating"],
      fueltech_id: ["coal_black", "coal_brown"],
    })

    const records = facilityResponse.table.getRecords()
    debug(`Found ${records.length} facility records`)
    
    // Get unique unit codes
    const unitCodes = new Set<string>()
    const facilityCodes = new Set<string>()
    
    records.forEach((record) => {
      if (record.unit_code) {
        unitCodes.add(record.unit_code)
      }
      if (record.facility_code) {
        facilityCodes.add(record.facility_code)
      }
    })
    
    debug(`Found ${unitCodes.size} unique units across ${facilityCodes.size} facilities`)
    
    // Calculate date range (last 2 days for testing)
    // Use a very recent date range to test
    const endDate = new Date()
    const startDate = subDays(endDate, 2)
    
    debug(`Fetching data from ${formatApiDate(startDate)} to ${formatApiDate(endDate)}`)
    
    // Fetch power data for all facilities for the last 30 days
    // Process facilities one by one to avoid API limits
    const allRows: any[] = []
    
    for (const facilityCode of Array.from(facilityCodes)) {
      try {
        debug(`Fetching data for facility ${facilityCode}...`)
        const { datatable } = await client.getFacilityData(
          "NEM",
          [facilityCode],
          ["power"],
          {
            interval: "5m", // Use 5m like the working script
            dateStart: formatApiDate(startDate),
          }
        )
        
        if (datatable) {
          const rows = datatable.getRows()
          allRows.push(...rows)
          debug(`Got ${rows.length} rows for ${facilityCode}`)
        }
      } catch (error) {
        debugWarn(`Failed to fetch data for ${facilityCode}:`, error)
      }
    }
    
    if (allRows.length === 0) {
      debugError("No data returned for any facility")
      return { history: {}, lastUpdated: new Date().toISOString() }
    }
    
    const rows = allRows
    debug(`Got ${rows.length} total rows of historic power data`)
    
    // Process data into daily summaries per unit
    const historyByUnit: Record<string, Map<string, { totalPower: number; count: number; maxPower: number }>> = {}
    
    rows.forEach((row) => {
      const unitCode = row.unit_code as string
      const power = row.power as number
      const interval = row.interval as Date
      
      if (!unitCode || interval === null || interval === undefined) {
        return
      }
      
      if (!historyByUnit[unitCode]) {
        historyByUnit[unitCode] = new Map()
      }
      
      const dayKey = formatDateKey(interval)
      const dayData = historyByUnit[unitCode].get(dayKey) || { totalPower: 0, count: 0, maxPower: 0 }
      
      if (typeof power === "number" && !isNaN(power) && power >= 0) {
        dayData.totalPower += power
        dayData.count += 1
        dayData.maxPower = Math.max(dayData.maxPower, power)
      }
      
      historyByUnit[unitCode].set(dayKey, dayData)
    })
    
    // Convert to final format
    const history: Record<string, UnitHistoryDay[]> = {}
    
    // Get unit capacities from facility records
    const unitCapacities: Record<string, number> = {}
    records.forEach((record) => {
      if (record.unit_code && record.unit_capacity) {
        unitCapacities[record.unit_code] = record.unit_capacity
      }
    })
    
    Object.entries(historyByUnit).forEach(([unitCode, dailyData]) => {
      const unitCapacity = unitCapacities[unitCode] || 0
      const days: UnitHistoryDay[] = []
      
      // Generate entry for each day in the range
      for (let d = 0; d < 30; d++) {
        const date = subDays(endDate, 29 - d)
        const dayKey = formatDateKey(date)
        const data = dailyData.get(dayKey)
        
        if (data && data.count > 0) {
          const avgPower = data.totalPower / data.count
          const capacityFactor = unitCapacity > 0 ? avgPower / unitCapacity : 0
          
          days.push({
            date: dayKey,
            active: data.maxPower > 10, // Consider active if max power > 10MW
            averageCapacityFactor: capacityFactor,
          })
        }
      }
      
      if (days.length > 0) {
        history[unitCode] = days
      }
    })
    
    debug(`Generated history for ${Object.keys(history).length} units`)
    
    const historyData: HistoryData = {
      history,
      lastUpdated: new Date().toISOString(),
    }
    
    // Store the data in Vercel Blob
    const jsonString = JSON.stringify(historyData, null, 2)
    const { url } = await put("data/history.json", jsonString, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    })
    
    debug(`History data successfully written to ${url}`)
    return historyData
  } catch (error) {
    debugError("Error generating history data:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  generateHistoryData()
    .then(() => {
      debug("History generation complete")
      process.exit(0)
    })
    .catch((error) => {
      debugError("History generation failed:", error)
      process.exit(1)
    })
}