import { NavLink } from 'react-router'
import {
  TbLogout,
  TbUsers,
  TbLayoutDashboard,
  TbBox,
  TbPackages,
  TbTruck
} from 'react-icons/tb'
import { useAuth } from '../context/AuthContext'
import pepsiIcon from '../assets/pepsi_icon.png'
import ebunIcon from '../assets/LIGHT_EBUN_ICON.png'

const MAIN_MENU = [
  { to: '/dashboard', label: 'Dashboard', icon: TbLayoutDashboard },
  { to: '/stocks', label: 'My Stocks', icon: TbPackages },
  { to: '/deployments', label: 'Deployments', icon: TbTruck }
]

const ADMIN_MENU = [{ to: '/users', label: 'Users', icon: TbUsers }]

// Rendered below the Admin section (still visible to all users)
const BELOW_ADMIN_MENU = [{ to: '/products', label: 'Products', icon: TbBox }]

const ROLE_LABEL = {
  admin: 'Administrator',
  sales_agent: 'Sales Agent',
  visitor: 'Visitor'
}

export default function Sidebar () {
  const { user, logout, isAdmin } = useAuth()

  const initials =
    `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase() ||
    '?'

  const fullName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim()
  const roleLabel = ROLE_LABEL[user?.role] || 'User'

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
      isActive
        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30'
        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
    }`

  const renderLink = item => {
    const Icon = item.icon
    return (
      <NavLink key={item.to} to={item.to} className={linkClass}>
        {({ isActive }) => (
          <>
            <Icon
              size={16}
              className={`shrink-0 transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-zinc-500 group-hover:text-zinc-200'
              }`}
            />
            <span className='truncate'>{item.label}</span>
          </>
        )}
      </NavLink>
    )
  }

  return (
    <aside className='bg-zinc-900 outline outline-zinc-800 rounded-lg w-56 shrink-0 flex flex-col p-2 shadow-lg shadow-black/40'>
      {/* Brand — dual logos + app name */}
      <div className='flex flex-col items-center gap-2.5 px-2 pt-3 pb-3 mb-1 border-b border-zinc-800'>
        <div className='flex items-center gap-2 rounded-lg bg-zinc-950/50 ring-1 ring-zinc-800/70 px-3 py-1.5 shadow-inner shadow-black/30'>
          <img
            src={pepsiIcon}
            alt='Pepsi'
            className='h-8 w-8 shrink-0 object-contain select-none'
            draggable={false}
          />
          <span className='text-zinc-700 text-[10px] font-light leading-none select-none'>
            ×
          </span>
          <img
            src={ebunIcon}
            alt='Ebun'
            className='h-8 w-8 shrink-0 object-contain select-none'
            draggable={false}
          />
        </div>

        <div className='flex flex-col items-center leading-tight text-center'>
          <div className='text-[10px] font-bold text-blue-400 tracking-[0.18em] uppercase'>
            Pepsi
          </div>
          <div className='text-[9px] text-zinc-500 tracking-[0.2em] uppercase mt-0.5'>
            Inventory
          </div>
        </div>
      </div>

      {/* Main menu */}
      <div className='text-[10px] uppercase tracking-wider text-zinc-600 px-3 py-2'>
        Menu
      </div>
      <nav className='flex flex-col gap-1'>{MAIN_MENU.map(renderLink)}</nav>

      {/* Admin menu */}
      {isAdmin && (
        <div className='border-t border-zinc-800/60 mt-2 pt-2'>
          <div className='text-[10px] uppercase tracking-wider text-zinc-600 px-3 py-2'>
            Admin
          </div>
          <nav className='flex flex-col gap-1'>
            {ADMIN_MENU.map(renderLink)}
          </nav>
        </div>
      )}

      {/* Products — below admin */}
      <nav className='flex flex-col gap-1 mt-2'>
        {BELOW_ADMIN_MENU.map(renderLink)}
      </nav>

      {/* User identity + sign out */}
      <div className='mt-auto border-t border-zinc-800 pt-2'>
        <div className='flex items-center gap-2.5 px-2 py-2 mb-1'>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ring-1 ${
              isAdmin
                ? 'bg-blue-500/15 text-blue-400 ring-blue-800/50'
                : user?.role === 'visitor'
                ? 'bg-violet-500/15 text-violet-400 ring-violet-800/50'
                : 'bg-zinc-800 text-zinc-400 ring-zinc-700/60'
            }`}
          >
            {initials}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='text-[11px] font-medium text-zinc-200 truncate capitalize'>
              {fullName || 'Unknown'}
            </div>
            <div className='text-[9px] uppercase tracking-wider text-zinc-500'>
              {roleLabel}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className='group w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40'
        >
          <TbLogout
            size={16}
            className='shrink-0 transition-transform group-hover:-translate-x-0.5'
          />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
