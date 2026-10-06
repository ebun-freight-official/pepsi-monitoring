import { useOutletContext } from 'react-router'
import {
  calcStockStats,
  calcDeploymentStats,
  formatMoney,
  formatNumber
} from '../utils/inventory'

function StatCard ({ label, value, color }) {
  return (
    <div className='bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition shadow-lg shadow-black/20'>
      <div className='text-[10px] uppercase tracking-wide text-zinc-500 mb-1'>
        {label}
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  )
}

export default function Dashboard () {
  const { stocks, entries, deployments } = useOutletContext()
  const stockStats = calcStockStats(stocks)
  const deployStats = calcDeploymentStats(deployments)

  return (
    <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-4 overflow-auto shadow-lg shadow-black/40'>
      <div className='uppercase font-medium text-lg pb-2 border-b border-zinc-800 mb-4'>
        Dashboard
      </div>

      <div className='text-[11px] uppercase tracking-wide text-zinc-500 mb-2'>
        Warehouse
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-6'>
        <StatCard
          label='Products'
          value={formatNumber(stocks.length)}
          color='text-zinc-100'
        />
        <StatCard
          label='Warehouse Cases'
          value={formatNumber(stockStats.totalCases)}
          color='text-blue-400'
        />
        <StatCard
          label='Warehouse Value'
          value={formatMoney(stockStats.totalValue)}
          color='text-emerald-400'
        />
      </div>

      <div className='text-[11px] uppercase tracking-wide text-zinc-500 mb-2'>
        Deployment
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-6'>
        <StatCard
          label='Trucks Out'
          value={formatNumber(deployStats.trucksOut)}
          color='text-blue-400'
        />
        <StatCard
          label='Cases On Trucks'
          value={formatNumber(deployStats.casesOut)}
          color='text-amber-400'
        />
        <StatCard
          label='Cases Sold'
          value={formatNumber(deployStats.casesSold)}
          color='text-emerald-400'
        />
      </div>

      <div className='text-[11px] uppercase tracking-wide text-zinc-500 mb-2'>
        Activity
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
        <StatCard
          label='Invoice Entries'
          value={formatNumber(entries.length)}
          color='text-zinc-100'
        />
        <StatCard
          label='Total Deployments'
          value={formatNumber(deployStats.totalDeployments)}
          color='text-zinc-100'
        />
      </div>
    </div>
  )
}
