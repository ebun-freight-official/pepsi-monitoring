import { NavLink } from 'react-router'

const MENU_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/stocks', label: 'My Stocks' },
  { to: '/deployments', label: 'Deployments' }
]

export default function Sidebar () {
  return (
    <aside className='bg-slate-900 outline outline-slate-800 rounded-lg w-56 shrink-0 p-2'>
      <div className='text-[10px] uppercase tracking-wider text-slate-600 px-3 py-2'>
        Menu
      </div>

      <nav className='flex flex-col gap-1'>
        {MENU_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm transition ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
