import type { Facility } from "@/server/types"

export function isUnitActive(lastSeen: Date): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return lastSeen > oneHourAgo
}

export function calculateRegionStats(facilities: Facility[]) {
    let totalCapacity = 0
    let operationalCapacity = 0

    facilities.forEach((facility) => {
        facility.units.forEach((unit) => {
            totalCapacity += unit.capacity
            if (isUnitActive(unit.lastSeen)) {
                operationalCapacity += unit.capacity
            }
        })
    })

    return {
        totalCapacity: Math.round(totalCapacity),
        operationalCapacity: Math.round(operationalCapacity),
        percentageOperational: Math.round(
            (operationalCapacity / totalCapacity) * 100,
        ),
    }
}
