import { useState, useEffect } from 'react'
import { TbX, TbRefresh, TbLoader2, TbPlus, TbTrash } from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'
import ProductCombobox from './ProductCombobox'

const GRID_EXISTING =
  'grid grid-cols-[minmax(0,1fr)_3.5rem_4rem] sm:grid-cols-[minmax(0,1fr)_4.5rem_5rem] gap-1.5 sm:gap-2 items-center'
const GRID_NEW =
  'grid grid-cols-[minmax(0,1fr)_4rem_1.75rem] sm:grid-cols-[minmax(0,1fr)_5rem_2rem] gap-1.5 sm:gap-2 items-center'

export default function ReloadTruckModal ({
  isOpen,
  onClose,
  deployment,
  stocks,
  onReload
}) {
  const [existing, setExisting] = useState([])
  const [newRows, setNewRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && deployment) {
      setExisting(
        deployment.items.map(it => ({
          product_name: it.product_name,
          current: Number(it.cases) || 0,
          add: 0
        }))
      )
      setNewRows([])
      setBusy(false)
      setError('')
    }
  }, [isOpen, deployment?._id])

  if (!isOpen || !deployment) return null

  const sortedStocks = [...stocks].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  const onTruckNames = new Set(existing.map(r => r.product_name))
  const availableNewProducts = sortedStocks.filter(
    s => !onTruckNames.has(s.product_name)
  )

  const getAvailable = productName => {
    const stock = stocks.find(s => s.product_name === productName)
    return stock ? Number(stock.quantity) || 0 : 0
  }

  const updateExistingAdd = (index, value) => {
    const num = Math.max(0, Math.floor(Number(value) || 0))
    setExisting(prev =>
      prev.map((r, i) => (i === index ? { ...r, add: num } : r))
    )
  }

  const updateNewRow = (index, field, value) => {
    setNewRows(prev =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }

  const addNewRow = () => {
    setNewRows(prev => [...prev, { product_name: '', cases: '' }])
  }

  const removeNewRow = index => {
    setNewRows(prev => prev.filter((_, i) => i !== index))
  }

  const totalAddedByProduct = {}
  existing.forEach(r => {
    if (r.add > 0) {
      totalAddedByProduct[r.product_name] =
        (totalAddedByProduct[r.product_name] || 0) + r.add
    }
  })
  newRows.forEach(r => {
    if (r.product_name && Number(r.cases) > 0) {
      totalAddedByProduct[r.product_name] =
        (totalAddedByProduct[r.product_name] || 0) + Number(r.cases)
    }
  })

  const validAdds = Object.entries(totalAddedByProduct)
    .filter(([, qty]) => qty > 0)
    .map(([product_name, cases]) => ({ product_name, cases }))

  const stockErrors = []
  Object.entries(totalAddedByProduct).forEach(([name, qty]) => {
    const avail = getAvailable(name)
    if (qty > avail) {
      stockErrors.push(`${name}: need ${qty}, only ${avail} available`)
    }
  })

  const newRowNames = newRows.map(r => r.product_name).filter(Boolean)
  const hasDuplicates = new Set(newRowNames).size !== newRowNames.length

  const isValid =
    validAdds.length > 0 && stockErrors.length === 0 && !hasDuplicates

  const totalAddedCases = validAdds.reduce((s, i) => s + i.cases, 0)
  const totalAddedValue = validAdds.reduce((s, i) => {
    const stock = stocks.find(st => st.product_name === i.product_name)
    const price = stock ? Number(stock.price_per_case) || 0 : 0
    return s + i.cases * price
  }, 0)

  const usedNames = currentIndex => {
    const set = new Set()
    newRows.forEach((r, i) => {
      if (i === currentIndex) return
      if (r.product_name) set.add(r.product_name)
    })
    return set
  }

  const handleReload = async () => {
    if (!isValid || busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await onReload(deployment._id, validAdds)
      if (ok === false) setError('Failed to reload truck. Please try again.')
    } catch (err) {
      setError(err.message || 'Failed to reload truck.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-2xl max-h-[80dvh] sm:max-h-[85vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Reload Truck
            </span>
            <span className='text-[10px] sm:text-[11px] text-zinc-500 truncate'>
              · {deployment.truck}
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

        {/* Body */}
        <div className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3'>
          <div className='text-[10px] sm:text-[11px] text-zinc-500'>
            Add cases to restock the truck while it's still out on its route.
            Stock is deducted from the warehouse immediately.
          </div>

          {/* Existing items */}
          {existing.length > 0 && (
            <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
              <div
                className={`${GRID_EXISTING} px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500`}
              >
                <span>Product</span>
                <span className='text-right'>On Truck</span>
                <span className='text-right'>Add</span>
              </div>
              <div className='divide-y divide-zinc-800/50'>
                {existing.map((row, i) => (
                  <div
                    key={row.product_name}
                    className={`${GRID_EXISTING} px-2 sm:px-3 py-1.5 sm:py-2`}
                  >
                    <span className='text-[11px] sm:text-sm text-zinc-100 font-medium truncate'>
                      {row.product_name}
                    </span>
                    <span className='text-[11px] sm:text-sm text-blue-400 font-medium text-right tabular-nums'>
                      {formatNumber(row.current)}
                    </span>
                    <input
                      type='number'
                      min='0'
                      step='1'
                      value={row.add || ''}
                      placeholder='0'
                      onChange={e => updateExistingAdd(i, e.target.value)}
                      disabled={busy}
                      className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 sm:px-2 py-1 text-xs text-right text-zinc-100 tabular-nums focus:outline-none focus:border-blue-500 transition disabled:opacity-60'
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New products */}
          {newRows.length > 0 && (
            <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
              <div
                className={`${GRID_NEW} px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500`}
              >
                <span>New Product</span>
                <span className='text-center'>Cases</span>
                <span />
              </div>
              <div className='p-2 sm:p-3 space-y-2'>
                {newRows.map((row, i) => {
                  const taken = usedNames(i)
                  const options = sortedStocks
                    .filter(
                      s =>
                        !taken.has(s.product_name) ||
                        s.product_name === row.product_name
                    )
                    .map(s => ({
                      value: s.product_name,
                      label: s.product_name,
                      meta: `${formatNumber(s.quantity)} avail`
                    }))
                  return (
                    <div key={i} className={GRID_NEW}>
                      <div className='min-w-0'>
                        <ProductCombobox
                          value={row.product_name}
                          options={options}
                          onChange={name =>
                            updateNewRow(i, 'product_name', name)
                          }
                          disabled={busy}
                          placeholder='— Product —'
                        />
                      </div>
                      <input
                        type='number'
                        min='1'
                        step='1'
                        value={row.cases}
                        placeholder='0'
                        onChange={e => updateNewRow(i, 'cases', e.target.value)}
                        disabled={busy}
                        className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 sm:px-2 py-1.5 text-xs text-center text-zinc-100 tabular-nums focus:outline-none focus:border-blue-500 transition disabled:opacity-60'
                      />
                      <button
                        type='button'
                        onClick={() => removeNewRow(i)}
                        disabled={busy}
                        className='text-zinc-500 hover:text-rose-400 transition justify-self-center p-1 -m-1 disabled:opacity-40'
                        aria-label='Remove'
                      >
                        <TbTrash size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {availableNewProducts.length > 0 && (
            <button
              type='button'
              onClick={addNewRow}
              disabled={busy}
              className='w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400 text-zinc-400 text-[11px] sm:text-xs py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-700 disabled:hover:text-zinc-400'
            >
              <TbPlus size={12} />
              Add product not on truck
            </button>
          )}

          {validAdds.length > 0 && (
            <div className='grid grid-cols-2 gap-1.5 sm:gap-2'>
              <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-2 sm:px-3 py-1.5 sm:py-2 text-center'>
                <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500'>
                  Adding Cases
                </div>
                <div className='text-xs sm:text-sm font-semibold text-blue-400 tabular-nums mt-0.5'>
                  {formatNumber(totalAddedCases)}
                </div>
              </div>
              <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-2 sm:px-3 py-1.5 sm:py-2 text-center'>
                <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500'>
                  Adding Value
                </div>
                <div className='text-xs sm:text-sm font-semibold text-emerald-400 tabular-nums mt-0.5'>
                  {formatMoney(totalAddedValue)}
                </div>
              </div>
            </div>
          )}

          {stockErrors.length > 0 && (
            <div className='text-[11px] sm:text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 space-y-0.5'>
              {stockErrors.map((msg, i) => (
                <div key={i}>• {msg}</div>
              ))}
            </div>
          )}

          {hasDuplicates && (
            <div className='text-[11px] sm:text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2'>
              Duplicate products in new rows.
            </div>
          )}

          {error && (
            <div className='text-[11px] sm:text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2'>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
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
            onClick={handleReload}
            disabled={!isValid || busy}
            className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 sm:py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-blue-600/30'
          >
            {busy ? (
              <>
                <TbLoader2 size={12} className='animate-spin' />
                Reloading…
              </>
            ) : (
              <>
                <TbRefresh size={12} />
                Reload Truck
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
