import { NavLink } from 'react-router-dom'

const items = [
  { label: 'Entities',   to: '/' },
  { label: 'Budgeting',  to: '/budgeting' },
]

export default function SubNav() {
  return (
    <div className="bg-white border-b border-stone-200 px-5 flex items-center gap-0 shrink-0">
      {items.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `px-4 py-2.5 text-xs font-semibold uppercase tracking-widest border-b-2 transition-colors ${
              isActive
                ? 'border-amber-400 text-stone-800'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </div>
  )
}
