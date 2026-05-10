interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  change?: number
}

export default function StatCard({ label, value, sub, highlight, change }: StatCardProps) {
  return (
    <div className={`rounded border p-4 bg-white ${highlight ? 'border-amber-300' : 'border-stone-200'}`}>
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <div className="text-xl font-semibold text-stone-800">{value}</div>
      {highlight && <div className="h-0.5 w-6 bg-amber-400 mt-1.5 rounded-full" />}
      {sub && <div className="text-xs text-stone-400 mt-1">{sub}</div>}
      {change !== undefined && (
        <div className={`text-xs mt-1.5 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs prior year
        </div>
      )}
    </div>
  )
}
