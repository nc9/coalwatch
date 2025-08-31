import type { FacilityData, HistoryData, UnitHistoryDay } from "@/server/types"
import { format, subDays } from "date-fns"

/**
 * Generate simulated history based on current facility status
 * This is a temporary solution until the OpenElectricity API historic data is available
 */
export async function generateSimpleHistory(): Promise<HistoryData> {
  // Fetch current facility data
  const blobUrl = process.env.NEXT_PUBLIC_FACILITIES_BLOB_URL
  if (!blobUrl) {
    throw new Error("NEXT_PUBLIC_FACILITIES_BLOB_URL environment variable is not set")
  }

  const response = await fetch(blobUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch facility data: ${response.statusText}`)
  }

  const facilityData: FacilityData = await response.json()
  
  // Generate history for each unit based on its current status
  const history: Record<string, UnitHistoryDay[]> = {}
  
  facilityData.facilities.forEach(facility => {
    facility.units.forEach(unit => {
      const unitHistory: UnitHistoryDay[] = []
      
      // Generate 30 days of history
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, "yyyy-MM-dd")
        
        // Base the history on current unit status with some variation
        let active = unit.active
        let capacityFactor = unit.capacityFactor ? unit.capacityFactor / 100 : 0
        
        // Add some realistic variation
        if (unit.active) {
          // Active units: mostly online with occasional outages
          const random = Math.random()
          if (random < 0.05) { // 5% chance of outage
            active = false
            capacityFactor = 0
          } else if (random < 0.2) { // 15% chance of reduced capacity
            capacityFactor = capacityFactor * (0.3 + Math.random() * 0.5)
          }
        } else {
          // Inactive units: mostly offline with rare activity
          const random = Math.random()
          if (random < 0.02) { // 2% chance of being online
            active = true
            capacityFactor = 0.2 + Math.random() * 0.3
          }
        }
        
        unitHistory.push({
          date: dateStr,
          active,
          averageCapacityFactor: capacityFactor
        })
      }
      
      history[unit.code] = unitHistory
    })
  })
  
  return {
    history,
    lastUpdated: new Date().toISOString()
  }
}

// Run if called directly
if (require.main === module) {
  generateSimpleHistory()
    .then(data => {
      console.log(JSON.stringify(data, null, 2))
    })
    .catch(error => {
      console.error("Error:", error)
      process.exit(1)
    })
}