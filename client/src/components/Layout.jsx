import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { TbMenu2 } from 'react-icons/tb'
import Sidebar from './Sidebar'
import { useInventory } from '../hooks/useInventory'
import pepsiIcon from '../assets/pepsi_icon.png'

export default function Layout () {
  const inventory = useInventory()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close drawer when the route changes (browser back, programmatic nav, etc.)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Close on Escape
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = e => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  if (inventory.loading) {
    return (
      <div className='bg-zinc-950 h-dvh flex items-center justify-center text-zinc-500 text-sm'>
        Loading inventory…
      </div>
    )
  }

  return (
    <div className='bg-zinc-950 h-dvh text-zinc-100 flex flex-col md:flex-row md:p-4 md:gap-4 overflow-hidden'>
      {/* Mobile header */}
      <header className='md:hidden shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900'>
        <button
          type='button'
          onClick={() => setSidebarOpen(true)}
          className='p-1.5 -ml-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition'
          aria-label='Open menu'
        >
          <TbMenu2 size={20} />
        </button>
        <div className='flex items-center gap-2 min-w-0'>
          <img
            src={pepsiIcon}
            alt='Pepsi'
            className='h-6 w-6 shrink-0 object-contain select-none'
            draggable={false}
          />
          <span className='text-xs font-bold text-blue-400 tracking-[0.18em] uppercase'>
            Pepsi
          </span>
          <span className='text-[10px] text-zinc-500 tracking-[0.2em] uppercase'>
            Inventory
          </span>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden='true'
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar (static on md+, slide-in drawer below md) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className='flex-1 min-h-0 flex flex-col p-3 md:p-0'>
        <Outlet context={inventory} />
      </main>
    </div>
  )
}
