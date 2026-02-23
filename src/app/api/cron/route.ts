import { generateData } from "@/scripts/generate-data"
import { generateStatusData } from "@/scripts/generate-status-data"
import { NextResponse } from "next/server"

// Disable caching for this route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get("Authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Generate and store the facility data
    const data = await generateData()

    // Generate and store the status data
    const statusData = await generateStatusData()

    return NextResponse.json({
      success: true,
      lastUpdated: data.lastUpdated,
      statusLastUpdated: statusData.lastUpdated,
      message: "Data and status generation completed successfully",
    })
  } catch (error) {
    console.error("Cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate data",
      },
      { status: 500 }
    )
  }
}
