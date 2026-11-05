import { useState, useEffect, useRef } from 'react'
import { TbX, TbCheck, TbLoader2 } from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'

export default function EditLoadoutModal ({
  isOpen,
  onClose,
  truck,
  loadout = [],
  stocks,
  onSave
}) {
  const [draft, setDraft] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lastValueRef = useRef({})

  useEffect(() => {
    if (isOpen) {
      const init = {}
      loadout.forEach(item => {
        init[item.product_name] = item.cases
      })
      setDraft(init)
      setBusy(false)
      setError('')
      lastValueRef.current = {}
    }
  }, [isOpen, loadout])

  if (!isOpen) return null

  const sortedStocks = [...stocks].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  const getAvailable = productName => {
    const stock = stocks.find(s => s.product_name === productName)
    const baseQty = stock ? Number(stock.quantity) || 0 : 0
    const reservedQty = loadout
      .filter(i => i.product_name === productName)
      .reduce((s, i) => s + (Number(i.cases) || 0), 0)
    return baseQty + reservedQty
  }

  const toggleProduct = name => {
    setDraft(prev => {
      if (prev[name] !== undefined) {
        lastValueRef.current[name] = prev[name]
        const { [name]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [name]: lastValueRef.current[name] || 1 }
    })
  }

  const updateCases = (name, value) => {
    if (value === '') {
      setDraft(prev => ({ ...prev, [name]: '' }))
      return
    }
    const num = Math.max(1, Number(value) || 1)
    setDraft(prev => ({ ...prev, [name]: num }))
  }

  const selectedEntries = Object.entries(draft)
  const selectedCount = selectedEntries.length

  const hasInvalidCases = selectedEntries.some(
    ([, c]) => c === '' || !Number.isFinite(Number(c)) || Number(c) < 1
  )

  const exceedsList = selectedEntries.filter(
    ([name, c]) => Number(c) > getAvailable(name)
  )
  const hasErrors = exceedsList.length > 0

  const isValid = selectedCount > 0 && !hasInvalidCases && !hasErrors

  const totalCases = selectedEntries.reduce(
    (s, [, c]) => s + (Number(c) || 0),
    0
  )
  const totalValue = selectedEntries.reduce((s, [name, c]) => {
    const stock = stocks.find(st => st.product_name === name)
    const price = stock ? Number(stock.price_per_case) || 0 : 0
    return s + (Number(c) || 0) * price
  }, 0)

  const handleSelectAll = () => {
    const next = {}
    sortedStocks.forEach(s => {
      const available = getAvailable(s.product_name)
      if (available > 0) {
        next[s.product_name] = draft[s.product_name] || 1
      }
    })
    setDraft(next)
  }

  const handleClearAll = () => setDraft({})

  const handleSave = async () => {
    if (!isValid || busy) return
    setBusy(true)
    setError('')
    try {
      const cleaned = selectedEntries.map(([product_name, c]) => ({
        product_name,
        cases: Math.max(1, Math.floor(Number(c) || 1))
      }))
      const ok = await onSave(cleaned)
      if (ok === false) setError('Failed to save loadout. Please try again.')
    } catch (err) {
      setError(err.message || 'Failed to save loadout.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-3xl max-h-[80dvh] sm:max-h-[85vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Edit Loadout
            </span>
            <span className='text-[10px] sm:text-[11px] text-zinc-500 truncate'>
              · {truck}
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

        {/* Meta bar */}
        <div className='shrink-0 px-3 sm:px-4 py-2 border-b border-zinc-800/60 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]'>
          <span className='text-zinc-500 tabular-nums'>
            <span className='text-zinc-100 font-semibold'>{selectedCount}</span>{' '}
            of {sortedStocks.length} selected
          </span>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleSelectAll}
              disabled={busy}
              className='text-blue-400 hover:text-blue-300 transition font-medium disabled:opacity-40'
            >
              Select all
            </button>
            {selectedCount > 0 && (
              <>
                <span className='text-zinc-700'>·</span>
                <button
                  type='button'
                  onClick={handleClearAll}
                  disabled={busy}
                  className='text-zinc-500 hover:text-zinc-200 transition disabled:opacity-40'
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Body — 2-column checklist */}
        <div className='flex-1 min-h-0 overflow-y-auto p-2 sm:p-3'>
          {sortedStocks.length === 0 ? (
            <div className='py-10 text-center text-zinc-600 text-xs'>
              No products available. Add products first.
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2'>
              {sortedStocks.map(stock => {
                const isChecked = draft[stock.product_name] !== undefined
                const current = isChecked ? draft[stock.product_name] : ''
                const available = getAvailable(stock.product_name)
                const exceeds = isChecked && Number(current) > available

                return (
                  <div
                    key={stock.product_name}
                    className={`grid grid-cols-[auto_minmax(0,1fr)_3.5rem] gap-2 items-center px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md border transition ${
                      isChecked
                        ? exceeds
                          ? 'bg-rose-500/5 border-rose-800/50'
                          : 'bg-blue-500/5 border-blue-800/40'
                        : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      type='button'
                      onClick={() => toggleProduct(stock.product_name)}
                      disabled={busy}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition disabled:opacity-40 ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-zinc-950 border-zinc-600 hover:border-zinc-500'
                      }`}
                      aria-label={isChecked ? 'Uncheck' : 'Check'}
                    >
                      {isChecked && <TbCheck size={12} />}
                    </button>

                    <div className='min-w-0'>
                      <div className='text-[12px] sm:text-[13px] text-zinc-100 font-medium truncate'>
                        {stock.product_name}
                      </div>
                      <div
                        className={`text-[9px] sm:text-[10px] tabular-nums truncate ${
                          exceeds ? 'text-rose-400' : 'text-zinc-500'
                        }`}
                      >
                        {formatNumber(available)} avail
                        {exceeds && ` · ${Number(current)} req`}
                      </div>
                    </div>

                    <input
                      type='number'
                      min='1'
                      step='1'
                      value={current}
                      onChange={e =>
                        updateCases(stock.product_name, e.target.value)
                      }
                      disabled={!isChecked || busy}
                      placeholder='—'
                      className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-[11px] sm:text-xs text-center text-zinc-100 tabular-nums focus:outline-none focus:border-blue-500 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-900/40'
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='shrink-0 border-t border-zinc-800 px-3 sm:px-4 py-2.5 sm:py-3'>
          {hasErrors && (
            <div className='text-[10px] sm:text-[11px] text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 py-1.5 mb-2'>
              {exceedsList.length} product
              {exceedsList.length === 1 ? '' : 's'} exceed available stock
            </div>
          )}
          {error && (
            <div className='text-[10px] sm:text-[11px] text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 py-1.5 mb-2'>
              {error}
            </div>
          )}

          <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3'>
            <div className='rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 flex items-center justify-between gap-3 min-w-0 sm:min-w-[200px]'>
              <div className='flex flex-col min-w-0'>
                <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-semibold'>
                  Loadout Value
                </span>
                <span className='text-[8px] sm:text-[9px] text-zinc-600 tabular-nums'>
                  {formatNumber(totalCases)}{' '}
                  {totalCases === 1 ? 'case' : 'cases'}
                </span>
              </div>
              <span className='text-base sm:text-lg font-bold text-emerald-400 tabular-nums shrink-0'>
                {formatMoney(totalValue)}
              </span>
            </div>

            <div className='flex gap-2 sm:ml-auto'>
              <button
                type='button'
                onClick={onClose}
                disabled={busy}
                className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleSave}
                disabled={!isValid || busy}
                className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 font-medium transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5'
              >
                {busy ? (
                  <>
                    <TbLoader2 size={14} className='animate-spin' />
                    Saving…
                  </>
                ) : (
                  <>
                    <TbCheck size={14} />
                    Save Loadout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
