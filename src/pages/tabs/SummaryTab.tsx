import EntityChart from '../../components/EntityChart'
import StatCard from '../../components/StatCard'
import { useFinances, aggregateByYear, fmtEur } from '../../api/useFinances'
import { kindDisplay } from '../../api/types'
import type { ApiEntity } from '../../api/types'
import { ExternalLink } from 'lucide-react'

interface Props {
  entity: ApiEntity
}

export default function SummaryTab({ entity }: Props) {
  const { records, loading } = useFinances(entity.entity)
  const yearly = aggregateByYear(records)
  const latest = yearly[0]
  const prior  = yearly[1]

  function pct(a: number | null, b: number | null) {
    if (a === null || b === null || b === 0) return undefined
    return ((a - b) / b) * 100
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-800">{entity.display}</h1>
            <div className="flex items-center gap-2 mt-1">
              {entity.ticker && (
                <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1.5 py-0.5 rounded">
                  {entity.ticker}
                </span>
              )}
              <span className="text-stone-300">·</span>
              <span className="text-sm text-stone-500">{kindDisplay(entity.kind)}</span>
              <span className="text-stone-300">·</span>
              <span className="text-sm text-stone-500 capitalize">{entity.sector.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(entity.display + ' Ireland annual report')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1 shrink-0"
          >
            Search reports
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Chart */}
      <EntityChart entity={entity} />

      {/* Key stats */}
      {loading ? (
        <div className="text-sm text-stone-400">Loading financials...</div>
      ) : latest ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label={`${latest.year} Income`}
            value={fmtEur(latest.income)}
            change={pct(latest.income, prior?.income ?? null)}
            highlight
          />
          <StatCard
            label={`${latest.year} Gov Income`}
            value={fmtEur(latest.govIncome)}
            change={pct(latest.govIncome, prior?.govIncome ?? null)}
          />
          <StatCard
            label={`${latest.year} Expenditure`}
            value={fmtEur(latest.expenditure)}
            change={pct(latest.expenditure, prior?.expenditure ?? null)}
          />
          <StatCard
            label="Headcount"
            value={latest.headcount !== null ? latest.headcount.toLocaleString() : '—'}
            sub={latest.staffCosts !== null ? `Staff costs: ${fmtEur(latest.staffCosts)}` : undefined}
            change={pct(latest.headcount, prior?.headcount ?? null)}
          />
        </div>
      ) : null}

      {/* Profile */}
      <div className="rounded border border-stone-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Profile</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row label="Entity ID"  value={entity.entity} />
          <Row label="Type"       value={kindDisplay(entity.kind)} />
          <Row label="Sector"     value={entity.sector.replace(/_/g, ' ')} />
          {entity.ticker && <Row label="Ticker" value={entity.ticker} />}
        </dl>
      </div>

      {/* Recent financials table */}
      {yearly.length > 0 && (
        <div className="rounded border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Recent Financials</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-stone-400">
                <th className="text-left pb-2 font-medium">Year</th>
                <th className="text-right pb-2 font-medium">Income</th>
                <th className="text-right pb-2 font-medium">Gov Income</th>
                <th className="text-right pb-2 font-medium">Expenditure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {yearly.slice(0, 5).map((y) => (
                <tr key={y.year}>
                  <td className="py-1.5 text-stone-600">{y.year}</td>
                  <td className="py-1.5 text-right text-stone-600">{fmtEur(y.income)}</td>
                  <td className="py-1.5 text-right text-stone-500">{fmtEur(y.govIncome)}</td>
                  <td className="py-1.5 text-right text-stone-600">{fmtEur(y.expenditure)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-stone-400 w-32 shrink-0">{label}</dt>
      <dd className="text-stone-600 capitalize">{value}</dd>
    </div>
  )
}
