"use client"

import { useMemo } from "react"
import type { Facility, Unit } from "@/server/types"
import { FacilityUnit } from "./FacilityUnit"
import { isUnitActive } from "@/utils/helpers"
import { ExternalLink, Factory } from "lucide-react"

interface FacilityCardProps {
    facility: Facility
}

function getFacilityUrl(code: string): string {
    return `https://explore.openelectricity.org.au/facility/au/NEM/${code}/`
}

export function FacilityCard({ facility }: FacilityCardProps) {
    // Sort units by code
    const sortedUnits = useMemo(
        () =>
            [...(facility.units || [])]
                .filter((unit): unit is Unit => {
                    return (
                        unit &&
                        typeof unit.code === "string" &&
                        typeof unit.capacity === "number" &&
                        (unit.lastSeen === null ||
                            typeof unit.lastSeen === "string") &&
                        typeof unit.status === "string"
                    )
                })
                .sort((a, b) => {
                    if (!a.code || !b.code) return 0
                    return a.code.localeCompare(b.code, undefined, {
                        numeric: true,
                        sensitivity: "base",
                    })
                }),
        [facility.units],
    )

    if (!facility.code || !facility.name || !facility.region) {
        console.error("Invalid facility data:", facility)
        return (
            <div className="bg-neutral-900/30 rounded-xl p-6 shadow-md">
                <p className="text-red-400">Error: Invalid facility data</p>
            </div>
        )
    }

    return (
        <div className="bg-neutral-900/30 rounded-xl p-6 shadow-md">
            <h3 className="text-2xl font-light mb-5 text-neutral-200 flex items-center gap-2 hover:text-neutral-100">
                <Factory className="w-6 h-6 opacity-75" />
                <a
                    href={getFacilityUrl(facility.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline"
                >
                    {facility.name}
                    <ExternalLink className="w-4 h-4 opacity-50" />
                </a>
            </h3>
            {sortedUnits.length === 0 ? (
                <p className="text-neutral-400">No active units found</p>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {sortedUnits.map((unit) => (
                        <FacilityUnit
                            key={unit.code}
                            code={unit.code}
                            capacity={unit.capacity}
                            active={unit.active || false}
                            currentPower={unit.currentPower}
                            capacityFactor={unit.capacityFactor}
                            latestInterval={unit.latestInterval}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
