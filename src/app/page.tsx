import { regionOrder } from "@/utils/format"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { RegionCard } from "@/components/RegionCard"
import type { Facility, FacilityData } from "@/server/types"

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
        <div className="min-h-screen bg-black text-neutral-200">
            {/* Hero section with image */}
            <div className="relative h-[60vh] min-h-[500px] w-full">
                <Image
                    src="/splash.jpg"
                    alt="Coal power station"
                    fill
                    priority
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="text-7xl font-normal tracking-wide text-center text-neutral-100 font-bebas uppercase">
                        Coal Watch Australia
                    </h1>
                </div>
            </div>

            {/* Main content */}
            <div className="relative">
                <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-12">
                    <div className="text-sm text-neutral-400 mb-8">
                        Last updated:{" "}
                        {new Date(lastUpdated).toLocaleString("en-AU", {
                            timeZone: "Australia/Sydney",
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
