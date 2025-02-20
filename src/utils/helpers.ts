import type { Facility } from "@/server/types"

export function isUnitActive(lastSeen: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return lastSeen > oneHourAgo
}

export function calculateRegionStats(facilities: Facility[]) {
  let totalCapacity = 0
  let operationalCapacity = 0
  let currentPower = 0

  facilities.forEach((facility) => {
    facility.units.forEach((unit) => {
      totalCapacity += unit.capacity
      if (isUnitActive(new Date(unit.lastSeen))) {
        operationalCapacity += unit.capacity
        if (unit.currentPower !== undefined) {
          currentPower += unit.currentPower
        }
      }
    })
  })

  const operatingCapacityPercentage = Math.round(
    (currentPower / totalCapacity) * 100
  )

  return {
    totalCapacity: Math.round(totalCapacity),
    operationalCapacity: Math.round(operationalCapacity),
    currentPower: Math.round(currentPower),
    percentageOperational: Math.round(
      (operationalCapacity / totalCapacity) * 100
    ),
    operatingCapacityPercentage,
  }
}
