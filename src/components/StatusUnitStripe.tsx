"use client"

import type { Unit, UnitStatusInterval } from "@/server/types"
import { formatMW } from "@/utils/format"
import { format } from "date-fns"
import { useState } from "react"

interface StatusUnitStripeProps {
  unit: Unit
  intervals?: UnitStatusInterval[]
}

export function StatusUnitStripe({ unit, intervals }: StatusUnitStripeProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const cells = intervals ?? []
  const hovered = hoveredIndex === null ? undefined : cells[hoveredIndex]

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-neutral-300">{unit.code}</span>
        <span className="text-xs text-neutral-500">
          {Math.round(Number(unit.capacity))} MW
        </span>
      </div>
      <div className="relative">
        <div className="flex gap-[1px]">
          {cells.map((interval, index) => {
            const hasData = !interval.noData && interval.power !== undefined

            return (
              <div
                key={interval.timestamp}
                className={`h-5 min-w-[4px] flex-1 rounded-[1px] transition-opacity hover:opacity-80 ${
                  !hasData
                    ? "bg-neutral-700"
                    : interval.active
                      ? "bg-green-500"
                      : "bg-red-500"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            )
          })}
        </div>
        {hovered && hoveredIndex !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2"
            style={{ left: `${((hoveredIndex + 0.5) / cells.length) * 100}%` }}
          >
            <div className="whitespace-nowrap rounded bg-neutral-800 px-2 py-1.5 text-xs shadow-lg">
              <div className="text-neutral-300">
                {format(new Date(hovered.timestamp), "MMM d, h:mm a")}
              </div>
              <div
                className={
                  hovered.noData
                    ? "text-neutral-400"
                    : hovered.active
                      ? "text-green-400"
                      : "text-red-400"
                }
              >
                {hovered.noData
                  ? "No data"
                  : hovered.active
                    ? "Online"
                    : "Offline"}
              </div>
              {hovered.power !== undefined && (
                <div className="text-neutral-400">
                  {formatMW(hovered.power)} MW
                </div>
              )}
              {hovered.capacityFactor !== undefined && (
                <div className="text-neutral-400">
                  {(hovered.capacityFactor * 100).toFixed(1)}% CF
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
          <span>48h ago</span>
          <span>24h ago</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  )
}
