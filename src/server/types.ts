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

export interface Facility {
    name: string
    code: string
    region: string
    units: {
        code: string
        capacity: number
        lastSeen: Date
        status: string
    }[]
}
