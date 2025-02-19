import { formatMW, formatLastSeen, formatUnitCode } from "@/utils/format"

interface FacilityUnitProps {
    code: string
    capacity: number
    lastSeen: Date
    active: boolean
}

export function FacilityUnit({
    code,
    capacity,
    lastSeen,
    active,
}: FacilityUnitProps) {
    return (
        <div
            className={`
                rounded-xl p-4 flex flex-col justify-between
                min-h-[100px] w-full
                ${
                    active
                        ? "bg-green-950/70 text-green-200"
                        : "bg-red-950/70 text-red-200"
                }
                backdrop-blur-sm shadow-lg transition-all duration-200
            `}
        >
            <div>
                <div className="text-lg font-mono mb-1">
                    <span className="sm:hidden">{formatUnitCode(code)}</span>
                    <span className="hidden sm:inline">{code}</span>
                </div>
                <div className="text-base opacity-85">{formatMW(capacity)}</div>
            </div>
            {!active && (
                <div className="text-sm mt-2 opacity-75">
                    {formatLastSeen(lastSeen)}
                </div>
            )}
        </div>
    )
}
