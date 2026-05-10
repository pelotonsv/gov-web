import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useEntityContext } from '../api/EntityContext'
import type { ApiEntity } from '../api/types'

const FEATURED_IDS = [
  'hse', 'esb', 'failte_ireland', 'ida_ireland',
  'an_post', 'rte',
]

export default function HomePage() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<ApiEntity[]>([])
  const navigate              = useNavigate()
  const { entities, search, loading } = useEntityContext()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setResults(q.length >= 1 ? search(q) : [])
  }

  function go(entity: ApiEntity) {
    navigate(`/entity/${entity.entity}/summary`)
  }

  const featured = FEATURED_IDS
    .map((id) => entities.find((e) => e.entity === id))
    .filter(Boolean) as ApiEntity[]

  return (
    <div className="flex flex-col items-center justify-start pt-20 px-6 min-h-full">
      <div className="text-center mb-10 max-w-lg">
        <h1 className="font-serif text-4xl font-bold text-stone-800 mb-3">GovData Ireland</h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Follow the money across Irish government departments, state agencies, and semi-state bodies.
        </p>
      </div>

      <div className="relative w-full max-w-lg mb-12">
        <div className="flex items-center bg-white border border-stone-300 rounded px-4 gap-3 focus-within:border-stone-500 transition-colors shadow-sm">
          <Search size={15} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search by name, ticker or ID — HSE, FAILTE, bord_bia..."
            className="w-full bg-transparent py-3.5 text-sm text-stone-800 placeholder-stone-400 outline-none"
            autoFocus
          />
        </div>

        {results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-stone-200 rounded shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto">
            {results.map((e) => (
              <button
                key={e.entity}
                onClick={() => go(e)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left border-b border-stone-100 last:border-0"
              >
                {e.ticker ? (
                  <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1.5 py-0.5 rounded shrink-0 w-16 text-center">
                    {e.ticker}
                  </span>
                ) : (
                  <span className="w-16 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm text-stone-800 truncate">{e.display}</div>
                  <div className="text-xs text-stone-400">{e.sector} · {e.kind}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Featured Entities</h2>
        {loading ? (
          <div className="text-sm text-stone-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {featured.map((e) => (
              <button
                key={e.entity}
                onClick={() => go(e)}
                className="rounded border border-stone-200 bg-white p-4 text-left hover:border-stone-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  {e.ticker ? (
                    <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1.5 py-0.5 rounded">
                      {e.ticker}
                    </span>
                  ) : null}
                  <span className="text-xs text-stone-400 ml-auto">{e.sector}</span>
                </div>
                <div className="text-sm font-medium text-stone-700 leading-snug">{e.display}</div>
                <div className="text-xs text-stone-400 mt-1 capitalize">{e.kind.replace(/_/g, ' ')}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
