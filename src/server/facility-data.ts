import type { FacilityData } from "@/server/types"

/** Cached blob read shared by the home page and the og image */
export async function getFacilityData(
  opts: { noDataCache?: boolean } = {}
): Promise<FacilityData> {
  const blobUrl = process.env.NEXT_PUBLIC_FACILITIES_BLOB_URL
  if (!blobUrl) {
    throw new Error(
      "NEXT_PUBLIC_FACILITIES_BLOB_URL environment variable is not set"
    )
  }

  const response = await fetch(
    blobUrl,
    opts.noDataCache ? { cache: "no-store" } : { next: { revalidate: 300 } }
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch facility data: ${response.statusText}`)
  }

  return response.json()
}
