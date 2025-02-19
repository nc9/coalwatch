import { regionOrder } from "@/utils/format"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { RegionCard } from "@/components/RegionCard"
import type { Facility, FacilityData } from "@/server/types"
import { formatDistanceToNow } from "date-fns"

// Revalidate every 5 minutes to match the data update frequency
export const revalidate = 300

async function getFacilityData(): Promise<FacilityData> {
    const blobUrl = process.env.NEXT_PUBLIC_FACILITIES_BLOB_URL
    if (!blobUrl) {
        throw new Error(
            "NEXT_PUBLIC_FACILITIES_BLOB_URL environment variable is not set",
        )
    }

    const response = await fetch(blobUrl, { next: { revalidate: 300 } })
    if (!response.ok) {
        throw new Error(`Failed to fetch facility data: ${response.statusText}`)
    }

    return response.json()
}

export default async function Home() {
    const { facilities, lastUpdated } = await getFacilityData()

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
        (a, b) => regionOrder.indexOf(a[0]) - regionOrder.indexOf(b[0]),
    )

    return (
        <div className="min-h-screen bg-black text-neutral-200 overflow-x-hidden">
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
                    <h1 className="text-7xl font-normal tracking-wide text-center text-neutral-100 font-bebas uppercase will-change-transform">
                        Coal Watch Australia
                    </h1>
                </div>
            </div>

            {/* Main content */}
            <div className="relative bg-black">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-12">
                    <div className="text-sm text-neutral-400 text-center mb-12 will-change-transform">
                        Last updated{" "}
                        {formatDistanceToNow(new Date(lastUpdated), {
                            addSuffix: true,
                        })}
                    </div>
                    <div className="space-y-16">
                        {sortedRegions.map(([region, facilities]) => (
                            <RegionCard
                                key={region}
                                region={region}
                                facilities={facilities}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
