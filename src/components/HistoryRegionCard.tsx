import { regionColors } from "@/utils/format"
import { HistoryFacilityCard } from "./HistoryFacilityCard"
import type { Facility, UnitHistoryDay } from "@/server/types"

interface HistoryRegionCardProps {
  region: string
  facilities: Facility[]
  historyData: Record<string, UnitHistoryDay[]>
}

export function HistoryRegionCard({
  region,
  facilities,
  historyData,
}: HistoryRegionCardProps) {
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
          <HistoryFacilityCard
            key={facility.code}
            facility={facility}
            historyData={historyData}
          />
        ))}
      </div>
    </div>
  )
}
