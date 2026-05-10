import { useNavigate } from 'react-router-dom'
import { X, ArrowUpRight, ExternalLink } from 'lucide-react'
import { useEntityContext } from '../api/EntityContext'
import { kindDisplay } from '../api/types'
import type { FlowCounterparty } from '../api/types'

function fmtLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface Props {
  counterparty: FlowCounterparty
  onClose: () => void
}

export default function CounterpartyPanel({ counterparty, onClose }: Props) {
  const navigate      = useNavigate()
  const { entities }  = useEntityContext()
  const linkedEntity  = entities.find((e) => e.entity === counterparty.slug)

  const rows = [
    { label: 'Type',        value: fmtLabel(counterparty.entityType)        },
    { label: 'Kind',        value: kindDisplay(counterparty.kind)            },
    { label: 'Sector',      value: fmtLabel(counterparty.sector)             },
    counterparty.charityNumber ? { label: 'Charity No.', value: counterparty.charityNumber }           : null,
    counterparty.companyNumber ? { label: 'Company No.', value: String(counterparty.companyNumber) }   : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="rounded border border-stone-200 bg-white flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-800 leading-snug">{counterparty.name}</h2>
        <button
          onClick={onClose}
          className="shrink-0 text-stone-400 hover:text-stone-600 transition-colors mt-0.5"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-baseline gap-2">
            <span className="text-xs text-stone-400 w-24 shrink-0">{label}</span>
            <span className="text-xs text-stone-700">{value}</span>
          </div>
        ))}
        {counterparty.url && counterparty.entityType !== 'individual' && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-stone-400 w-24 shrink-0">Website</span>
            <a
              href={counterparty.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-700 hover:text-amber-900 transition-colors inline-flex items-center gap-0.5 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{counterparty.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              <ExternalLink size={10} className="shrink-0 ml-0.5" />
            </a>
          </div>
        )}
      </div>

      {linkedEntity && (
        <div className="px-4 pb-3 border-t border-stone-100 pt-3">
          <button
            onClick={() => navigate(`/entity/${linkedEntity.entity}/summary`)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ArrowUpRight size={12} />
            View entity page
          </button>
        </div>
      )}
    </div>
  )
}
