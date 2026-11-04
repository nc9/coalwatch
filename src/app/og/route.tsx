import { ImageResponse } from "next/og"
import { getFacilityData } from "@/server/facility-data"

// File-convention og images are served immutable for a year; a route handler
// lets us control Cache-Control so the live numbers refresh
export const dynamic = "force-dynamic"

const size = { width: 1200, height: 630 }

const HAIRLINE = "rgba(255,255,255,0.1)"
const MUTED = "#a3a3a3"
const STALE_MS = 2 * 60 * 60 * 1000

interface LiveStats {
  gw: string
  live: number
  total: number
  asOf: string
}

// Any doubt (fetch error, delayed feed, stale data) returns null: static design
async function getLiveStats(): Promise<LiveStats | null> {
  try {
    const data = // no-store: the Next data cache served an hour-old blob here on prod while
      // the page was fresh; the response is CDN-cached 5m and the blob URL is
      // itself CDN-fronted, so this adds no meaningful upstream load
      await getFacilityData({ noDataCache: true })
    const updated = new Date(data.lastUpdated).getTime()
    if (!Number.isFinite(updated) || Date.now() - updated > STALE_MS)
      return null
    if (data.dataDelayed === true || (data.delayedNetworks?.length ?? 0) > 0)
      return null
    if (!data.facilities?.length) return null

    // Count per the blob's own `active` flag so output and unit counts agree
    // (calculateNetworkSummary re-checks lastSeen against now, which ages
    // inside the cache window and would zero the output)
    const units = data.facilities.flatMap((f) => f.units)
    if (units.length === 0) return null
    const newest = Math.max(...units.map((u) => new Date(u.lastSeen).getTime()))
    if (!Number.isFinite(newest) || Date.now() - newest > STALE_MS) return null
    const live = units.filter((u) => u.active)
    const mw = live.reduce((sum, u) => sum + (u.currentPower ?? 0), 0)
    const asOf = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(newest))
    return {
      gw: (mw / 1000).toFixed(2),
      live: live.length,
      total: units.length,
      asOf: `${asOf} AEST`,
    }
  } catch {
    return null
  }
}

export async function GET() {
  const stats = await getLiveStats()

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#f5f5f5",
          padding: 72,
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: stats ? 44 : 128,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Coal Watch Australia
        </div>
        {stats ? (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
                Coal output now, NEM + WEM
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 220,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {stats.gw}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 64,
                    color: MUTED,
                    marginLeft: 20,
                  }}
                >
                  GW
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 72,
                paddingLeft: 56,
                borderLeft: `1px solid ${HAIRLINE}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
                Units running
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 140,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {stats.live}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 56,
                    color: MUTED,
                    marginLeft: 12,
                  }}
                >
                  / {stats.total}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 36, color: MUTED }}>
            Live output of coal-fired power units on the NEM and WEM
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: 24,
            fontSize: 28,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex" }}>coalwatch.com.au</div>
          {stats && (
            <div style={{ display: "flex" }}>Data as of {stats.asOf}</div>
          )}
        </div>
      </div>
    ),
    size
  )
  return new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
