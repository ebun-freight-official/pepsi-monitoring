import { useState, useEffect, useMemo } from 'react'
import { TbX, TbPlus, TbTrash, TbLoader2 } from 'react-icons/tb'
import { calcEntryTotal, formatMoney } from '../utils/inventory'
import ProductCombobox from './ProductCombobox'

const blankItem = () => ({
  product_name: '',
  bottle_size: '',
  unit: 0,
  quantity: 1,
  promo: 0,
  price_per_case: 0,
  empties_per_case: 0,
  discount: 0
})

const inputClass =
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 sm:px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 uppercase focus:outline-none focus:border-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed'

const lockedClass =
  'w-full bg-zinc-950/60 border border-zinc-800 rounded-md px-2 sm:px-3 py-1.5 text-sm text-zinc-400 uppercase cursor-not-allowed'

const labelClass =
  'block text-[10px] sm:text-xs uppercase tracking-wide text-zinc-500 mb-1'

export default function NewEntryModal ({
  isOpen,
  onClose,
  onSave,
  products = []
}) {
  const [items, setItems] = useState([blankItem()])
  const [netAmount, setNetAmount] = useState('0.00')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setItems([blankItem()])
      setNetAmount('0.00')
      setBusy(false)
      setError('')
    }
  }, [isOpen])

  const productOptions = useMemo(
    () =>
      products.map(p => ({
        value: p.product_name,
        label: p.product_name,
        meta: `${p.unit} btls · ${formatMoney(p.price_per_case)}`
      })),
    [products]
  )

  if (!isOpen) return null

  const applyProduct = (index, productName) => {
    const product = products.find(p => p.product_name === productName)
    const next = items.map((item, i) =>
      i === index
        ? {
            ...item,
            product_name: productName,
            bottle_size: product ? product.bottle_size : '',
            unit: product ? Number(product.unit) || 0 : 0,
            price_per_case: product ? Number(product.price_per_case) || 0 : 0,
            empties_per_case: product
              ? Number(product.empties_per_case) || 0
              : 0
          }
        : item
    )
    setItems(next)
    setNetAmount(calcEntryTotal(next).toFixed(2))
  }

  const updateItem = (index, field, value) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setItems(next)
    setNetAmount(calcEntryTotal(next).toFixed(2))
  }

  const addItem = () => setItems([...items, blankItem()])

  const removeItem = index => {
    const next = items.filter((_, i) => i !== index)
    setItems(next)
    setNetAmount(calcEntryTotal(next).toFixed(2))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
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
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-3xl max-h-[80dvh] sm:max-h-[90vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* HEADER */}
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
            <TbX size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='flex flex-col flex-1 min-h-0 overflow-hidden'
        >
          {/* BODY */}
          <div className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2'>
            {products.length === 0 && (
              <div className='bg-amber-500/10 border border-amber-800/50 text-amber-400 rounded-md px-3 py-2 text-xs'>
                No products defined yet. Go to <b>Products</b> page to add
                products first.
              </div>
            )}

            {items.map((item, index) => {
              const subtotal =
                (Number(item.quantity) || 0) *
                (Number(item.price_per_case) || 0)
              const discount = Number(item.discount) || 0
              const total = subtotal - discount

              return (
                <div
                  key={index}
                  className='bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 sm:p-3'
                >
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-[10px] sm:text-[11px] uppercase tracking-wide text-zinc-500'>
                      Product {index + 1}
                    </span>

                    {items.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removeItem(index)}
                        disabled={busy}
                        className='p-1 -m-1 text-zinc-500 hover:text-rose-400 transition disabled:opacity-40'
                        title='Remove product'
                        aria-label='Remove product'
                      >
                        <TbTrash size={15} />
                      </button>
                    )}
                  </div>

                  {/* Row 1 */}
                  <div className='grid grid-cols-12 gap-2'>
                    <div className='col-span-12 sm:col-span-6 min-w-0'>
                      <label className={labelClass}>Product</label>
                      <ProductCombobox
                        value={item.product_name}
                        options={productOptions}
                        onChange={name => applyProduct(index, name)}
                        disabled={products.length === 0 || busy}
                        placeholder='— Search product —'
                      />
                    </div>

                    <div className='col-span-6 sm:col-span-3 min-w-0'>
                      <label className={labelClass}>Cases</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        value={item.quantity}
                        onChange={e =>
                          updateItem(index, 'quantity', e.target.value)
                        }
                        disabled={busy}
                        className={inputClass}
                      />
                    </div>

                    <div className='col-span-6 sm:col-span-3 min-w-0'>
                      <label className={labelClass}>Free</label>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        value={item.promo}
                        onChange={e =>
                          updateItem(index, 'promo', e.target.value)
                        }
                        disabled={busy}
                        placeholder='0'
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className='grid grid-cols-12 gap-2 mt-2'>
                    <div className='col-span-6 sm:col-span-4 min-w-0'>
                      <label className={labelClass}>Price / Case</label>
                      <input
                        type='text'
                        value={
                          item.product_name
                            ? formatMoney(item.price_per_case)
                            : '—'
                        }
                        readOnly
                        tabIndex={-1}
                        className={lockedClass}
                      />
                    </div>

                    <div className='col-span-6 sm:col-span-4 min-w-0'>
                      <label className={labelClass}>Discount</label>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        value={item.discount}
                        onChange={e =>
                          updateItem(index, 'discount', e.target.value)
                        }
                        disabled={busy}
                        placeholder='0.00'
                        className={inputClass}
                      />
                    </div>

                    <div className='col-span-12 sm:col-span-4 min-w-0'>
                      <label className={labelClass}>Total</label>
                      <input
                        type='text'
                        value={formatMoney(total)}
                        readOnly
                        tabIndex={-1}
                        className={lockedClass + ' text-emerald-400'}
                      />
                    </div>
                  </div>

                  {discount > 0 && (
                    <div className='flex justify-end text-[10px] text-rose-400/80 mt-1 tabular-nums'>
                      Subtotal {formatMoney(subtotal)} − Discount{' '}
                      {formatMoney(discount)}
                    </div>
                  )}
                </div>
              )
            })}

            <button
              type='button'
              onClick={addItem}
              disabled={products.length === 0 || busy}
              className='w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400 text-zinc-400 text-xs sm:text-sm py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-700 disabled:hover:text-zinc-400'
            >
              <TbPlus size={14} />
              Add another product
            </button>

            {error && (
              <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2'>
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className='shrink-0 px-2.5 sm:px-4 py-2.5 sm:py-3 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-2 sm:gap-3'>
            <div className='min-w-0 sm:w-auto'>
              <label className={labelClass}>Net Amount</label>
              <div className='flex items-center gap-1'>
                <span className='text-zinc-400 text-sm shrink-0'>₱</span>
                <input
                  type='number'
                  step='0.01'
                  value={netAmount}
                  onChange={e => setNetAmount(e.target.value)}
                  disabled={busy}
                  className='w-full sm:w-40 bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1.5 text-sm font-semibold text-emerald-400 uppercase focus:outline-none focus:border-blue-500 transition disabled:opacity-60'
                />
              </div>
            </div>

            <div className='flex gap-2'>
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
                disabled={products.length === 0 || busy}
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
        </form>
      </div>
    </div>
  )
}
