import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import { useInventory } from '../hooks/useInventory'

export default function Layout () {
  const inventory = useInventory()

  return (
    <div className='bg-slate-950 h-screen text-slate-100 flex p-4 gap-4'>
      <Sidebar />
      <Outlet context={inventory} />
    </div>
  )
}
