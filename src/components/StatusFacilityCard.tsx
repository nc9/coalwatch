import type { Facility, UnitStatusInterval } from "@/server/types"
import { ExternalLink, Factory } from "lucide-react"
import { StatusUnitStripe } from "./StatusUnitStripe"

interface StatusFacilityCardProps {
  facility: Facility
  statusData: Record<string, UnitStatusInterval[]>
}

function getFacilityUrl(code: string): string {
  return `https://explore.openelectricity.org.au/facility/au/NEM/${code}/`
}

export function StatusFacilityCard({
  facility,
  statusData,
}: StatusFacilityCardProps) {
  return (
    <div className="rounded-xl bg-neutral-900/30 p-6 shadow-md">
      <h3 className="mb-5 flex items-center gap-2 text-2xl font-light text-neutral-200 hover:text-neutral-100">
        <Factory className="h-6 w-6 opacity-75" />
        <a
          href={getFacilityUrl(facility.code)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:underline"
        >
          {facility.name}
          <ExternalLink className="h-4 w-4 opacity-50" />
        </a>
      </h3>
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
