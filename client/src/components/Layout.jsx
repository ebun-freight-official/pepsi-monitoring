import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import { useInventory } from '../hooks/useInventory'

export default function Layout () {
  const inventory = useInventory()

  if (inventory.loading) {
    return (
      <div className='bg-zinc-950 h-screen flex items-center justify-center text-zinc-500 text-sm'>
        Loading inventory…
      </div>
    )
  }

  return (
    <div className='bg-zinc-950 h-screen text-zinc-100 flex p-4 gap-4'>
      <Sidebar />
      <Outlet context={inventory} />
    </div>
  )
}
