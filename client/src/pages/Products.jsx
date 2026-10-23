import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbTrash, TbSearch } from 'react-icons/tb'
import {
  BOTTLE_SIZES,
  findBottleSize,
  calcEmptiesPerCase
} from '../data/bottleSizes'
import { formatMoney } from '../utils/inventory'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 uppercase focus:outline-none focus:border-blue-500 transition'

const labelClass =
  'block text-[10px] uppercase tracking-wide text-zinc-500 mb-1'

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

const firstBS = BOTTLE_SIZES[0]

const formatBottleSizeOption = bs =>
  bs.isPlastic ? `${bs.label} · plastic` : bs.label

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'price_desc', label: 'Price (High → Low)' },
  { value: 'price_asc', label: 'Price (Low → High)' },
  { value: 'unit_desc', label: 'Unit (High → Low)' },
  { value: 'unit_asc', label: 'Unit (Low → High)' }
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'returnable', label: 'Returnable only' },
  { value: 'plastic', label: 'Plastic only' },
  { value: 'has_empties', label: 'Has empties' }
]

export default function Products () {
  const { isAdmin } = useAuth()
  const { products, addProduct, deleteProduct } = useOutletContext()

  const [form, setForm] = useState({
    product_name: '',
    bottle_size: firstBS.id,
    unit: firstBS.defaultUnit,
    price_per_case: 0
  })
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterBy, setFilterBy] = useState('all')

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
    setError('')
    const ok = await addProduct({ ...form, empties_per_case: empties })
    if (!ok) {
      setError('Product already exists or name is empty.')
      return
    }
    setForm({
      product_name: '',
      bottle_size: firstBS.id,
      unit: firstBS.defaultUnit,
      price_per_case: 0
    })
  }

  const q = search.trim().toLowerCase()
  let list = products
  if (q) {
    list = list.filter(p => p.product_name.toLowerCase().includes(q))
  }

  switch (filterBy) {
    case 'returnable':
      list = list.filter(p => {
        const bs = findBottleSize(p.bottle_size)
        return bs && !bs.isPlastic
      })
      break
    case 'plastic':
      list = list.filter(p => {
        const bs = findBottleSize(p.bottle_size)
        return bs && bs.isPlastic
      })
      break
    case 'has_empties':
      list = list.filter(p => Number(p.empties_per_case) > 0)
      break
    default:
      break
  }

  const visibleProducts = [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name_desc':
        return b.product_name.localeCompare(a.product_name)
      case 'price_desc':
        return Number(b.price_per_case) - Number(a.price_per_case)
      case 'price_asc':
        return Number(a.price_per_case) - Number(b.price_per_case)
      case 'unit_desc':
        return Number(b.unit) - Number(a.unit)
      case 'unit_asc':
        return Number(a.unit) - Number(b.unit)
      case 'name_asc':
      default:
        return a.product_name.localeCompare(b.product_name)
    }
  })

  const hasActiveFilter =
    search !== '' || filterBy !== 'all' || sortBy !== 'name_asc'

  const resetFilters = () => {
    setSearch('')
    setFilterBy('all')
    setSortBy('name_asc')
  }

  return (
    <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg flex flex-col overflow-hidden shadow-lg shadow-black/40'>
      <div className='shrink-0 p-4 pb-2 border-b border-zinc-800'>
        <div className='flex justify-between items-center pb-2 mb-3'>
          <div className='uppercase font-medium text-lg'>Products</div>
        </div>

        {/* Add Product form — admin only */}
        {isAdmin && (
          <form
            onSubmit={handleSubmit}
            className='bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 mb-3'
          >
            <div className='text-[11px] uppercase tracking-wide text-zinc-500 mb-2'>
              Add Product
            </div>

            <div className='grid grid-cols-1 md:grid-cols-12 gap-3'>
              <div className='md:col-span-4'>
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
                />
              </div>

              <div className='md:col-span-3'>
                <label className={labelClass}>Bottle Size</label>
                <select
                  value={form.bottle_size}
                  onChange={e => handleBottleSizeChange(e.target.value)}
                  className={inputClass}
                >
                  {BOTTLE_SIZES.map(bs => (
                    <option key={bs.id} value={bs.id}>
                      {formatBottleSizeOption(bs)}
                    </option>
                  ))}
                </select>
              </div>

              <div className='md:col-span-2'>
                <label className={labelClass}>Unit (btls/case)</label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className='md:col-span-3'>
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
                />
              </div>
            </div>

            {selectedBS && (
              <>
                <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]'>
                  <div className='bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2'>
                    <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                      Price / Bottle
                    </div>
                    <div className='text-emerald-400 font-semibold tabular-nums'>
                      {formatMoney(pricePerBottle)}
                    </div>
                  </div>

                  {!isPlastic && (
                    <>
                      <div className='bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                          Bottle deposit
                        </div>
                        <div className='text-zinc-300 font-medium tabular-nums'>
                          {formatMoney(selectedBS.bottleDeposit)} ×{' '}
                          {form.unit || 0} ={' '}
                          {formatMoney(
                            selectedBS.bottleDeposit * (Number(form.unit) || 0)
                          )}
                        </div>
                      </div>

                      <div className='bg-zinc-900/60 border border-zinc-800 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-zinc-500'>
                          Case deposit
                        </div>
                        <div className='text-zinc-300 font-medium tabular-nums'>
                          {formatMoney(selectedBS.caseDeposit)}
                        </div>
                      </div>

                      <div className='bg-amber-500/5 border border-amber-800/40 rounded-md px-3 py-2'>
                        <div className='text-[10px] uppercase tracking-wide text-amber-400/80'>
                          Empties / Case (auto)
                        </div>
                        <div className='text-amber-400 font-semibold tabular-nums'>
                          {formatMoney(empties)}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {isPlastic && (
                  <div className='mt-3 bg-sky-500/10 border border-sky-800/50 rounded-md px-3 py-2 text-xs text-sky-400 flex items-center justify-between'>
                    <span>
                      Plastic bottle · <b>non-returnable</b> — no bottle or case
                      deposit
                    </span>
                    <span className='text-sky-400 font-semibold tabular-nums'>
                      Empties ₱0.00
                    </span>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800 rounded-md px-3 py-2 mt-3'>
                {error}
              </div>
            )}

            <button
              type='submit'
              className='mt-3 bg-blue-600 hover:bg-blue-500 text-sm font-medium px-4 py-1.5 rounded-md shadow-md shadow-blue-600/30 transition'
            >
              Add Product
            </button>
          </form>
        )}

        <div className='flex flex-wrap items-center gap-2 pb-2'>
          <div className='relative flex-1 min-w-[160px]'>
            <TbSearch
              size={14}
              className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
            />
            <input
              type='text'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search product…'
              className='w-full bg-zinc-900 border border-zinc-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'
            />
          </div>

          <select
            value={filterBy}
            onChange={e => setFilterBy(e.target.value)}
            className={selectClass}
          >
            {FILTER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className={selectClass}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className='text-[11px] text-zinc-500 hover:text-zinc-200 transition'
            >
              Reset
            </button>
          )}

          <span className='text-[10px] text-zinc-600 ml-auto tabular-nums'>
            {visibleProducts.length} of {products.length}
          </span>
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-auto px-4 pb-4'>
        <table className='w-full text-sm border-collapse'>
          <thead className='sticky top-0 bg-zinc-900 z-10'>
            <tr className='text-left text-[11px] uppercase tracking-wide text-zinc-500'>
              <th className='px-3 py-2 font-medium'>Name</th>
              <th className='px-3 py-2 font-medium'>Bottle Size</th>
              <th className='px-3 py-2 font-medium'>Unit</th>
              <th className='px-3 py-2 font-medium'>Price / Bottle</th>
              <th className='px-3 py-2 font-medium'>Price / Case</th>
              <th className='px-3 py-2 font-medium'>Empties / Case</th>
              <th className='px-3 py-2 font-medium'>Total / Case</th>
              {isAdmin && (
                <th className='px-3 py-2 font-medium text-right'>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  className='px-3 py-8 text-center text-zinc-600'
                >
                  {products.length === 0
                    ? isAdmin
                      ? 'No products yet. Add one above.'
                      : 'No products yet.'
                    : 'No products match your filter.'}
                </td>
              </tr>
            )}
            {visibleProducts.map(p => {
              const bs = findBottleSize(p.bottle_size)
              const price = Number(p.price_per_case) || 0
              const unit = Number(p.unit) || 0
              const ppb = unit > 0 ? price / unit : 0
              const total = price + Number(p.empties_per_case)
              return (
                <tr
                  key={p._id}
                  className='border-t border-zinc-800 hover:bg-zinc-800/40 transition'
                >
                  <td className='px-3 py-2 font-medium'>{p.product_name}</td>
                  <td className='px-3 py-2 text-zinc-400'>
                    <div className='flex items-center gap-2'>
                      <span>{bs ? bs.label : '—'}</span>
                      {bs?.isPlastic && (
                        <span className='text-[9px] uppercase tracking-wide text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded font-medium'>
                          Plastic
                        </span>
                      )}
                    </div>
                  </td>
                  <td className='px-3 py-2 text-zinc-400'>{p.unit}</td>
                  <td className='px-3 py-2 text-emerald-400/80 tabular-nums'>
                    {formatMoney(ppb)}
                  </td>
                  <td className='px-3 py-2 text-emerald-400 tabular-nums'>
                    {formatMoney(price)}
                  </td>
                  <td className='px-3 py-2 text-amber-400 tabular-nums'>
                    {Number(p.empties_per_case) > 0
                      ? formatMoney(p.empties_per_case)
                      : '—'}
                  </td>
                  <td className='px-3 py-2 text-zinc-100 font-medium tabular-nums'>
                    {formatMoney(total)}
                  </td>
                  {isAdmin && (
                    <td className='px-3 py-2 text-right'>
                      <button
                        onClick={() => deleteProduct(p._id)}
                        className='text-zinc-500 hover:text-rose-400 transition'
                        title='Delete product'
                      >
                        <TbTrash size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
