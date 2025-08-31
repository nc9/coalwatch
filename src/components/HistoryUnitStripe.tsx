"use client"

import type { Unit, UnitHistoryDay } from "@/server/types"
import { format, subDays, startOfDay } from "date-fns"
import { useState } from "react"

interface HistoryUnitStripeProps {
  unit: Unit
  unitHistory?: UnitHistoryDay[]
}

export function HistoryUnitStripe({
  unit,
  unitHistory,
}: HistoryUnitStripeProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  // Generate last 30 days
  const today = startOfDay(new Date())
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i)
    return {
      date,
      dateString: format(date, "yyyy-MM-dd"),
      label: format(date, "MMM d"),
    }
  })

  // Create a map for quick history lookup
  const historyMap = new Map<
    string,
    { active: boolean; averageCapacityFactor?: number }
  >()
  if (unitHistory) {
    unitHistory.forEach((day) => {
      historyMap.set(day.date, {
        active: day.active,
        averageCapacityFactor: day.averageCapacityFactor,
      })
    })
  }

  // For now, generate mock data based on unit status
  const generateMockStatus = (unit: Unit) => {
    // If unit is currently active, show mostly green with some red days
    if (unit.active) {
      // Random outages with less frequency for active units
      return Math.random() > 0.15
    }
    // If unit is inactive, show mostly red with occasional green days
    return Math.random() > 0.85
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-neutral-300">{unit.code}</span>
        <span className="text-xs text-neutral-500">{unit.capacity} MW</span>
      </div>
      <div className="relative">
        <div className="flex gap-[2px]">
          {days.map((day, index) => {
            const historyData = historyMap.get(day.dateString)
            const isActive = historyData?.active ?? generateMockStatus(unit)
            const capacityFactor = historyData?.averageCapacityFactor

            return (
              <div
                key={day.dateString}
                className="group relative"
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div
                  className={`h-6 flex-1 rounded-sm transition-all ${
                    isActive
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                  style={{ width: "8px" }}
                />
                {hoveredDay === index && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2">
                    <div className="whitespace-nowrap rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200">
                      <div>{day.label}</div>
                      <div
                        className={isActive ? "text-green-400" : "text-red-400"}
                      >
                        {isActive ? "Online" : "Offline"}
                      </div>
                      {capacityFactor !== undefined && (
                        <div className="text-neutral-400">
                          {(capacityFactor * 100).toFixed(1)}% capacity
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-neutral-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
