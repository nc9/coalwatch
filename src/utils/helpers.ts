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

/**
 * Whole-grid summary across NEM and WEM. A network whose feed is delayed keeps
 * its last known readings, same as the region cards.
 */
export function calculateNetworkSummary(
  facilities: Facility[],
  isDelayed: (region: string) => boolean = () => false
) {
  let unitsLive = 0
  let unitsDown = 0
  let currentPower = 0
  let totalCapacity = 0

  facilities.forEach((facility) => {
    const delayed = isDelayed(facility.region)
    facility.units.forEach((unit) => {
      totalCapacity += unit.capacity
      if (unit.active) unitsLive += 1
      else unitsDown += 1
      if (
        (delayed || isUnitActive(new Date(unit.lastSeen))) &&
        unit.currentPower !== undefined
      ) {
        currentPower += unit.currentPower
      }
    })
  })

  return {
    unitsLive,
    unitsDown,
    unitsTotal: unitsLive + unitsDown,
    currentPower: Math.round(currentPower),
    totalCapacity: Math.round(totalCapacity),
    percentage:
      totalCapacity > 0 ? Math.round((currentPower / totalCapacity) * 100) : 0,
  }
}
