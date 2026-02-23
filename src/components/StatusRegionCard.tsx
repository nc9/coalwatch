import type { Facility, UnitStatusInterval } from "@/server/types"
import { StatusFacilityCard } from "./StatusFacilityCard"
import { regionNames, formatMW } from "@/utils/format"
import { calculateRegionStats } from "@/utils/helpers"
import { Power, Zap, Battery } from "lucide-react"

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
    <div className="transform-gpu rounded-2xl border border-neutral-700 bg-neutral-800/90 p-8 shadow-xl backdrop-blur-[2px]">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h2 className="mr-auto transform-gpu text-3xl font-light tracking-tight text-neutral-100">
          {regionNames[region] || region}
        </h2>
        <div className="transform-gpu rounded-full bg-neutral-900/50 px-4 py-2 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Battery className="h-4 w-4" />
            <span className="font-semibold">Operational</span>{" "}
            {stats.operationalCapacity} MW
            <span className="ml-1 text-neutral-400">
              ({stats.percentageOperational}%)
            </span>
          </div>
        </div>
        <div className="transform-gpu rounded-full bg-neutral-900/50 px-4 py-2 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-200">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">Operating</span>{" "}
            {formatMW(stats.currentPower)} MW
            <span className="ml-1 text-neutral-400">
              ({stats.operatingCapacityPercentage}%)
            </span>
          </div>
        </div>
        <div className="transform-gpu rounded-full bg-neutral-900/50 px-4 py-2 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
            <Power className="h-4 w-4" />
            <span className="font-semibold">Total</span>{" "}
            {formatMW(stats.totalCapacity)} MW
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
