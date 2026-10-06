import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import { useInventory } from '../hooks/useInventory'

export default function Layout () {
  const inventory = useInventory()

  return (
    <div className='bg-zinc-950 h-screen text-zinc-100 flex p-4 gap-4'>
      <Sidebar
        onExport={inventory.exportData}
        onImport={inventory.importData}
        onReset={inventory.resetData}
      />
      <Outlet context={inventory} />
    </div>
  )
}
