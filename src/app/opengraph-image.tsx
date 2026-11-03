import { ImageResponse } from "next/og"

export const alt = "Coal Watch Australia"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
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
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 1,
          background: "rgba(255,255,255,0.1)",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          Coal Watch Australia
        </div>
        <div style={{ fontSize: 36, color: "#a3a3a3", marginTop: 32 }}>
          Live output of coal-fired power units on the NEM and WEM
        </div>
      </div>
      <div
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: 24,
          fontSize: 28,
          color: "#a3a3a3",
        }}
      >
        coalwatch.com.au
      </div>
    </div>,
    size,
  )
}
