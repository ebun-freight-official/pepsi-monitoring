import { useOutletContext } from 'react-router'
import { calcStockStats, calcDeploymentStats } from '../utils/inventory'

function StatCard ({ label, value, color }) {
  return (
    <div className='bg-slate-950/60 border border-slate-800 rounded-lg p-4'>
      <div className='text-[10px] uppercase tracking-wide text-slate-500 mb-1'>
        {label}
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  )
}

export default function Dashboard () {
  const { stocks, entries, deployments } = useOutletContext()
  const stockStats = calcStockStats(stocks)
  const deployStats = calcDeploymentStats(deployments)

  return (
    <div className='bg-slate-900 flex-1 outline outline-slate-800 rounded-lg p-4 overflow-auto'>
      <div className='uppercase font-medium text-lg pb-2 border-b border-slate-800 mb-4'>
        Dashboard
      </div>

      <div className='text-[11px] uppercase tracking-wide text-slate-500 mb-2'>
        Warehouse
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-6'>
        <StatCard
          label='Products'
          value={stocks.length}
          color='text-slate-100'
        />
        <StatCard
          label='Warehouse Cases'
          value={stockStats.totalCases.toLocaleString()}
          color='text-indigo-400'
        />
        <StatCard
          label='Warehouse Value'
          value={`₱${stockStats.totalValue.toFixed(2)}`}
          color='text-emerald-400'
        />
      </div>

      <div className='text-[11px] uppercase tracking-wide text-slate-500 mb-2'>
        Deployment
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-6'>
        <StatCard
          label='Trucks Out'
          value={deployStats.trucksOut}
          color='text-indigo-400'
        />
        <StatCard
          label='Cases On Trucks'
          value={deployStats.casesOut.toLocaleString()}
          color='text-amber-400'
        />
        <StatCard
          label='Cases Sold'
          value={deployStats.casesSold.toLocaleString()}
          color='text-emerald-400'
        />
      </div>

      <div className='text-[11px] uppercase tracking-wide text-slate-500 mb-2'>
        Activity
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
        <StatCard
          label='Invoice Entries'
          value={entries.length}
          color='text-slate-100'
        />
        <StatCard
          label='Total Deployments'
          value={deployStats.totalDeployments}
          color='text-slate-100'
        />
      </div>
    </div>
  )
}
