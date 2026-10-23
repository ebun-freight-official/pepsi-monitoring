import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbPlus } from 'react-icons/tb'
import StockTable from '../components/StockTable'
import RecentEntries from '../components/RecentEntries'
import NewEntryModal from '../components/NewEntryModal'
import { useAuth } from '../context/AuthContext'
import { calcStockStats, formatMoney, formatNumber } from '../utils/inventory'

function HeaderStat ({ label, value, color }) {
  return (
    <div className='text-right hidden sm:block'>
      <div className='text-[9px] sm:text-[10px] uppercase text-zinc-500'>
        {label}
      </div>
      <div className={`text-xs sm:text-sm font-medium tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  )
}

export default function MyStocks () {
  const { isAdmin } = useAuth()
  const { products, stocks, entries, deployments, truckLoadouts, addEntry } =
    useOutletContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const stats = calcStockStats(stocks)

  return (
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-2 flex flex-col overflow-auto lg:overflow-hidden shadow-lg shadow-black/40'>
        {/* HEADER */}
        <div className='flex justify-between items-center gap-2 pb-2 border-b border-zinc-800 shrink-0'>
          <div className='uppercase font-medium text-sm sm:text-lg truncate'>
            My Stocks
          </div>

          <div className='flex items-center gap-2 sm:gap-5 shrink-0'>
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
              label='Total Value'
              value={formatMoney(stats.totalValue)}
              color='text-emerald-400'
            />

            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className='flex items-center gap-1 sm:gap-1.5 bg-blue-600 hover:bg-blue-500 transition text-xs sm:text-sm font-medium px-2 sm:px-3 py-2 sm:py-1.5 rounded-md shadow-md shadow-blue-600/30 whitespace-nowrap'
              >
                <TbPlus size={14} />
                New Entry
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className='flex flex-col lg:flex-row gap-3 mt-2 lg:flex-1 lg:min-h-0'>
          <div className='min-w-0 flex flex-col lg:flex-[2] lg:min-h-0'>
            <StockTable
              stocks={stocks}
              deployments={deployments}
              truckLoadouts={truckLoadouts}
            />
          </div>

          <div className='flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-800 pt-3 lg:pt-0 lg:pl-3 lg:w-80 lg:shrink-0 lg:min-h-0'>
            <div className='flex-1 overflow-auto min-h-0'>
              <RecentEntries entries={entries} />
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <NewEntryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={addEntry}
          products={products}
        />
      )}
    </>
  )
}
