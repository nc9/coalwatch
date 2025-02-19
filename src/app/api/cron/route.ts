import { generateData } from "@/scripts/generate-data"
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

        // Generate and store the data
        const data = await generateData()

        return NextResponse.json({
            success: true,
            lastUpdated: data.lastUpdated,
            message: "Data generation completed successfully",
        })
    } catch (error) {
        console.error("Cron job failed:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate data",
            },
            { status: 500 },
        )
    }
}
