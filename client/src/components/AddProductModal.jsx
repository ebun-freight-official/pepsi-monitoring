import { useState, useEffect } from 'react'
import { TbX, TbPackage, TbLoader2 } from 'react-icons/tb'
import {
  BOTTLE_SIZES,
  findBottleSize,
  calcEmptiesPerCase
} from '../data/bottleSizes'
import { formatMoney } from '../utils/inventory'

const inputClass =
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 sm:px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 uppercase focus:outline-none focus:border-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed'

const labelClass =
  'block text-[10px] sm:text-xs uppercase tracking-wide text-zinc-500 mb-1'

const firstBS = BOTTLE_SIZES[0]

const emptyForm = () => ({
  product_name: '',
  bottle_size: firstBS.id,
  unit: firstBS.defaultUnit,
  price_per_case: 0
})

export default function AddProductModal ({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm())
      setError('')
      setBusy(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedBS = findBottleSize(form.bottle_size)
  const empties = selectedBS
    ? calcEmptiesPerCase(form.bottle_size, form.unit)
    : 0
  const isPlastic = !!selectedBS?.isPlastic
  const pricePerBottle =
    (Number(form.unit) || 0) > 0
      ? (Number(form.price_per_case) || 0) / Number(form.unit)
      : 0

  const handleBottleSizeChange = id => {
    const bs = findBottleSize(id)
    if (!bs) return
    setForm({ ...form, bottle_size: id, unit: bs.defaultUnit })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const ok = await onSave({ ...form, empties_per_case: empties })
      if (ok === false) {
        setError('Product already exists or name is empty.')
        setBusy(false)
        return
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add product.')
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-lg max-h-[80dvh] sm:max-h-[80vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Add Product
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

        <form
          onSubmit={handleSubmit}
          className='flex flex-col flex-1 min-h-0 overflow-hidden'
        >
          {/* Body */}
          <div className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3'>
            <div className='grid grid-cols-12 gap-2 sm:gap-3'>
              <div className='col-span-12'>
                <label className={labelClass}>Product Name</label>
                <input
                  type='text'
                  value={form.product_name}
                  onChange={e =>
                    setForm({ ...form, product_name: e.target.value })
                  }
                  placeholder='e.g. PEPSI 8'
                  className={inputClass}
                  required
                  disabled={busy}
                  autoFocus
                />
              </div>

              <div className='col-span-12 sm:col-span-4'>
                <label className={labelClass}>Bottle Size</label>
                <select
                  value={form.bottle_size}
                  onChange={e => handleBottleSizeChange(e.target.value)}
                  className={inputClass}
                  disabled={busy}
                >
                  {BOTTLE_SIZES.map(bs => (
                    <option key={bs.id} value={bs.id}>
                      {bs.isPlastic ? `${bs.label} · plastic` : bs.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='col-span-6 sm:col-span-4'>
                <label className={labelClass}>Unit (btls/case)</label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className={inputClass}
                  disabled={busy}
                />
              </div>

              <div className='col-span-6 sm:col-span-4'>
                <label className={labelClass}>Price / Case</label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.price_per_case}
                  onChange={e =>
                    setForm({ ...form, price_per_case: e.target.value })
                  }
                  placeholder='Sell price'
                  className={inputClass}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Info cards — hidden on mobile */}
            {selectedBS && (
              <>
                <div className='hidden md:grid md:grid-cols-4 gap-2 text-[11px]'>
                  <div className='bg-zinc-950/60 border border-zinc-800 rounded-md px-3 py-2'>
                    <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                      Price / Bottle
                    </div>
                    <div className='text-emerald-400 font-semibold tabular-nums'>
                      {formatMoney(pricePerBottle)}
                    </div>
                  </div>

                  {!isPlastic && (
                    <>
                      <div className='bg-zinc-950/60 border border-zinc-800 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                          Bottle deposit
                        </div>
                        <div className='text-zinc-300 font-medium tabular-nums text-[11px]'>
                          {formatMoney(selectedBS.bottleDeposit)} ×{' '}
                          {form.unit || 0} ={' '}
                          {formatMoney(
                            selectedBS.bottleDeposit * (Number(form.unit) || 0)
                          )}
                        </div>
                      </div>

                      <div className='bg-zinc-950/60 border border-zinc-800 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                          Case deposit
                        </div>
                        <div className='text-zinc-300 font-medium tabular-nums'>
                          {formatMoney(selectedBS.caseDeposit)}
                        </div>
                      </div>

                      <div className='bg-amber-500/5 border border-amber-800/40 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-amber-400/80'>
                          Empties / Case
                        </div>
                        <div className='text-amber-400 font-semibold tabular-nums'>
                          {formatMoney(empties)}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isPlastic && (
                  <div className='hidden md:flex bg-sky-500/10 border border-sky-800/50 rounded-md px-3 py-2 text-xs text-sky-400 items-center justify-between gap-2'>
                    <span>
                      Plastic bottle · <b>non-returnable</b> — no bottle or case
                      deposit
                    </span>
                    <span className='text-sky-400 font-semibold tabular-nums shrink-0'>
                      Empties ₱0
                    </span>
                  </div>
                )}
              </>
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
              className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2 sm:py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={busy}
              className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 sm:py-2.5 rounded-md transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5'
            >
              {busy ? (
                <>
                  <TbLoader2 size={13} className='animate-spin' />
                  Adding…
                </>
              ) : (
                'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
