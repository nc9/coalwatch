import type { Facility } from "@/server/types"
import { formatMW } from "@/utils/format"
import { calculateNetworkSummary } from "@/utils/helpers"

interface NetworkSummaryProps {
  facilities: Facility[]
  isDelayed?: (region: string) => boolean
}

export function NetworkSummary({ facilities, isDelayed }: NetworkSummaryProps) {
  const s = calculateNetworkSummary(facilities, isDelayed)

  return (
    <section
      aria-label="NEM and WEM summary"
      className="mx-auto mb-10 grid max-w-3xl grid-cols-3 gap-x-4 border-t border-white/10 py-4 text-center sm:py-5"
    >
      <div>
        <div className="text-xs text-neutral-400 sm:text-sm">Units live</div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-green-400 sm:text-2xl">
          {s.unitsLive}
          <span className="text-sm font-normal text-neutral-500 sm:text-base">
            {" "}
            / {s.unitsTotal}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs text-neutral-400 sm:text-sm">Units down</div>
        <div
          className={`mt-1 font-mono text-xl font-semibold tabular-nums sm:text-2xl ${
            s.unitsDown > 0 ? "text-red-400" : "text-neutral-200"
          }`}
        >
          {s.unitsDown}
        </div>
      </div>
      <div>
        <div className="text-xs text-neutral-400 sm:text-sm">
          Capacity factor
        </div>
        <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-neutral-100 sm:text-2xl">
          {s.percentage}%
          <span className="block text-xs font-normal text-neutral-500 sm:text-sm">
            {formatMW(s.currentPower)} / {formatMW(s.totalCapacity)} MW
          </span>
        </div>
      </div>
    </section>
  )
}
