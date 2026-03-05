export interface SolarRegion {
  observed_date: string
  region: number
  latitude: number
  longitude: number
  location: string
  carrington_longitude: number
  area: number | null
  spot_class: string | null
  extent: number | null
  number_spots: number | null
  mag_class: string | null
  c_xray_events: number
  m_xray_events: number
  x_xray_events: number
  proton_events: number | null
  c_flare_probability: number
  m_flare_probability: number
  x_flare_probability: number
  proton_probability: number
  status: string | null
  first_date: string
}

export interface SolarCycleIndex {
  'time-tag': string
  ssn: number
  smoothed_ssn: number
  observed_swpc_ssn: number
  smoothed_swpc_ssn: number
  'f10.7': number
  'smoothed_f10.7': number
}

export interface FluxRecord {
  time_tag: string
  frequency: number
  flux: number
  reporting_schedule: string
  avg_begin_date: string | null
  ninety_day_mean: number | null
  rec_count: number | null
}

// From solar-cycle/predicted-solar-cycle.json
export interface PredictedSSN {
  'time-tag': string
  predicted_ssn: number
  high_ssn: number
  low_ssn: number
}

export interface AppData {
  regions: SolarRegion[]
  cycleHistory: SolarCycleIndex[]
  flux: FluxRecord[]
  predicted: PredictedSSN[]
  fetchedAt: Date
}
