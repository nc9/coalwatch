import { regionColors } from "@/utils/format"
import { StatusFacilityCard } from "./StatusFacilityCard"
import type { Facility, UnitStatusInterval } from "@/server/types"

interface StatusRegionCardProps {
  region: string
  facilities: Facility[]
  statusData: Record<string, UnitStatusInterval[]>
}

export function StatusRegionCard({
  region,
  facilities,
  statusData,
}: StatusRegionCardProps) {
  const bgColorClass =
    regionColors[region as keyof typeof regionColors] || "bg-neutral-800"

  return (
    <div className="space-y-6">
      <h2
        className={`font-bebas text-2xl uppercase tracking-wide text-neutral-100 ${bgColorClass} inline-block rounded-lg px-4 py-2`}
      >
        {region}
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {facilities.map((facility) => (
          <StatusFacilityCard
            key={facility.code}
            facility={facility}
            statusData={statusData}
          />
        ))}
      </div>
    </div>
  )
}
