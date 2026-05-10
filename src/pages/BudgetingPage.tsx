import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useEntityContext } from '../api/EntityContext'
import { fetchFinances } from '../api/client'
import { aggregateByYear, fmtEur } from '../api/useFinances'
import type { ApiEntity } from '../api/types'
import type { YearlyFinancials } from '../api/useFinances'

// Only public entities are relevant for state spending simulation
// Year range — derived from available data
const MIN_YEAR = 2014
const MAX_YEAR = 2024

type FinanceMap = Record<string, YearlyFinancials[]>

type SortKey = 'name' | 'kind' | 'govIncome' | 'savings'
type SortDir = 'asc' | 'desc'

export default function BudgetingPage() {
  const { entities, loading: entitiesLoading } = useEntityContext()
  const [financeMap, setFinanceMap] = useState<FinanceMap>({})
  const [loadingFinances, setLoadingFinances] = useState(false)
  const [years, setYears] = useState<Record<string, number>>({})
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const navigate = useNavigate()

  const publicEntities = useMemo(
    () => entities.filter((e) => e.typ === 'public'),
    [entities],
  )

  // Initialise year sliders once entity list loads
  useEffect(() => {
    if (publicEntities.length === 0) return
    setYears((prev) => {
      const next = { ...prev }
      publicEntities.forEach((e) => {
        if (!(e.entity in next)) next[e.entity] = MAX_YEAR
      })
      return next
    })
  }, [publicEntities])

  // Fetch finances for all public entities
  useEffect(() => {
    if (publicEntities.length === 0) return
    setLoadingFinances(true)
    Promise.all(
      publicEntities.map((e) =>
        fetchFinances(e.entity)
          .then((records) => ({ id: e.entity, yearly: aggregateByYear(records) }))
          .catch(() => ({ id: e.entity, yearly: [] })),
      ),
    ).then((results) => {
      const map: FinanceMap = {}
      results.forEach(({ id, yearly }) => { map[id] = yearly })
      setFinanceMap(map)
      setLoadingFinances(false)
    })
  }, [publicEntities])

  function getGovIncome(entity: ApiEntity, year: number): number | null {
    const yearly = financeMap[entity.entity]
    if (!yearly) return null
    const row = yearly.find((y) => y.year === year)
    return row?.govIncome ?? row?.income ?? null
  }

  function setYear(id: string, year: number) {
    setYears((prev) => ({ ...prev, [id]: year }))
  }

  function resetAll() {
    setYears(Object.fromEntries(publicEntities.map((e) => [e.entity, MAX_YEAR])))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' || key === 'kind' ? 'asc' : 'desc') }
  }

  const rows = useMemo(() => {
    return publicEntities.map((e) => {
      const selectedYear      = years[e.entity] ?? MAX_YEAR
      const currentGovIncome  = getGovIncome(e, MAX_YEAR)
      const selectedGovIncome = getGovIncome(e, selectedYear)
      const savings = (currentGovIncome !== null && selectedGovIncome !== null)
        ? currentGovIncome - selectedGovIncome
        : null
      return { entity: e, selectedYear, currentGovIncome, selectedGovIncome, savings }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicEntities, years, financeMap])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name')      cmp = a.entity.display.localeCompare(b.entity.display)
      if (sortKey === 'kind')      cmp = a.entity.kind.localeCompare(b.entity.kind)
      if (sortKey === 'govIncome') cmp = (a.selectedGovIncome ?? 0) - (b.selectedGovIncome ?? 0)
      if (sortKey === 'savings')   cmp = (a.savings ?? 0) - (b.savings ?? 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir])

  const totalSavings      = rows.reduce((s, r) => s + (r.savings ?? 0), 0)
  const totalCurrentSpend = rows.reduce((s, r) => s + (r.currentGovIncome ?? 0), 0)
  const anyChanged        = rows.some((r) => r.selectedYear !== MAX_YEAR)

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={11} className="text-stone-300 ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp   size={11} className="text-amber-500 ml-1" />
      : <ChevronDown size={11} className="text-amber-500 ml-1" />
  }

  if (entitiesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-stone-400">
        Loading entities...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-stone-800 mb-1">Budget Simulator</h1>
          <p className="text-sm text-stone-500 max-w-2xl">
            Roll back each public entity's income to any year between {MIN_YEAR} and {MAX_YEAR}.
            Savings reflect the reduction versus {MAX_YEAR} levels.
            {loadingFinances && <span className="ml-2 text-amber-600">Loading financial data…</span>}
          </p>
        </div>

        {/* Summary bar */}
        <div className="rounded border border-stone-200 bg-white p-4 mb-4 flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-xs text-stone-400 mb-0.5">{MAX_YEAR} Total Income</div>
            <div className="text-lg font-semibold text-stone-800">{fmtEur(totalCurrentSpend)}</div>
          </div>
          <div className="h-8 w-px bg-stone-200" />
          <div>
            <div className="text-xs text-stone-400 mb-0.5">Simulated Spend</div>
            <div className="text-lg font-semibold text-stone-800">{fmtEur(totalCurrentSpend - totalSavings)}</div>
          </div>
          <div className="h-8 w-px bg-stone-200" />
          <div>
            <div className="text-xs text-stone-400 mb-0.5">Total Savings</div>
            <div className={`text-lg font-semibold ${totalSavings > 0 ? 'text-emerald-600' : 'text-stone-400'}`}>
              {totalSavings > 0 ? `+${fmtEur(totalSavings)}` : '—'}
            </div>
          </div>
          {anyChanged && (
            <button
              onClick={resetAll}
              className="ml-auto text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded border border-stone-200 bg-white overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-4 py-2.5 bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <button className="flex items-center text-left hover:text-stone-600 transition-colors" onClick={() => handleSort('name')}>
              Name <SortIcon col="name" />
            </button>
            <button className="flex items-center hover:text-stone-600 transition-colors" onClick={() => handleSort('govIncome')}>
              Income <SortIcon col="govIncome" />
            </button>
            <div>Year ({MIN_YEAR}–{MAX_YEAR})</div>
            <button className="flex items-center justify-end hover:text-stone-600 transition-colors" onClick={() => handleSort('savings')}>
              Savings <SortIcon col="savings" />
            </button>
          </div>

          {sorted.map(({ entity: e, selectedYear, selectedGovIncome, savings }) => {
            const hasData = financeMap[e.entity] !== undefined
            const pctSaved = savings !== null && savings > 0 && selectedGovIncome !== null && selectedGovIncome > 0
              ? ((savings / (selectedGovIncome + savings)) * 100).toFixed(1)
              : null

            return (
              <div
                key={e.entity}
                className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 items-center px-4 py-3.5 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
              >
                <div>
                  <button
                    onClick={() => navigate(`/entity/${e.entity}/summary`)}
                    className="font-medium text-sm text-stone-700 hover:text-amber-700 transition-colors text-left leading-snug"
                  >
                    {e.display}
                  </button>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {e.ticker && (
                      <span className="bg-stone-800 text-amber-400 font-mono text-xs px-1 py-0.5 rounded">
                        {e.ticker}
                      </span>
                    )}
                    <span className="text-xs text-stone-400">{e.sector}</span>
                  </div>
                </div>

                <div>
                  {!hasData ? (
                    <span className="text-xs text-stone-300">—</span>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-stone-700">{fmtEur(selectedGovIncome)}</div>
                      {selectedYear < MAX_YEAR && (
                        <div className="text-xs text-stone-400">{selectedYear} levels</div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 w-8 shrink-0">{MIN_YEAR}</span>
                  <div className="relative flex-1">
                    <input
                      type="range"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      step={1}
                      value={selectedYear}
                      onChange={(ev) => setYear(e.entity, Number(ev.target.value))}
                      disabled={!hasData}
                      className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-amber-500 disabled:opacity-30"
                      style={{
                        background: `linear-gradient(to right, #F59E0B ${((selectedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%, #E7E5E4 ${((selectedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-stone-400 w-8 shrink-0 text-right">{MAX_YEAR}</span>
                  <span
                    className={`text-xs font-semibold w-8 text-center rounded px-1 py-0.5 shrink-0 ${
                      selectedYear < MAX_YEAR ? 'bg-amber-100 text-amber-700' : 'text-stone-400'
                    }`}
                  >
                    {selectedYear}
                  </span>
                </div>

                <div className="text-right">
                  {savings !== null && savings > 0 ? (
                    <>
                      <div className="text-sm font-semibold text-emerald-600">{fmtEur(savings)}</div>
                      {pctSaved && <div className="text-xs text-stone-400">{pctSaved}% reduction</div>}
                    </>
                  ) : (
                    <span className="text-sm text-stone-300">—</span>
                  )}
                </div>
              </div>
            )
          })}

          {anyChanged && (
            <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 items-center px-4 py-3 bg-stone-50 border-t border-stone-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total</div>
              <div /><div />
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-600">{fmtEur(totalSavings)}</div>
                {totalCurrentSpend > 0 && (
                  <div className="text-xs text-stone-400">
                    {((totalSavings / totalCurrentSpend) * 100).toFixed(1)}% of {MAX_YEAR} spend
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
