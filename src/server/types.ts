export interface DataTableRow {
    interval: Date
    unit_code: string
    energy: number
}

export interface IFacilityRecord {
    facility_code: string
    facility_name: string
    facility_network: string
    facility_region: string
    unit_code: string
    unit_capacity: number | null
    unit_last_seen: string | null
    unit_status: string | null
    unit_current_power: number | null
}

// This is our internal type after data transformation
export interface FacilityRecord {
    facility_code: string
    facility_name: string
    facility_network: string
    facility_region: string
    unit_code: string
    unit_capacity: number | null
    unit_last_seen: string | null
    unit_status: string | null
}

export interface Unit {
    code: string
    capacity: number
    lastSeen: string
    rawLastSeen: string // Original data_last_seen value
    status: string
    currentPower?: number
    capacityFactor?: number
    latestInterval?: string
    active: boolean
}

export interface Facility {
    name: string
    code: string
    region: string
    units: Unit[]
    lastUpdated: string
}

export interface FacilityData {
    facilities: Facility[]
    lastUpdated: string
}
