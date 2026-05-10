import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'

const tabs = [
  { label: 'Summary',  path: 'summary',  icon: LayoutDashboard },
  { label: 'Outflows', path: 'outflows', icon: ArrowUpRight },
  { label: 'Inflows',  path: 'inflows',  icon: ArrowDownLeft },
  { label: 'News',     path: 'news',     icon: Newspaper },
  { label: 'Analysis', path: 'analysis', icon: TrendingUp },
]

export default function Sidebar() {
  const { id } = useParams<{ id: string }>()

  return (
    <aside className="w-48 shrink-0 bg-stone-50 border-r border-stone-200 flex flex-col">
      {id ? (
        <div className="px-4 py-3 border-b border-stone-200">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Building2 size={11} />
            <span className="uppercase tracking-wider font-medium">{id.replace(/-/g, ' ')}</span>
          </div>
        </div>
      ) : null}

      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {id &&
          tabs.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={`/entity/${id}/${path}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-stone-800 text-amber-400 font-medium'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}

        {!id && (
          <div className="px-3 py-2.5 text-xs text-stone-400 italic">
            Search for an entity above
          </div>
        )}
      </nav>
    </aside>
  )
}
