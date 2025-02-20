import { formatMW, formatUnitCode, formatPercentage } from "@/utils/format"
import * as Tooltip from "@radix-ui/react-tooltip"
import { format } from "date-fns"

interface FacilityUnitProps {
  code: string
  capacity: number
  active: boolean
  currentPower?: number
  capacityFactor?: number
  latestInterval?: string
}

export function FacilityUnit({
  code,
  capacity,
  active,
  currentPower,
  capacityFactor,
  latestInterval,
}: FacilityUnitProps) {
  const formatTimeString = (isoString?: string) => {
    if (!isoString) return ""
    // Parse the ISO string as UTC by replacing +10:00 with Z
    const date = new Date(isoString.replace("+10:00", "Z"))
    return format(date, "h:mm a, d MMM yyyy")
  }

  const tooltipContent = active
    ? `Last reading: ${formatTimeString(latestInterval)}
Generation: ${formatMW(currentPower || 0)} MW`
    : `Last seen: ${formatTimeString(latestInterval)}`

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="relative">
            <div
              className={`relative flex min-h-[160px] w-full flex-col justify-between overflow-hidden rounded-xl p-4 ${
                active
                  ? "bg-green-950 text-green-100"
                  : "border border-red-900 bg-red-950 text-red-200"
              } shadow-lg backdrop-blur-sm transition-all duration-200`}
            >
              {/* Power level fill */}
              {active && capacityFactor !== undefined && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-green-900 transition-all duration-300"
                  style={{
                    height: `${Math.min(100, capacityFactor)}%`,
                  }}
                />
              )}

              {/* Content */}
              <div className="relative">
                <div className="mb-1 font-mono text-lg font-semibold">
                  <span className="sm:hidden">{formatUnitCode(code)}</span>
                  <span className="hidden sm:inline">{code}</span>
                </div>
                <div className="text-base font-bold tracking-wide">
                  {active && currentPower !== undefined ? (
                    <div>
                      {formatMW(currentPower)} / {formatMW(capacity)}{" "}
                      <span className="text-sm font-medium opacity-75">MW</span>
                      <span className="ml-2 text-sm font-medium">
                        ({formatPercentage(capacityFactor)})
                      </span>
                    </div>
                  ) : (
                    <div>
                      {formatMW(capacity)}{" "}
                      <span className="text-sm font-medium opacity-75">MW</span>
                    </div>
                  )}
                </div>
              </div>
              {!active && latestInterval && (
                <div className="relative mt-2 text-sm opacity-75">
                  Last seen {formatTimeString(latestInterval)}
                </div>
              )}
            </div>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm leading-none text-neutral-100 shadow-md"
            sideOffset={5}
          >
            {tooltipContent}
            <Tooltip.Arrow className="fill-neutral-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
