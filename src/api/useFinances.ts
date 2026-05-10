import { useEffect, useState } from 'react'
import { fetchFinances } from './client'
import { yearFromSource, type ApiFinanceRecord } from './types'

export interface YearlyFinancials {
  year: number
  income: number | null
  govIncome: number | null           // oireachtas/government grants portion
  expenditure: number | null         // stored as negative in API — normalised to positive here
  headcount: number | null
  headcountSubMetric: string | null  // the actual sub_metric used e.g. "year_end_headcount"
  staffCosts: number | null          // total from sub_category==="staff_costs"
  pensions: number | null            // net from sub_category==="pensions"
  operatingCosts: number | null      // from sub_category==="operating_costs" (pre-normalised positive)
  notableLines: Record<string, { amount: number; metric: string }>  // notable-flagged records keyed by sub_metric
}

// Module-level cache — persists for the lifetime of the page session
const cache = new Map<string, ApiFinanceRecord[]>()

export function useFinances(entity: string) {
  const cached = cache.get(entity)
  const [records, setRecords] = useState<ApiFinanceRecord[]>(cached ?? [])
  const [loading, setLoading]  = useState(!cached)
  const [error, setError]      = useState<string | null>(null)

  useEffect(() => {
    if (cache.has(entity)) {
      setRecords(cache.get(entity)!)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchFinances(entity)
      .then((data) => {
        if (cancelled) return
        cache.set(entity, data)
        setRecords(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load finances')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [entity])

  return { records, loading, error }
}

/**
 * Collapse a flat array of finance records into one row per year.
 * Returns newest-first.
 */
export function aggregateByYear(records: ApiFinanceRecord[]): YearlyFinancials[] {
  const byYear = new Map<number, YearlyFinancials>()

  // Track whether income/expenditure/staffCosts for a year has been set from a definitive total
  const incomeFinal      = new Set<number>()
  const expenditureFinal = new Set<number>()
  const staffCostsFinal  = new Set<number>()

  // Track whether each year's headcount came from a normalised (preferred) record
  const headcountPriority = new Map<number, number>()

  function ensure(year: number): YearlyFinancials {
    if (!byYear.has(year)) {
      byYear.set(year, { year, income: null, govIncome: null, expenditure: null, headcount: null, headcountSubMetric: null, staffCosts: null, pensions: null, operatingCosts: null, notableLines: {} })
    }
    return byYear.get(year)!
  }

  for (const r of records) {
    const year = yearFromSource(r.source)
    const row  = ensure(year)

    // Income — prefer sub_category==="income" (future server normalisation) or sub_metric==="total",
    // fall back to sub_metric==="revenue" (e.g. An Post), ignoring sub-line items
    if (r.metric === 'income') {
      const isTotal   = r.sub_category === 'income' || r.sub_metric === 'total'
      const isRevenue = r.sub_metric === 'revenue'
      if (isTotal) {
        row.income = r.amount
        incomeFinal.add(year)
      } else if (isRevenue && !incomeFinal.has(year)) {
        row.income = r.amount
      }
    }

    // Government / exchequer income — server tags these with sub_category==="gov"
    if (r.metric === 'income' && r.sub_category === 'gov') {
      row.govIncome = (row.govIncome ?? 0) + r.amount
    }

    // Expenditure — prefer sub_category==="expenditure" or sub_metric==="total";
    // if neither exists (e.g. An Post), accumulate all expenditure line items
    if (r.metric === 'expenditure') {
      const isTotal = r.sub_category === 'expenditure' || r.sub_metric === 'total'
      if (isTotal) {
        row.expenditure = Math.abs(r.amount)
        expenditureFinal.add(year)
      } else if (!expenditureFinal.has(year)) {
        row.expenditure = (row.expenditure ?? 0) + Math.abs(r.amount)
      }
    }

    // Headcount — metric name varies by entity ("headcount" or "staff"), so use sub_category
    // as the authoritative signal. Fall back to metric==="headcount" if sub_category is absent.
    if (r.sub_category === 'headcount' || r.metric === 'headcount') {
      const priority = r.sub_category === 'headcount' ? 1 : 0
      if (priority > (headcountPriority.get(year) ?? -1)) {
        row.headcount = Math.round(r.amount)
        row.headcountSubMetric = r.sub_metric
        headcountPriority.set(year, priority)
      }
    }

    // Staff costs — prefer record with "total" in sub_metric name, otherwise keep largest
    if (r.sub_category === 'staff_costs') {
      const isTotal = r.sub_metric.includes('total')
      if (isTotal) {
        row.staffCosts = r.amount
        staffCostsFinal.add(year)
      } else if (!staffCostsFinal.has(year) && r.amount > (row.staffCosts ?? 0)) {
        row.staffCosts = r.amount
      }
    }

    // Pensions — net of all sub_category==="pensions" records per year
    if (r.sub_category === 'pensions') {
      row.pensions = (row.pensions ?? 0) + r.amount
    }

    // Operating costs — pre-normalised to positive by server
    if (r.sub_category === 'operating_costs') {
      row.operatingCosts = r.amount
    }

    // Notable lines — flagged by server, keyed by sub_category and summed per year
    if (r.notable && r.sub_category) {
      const existing = row.notableLines[r.sub_category]
      row.notableLines[r.sub_category] = {
        amount: (existing?.amount ?? 0) + r.amount,
        metric: r.metric,
      }
    }
  }

  return Array.from(byYear.values()).sort((a, b) => b.year - a.year)
}

/** Convert raw EUR amount to display string in millions/billions */
export function fmtEur(amount: number | null): string {
  if (amount === null) return '—'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000_000) return `€${(amount / 1_000_000_000).toFixed(2)}bn`
  if (abs >= 1_000_000)     return `€${(amount / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000)         return `€${(amount / 1_000).toFixed(0)}k`
  return `€${amount.toLocaleString()}`
}

/** Convert raw EUR to millions (for chart axes) */
export function toMillions(amount: number): number {
  return amount / 1_000_000
}
