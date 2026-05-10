export interface ApiEntity {
  entity: string        // snake_case ID e.g. "failte_ireland"
  typ: 'public' | 'private'
  ticker: string        // e.g. "FAILTE" — empty string for some private entities
  display: string       // e.g. "Fáilte Ireland"
  kind: string          // semi_state | agency | quango | ngo | charity | ltd | ...
  sector: string        // tourism | health | transport | ...
}

export interface ApiFinanceRecord {
  typ: string
  entity: string
  source: string        // "ar2024" — year encoded as ar + year
  metric: string        // income | expenditure | surplus | balance_sheet | headcount | ...
  sub_metric: string    // total | government_total | average_headcount | year_end_headcount | ...
  sub_category: string  // normalised category e.g. "headcount" — empty string if not mapped
  notable?: boolean     // flag: render as an extra labelled line on the chart
  amount: number        // raw EUR
  currency: string
  pages: number[]       // some values are INT64_MIN sentinel for null — filter these
  notes: string
}

export interface ApiFlowRecord {
  flow_id: string
  year: number
  flow_type: string
  payer_slug: string
  payer_name: string
  payer_entity_type: string
  payer_kind: string
  payer_sector: string
  payee_slug: string
  payee_name: string
  payee_entity_type: string
  payee_kind: string
  payee_sector: string
  payee_company_number: number
  payee_charity_number: string
  payee_url: string
  payer_url: string
  scheme_slug: string
  scheme_code: string
  scheme_name: string
  amount: number
  currency: string
  source_slug: string
  source_sheet: string
  source_row: number
  match_status: string
  notes: string
}

export interface FlowCounterparty {
  slug: string
  name: string
  entityType: string   // individual | state | private | ...
  kind: string
  sector: string
  companyNumber: number | null   // null when INT64_MIN sentinel
  charityNumber: string | null   // null when empty
  url: string | null
}

/** Extract year from source string e.g. "ar2024" or "fs2024" → 2024 */
export function yearFromSource(source: string): number {
  const m = source.match(/(\d{4})$/)
  return m ? parseInt(m[1], 10) : NaN
}

/** Human-readable label for entity kind */
export function kindDisplay(kind: string): string {
  const map: Record<string, string> = {
    semi_state:        'Semi-State Body',
    agency:            'State Agency',
    quango:            'State Body',
    ngo:               'NGO',
    charity:           'Charity',
    ltd:               'Private Company',
    ulc:               'Private Company',
    partnership:       'Partnership',
    plc:               'Public Company',
    clg:               'Company Limited by Guarantee',
    professional_body: 'Professional Body',
    business_body:     'Business Body',
  }
  return map[kind] ?? kind.replace(/_/g, ' ')
}

/** Safe page numbers — filter out INT64_MIN sentinel values */
export function validPages(pages: number[]): number[] {
  return pages.filter(p => p > 0 && p < 100000)
}
