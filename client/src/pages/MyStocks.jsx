import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbPlus } from 'react-icons/tb'
import StockTable from '../components/StockTable'
import RecentEntries from '../components/RecentEntries'
import NewEntryModal from '../components/NewEntryModal'
import { calcStockStats } from '../utils/inventory'

function HeaderStat ({ label, value, color }) {
  return (
    <div className='text-right hidden sm:block'>
      <div className='text-[10px] uppercase text-slate-500'>{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  )
}

export default function MyStocks () {
  const { stocks, entries, deployments, truckLoadouts, addEntry } =
    useOutletContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const stats = calcStockStats(stocks)

  return (
    <>
      <div className='bg-slate-900 flex-1 outline outline-slate-800 rounded-lg p-2 flex flex-col overflow-hidden'>
        <div className='flex justify-between items-center pb-2 border-b border-slate-800'>
          <div className='uppercase font-medium text-lg'>My Stocks</div>

          <div className='flex items-center gap-5'>
            <HeaderStat
              label='Free Cases'
              value={stats.totalFreeCases}
              color='text-amber-400'
            />
            <HeaderStat
              label='Total Cases'
              value={stats.totalCases.toLocaleString()}
              color='text-indigo-400'
            />
            <HeaderStat
              label='Total Bottles'
              value={stats.totalBottles.toLocaleString()}
              color='text-sky-400'
            />
            <HeaderStat
              label='Total Value'
              value={`₱${stats.totalValue.toFixed(2)}`}
              color='text-emerald-400'
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 transition text-sm font-medium px-3 py-1.5 rounded-md'
            >
              <TbPlus size={16} />
              New Entry
            </button>
          </div>
        </div>

        <div className='flex-1 flex gap-3 mt-2 overflow-hidden'>
          <div className='flex-[2] min-w-0 overflow-auto pr-1'>
            <StockTable
              stocks={stocks}
              deployments={deployments}
              truckLoadouts={truckLoadouts}
            />
          </div>

          <div className='w-80 shrink-0 overflow-auto border-l border-slate-800 pl-3'>
            <RecentEntries entries={entries} />
          </div>
        </div>
      </div>

      <NewEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addEntry}
      />
    </>
  )
}
