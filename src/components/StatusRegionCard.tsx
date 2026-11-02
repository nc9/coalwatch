import type { Facility, UnitStatusInterval } from "@/server/types"
import { StatusFacilityCard } from "./StatusFacilityCard"
import { regionNames, formatMW } from "@/utils/format"
import { calculateRegionStats } from "@/utils/helpers"
import { Zap } from "lucide-react"

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
  const stats = calculateRegionStats(facilities)

  return (
    <div className="transform-gpu border-t border-white/10 pt-6 sm:rounded-xl sm:border sm:bg-neutral-900/60 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-8 sm:gap-4">
        <h2 className="mr-auto transform-gpu text-2xl font-semibold tracking-[-0.02em] text-neutral-100 sm:text-3xl">
          {regionNames[region] || region}
        </h2>
        <div className="transform-gpu py-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">Capacity factor</span>{" "}
            <span className="font-mono tabular-nums text-neutral-100">
              {stats.operatingCapacityPercentage}%
            </span>
            <span className="ml-1 text-neutral-400">
              {formatMW(stats.currentPower)} / {formatMW(stats.totalCapacity)}{" "}
              MW
            </span>
          </div>
        </div>
      </div>
      <div className="grid transform-gpu grid-cols-1 gap-8 lg:grid-cols-2">
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
