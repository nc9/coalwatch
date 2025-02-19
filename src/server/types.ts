export interface DataTableRow {
    interval: Date
    unit_code: string
    energy: number
}

export interface FacilityRecord {
    facility_code: string
    facility_name: string
    facility_network: string
    facility_region: string
    unit_code: string
    unit_capacity: number
    unit_last_seen: string
    unit_status: string
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
