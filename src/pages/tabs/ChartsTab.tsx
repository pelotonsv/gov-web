import { useFinances, aggregateByYear, fmtEur } from '../../api/useFinances'
import type { ApiEntity } from '../../api/types'

interface Props {
  entity: ApiEntity
}

function Bar({ value, max, colour }: { value: number; max: number; colour: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-4 bg-stone-100 rounded overflow-hidden">
        <div className={`h-full rounded ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-stone-400 w-20 text-right">{fmtEur(value * 1_000_000)}</span>
    </div>
  )
}

export default function ChartsTab({ entity }: Props) {
  const { records, loading, error } = useFinances(entity.entity)
  const yearly = aggregateByYear(records)
  const reversed = [...yearly].reverse()

  const maxInEx = Math.max(
    ...yearly.flatMap((y) => [y.income ?? 0, y.expenditure ?? 0]).map((v) => v / 1_000_000),
  )
  const maxIncome = Math.max(...yearly.map((y) => (y.income ?? 0) / 1_000_000))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">Charts</h2>
        <p className="text-sm text-stone-500">Visual overview of financial trends.</p>
      </div>

      {loading && <div className="text-sm text-stone-400">Loading...</div>}
      {error   && <div className="text-sm text-red-500">{error}</div>}

      {!loading && yearly.length === 0 && (
        <div className="rounded border border-stone-200 border-dashed p-8 text-center text-sm text-stone-400">
          No financial data available for {entity.display} yet.
        </div>
      )}

      {!loading && yearly.length > 0 && (
        <>
          <div className="rounded border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-600 mb-4">Income vs Expenditure</h3>
            <div className="flex flex-col gap-5">
              {reversed.map((y) => (
                <div key={y.year}>
                  <div className="text-xs font-medium text-stone-400 mb-1.5">{y.year}</div>
                  <div className="flex flex-col gap-1">
                    {y.income !== null && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Income
                        </div>
                        <Bar value={y.income / 1_000_000} max={maxInEx} colour="bg-amber-400" />
                      </>
                    )}
                    {y.expenditure !== null && (
                      <>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span className="w-2 h-2 rounded-full bg-stone-400 inline-block" /> Expenditure
                        </div>
                        <Bar value={y.expenditure / 1_000_000} max={maxInEx} colour="bg-stone-400" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {yearly.some((y) => y.govIncome !== null) && (
            <div className="rounded border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-stone-600 mb-4">Government Income Trend</h3>
              <div className="flex flex-col gap-3">
                {reversed.map((y) =>
                  y.govIncome !== null ? (
                    <div key={y.year}>
                      <div className="text-xs text-stone-400 mb-1">{y.year}</div>
                      <Bar value={y.govIncome / 1_000_000} max={maxIncome} colour="bg-emerald-500" />
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
