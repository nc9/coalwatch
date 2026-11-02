import type { Facility } from "@/server/types"

export function isUnitActive(lastSeen: Date): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  return lastSeen > oneHourAgo
}

/**
 * True when no unit has reported within the last hour: the feed itself is
 * delayed (backend/ingest problem), which says nothing about the grid.
 */
export function isFeedDelayed(
  units: { lastSeen: string }[],
  now: Date = new Date()
): boolean {
  const newest = Math.max(...units.map((u) => new Date(u.lastSeen).getTime()))
  if (!Number.isFinite(newest)) return false
  return newest <= now.getTime() - 60 * 60 * 1000
}

export function calculateRegionStats(
  facilities: Facility[],
  dataDelayed = false
) {
  let totalCapacity = 0
  let operationalCapacity = 0
  let currentPower = 0

  facilities.forEach((facility) => {
    facility.units.forEach((unit) => {
      totalCapacity += unit.capacity
      if (dataDelayed || isUnitActive(new Date(unit.lastSeen))) {
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
