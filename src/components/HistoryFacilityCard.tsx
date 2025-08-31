import type { Facility, UnitHistoryDay } from "@/server/types"
import { HistoryUnitStripe } from "./HistoryUnitStripe"

interface HistoryFacilityCardProps {
  facility: Facility
  historyData: Record<string, UnitHistoryDay[]>
}

export function HistoryFacilityCard({ facility, historyData }: HistoryFacilityCardProps) {
  const totalCapacity = facility.units.reduce(
    (sum, unit) => sum + (unit.capacity || 0),
    0
  )

  return (
    <div className="rounded-lg bg-neutral-900 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">{facility.name}</h3>
        <div className="text-sm text-neutral-400">
          {totalCapacity} MW • {facility.units.length} units
        </div>
      </div>
      <div className="space-y-3">
        {facility.units.map((unit) => (
          <HistoryUnitStripe
            key={unit.code}
            unit={unit}
            unitHistory={historyData?.[unit.code]}
          />
        ))}
      </div>
    </div>
  )
}