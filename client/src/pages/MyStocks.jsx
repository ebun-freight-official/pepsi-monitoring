import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbPlus } from 'react-icons/tb'
import StockTable from '../components/StockTable'
import RecentEntries from '../components/RecentEntries'
import NewEntryModal from '../components/NewEntryModal'
import { calcStockStats, formatMoney, formatNumber } from '../utils/inventory'

function HeaderStat ({ label, value, color }) {
  return (
    <div className='text-right hidden sm:block'>
      <div className='text-[10px] uppercase text-zinc-500'>{label}</div>
      <div className={`text-sm font-medium tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

export default function MyStocks () {
  const { products, stocks, entries, deployments, truckLoadouts, addEntry } =
    useOutletContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const stats = calcStockStats(stocks)

  return (
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-2 flex flex-col overflow-hidden shadow-lg shadow-black/40'>
        {/* FIXED HEADER */}
        <div className='flex justify-between items-center pb-2 border-b border-zinc-800 shrink-0'>
          <div className='uppercase font-medium text-lg'>My Stocks</div>

          <div className='flex items-center gap-5'>
            <HeaderStat
              label='Free Cases'
              value={formatNumber(stats.totalFreeCases)}
              color='text-amber-400'
            />
            <HeaderStat
              label='Total Cases'
              value={formatNumber(stats.totalCases)}
              color='text-blue-400'
            />
            <HeaderStat
              label='Total Bottles'
              value={formatNumber(stats.totalBottles)}
              color='text-sky-400'
            />
            <HeaderStat
              label='Total Value'
              value={formatMoney(stats.totalValue)}
              color='text-emerald-400'
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition text-sm font-medium px-3 py-1.5 rounded-md shadow-md shadow-blue-600/30'
            >
              <TbPlus size={16} />
              New Entry
            </button>
          </div>
        </div>

        {/* BODY: left = stocks, right = entries */}
        <div className='flex-1 flex gap-3 mt-2 min-h-0'>
          {/* LEFT: fixed filter bar + scrollable table */}
          <div className='flex-[2] min-w-0 flex flex-col min-h-0'>
            <StockTable
              stocks={stocks}
              deployments={deployments}
              truckLoadouts={truckLoadouts}
            />
          </div>

          {/* RIGHT: recent entries — independent scroll */}
          <div className='w-80 shrink-0 flex flex-col min-h-0 border-l border-zinc-800 pl-3'>
            <div className='flex-1 overflow-auto min-h-0'>
              <RecentEntries entries={entries} />
            </div>
          </div>
        </div>
      </div>

      <NewEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={addEntry}
        products={products}
      />
    </>
  )
}
