import {
    formatMW,
    formatLastSeen,
    formatUnitCode,
    formatPercentage,
} from "@/utils/format"

interface FacilityUnitProps {
    code: string
    capacity: number
    lastSeen: Date
    active: boolean
    currentPower?: number
    capacityFactor?: number
}

export function FacilityUnit({
    code,
    capacity,
    lastSeen,
    active,
    currentPower,
    capacityFactor,
}: FacilityUnitProps) {
    return (
        <div className="relative">
            <div
                className={`
                    relative rounded-xl p-4 flex flex-col justify-between
                    min-h-[160px] w-full overflow-hidden
                    ${
                        active
                            ? "bg-green-900 text-green-100"
                            : "bg-red-950 text-red-200 border border-red-900"
                    }
                    backdrop-blur-sm shadow-lg transition-all duration-200
                `}
            >
                {/* Power level fill */}
                {active && capacityFactor !== undefined && (
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-green-950 transition-all duration-300"
                        style={{ height: `${Math.min(100, capacityFactor)}%` }}
                    />
                )}

                {/* Content */}
                <div className="relative">
                    <div className="text-lg font-mono font-semibold mb-1">
                        <span className="sm:hidden">
                            {formatUnitCode(code)}
                        </span>
                        <span className="hidden sm:inline">{code}</span>
                    </div>
                    <div className="text-base font-bold tracking-wide">
                        {active && currentPower !== undefined ? (
                            <div>
                                {formatMW(currentPower)} / {formatMW(capacity)}{" "}
                                <span className="text-sm font-medium opacity-75">
                                    MW
                                </span>
                                <span className="ml-2 text-sm font-medium">
                                    ({formatPercentage(capacityFactor)})
                                </span>
                            </div>
                        ) : (
                            <div>
                                {formatMW(capacity)}{" "}
                                <span className="text-sm font-medium opacity-75">
                                    MW
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                {!active && (
                    <div className="relative text-sm mt-2 opacity-75">
                        {formatLastSeen(lastSeen)}
                    </div>
                )}
            </div>
        </div>
    )
}
