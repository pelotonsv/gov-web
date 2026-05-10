import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  type TooltipProps,
} from 'recharts'
import { useFinances, aggregateByYear, toMillions } from '../api/useFinances'
import type { ApiEntity } from '../api/types'

// ── constants ─────────────────────────────────────────────────────────────────

function fmtM(m: number) {
  if (Math.abs(m) >= 1000) return `€${(m / 1000).toFixed(1)}bn`
  return `€${m.toFixed(1)}m`
}
function fmtHead(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}
function fmtSubMetric(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const CHART_MARGIN = { top: 8, right: 24, left: 16, bottom: 0 }
const BAR_MARGIN   = { top: 0,  right: 24, left: 16, bottom: 0 }
const GOLD           = '#C9A84C'
const GOLD_DARK      = '#A8872E'
const EXP_COLOR      = '#78716C'   // stone-500 — distinct from gold
const STAFF_COLOR    = '#44403C'   // stone-700 — dashed sub-line under expenditure
const MUTED          = '#9B9588'
const NOTABLE_COLORS = ['#0D9488', '#7C3AED', '#DB2777', '#EA580C', '#0284C7']

type Metric    = 'income' | 'expenditure'
type TimeRange = '3Y' | '5Y' | '10Y' | 'Max'
const TIME_RANGES: TimeRange[] = ['3Y', '5Y', '10Y', 'Max']
const YEARS_BACK: Record<string, number> = { '3Y': 3, '5Y': 5, '10Y': 10 }

// ── global prefs (localStorage) ───────────────────────────────────────────────

function storedMetric():    Metric    { return (localStorage.getItem('chart.metric')    as Metric)    ?? 'income' }
function storedTimeRange(): TimeRange { return (localStorage.getItem('chart.timeRange') as TimeRange) ?? 'Max'    }

// ── types ─────────────────────────────────────────────────────────────────────

type DataPoint = {
  year: number
  income:             number | null
  govIncome:          number | null
  expenditure:        number | null
  operatingCosts:     number | null
  headcount:          number | null
  headcountSubMetric: string | null
  notableLines:       Record<string, { amountM: number; metric: string }>
}

type TProps = TooltipProps<number, string> & {
  payload?: { name: string; value: number; color: string; payload?: DataPoint }[]
  label?: string
}

// ── tooltips ──────────────────────────────────────────────────────────────────

function LineTooltip({ active, payload, label }: TProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-200 shadow-lg rounded px-3 py-2.5 text-xs">
      <div className="font-semibold text-stone-700 mb-1.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-stone-500">{p.name}:</span>
          <span className="font-medium text-stone-800">{fmtM(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function HeadcountTooltip({ active, payload, label }: TProps) {
  if (!active || !payload?.length) return null
  const subMetric = payload[0]?.payload?.headcountSubMetric
  return (
    <div className="bg-white border border-stone-200 shadow-lg rounded px-3 py-2.5 text-xs">
      <div className="font-semibold text-stone-700 mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full inline-block bg-stone-400" />
        <span className="text-stone-500">Headcount:</span>
        <span className="font-medium text-stone-800">{payload[0]?.value?.toLocaleString()}</span>
      </div>
      {subMetric && (
        <div className="text-stone-400 mt-1 pl-4">{fmtSubMetric(subMetric)}</div>
      )}
    </div>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props { entity: ApiEntity }

export default function EntityChart({ entity }: Props) {
  const { records, loading, error } = useFinances(entity.entity)

  // Global prefs — initialised from localStorage so they survive entity navigation
  const [metric, setMetricRaw]       = useState<Metric>(storedMetric)
  const [timeRange, setTimeRangeRaw] = useState<TimeRange>(storedTimeRange)

  function setMetric(m: Metric) {
    localStorage.setItem('chart.metric', m)
    setMetricRaw(m)
  }
  function setTimeRange(t: TimeRange) {
    localStorage.setItem('chart.timeRange', t)
    setTimeRangeRaw(t)
  }

  const yearly = aggregateByYear(records)

  // Full data oldest → newest
  const allData: DataPoint[] = useMemo(
    () => [...yearly].reverse().map((y) => ({
      year:               y.year,
      income:             y.income      !== null ? toMillions(y.income)      : null,
      govIncome:          y.govIncome   !== null ? toMillions(y.govIncome)   : null,
      expenditure:        y.expenditure    !== null ? toMillions(y.expenditure)    : null,
      operatingCosts:     y.operatingCosts !== null ? toMillions(y.operatingCosts) : null,
      notableLines:       Object.fromEntries(
        Object.entries(y.notableLines).map(([k, v]) => [k, { amountM: toMillions(v.amount), metric: v.metric }])
      ),
      headcount:          y.headcount,
      headcountSubMetric: y.headcountSubMetric,
    })),
    [yearly],
  )

  // Apply time-range filter relative to the latest data year
  const data = useMemo(() => {
    if (timeRange === 'Max' || allData.length === 0) return allData
    const maxYear = allData[allData.length - 1].year
    const cutoff  = maxYear - YEARS_BACK[timeRange]
    return allData.filter((d) => d.year > cutoff)
  }, [allData, timeRange])

  const hasGovIncome      = data.some((d) => d.govIncome      !== null)
  const hasOperatingCosts = data.some((d) => d.operatingCosts !== null)

  // Sub-categories already rendered as dedicated built-in lines — exclude from notable
  const BUILTIN_KEYS: Record<string, string[]> = {
    income:      ['gov'],
    expenditure: ['operating_costs'],
  }

  // Notable lines for the active metric mode — distinct sub_categories across all years
  const activeNotableKeys = useMemo(() => [...new Set(
    data.flatMap((d) =>
      Object.entries(d.notableLines)
        .filter(([k, v]) => v.metric === metric && !BUILTIN_KEYS[metric]?.includes(k))
        .map(([k]) => k)
    )
  )], [data, metric])

  // Headcount legend label — reflect the actual sub_metric(s) used
  const headcountMeasures = [...new Set(data.map((d) => d.headcountSubMetric).filter(Boolean))] as string[]
  const headcountLabel = headcountMeasures.length === 1
    ? fmtSubMetric(headcountMeasures[0])
    : headcountMeasures.length > 1 ? 'Headcount (varies)' : 'Headcount'

  // ── line config based on selected metric ──────────────────────────────────
  const lineConfig =
    metric === 'income'
      ? { dataKey: 'income',      name: 'Total Income', color: GOLD,      dashed: false }
      : { dataKey: 'expenditure', name: 'Expenditure',  color: EXP_COLOR, dashed: false }

  // ── loading / empty states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white h-48 flex items-center justify-center text-sm text-stone-400">
        Loading chart data...
      </div>
    )
  }
  if (error || allData.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 border-dashed bg-white h-48 flex items-center justify-center text-sm text-stone-400">
        {error ?? 'No financial data available yet'}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">

      {/* ── toolbar ── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1 gap-4 flex-wrap">

        {/* Metric toggle */}
        <div className="flex items-center gap-0.5 bg-stone-100 rounded p-0.5">
          {(['income', 'expenditure'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`text-xs px-2.5 py-1 rounded transition-colors font-medium capitalize ${
                metric === m
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {m === 'income' ? 'Income' : 'Expenditure'}
            </button>
          ))}
        </div>

        {/* Time-range picker */}
        <div className="flex items-center gap-0.5 ml-auto">
          {TIME_RANGES.map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`text-xs px-2 py-0.5 rounded transition-colors font-medium ${
                timeRange === t
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── legend ── */}
      <div className="flex items-center gap-5 px-5 pt-1.5 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <span className="inline-block w-6 h-0.5 rounded" style={{ background: lineConfig.color }} />
          {lineConfig.name}
        </div>
        {metric === 'income' && hasGovIncome && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: GOLD_DARK }} />
            Gov Income
          </div>
        )}
        {metric === 'expenditure' && hasOperatingCosts && (
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: STAFF_COLOR }} />
            Operating Costs
          </div>
        )}
        {activeNotableKeys.map((key, i) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="inline-block w-6 border-t-2 border-dashed" style={{ borderColor: NOTABLE_COLORS[i % NOTABLE_COLORS.length] }} />
            {fmtSubMetric(key)}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-stone-400 ml-auto">
          <span className="w-3 h-3 rounded-sm inline-block bg-stone-400" />
          {headcountLabel}
        </div>
      </div>

      {/* ── main line chart ── */}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={CHART_MARGIN} syncId="entity">
          <CartesianGrid vertical={false} stroke="#E7E4DE" />
          <XAxis dataKey="year" hide axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => fmtM(v as number)}
            tick={{ fontSize: 10, fill: '#9B9588' }}
            axisLine={false}
            tickLine={false}
            width={62}
          />
          <Tooltip
            content={<LineTooltip />}
            cursor={{ stroke: lineConfig.color, strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          <Line
            type="monotone"
            dataKey={lineConfig.dataKey}
            name={lineConfig.name}
            stroke={lineConfig.color}
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 3, fill: lineConfig.color, strokeWidth: 0 }}
          />
          {metric === 'income' && hasGovIncome && (
            <Line
              type="monotone"
              dataKey="govIncome"
              name="Gov Income"
              stroke={GOLD_DARK}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: GOLD_DARK, strokeWidth: 0 }}
            />
          )}
          {metric === 'expenditure' && hasOperatingCosts && (
            <Line
              type="monotone"
              dataKey="operatingCosts"
              name="Operating Costs"
              stroke={STAFF_COLOR}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: STAFF_COLOR, strokeWidth: 0 }}
            />
          )}
          {activeNotableKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={(entry: DataPoint) => entry.notableLines[key]?.amountM ?? null}
              name={fmtSubMetric(key)}
              stroke={NOTABLE_COLORS[i % NOTABLE_COLORS.length]}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: NOTABLE_COLORS[i % NOTABLE_COLORS.length], strokeWidth: 0 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="border-t border-stone-100 mx-5" />

      {/* ── headcount bar chart ── */}
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={BAR_MARGIN} syncId="entity">
          <CartesianGrid vertical={false} stroke="#E7E4DE" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: '#9B9588' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmtHead(v as number)}
            tick={{ fontSize: 10, fill: '#9B9588' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            content={<HeadcountTooltip />}
            cursor={{ fill: '#F5F0E8' }}
            position={{ y: 4 }}
          />
          <Bar dataKey="headcount" name="Headcount" fill={MUTED} radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>

    </div>
  )
}
