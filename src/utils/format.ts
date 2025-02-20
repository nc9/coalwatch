import { formatDistanceToNow } from "date-fns"
import { format } from "date-fns"
import numeral from "numeral"

export const regionNames: Record<string, string> = {
  NSW1: "New South Wales",
  QLD1: "Queensland",
  SA1: "South Australia",
  TAS1: "Tasmania",
  VIC1: "Victoria",
}

// Order for regions
export const regionOrder = ["NSW1", "QLD1", "VIC1", "SA1", "TAS1"]

export function formatLastSeen(date: Date): string {
  return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`
}

export function formatMW(value: number): string {
  return numeral(value).format("0,0")
}

export function formatNetworkTime(date: Date | string): string {
  try {
    // If we get a string with timezone, parse it carefully
    let parsedDate: Date
    if (typeof date === "string") {
      // For dates with +10:00, we need to parse them as UTC
      // by replacing +10:00 with Z to keep the same time
      parsedDate = new Date(date.replace("+10:00", "Z"))
    } else {
      parsedDate = date
    }

    // Validate the date is valid
    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date value:", date)
      return "Invalid date"
    }

    // Format the time - use the exact time without timezone adjustments
    return format(parsedDate, "h:mm a, d MMM yyyy")
  } catch (error) {
    console.error("Error formatting date:", date, error)
    return "Invalid date"
  }
}

// Format unit codes to be more readable
export function formatUnitCode(code: string): string {
  // Remove common suffixes and prefixes
  return (
    code
      // Handle Bluewaters special cases
      .replace(/_BLUEWATERS.*$/, "") // Remove _BLUEWATERS and anything after
      .replace(/_BLUEWATE.*$/, "") // Remove _BLUEWATE and anything after
      .replace(/2_BLUEWATERS$/, "2") // Handle case where number is before BLUEWATERS
      .replace(/1_BLUEWATERS$/, "1") // Handle case where number is before BLUEWATERS
      // Add spaces between letters and numbers
      .replace(/([A-Z]+)(\d+)/, "$1 $2") // Add space between letters and numbers
      // Common prefix replacements
      .replace(/^BW/, "BW ") // Add space after BW
      .replace(/^ER/, "ER ") // Add space after ER
      .replace(/^MP/, "MP ") // Add space after MP
      .replace(/^CPP/, "CPP ") // Add space after CPP
      .replace(/^GSTONE/, "GS ") // Replace GSTONE with GS
      .replace(/^STAN-/, "ST ") // Replace STAN- with ST
      .replace(/^KPP_/, "KP ") // Replace KPP_ with KP
      .replace(/^MPP_/, "MP ") // Replace MPP_ with MP
      // Clean up any double spaces
      .replace(/\s+/g, " ")
      .trim()
  )
}

export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return "-%"
  return `${Math.round(value)}%`
}
