import { describe, expect, test } from "bun:test"
import type { Facility } from "@/server/types"
import { calculateRegionStats, isFeedDelayed } from "./helpers"

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

const unit = (lastSeen: string, currentPower: number) => ({
  code: "U1",
  capacity: 500,
  lastSeen,
  status: "operating",
  currentPower,
  active: currentPower > 5,
})

describe("isFeedDelayed", () => {
  test("false when any unit is fresh", () => {
    expect(isFeedDelayed([{ lastSeen: hoursAgo(5) }, { lastSeen: hoursAgo(0.1) }], now)).toBe(false)
  })
  test("true when newest unit is >1h old", () => {
    expect(isFeedDelayed([{ lastSeen: hoursAgo(3) }, { lastSeen: hoursAgo(5) }], now)).toBe(true)
  })
  test("false for empty or invalid", () => {
    expect(isFeedDelayed([], now)).toBe(false)
    expect(isFeedDelayed([{ lastSeen: "nope" }], now)).toBe(false)
  })
})

describe("calculateRegionStats with delayed feed", () => {
  const facilities: Facility[] = [
    { name: "A", code: "A", region: "NSW1", lastUpdated: "", units: [unit(hoursAgo(3), 400), unit(hoursAgo(3), 0)] },
  ]
  test("keeps last readings when delayed", () => {
    const s = calculateRegionStats(facilities, true)
    expect(s.currentPower).toBe(400)
    expect(s.percentageOperational).toBe(100)
    expect(s.operatingCapacityPercentage).toBe(40)
  })
  test("zeroes without flag", () => {
    expect(calculateRegionStats(facilities, false).currentPower).toBe(0)
  })
})
