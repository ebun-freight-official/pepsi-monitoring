import { useState, useEffect } from 'react'
import { TbX, TbPlus, TbTrash, TbCheck, TbLoader2 } from 'react-icons/tb'
import { formatNumber } from '../utils/inventory'
import ProductCombobox from './ProductCombobox'

const GRID_EDIT = 'grid grid-cols-[minmax(0,1fr)_5rem_2rem] gap-2 items-center'

export default function EditLoadoutModal ({
  isOpen,
  onClose,
  truck,
  loadout = [],
  stocks,
  onSave
}) {
  const [draft, setDraft] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDraft(
        loadout.length > 0
          ? loadout.map(i => ({ ...i }))
          : [{ product_name: '', cases: 1 }]
      )
      setError('')
      setBusy(false)
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

  const updateDraft = (index, field, value) => {
    setDraft(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const addDraftItem = () =>
    setDraft([...draft, { product_name: '', cases: 1 }])
  const removeDraftItem = index => setDraft(draft.filter((_, i) => i !== index))

  const usedElsewhere = currentIndex => {
    const set = new Set()
    draft.forEach((item, i) => {
      if (i === currentIndex) return
      if (item.product_name) set.add(item.product_name)
    })
    return set
  }

  const draftValid = (() => {
    const grouped = {}
    draft.forEach(i => {
      if (!i.product_name) return
      grouped[i.product_name] =
        (grouped[i.product_name] || 0) + (Number(i.cases) || 0)
    })
    if (Object.keys(grouped).length === 0) return false
    return Object.entries(grouped).every(
      ([name, total]) => total <= getAvailable(name)
    )
  })()

  const allUsedNames = new Set(draft.map(i => i.product_name).filter(Boolean))
  const allProductsAdded =
    stocks.length > 0 && allUsedNames.size >= stocks.length

  const handleSave = async () => {
    if (!draftValid || busy) return
    setBusy(true)
    setError('')
    const cleaned = draft
      .filter(i => i.product_name && Number(i.cases) > 0)
      .map(i => ({ product_name: i.product_name, cases: Number(i.cases) }))
    try {
      const ok = await onSave(cleaned)
      if (ok === false) setError('Failed to save loadout')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-2xl max-h-[60vh] flex flex-col shadow-2xl shadow-black/60'>
        <div className='flex justify-between items-center px-4 py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Edit Loadout
            </span>
            <span className='text-[11px] text-zinc-500 truncate'>
              · {truck}
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className='text-zinc-500 hover:text-zinc-100 transition disabled:opacity-40'
          >
            <TbX size={18} />
          </button>
        </div>

        <div className='flex-1 min-h-0 overflow-y-auto p-4'>
          <div
            className={`${GRID_EDIT} pb-2 mb-2 border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-600`}
          >
            <span>Product</span>
            <span className='text-center'>Cases</span>
            <span />
          </div>

          <div className='space-y-2'>
            {draft.map((item, index) => {
              const available = getAvailable(item.product_name)
              const exceeds =
                item.product_name && Number(item.cases) > available
              const taken = usedElsewhere(index)

              const productOptions = sortedStocks
                .filter(
                  s =>
                    !taken.has(s.product_name) ||
                    s.product_name === item.product_name
                )
                .map(s => ({
                  value: s.product_name,
                  label: s.product_name,
                  meta: `${formatNumber(s.quantity)} avail`
                }))

              return (
                <div key={index}>
                  <div className={GRID_EDIT}>
                    <div className='min-w-0'>
                      <ProductCombobox
                        value={item.product_name}
                        options={productOptions}
                        onChange={name =>
                          updateDraft(index, 'product_name', name)
                        }
                        placeholder='— Product —'
                      />
                    </div>
                    <input
                      type='number'
                      min='1'
                      step='1'
                      value={item.cases}
                      onChange={e =>
                        updateDraft(index, 'cases', e.target.value)
                      }
                      className='w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-100 text-center focus:outline-none focus:border-blue-500 tabular-nums transition'
                    />
                    {draft.length > 1 ? (
                      <button
                        type='button'
                        onClick={() => removeDraftItem(index)}
                        className='text-zinc-500 hover:text-rose-400 transition justify-self-center'
                      >
                        <TbTrash size={14} />
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                  {exceeds && (
                    <div className='text-[10px] text-rose-400 mt-1'>
                      Only {formatNumber(available)} available
                    </div>
                  )}
                </div>
              )
            })}

            <button
              type='button'
              onClick={addDraftItem}
              disabled={allProductsAdded}
              className='w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400 text-zinc-400 text-[11px] py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-700 disabled:hover:text-zinc-400'
            >
              <TbPlus size={12} />
              {allProductsAdded ? 'All products added' : 'Add product'}
            </button>
          </div>

          {error && (
            <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2 mt-3'>
              {error}
            </div>
          )}
        </div>

        <div className='shrink-0 border-t border-zinc-800 p-3 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            disabled={busy}
            className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2.5 rounded-md transition disabled:opacity-40'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={!draftValid || busy}
            className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-blue-600/30'
          >
            {busy ? (
              <>
                <TbLoader2 size={12} className='animate-spin' />
                Saving…
              </>
            ) : (
              <>
                <TbCheck size={12} />
                Save Loadout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
