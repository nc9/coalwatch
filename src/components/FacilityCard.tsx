"use client"

import type { Facility, Unit } from "@/server/types"
import { ExternalLink, Factory } from "lucide-react"
import { useMemo } from "react"
import { FacilityUnit } from "./FacilityUnit"
import { networkOfRegion } from "@/utils/format"

interface FacilityCardProps {
  facility: Facility
}

function getFacilityUrl(code: string, region: string): string {
  return `https://explore.openelectricity.org.au/facility/au/${networkOfRegion(region)}/${code}/`
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
            (unit.lastSeen === null || typeof unit.lastSeen === "string") &&
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
    [facility.units]
  )

  if (!facility.code || !facility.name || !facility.region) {
    console.error("Invalid facility data:", facility)
    return (
      <div className="border-t border-white/10 pt-4 sm:pt-6">
        <p className="text-red-400">Error: Invalid facility data</p>
      </div>
    )
  }

  return (
    <div className="border-t border-white/10 pt-4 sm:pt-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-medium tracking-[-0.01em] text-neutral-200 hover:text-neutral-100">
        <Factory className="h-6 w-6 opacity-75" />
        <a
          href={getFacilityUrl(facility.code, facility.region)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        >
          {facility.name}
          <ExternalLink className="h-4 w-4 opacity-50" />
        </a>
      </h3>
      {sortedUnits.length === 0 ? (
        <p className="text-neutral-400">No active units found</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {sortedUnits.map((unit) => (
            <FacilityUnit
              key={unit.code}
              code={unit.code}
              capacity={unit.capacity}
              active={unit.active || false}
              currentPower={unit.currentPower}
              capacityFactor={unit.capacityFactor}
              latestInterval={unit.latestInterval}
              lastSeen={unit.lastSeen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
