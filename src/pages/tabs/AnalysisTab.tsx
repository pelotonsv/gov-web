import { useFinances, aggregateByYear, fmtEur } from '../../api/useFinances'
import type { ApiEntity } from '../../api/types'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

interface Props {
  entity: ApiEntity
}

export default function AnalysisTab({ entity }: Props) {
  const { records, loading, error } = useFinances(entity.entity)
  const yearly = aggregateByYear(records)
  const latest = yearly[0]
  const oldest = yearly[yearly.length - 1]

  function cagr(current: number | null, base: number | null, years: number): number | null {
    if (!current || !base || years < 1) return null
    return (Math.pow(current / base, 1 / years) - 1) * 100
  }

  function pct(a: number | null, b: number | null): number | null {
    if (a === null || b === null || b === 0) return null
    return ((a - b) / b) * 100
  }

  const years = latest && oldest ? latest.year - oldest.year : 0

  const incomeCagr      = cagr(latest?.income, oldest?.income, years)
  const headcountGrowth = pct(latest?.headcount, oldest?.headcount)
  const avgStaffPct     = yearly.length > 0
    ? yearly.reduce((acc, y) => {
        if (y.staffCosts === null || y.expenditure === null || y.expenditure === 0) return acc
        return acc + (y.staffCosts / y.expenditure) * 100
      }, 0) / yearly.filter((y) => y.staffCosts && y.expenditure).length
    : null

  const insights: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = []

  if (incomeCagr !== null) {
    insights.push({
      type: incomeCagr > 8 ? 'negative' : incomeCagr > 0 ? 'positive' : 'negative',
      text: `Income has grown at a CAGR of ${incomeCagr.toFixed(1)}% over ${years} years (${oldest?.year}–${latest?.year}).`,
    })
  }

  if (headcountGrowth !== null) {
    insights.push({
      type: 'neutral',
      text: `Headcount has ${headcountGrowth > 0 ? 'grown' : 'decreased'} by ${Math.abs(headcountGrowth).toFixed(1)}% since ${oldest?.year}.`,
    })
  }

  if (avgStaffPct !== null && !isNaN(avgStaffPct)) {
    insights.push({
      type: 'neutral',
      text: `Staff costs average ${avgStaffPct.toFixed(1)}% of total expenditure across available years.`,
    })
  }

  if (latest?.govIncome !== null && latest?.income !== null && latest?.income !== 0 && latest?.govIncome !== undefined && latest?.income !== undefined) {
    const govShare = (latest.govIncome / latest.income) * 100
    insights.push({
      type: 'neutral',
      text: `Government income represents ${govShare.toFixed(1)}% of total income in ${latest.year}.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">Analysis</h2>
        <p className="text-sm text-stone-500">Auto-generated analysis based on published financials.</p>
      </div>

      {loading && <div className="text-sm text-stone-400">Loading...</div>}
      {error   && <div className="text-sm text-red-500">{error}</div>}

      {!loading && latest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Metric label="Income CAGR"     value={incomeCagr !== null ? `${incomeCagr.toFixed(1)}%` : '—'} sub={`${oldest?.year}–${latest.year}`} />
            <Metric label="Latest Income"   value={fmtEur(latest.income)}       sub={String(latest.year)} />
            <Metric label="Latest Spend"    value={fmtEur(latest.expenditure)}   sub={String(latest.year)} />
            <Metric label="Gov Income"      value={fmtEur(latest.govIncome)}    sub={String(latest.year)} />
            <Metric label="Headcount"       value={latest.headcount?.toLocaleString() ?? '—'} sub={String(latest.year)} />
            <Metric label="Years of Data"   value={String(yearly.length)}       sub={`${oldest?.year}–${latest.year}`} />
          </div>

          {insights.length > 0 && (
            <div className="rounded border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-600 mb-4">Key Observations</h3>
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    {ins.type === 'positive' && <TrendingUp  size={14} className="text-emerald-500 shrink-0 mt-0.5" />}
                    {ins.type === 'negative' && <TrendingDown size={14} className="text-red-500 shrink-0 mt-0.5" />}
                    {ins.type === 'neutral'  && <AlertCircle size={14} className="text-stone-400 shrink-0 mt-0.5" />}
                    <span className="text-stone-600 leading-relaxed">{ins.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && yearly.length === 0 && (
        <div className="rounded border border-stone-200 border-dashed p-8 text-center text-sm text-stone-400">
          No financial data available for {entity.display} yet.
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded border border-stone-200 bg-white p-4">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-stone-800">{value}</div>
      <div className="text-xs text-stone-400 mt-0.5">{sub}</div>
    </div>
  )
}
