import { TbX, TbArrowUp, TbLoader2, TbTruck } from 'react-icons/tb'
import { useState } from 'react'
import { formatMoney, formatNumber } from '../utils/inventory'

const GRID_CONFIRM =
  'grid grid-cols-[minmax(0,1fr)_2.75rem_4.5rem_4.5rem] sm:grid-cols-[minmax(0,1fr)_4rem_5.5rem_5.5rem] gap-1.5 sm:gap-2 items-center'

export default function DeployConfirmModal ({
  isOpen,
  onClose,
  onConfirm,
  truck,
  loadout = [],
  stocks
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const enriched = loadout.map(i => {
    const stock = stocks.find(s => s.product_name === i.product_name)
    const price = stock ? Number(stock.price_per_case) || 0 : 0
    const emptiesPer = stock ? Number(stock.empties_per_case) || 0 : 0
    const cases = Number(i.cases) || 0
    return {
      ...i,
      cases,
      price,
      lineValue: cases * price,
      lineEmpties: cases * emptiesPer
    }
  })

  const totalCases = enriched.reduce((s, i) => s + i.cases, 0)
  const totalValue = enriched.reduce((s, i) => s + i.lineValue, 0)
  const totalEmpties = enriched.reduce((s, i) => s + i.lineEmpties, 0)

  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await onConfirm()
      if (ok === false) setError('Failed to deploy truck. Please try again.')
    } catch (err) {
      setError(err.message || 'Failed to deploy truck.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-lg max-h-[80dvh] sm:max-h-[85vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header — pinned */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <TbTruck className='text-blue-400 shrink-0' size={16} />
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Deploy Truck
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className='p-1 -m-1 text-zinc-500 hover:text-zinc-100 transition disabled:opacity-40 shrink-0'
            aria-label='Close'
          >
            <TbX size={18} />
          </button>
        </div>

        {/* Body — table is flex column, only rows scroll */}
        <div className='flex-1 min-h-0 flex flex-col p-2.5 sm:p-4 gap-2 sm:gap-3'>
          <div className='shrink-0 text-[11px] sm:text-xs text-zinc-500'>
            Deploy{' '}
            <span className='text-zinc-200 font-medium uppercase'>{truck}</span>{' '}
            with the following loadout?
          </div>

          {/* Products table */}
          <div className='flex-1 min-h-0 flex flex-col rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
            <div
              className={`${GRID_CONFIRM} px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 shrink-0`}
            >
              <span>Product</span>
              <span className='text-right'>Cases</span>
              <span className='text-right'>Line ₱</span>
              <span className='text-right'>Empties</span>
            </div>

            <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-800/50'>
              {enriched.map((item, i) => (
                <div
                  key={i}
                  className={`${GRID_CONFIRM} px-2 sm:px-3 py-1.5 sm:py-2 transition-colors hover:bg-zinc-800/40`}
                >
                  <span className='text-[11px] sm:text-sm text-zinc-100 font-medium truncate'>
                    {item.product_name}
                  </span>
                  <span className='text-[11px] sm:text-sm text-blue-400 font-medium text-right tabular-nums'>
                    {formatNumber(item.cases)}
                  </span>
                  <span className='text-[11px] sm:text-sm text-emerald-400 font-semibold text-right tabular-nums'>
                    {formatMoney(item.lineValue)}
                  </span>
                  <span className='text-[11px] sm:text-sm text-amber-400 font-semibold text-right tabular-nums'>
                    {formatMoney(item.lineEmpties)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary — pinned */}
          <div className='shrink-0 grid grid-cols-3 gap-1.5 sm:gap-2'>
            <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-1.5 sm:px-3 py-1.5 sm:py-2 text-center min-w-0'>
              <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 truncate'>
                Cases
              </div>
              <div className='text-xs sm:text-sm font-semibold text-blue-400 tabular-nums mt-0.5 truncate'>
                {formatNumber(totalCases)}
              </div>
            </div>
            <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-1.5 sm:px-3 py-1.5 sm:py-2 text-center min-w-0'>
              <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 truncate'>
                Value
              </div>
              <div className='text-xs sm:text-sm font-semibold text-emerald-400 tabular-nums mt-0.5 truncate'>
                {formatMoney(totalValue)}
              </div>
            </div>
            <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-1.5 sm:px-3 py-1.5 sm:py-2 text-center min-w-0'>
              <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 truncate'>
                Empties
              </div>
              <div className='text-xs sm:text-sm font-semibold text-amber-400 tabular-nums mt-0.5 truncate'>
                {formatMoney(totalEmpties)}
              </div>
            </div>
          </div>

          {error && (
            <div className='shrink-0 text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2'>
              {error}
            </div>
          )}
        </div>

        {/* Footer — pinned */}
        <div className='shrink-0 border-t border-zinc-800 p-2.5 sm:p-3 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            disabled={busy}
            className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2 sm:py-2.5 rounded-md transition disabled:opacity-40'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleConfirm}
            disabled={busy}
            className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 sm:py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-blue-600/30'
          >
            {busy ? (
              <>
                <TbLoader2 size={12} className='animate-spin' />
                Deploying…
              </>
            ) : (
              <>
                <TbArrowUp size={12} />
                Confirm Deploy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
