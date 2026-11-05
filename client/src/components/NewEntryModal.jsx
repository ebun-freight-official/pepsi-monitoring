import { useState, useEffect } from 'react'
import { TbX, TbLoader2, TbCheck } from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'

export default function NewEntryModal ({
  isOpen,
  onClose,
  onSave,
  products = []
}) {
  const [draft, setDraft] = useState({}) // { name: { quantity } }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDraft({})
      setBusy(false)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const sortedProducts = [...products].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  const toggleProduct = name => {
    setDraft(prev => {
      if (prev[name]) {
        const { [name]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [name]: { quantity: 1 } }
    })
  }

  const updateQuantity = (name, value) => {
    setDraft(prev => ({
      ...prev,
      [name]: { ...prev[name], quantity: value }
    }))
  }

  const computedTotal = Object.entries(draft).reduce((sum, [name, item]) => {
    const product = products.find(p => p.product_name === name)
    const price = product ? Number(product.price_per_case) || 0 : 0
    const qty = Number(item.quantity) || 0
    return sum + qty * price
  }, 0)

  const totalCases = Object.values(draft).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  const selectedCount = Object.keys(draft).length
  const netAmount = computedTotal.toFixed(2)

  const handleSelectAll = () => {
    const next = {}
    sortedProducts.forEach(p => {
      next[p.product_name] = draft[p.product_name] || { quantity: 1 }
    })
    setDraft(next)
  }

  const handleClearAll = () => setDraft({})

  const isValid = selectedCount > 0 && !busy

  const handleSubmit = async e => {
    e.preventDefault()
    if (!isValid) return
    setBusy(true)
    setError('')
    try {
      const items = Object.entries(draft).map(([name, data]) => {
        const product = products.find(p => p.product_name === name)
        return {
          product_name: name,
          bottle_size: product?.bottle_size || '',
          unit: product ? Number(product.unit) || 0 : 0,
          quantity: Number(data.quantity) || 0,
          price_per_case: product ? Number(product.price_per_case) || 0 : 0,
          empties_per_case: product ? Number(product.empties_per_case) || 0 : 0
        }
      })
      const ok = await onSave(items, netAmount)
      if (ok === false) {
        setError('Failed to save entry. Please try again.')
        setBusy(false)
        return
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save entry.')
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-3xl max-h-[80dvh] sm:max-h-[85vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='uppercase font-medium text-sm tracking-wide'>
            New Entry
          </div>
          <button
            type='button'
            onClick={onClose}
            disabled={busy}
            className='p-1 -m-1 text-zinc-500 hover:text-zinc-100 transition disabled:opacity-40'
            aria-label='Close'
          >
            <TbX size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex flex-col flex-1 min-h-0 overflow-hidden'
        >
          {/* Meta bar */}
          <div className='shrink-0 px-3 sm:px-4 py-2 border-b border-zinc-800/60 flex items-center justify-between gap-2 text-[10px] sm:text-[11px]'>
            <span className='text-zinc-500 tabular-nums'>
              <span className='text-zinc-100 font-semibold'>
                {selectedCount}
              </span>{' '}
              of {sortedProducts.length} selected
            </span>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleSelectAll}
                disabled={busy || sortedProducts.length === 0}
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
            {sortedProducts.length === 0 ? (
              <div className='py-10 text-center text-zinc-600 text-xs'>
                No products defined yet. Go to <b>Products</b> page to add
                products first.
              </div>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2'>
                {sortedProducts.map(product => {
                  const isChecked = draft[product.product_name] !== undefined
                  const data = draft[product.product_name] || { quantity: '' }
                  const price = Number(product.price_per_case) || 0
                  const unit = Number(product.unit) || 0

                  return (
                    <div
                      key={product.product_name}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_3.5rem] gap-2 items-center px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md border transition ${
                        isChecked
                          ? 'bg-blue-500/5 border-blue-800/40'
                          : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700'
                      }`}
                    >
                      <button
                        type='button'
                        onClick={() => toggleProduct(product.product_name)}
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
                          {product.product_name}
                        </div>
                        <div className='text-[9px] sm:text-[10px] text-zinc-500 tabular-nums truncate'>
                          {formatMoney(price)}/case · {formatNumber(unit)} btls
                        </div>
                      </div>

                      <input
                        type='number'
                        min='0'
                        step='any'
                        value={data.quantity}
                        onChange={e =>
                          updateQuantity(product.product_name, e.target.value)
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
            {error && (
              <div className='text-[10px] sm:text-[11px] text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2.5 py-1.5 mb-2'>
                {error}
              </div>
            )}

            <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-3'>
              <div className='rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 flex items-center justify-between gap-3 min-w-0 sm:min-w-[200px]'>
                <div className='flex flex-col min-w-0'>
                  <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-semibold'>
                    Net Amount
                  </span>
                  <span className='text-[8px] sm:text-[9px] text-zinc-600 tabular-nums'>
                    {formatNumber(totalCases)}{' '}
                    {totalCases === 1 ? 'case' : 'cases'}
                  </span>
                </div>
                <span className='text-base sm:text-lg font-bold text-emerald-400 tabular-nums shrink-0'>
                  {formatMoney(computedTotal)}
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
                  type='submit'
                  disabled={!isValid || busy}
                  className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md bg-blue-600 hover:bg-blue-500 font-medium transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5'
                >
                  {busy ? (
                    <>
                      <TbLoader2 size={14} className='animate-spin' />
                      Saving…
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
