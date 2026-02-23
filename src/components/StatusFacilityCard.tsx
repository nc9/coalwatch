import type { Facility, UnitStatusInterval } from "@/server/types"
import { StatusUnitStripe } from "./StatusUnitStripe"

interface StatusFacilityCardProps {
  facility: Facility
  statusData: Record<string, UnitStatusInterval[]>
}

export function StatusFacilityCard({
  facility,
  statusData,
}: StatusFacilityCardProps) {
  const totalCapacity = facility.units.reduce(
    (sum, unit) => sum + Number(unit.capacity || 0),
    0
  )

  return (
    <div className="rounded-lg bg-neutral-900 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-100">
          {facility.name}
        </h3>
        <div className="text-sm text-neutral-400">
          {Math.round(totalCapacity)} MW &middot; {facility.units.length} units
        </div>
      </div>
      <div className="space-y-3">
        {facility.units.map((unit) => (
          <StatusUnitStripe
            key={unit.code}
            unit={unit}
            intervals={statusData?.[unit.code]}
          />
        ))}
      </div>
    </div>
  )
}
