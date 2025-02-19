import type { Facility } from "@/server/types"
import { FacilityUnit } from "./FacilityUnit"
import { isUnitActive } from "@/utils/helpers"
import { ExternalLink } from "lucide-react"

interface FacilityCardProps {
    facility: Facility
}

function getFacilityUrl(code: string, network: string): string {
    return `https://explore.openelectricity.org.au/facility/au/${network}/${code}/`
}

export function FacilityCard({ facility }: FacilityCardProps) {
    // Sort units by code
    const sortedUnits = [...facility.units].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
            numeric: true,
            sensitivity: "base",
        }),
    )

    const network = facility.region === "WEM" ? "WEM" : "NEM"

    return (
        <div className="bg-neutral-900/30 rounded-xl p-6 shadow-md">
            <h3 className="text-2xl font-light mb-5 text-neutral-200 flex items-center gap-2 hover:text-neutral-100">
                <a
                    href={getFacilityUrl(facility.code, network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline"
                >
                    {facility.name}
                    <ExternalLink className="w-4 h-4 opacity-50" />
                </a>
            </h3>
            <div className="grid grid-cols-2 gap-4">
                {sortedUnits.map((unit) => (
                    <FacilityUnit
                        key={unit.code}
                        code={unit.code}
                        capacity={unit.capacity}
                        lastSeen={unit.lastSeen}
                        active={isUnitActive(unit.lastSeen)}
                    />
                ))}
            </div>
        </div>
    )
}
