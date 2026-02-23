import { regionOrder } from "@/utils/format"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { ViewTabs } from "@/components/ViewTabs"
import { StatusRegionCard } from "@/components/StatusRegionCard"
import type { Facility, FacilityData, StatusData } from "@/server/types"
import { formatDistanceToNow } from "date-fns"

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

async function getStatusData(): Promise<StatusData> {
  const blobUrl =
    process.env.NEXT_PUBLIC_STATUS_BLOB_URL ??
    process.env.NEXT_PUBLIC_HISTORY_BLOB_URL

  if (!blobUrl) {
    console.warn("No status blob URL configured, returning empty status")
    return {
      status: {},
      intervalMinutes: 30,
      lastUpdated: new Date().toISOString(),
    }
  }

  try {
    const response = await fetch(blobUrl, { next: { revalidate: 300 } })
    if (!response.ok) {
      console.error(`Failed to fetch status data: ${response.statusText}`)
      return {
        status: {},
        intervalMinutes: 30,
        lastUpdated: new Date().toISOString(),
      }
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching status data:", error)
    return {
      status: {},
      intervalMinutes: 30,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export default async function StatusPage() {
  const { facilities, lastUpdated } = await getFacilityData()
  const statusData = await getStatusData()

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
              <StatusRegionCard
                key={region}
                region={region}
                facilities={facilities}
                statusData={statusData.status}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
