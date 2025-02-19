import type { Facility } from "@/server/types"
import { FacilityCard } from "./FacilityCard"
import { regionNames } from "@/utils/format"
import { calculateRegionStats } from "@/utils/helpers"
import { formatMW } from "@/utils/format"
import { Power, Zap, Battery, Factory } from "lucide-react"

interface RegionCardProps {
    region: string
    facilities: Facility[]
}

export function RegionCard({ region, facilities }: RegionCardProps) {
    const stats = calculateRegionStats(facilities)

    return (
        <div className="bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-neutral-700">
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <h2 className="text-3xl font-light tracking-tight text-neutral-100 mr-auto">
                    {regionNames[region] || region}
                </h2>
                <div className="px-4 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm">
                    <div className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                        <Battery className="w-4 h-4" />
                        <span className="font-semibold">Operational</span>{" "}
                        {stats.operationalCapacity} MW
                        <span className="ml-1 text-neutral-400">
                            ({stats.percentageOperational}%)
                        </span>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm">
                    <div className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="font-semibold">Operating</span>{" "}
                        {formatMW(stats.currentPower)} MW
                        <span className="ml-1 text-neutral-400">
                            ({stats.operatingCapacityPercentage}%)
                        </span>
                    </div>
                </div>
                <div className="px-4 py-2 rounded-full bg-neutral-900/50 backdrop-blur-sm">
                    <div className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                        <Power className="w-4 h-4" />
                        <span className="font-semibold">Total</span>{" "}
                        {formatMW(stats.totalCapacity)} MW
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {facilities.map((facility) => (
                    <FacilityCard key={facility.code} facility={facility} />
                ))}
            </div>
        </div>
    )
}
