import { getFacilities } from "@/server/facilities"
import type { FacilityRecord, Facility } from "@/server/types"
import {
    regionNames,
    regionOrder,
    formatLastSeen,
    formatMW,
} from "@/utils/format"
import Image from "next/image"
import { Footer } from "@/components/Footer"
import { RegionCard } from "@/components/RegionCard"

function isUnitActive(lastSeen: Date): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return lastSeen > oneHourAgo
}

function calculateRegionStats(facilities: Facility[]) {
    let totalCapacity = 0
    let operationalCapacity = 0

    facilities.forEach((facility) => {
        facility.units.forEach((unit) => {
            totalCapacity += unit.capacity
            if (isUnitActive(unit.lastSeen)) {
                operationalCapacity += unit.capacity
            }
        })
    })

    return {
        totalCapacity: Math.round(totalCapacity),
        operationalCapacity: Math.round(operationalCapacity),
        percentageOperational: Math.round(
            (operationalCapacity / totalCapacity) * 100,
        ),
    }
}

function groupFacilitiesByRegion(
    records: FacilityRecord[],
): Map<string, Facility[]> {
    // First convert records to facilities with units
    const facilitiesMap = new Map<string, Facility>()

    records.forEach((record) => {
        if (!facilitiesMap.has(record.facility_code)) {
            facilitiesMap.set(record.facility_code, {
                name: record.facility_name,
                code: record.facility_code,
                region: record.facility_region,
                units: [],
            })
        }

        const facility = facilitiesMap.get(record.facility_code)
        if (facility) {
            facility.units.push({
                code: record.unit_code,
                capacity: record.unit_capacity,
                lastSeen: new Date(record.unit_last_seen),
                status: record.unit_status,
            })
        }
    })

    // Then group by region and sort by our custom order
    const groupedFacilities = new Map<string, Facility[]>()
    Array.from(facilitiesMap.values()).forEach((facility) => {
        const region = facility.region
        if (!groupedFacilities.has(region)) {
            groupedFacilities.set(region, [])
        }
        groupedFacilities.get(region)?.push(facility)
    })

    return groupedFacilities
}

export default async function Home() {
    const records = await getFacilities()
    const facilitiesByRegion = groupFacilitiesByRegion(records.getRecords())

    const sortedRegions = Array.from(facilitiesByRegion.entries()).sort(
        (a, b) => {
            return regionOrder.indexOf(a[0]) - regionOrder.indexOf(b[0])
        },
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
