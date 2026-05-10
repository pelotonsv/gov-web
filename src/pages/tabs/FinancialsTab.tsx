import { useFinances, aggregateByYear, fmtEur } from '../../api/useFinances'
import type { ApiEntity } from '../../api/types'

interface Props {
  entity: ApiEntity
}

export default function FinancialsTab({ entity }: Props) {
  const { records, loading, error } = useFinances(entity.entity)
  const yearly = aggregateByYear(records)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">Financials</h2>
        <p className="text-sm text-stone-500">Annual financial data sourced from published accounts.</p>
      </div>

      {loading && <div className="text-sm text-stone-400">Loading...</div>}
      {error   && <div className="text-sm text-red-500">{error}</div>}

      {!loading && yearly.length > 0 && (
        <>
          <div className="rounded border border-stone-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-xs text-stone-400 uppercase tracking-wide border-b border-stone-200">
                  <th className="text-left px-4 py-3 font-medium">Year</th>
                  <th className="text-right px-4 py-3 font-medium">Income</th>
                  <th className="text-right px-4 py-3 font-medium">Gov Income</th>
                  <th className="text-right px-4 py-3 font-medium">Expenditure</th>
                  <th className="text-right px-4 py-3 font-medium">Staff Costs</th>
                  <th className="text-right px-4 py-3 font-medium">Pensions</th>
                  <th className="text-right px-4 py-3 font-medium">Headcount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {yearly.map((y) => (
                  <tr key={y.year} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-700">{y.year}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmtEur(y.income)}</td>
                    <td className="px-4 py-3 text-right text-stone-500">{fmtEur(y.govIncome)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmtEur(y.expenditure)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmtEur(y.staffCosts)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{fmtEur(y.pensions)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">
                      {y.headcount !== null ? y.headcount.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Staff costs bar */}
          {yearly.some((y) => y.staffCosts !== null && y.expenditure !== null) && (
            <div className="rounded border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-600 mb-4">Staff Costs as % of Expenditure</h3>
              <div className="flex flex-col gap-3">
                {yearly.map((y) => {
                  if (y.staffCosts === null || y.expenditure === null || y.expenditure === 0) return null
                  const pct = ((y.staffCosts / y.expenditure) * 100).toFixed(1)
                  const width = Math.min(100, Math.round((y.staffCosts / y.expenditure) * 100))
                  return (
                    <div key={y.year} className="flex items-center gap-3 text-sm">
                      <span className="text-stone-400 w-12 shrink-0">{y.year}</span>
                      <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
                        <div className="h-full bg-amber-400 rounded" style={{ width: `${width}%` }} />
                      </div>
                      <span className="text-stone-600 w-12 text-right font-medium">{pct}%</span>
                    </div>
                  )
                })}
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
