import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useInflows } from '../../api/useFlows'
import { fmtEur } from '../../api/useFinances'
import CounterpartyPanel from '../../components/CounterpartyPanel'
import type { ApiEntity, ApiFlowRecord, FlowCounterparty } from '../../api/types'

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019]

type SortField = 'name' | 'amount'
type SortDir   = 'asc'  | 'desc'

interface SchemeGroup {
  code: string
  name: string
  records: ApiFlowRecord[]
  total: number
}

function groupByScheme(records: ApiFlowRecord[]): SchemeGroup[] {
  const map = new Map<string, SchemeGroup>()
  for (const r of records) {
    const key = r.scheme_slug || 'unknown'
    if (!map.has(key)) map.set(key, { code: r.scheme_code, name: r.scheme_name, records: [], total: 0 })
    const g = map.get(key)!
    g.records.push(r)
    g.total += r.amount
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

function toCounterparty(r: ApiFlowRecord): FlowCounterparty {
  return {
    slug:          r.payer_slug,
    name:          r.payer_name,
    entityType:    r.payer_entity_type,
    kind:          r.payer_kind,
    sector:        r.payer_sector,
    companyNumber: r.payee_company_number > 0 ? r.payee_company_number : null,
    charityNumber: r.payee_charity_number  || null,
    url:           r.payer_url             || null,
  }
}

function SortHeader({ label, field, sortField, sortDir, onSort, align = 'left' }: {
  label: string; field: SortField; sortField: SortField; sortDir: SortDir
  onSort: (f: SortField) => void; align?: 'left' | 'right'
}) {
  const active = sortField === field
  const Icon   = active && sortDir === 'asc' ? ChevronUp : ChevronDown
  return (
    <th
      className={`px-4 py-1.5 text-xs font-medium text-stone-400 cursor-pointer select-none hover:text-stone-600 transition-colors ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-0.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        <Icon size={10} className={active ? 'text-stone-500' : 'opacity-30'} />
      </span>
    </th>
  )
}

function SchemeSection({ group, onSelect }: { group: SchemeGroup; onSelect: (c: FlowCounterparty) => void }) {
  const [sortField, setSortField] = useState<SortField>('amount')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const sorted = [...group.records].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    if (sortField === 'name') return mul * a.payer_name.localeCompare(b.payer_name)
    return mul * (a.amount - b.amount)
  })

  return (
    <div className="rounded border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{group.code}</span>
          <span className="text-sm font-medium text-stone-700">{group.name}</span>
        </div>
        <span className="text-sm font-semibold text-stone-800 shrink-0 ml-4">{fmtEur(group.total)}</span>
      </div>

      <table className="w-full text-sm">
        {group.records.length > 1 && (
          <thead className="border-b border-stone-100">
            <tr>
              <SortHeader label="Name"   field="name"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              <th className="px-4 py-1.5" />
              <SortHeader label="Amount" field="amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" />
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-stone-100">
          {sorted.map((r) => (
            <tr
              key={r.flow_id}
              className="hover:bg-amber-50 transition-colors cursor-pointer"
              onClick={() => onSelect(toCounterparty(r))}
            >
              <td className="px-4 py-1.5 text-stone-700">{r.payer_name}</td>
              <td className="px-4 py-1.5 text-stone-400 text-xs capitalize">
                {r.payer_entity_type.replace(/_/g, ' ')}
              </td>
              <td className="px-4 py-1.5 text-right font-medium text-stone-800">{fmtEur(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Props { entity: ApiEntity }

export default function InflowsTab({ entity }: Props) {
  const [year, setYear]                 = useState(2024)
  const [counterparty, setCounterparty] = useState<FlowCounterparty | null>(null)
  const { records, loading, error }     = useInflows(entity.entity, year)

  const groups     = groupByScheme(records)
  const grandTotal = records.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-stone-800 mb-1">Inflows</h2>
        <p className="text-sm text-stone-500">Payments and grants received by {entity.display}.</p>
      </div>

      <div className="flex items-center gap-0.5">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`text-sm px-3 py-1.5 rounded font-medium transition-colors ${
              year === y ? 'bg-stone-800 text-amber-400' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-stone-400">Loading...</div>}
      {error   && <div className="text-sm text-red-500">{error}</div>}

      {!loading && records.length === 0 && !error && (
        <div className="rounded border border-stone-200 border-dashed p-8 text-center text-sm text-stone-400">
          No inflow data available for {entity.display} in {year}.
        </div>
      )}

      {!loading && groups.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-500">{records.length} payment{records.length !== 1 ? 's' : ''} across {groups.length} scheme{groups.length !== 1 ? 's' : ''}</span>
            <span className="text-stone-300">·</span>
            <span className="font-semibold text-stone-800">{fmtEur(grandTotal)} total</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {groups.map((g) => <SchemeSection key={g.code} group={g} onSelect={setCounterparty} />)}
            </div>
            {counterparty && (
              <div className="w-[30%] shrink-0 sticky top-0">
                <CounterpartyPanel counterparty={counterparty} onClose={() => setCounterparty(null)} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
