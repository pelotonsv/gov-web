import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useEntityContext } from '../api/EntityContext'
import type { ApiEntity } from '../api/types'

const POPULAR_IDS = [
  'hse', 'esb', 'failte_ireland', 'ida_ireland',
  'an_post', 'rte', 'dublin_bus', 'enterprise_ireland',
]

interface Props {
  currentId: string
}

export default function RightPanel({ currentId }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<ApiEntity[]>([])
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)
  const navigate              = useNavigate()
  const { entities, search }  = useEntityContext()

  useEffect(() => {
    if (query.length >= 1) {
      setResults(search(query))
      setOpen(true)
    } else {
      setResults([])
      setOpen(false)
    }
  }, [query, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function go(entity: ApiEntity) {
    setQuery('')
    setOpen(false)
    navigate(`/entity/${entity.entity}/summary`)
  }

  const popular = POPULAR_IDS
    .map((id) => entities.find((e) => e.entity === id))
    .filter((e): e is ApiEntity => !!e && e.entity !== currentId)

  return (
    <aside className="w-60 shrink-0 border-l border-stone-200 bg-stone-50 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-stone-200">
        <div ref={containerRef} className="relative">
          <div className="flex items-center bg-white border border-stone-200 rounded px-2.5 gap-2 focus-within:border-stone-400 transition-colors">
            <Search size={13} className="text-stone-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entity"
              className="w-full bg-transparent py-2 text-xs text-stone-700 placeholder-stone-400 outline-none"
            />
          </div>

          {open && (
            <div className="absolute top-full mt-1 w-full bg-white border border-stone-200 rounded shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-stone-400">No results found</div>
              ) : (
                results.map((entity) => (
                  <button
                    key={entity.entity}
                    onClick={() => go(entity)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-stone-50 transition-colors text-left border-b border-stone-100 last:border-0"
                  >
                    {entity.ticker && (
                      <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1 py-0.5 rounded shrink-0">
                        {entity.ticker}
                      </span>
                    )}
                    <span className="text-xs text-stone-700 truncate">{entity.display}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Popular</h3>
        {popular.map((e) => (
          <button
            key={e.entity}
            onClick={() => go(e)}
            className="w-full rounded border border-stone-200 bg-white p-3 text-left hover:border-stone-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              {e.ticker ? (
                <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1.5 py-0.5 rounded">
                  {e.ticker}
                </span>
              ) : (
                <span className="text-xs text-stone-400 uppercase">{e.kind}</span>
              )}
              <span className="text-xs text-stone-400">{e.sector}</span>
            </div>
            <div className="text-xs font-medium text-stone-700 leading-snug">{e.display}</div>
          </button>
        ))}
      </div>
    </aside>
  )
}
