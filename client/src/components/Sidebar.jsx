import { useRef } from 'react'
import { NavLink } from 'react-router'
import { TbDownload, TbUpload, TbTrash } from 'react-icons/tb'

const MENU_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/stocks', label: 'My Stocks' },
  { to: '/deployments', label: 'Deployments' }
]

export default function Sidebar ({ onExport, onImport, onReset }) {
  const fileRef = useRef(null)

  const handleFile = e => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const ok = onImport(data)
        if (ok) alert('Data imported successfully.')
        else alert('Invalid file format.')
      } catch {
        alert('Could not read file. Make sure it is valid JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <aside className='bg-zinc-900 outline outline-zinc-800 rounded-lg w-56 shrink-0 flex flex-col p-2 shadow-lg shadow-black/40'>
      <div className='flex items-center gap-2 px-3 pt-2 pb-3 mb-1 border-b border-zinc-800'>
        <div className='w-1 h-7 rounded-full overflow-hidden flex flex-col shrink-0'>
          <div className='flex-1 bg-red-500' />
          <div className='flex-1 bg-slate-200' />
          <div className='flex-1 bg-blue-600' />
        </div>
        <div className='min-w-0'>
          <div className='text-xs font-bold text-blue-400 tracking-widest uppercase leading-tight'>
            Pepsi
          </div>
          <div className='text-[10px] text-zinc-500 tracking-widest uppercase leading-tight'>
            Inventory
          </div>
        </div>
      </div>

      <div className='text-[10px] uppercase tracking-wider text-zinc-600 px-3 py-2'>
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
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className='mt-auto border-t border-zinc-800 pt-2'>
        <div className='text-[10px] uppercase tracking-wider text-zinc-600 px-3 py-2'>
          Data
        </div>

        <div className='flex flex-col gap-1'>
          <button
            onClick={onExport}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition text-left'
          >
            <TbDownload size={14} />
            Export JSON
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition text-left'
          >
            <TbUpload size={14} />
            Import JSON
          </button>

          <button
            onClick={onReset}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition text-left'
          >
            <TbTrash size={14} />
            Reset Local Data
          </button>

          <input
            ref={fileRef}
            type='file'
            accept='.json,application/json'
            className='hidden'
            onChange={handleFile}
          />
        </div>
      </div>
    </aside>
  )
}
