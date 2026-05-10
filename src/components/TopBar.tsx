import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useEntityContext } from '../api/EntityContext'
import type { ApiEntity } from '../api/types'

export default function TopBar() {
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState<ApiEntity[]>([])
  const [open, setOpen]     = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)
  const navigate            = useNavigate()
  const { search }          = useEntityContext()

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

  function handleSelect(entity: ApiEntity) {
    setQuery('')
    setOpen(false)
    navigate(`/entity/${entity.entity}/summary`)
  }

  return (
    <header className="h-14 bg-stone-800 border-b border-stone-700 flex items-center px-5 gap-5 shrink-0 z-50">
      <a href="/" className="flex items-center gap-2 shrink-0">
        <span className="font-serif text-lg font-bold text-amber-400 tracking-tight">GovData</span>
        <span className="text-stone-400 text-xs font-medium border border-stone-600 px-1.5 py-0.5 rounded">IE</span>
      </a>

      <div className="h-5 w-px bg-stone-600" />

      <div ref={containerRef} className="relative flex-1 max-w-xl">
        <div className="flex items-center bg-stone-700 border border-stone-600 rounded px-3 gap-2 focus-within:border-amber-500/60 transition-colors">
          <Search size={14} className="text-stone-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ticker or ID — HSE, FAILTE, bord_bia..."
            className="w-full bg-transparent py-2 text-sm text-stone-100 placeholder-stone-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-stone-500 hover:text-stone-300">
              <X size={13} />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full mt-1 w-full bg-white border border-stone-200 rounded shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-stone-400">No results found</div>
            ) : (
              results.map((entity) => (
                <button
                  key={entity.entity}
                  onClick={() => handleSelect(entity)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors text-left border-b border-stone-100 last:border-0"
                >
                  {entity.ticker ? (
                    <span className="bg-stone-800 text-amber-400 font-mono font-semibold text-xs px-1.5 py-0.5 rounded shrink-0 w-16 text-center">
                      {entity.ticker}
                    </span>
                  ) : (
                    <span className="w-16 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm text-stone-800 truncate">{entity.display}</div>
                    <div className="text-xs text-stone-400 truncate">{entity.sector} · {entity.kind}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  )
}
