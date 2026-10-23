import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbPlus, TbHistory } from 'react-icons/tb'
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
  const [entriesOpen, setEntriesOpen] = useState(false)
  const stats = calcStockStats(stocks)

  return (
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-2 flex flex-col overflow-hidden shadow-lg shadow-black/40'>
        {/* HEADER — fixed */}
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

            <button
              type='button'
              onClick={() => setEntriesOpen(true)}
              className='lg:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition shrink-0'
              aria-label='Recent Entries'
              title='Recent Entries'
            >
              <TbHistory size={15} className='text-zinc-400' />
            </button>
          </div>
        </div>

        {/* BODY — fills remaining height, no page scroll */}
        <div className='flex-1 min-h-0 flex flex-col lg:flex-row gap-3 mt-2'>
          <div className='min-w-0 flex flex-col flex-1 min-h-0 lg:flex-[2]'>
            <StockTable
              stocks={stocks}
              deployments={deployments}
              truckLoadouts={truckLoadouts}
            />
          </div>

          <div className='hidden lg:flex flex-col border-l border-zinc-800 pl-3 w-80 shrink-0 min-h-0'>
            <div className='flex-1 overflow-auto min-h-0'>
              <RecentEntries entries={entries} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Recent Entries modal */}
      {entriesOpen && (
        <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 lg:hidden'>
          <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-lg max-h-[80dvh] flex flex-col shadow-2xl shadow-black/60'>
            <div className='flex-1 min-h-0 overflow-y-auto p-3'>
              <RecentEntries
                entries={entries}
                onClose={() => setEntriesOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

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
