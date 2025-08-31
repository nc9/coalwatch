import { regionOrder } from "@/utils/format"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { ViewTabs } from "@/components/ViewTabs"
import { HistoryRegionCard } from "@/components/HistoryRegionCard"
import type {
  Facility,
  FacilityData,
  HistoryData,
  UnitHistoryDay,
} from "@/server/types"
import { formatDistanceToNow, format, subDays } from "date-fns"

// Revalidate every 5 minutes to match the data update frequency
export const revalidate = 300

async function getFacilityData(): Promise<FacilityData> {
  const blobUrl = process.env.NEXT_PUBLIC_FACILITIES_BLOB_URL
  if (!blobUrl) {
    throw new Error(
      "NEXT_PUBLIC_FACILITIES_BLOB_URL environment variable is not set"
    )
  }

  const response = await fetch(blobUrl, { next: { revalidate: 300 } })
  if (!response.ok) {
    throw new Error(`Failed to fetch facility data: ${response.statusText}`)
  }

  return response.json()
}

async function getHistoryData(facilities: Facility[]): Promise<HistoryData> {
  // Generate simulated history based on current facility status
  // This is a temporary solution until historic data API is available
  const history: Record<string, UnitHistoryDay[]> = {}

  facilities.forEach((facility) => {
    facility.units.forEach((unit) => {
      const unitHistory: UnitHistoryDay[] = []

      // Generate 30 days of history
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, "yyyy-MM-dd")

        // Base the history on current unit status with some variation
        let active = unit.active
        let capacityFactor = unit.capacityFactor ? unit.capacityFactor / 100 : 0

        // Add some realistic variation using a seeded random based on unit code and date
        const seed =
          unit.code
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) + i
        const random =
          Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000)

        if (unit.active) {
          // Active units: mostly online with occasional outages
          if (random < 0.05) {
            // 5% chance of outage
            active = false
            capacityFactor = 0
          } else if (random < 0.2) {
            // 15% chance of reduced capacity
            capacityFactor = capacityFactor * (0.3 + random * 2.5)
          }
        } else {
          // Inactive units: mostly offline with rare activity
          if (random < 0.02) {
            // 2% chance of being online
            active = true
            capacityFactor = 0.2 + random * 1.5
          } else {
            active = false
            capacityFactor = 0
          }
        }

        unitHistory.push({
          date: dateStr,
          active,
          averageCapacityFactor: Math.min(1, Math.max(0, capacityFactor)),
        })
      }

      history[unit.code] = unitHistory
    })
  })

  return {
    history,
    lastUpdated: new Date().toISOString(),
  }
}

export default async function HistoryPage() {
  const { facilities, lastUpdated } = await getFacilityData()
  const historyData = await getHistoryData(facilities)

  // Group facilities by region
  const facilitiesByRegion = new Map<string, Facility[]>()
  facilities.forEach((facility: Facility) => {
    if (!facilitiesByRegion.has(facility.region)) {
      facilitiesByRegion.set(facility.region, [])
    }
    facilitiesByRegion.get(facility.region)?.push(facility)
  })

  // Sort regions according to our custom order
  const sortedRegions = Array.from(facilitiesByRegion.entries()).sort(
    (a, b) => regionOrder.indexOf(a[0]) - regionOrder.indexOf(b[0])
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-neutral-200">
      {/* Hero section with image */}
      <div className="relative h-[60vh] min-h-[500px] w-full will-change-transform">
        <div className="absolute inset-0">
          <Image
            src="/splash.jpg"
            alt="Coal power station"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black will-change-transform" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-center font-bebas text-7xl font-normal uppercase tracking-wide text-neutral-100 will-change-transform">
            Coal Watch Australia
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="relative bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-8">
          <ViewTabs />
          <div className="mb-12 text-center text-sm text-neutral-400 will-change-transform">
            Last updated{" "}
            {formatDistanceToNow(new Date(lastUpdated), {
              addSuffix: true,
            })}
          </div>
          <div className="space-y-16">
            {sortedRegions.map(([region, facilities]) => (
              <HistoryRegionCard
                key={region}
                region={region}
                facilities={facilities}
                historyData={historyData.history}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
