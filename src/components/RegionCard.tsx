import type { Facility } from "@/server/types"
import { FacilityCard } from "./FacilityCard"
import { regionNames } from "@/utils/format"
import { calculateRegionStats } from "@/utils/helpers"
import { formatMW } from "@/utils/format"

interface RegionCardProps {
    region: string
    facilities: Facility[]
}

export function RegionCard({ region, facilities }: RegionCardProps) {
    const stats = calculateRegionStats(facilities)

    return (
        <div className="bg-neutral-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-8 mb-8">
                <h2 className="text-3xl font-light tracking-tight text-neutral-100">
                    {regionNames[region] || region}
                </h2>
                <div className="flex flex-row sm:flex-col sm:text-right gap-4 sm:gap-0 items-baseline sm:items-end text-sm sm:text-base">
                    <div className="font-light text-neutral-200">
                        Operational: {formatMW(stats.operationalCapacity)}
                        <span className="ml-1 font-normal text-neutral-400">
                            ({stats.percentageOperational}%)
                        </span>
                    </div>
                    <div className="text-neutral-400">
                        Total: {formatMW(stats.totalCapacity)}
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
