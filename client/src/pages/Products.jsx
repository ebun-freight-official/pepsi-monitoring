import { useState } from 'react'
import { useOutletContext } from 'react-router'
import { TbTrash, TbSearch, TbPlus } from 'react-icons/tb'
import { findBottleSize } from '../data/bottleSizes'
import { formatMoney } from '../utils/inventory'
import { useAuth } from '../context/AuthContext'
import AddProductModal from '../components/AddProductModal'

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

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

const CELL = 'px-2 sm:px-3 py-2 sm:py-2.5'
const HEAD_CELL = 'px-2 sm:px-3 py-2 font-medium whitespace-nowrap'

export default function Products () {
  const { isAdmin } = useAuth()
  const { products, addProduct, deleteProduct } = useOutletContext()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterBy, setFilterBy] = useState('all')

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
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg flex flex-col overflow-hidden shadow-lg shadow-black/40'>
        <div className='shrink-0 p-2.5 sm:p-4 pb-1.5 sm:pb-2 border-b border-zinc-800'>
          <div className='flex justify-between items-center gap-2 pb-1.5 sm:pb-2 mb-2 sm:mb-3'>
            <div className='uppercase font-medium text-sm sm:text-lg truncate'>
              Products
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className='flex items-center gap-1 sm:gap-1.5 bg-blue-600 hover:bg-blue-500 transition text-xs sm:text-sm font-medium px-2 sm:px-3 py-2 sm:py-1.5 rounded-md shadow-md shadow-blue-600/30 whitespace-nowrap shrink-0'
              >
                <TbPlus size={14} />
                Add Product
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className='flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1.5 sm:pb-2'>
            <div className='relative w-full sm:w-auto sm:flex-1 sm:min-w-[160px]'>
              <TbSearch
                size={13}
                className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
              />
              <input
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search product…'
                className='w-full bg-zinc-900 border border-zinc-700 rounded-md pl-7 pr-2 py-1 sm:py-1.5 text-[11px] sm:text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'
              />
            </div>

            <select
              value={filterBy}
              onChange={e => setFilterBy(e.target.value)}
              className={`${selectClass} flex-1 sm:flex-none`}
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
              className={`${selectClass} flex-1 sm:flex-none`}
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
                className='text-[10px] sm:text-[11px] text-zinc-500 hover:text-zinc-200 transition'
              >
                Reset
              </button>
            )}

            <span className='text-[9px] sm:text-[10px] text-zinc-600 ml-auto tabular-nums'>
              {visibleProducts.length} of {products.length}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className='flex-1 min-h-0 overflow-auto px-2.5 sm:px-4 pb-2.5 sm:pb-4'>
          <table className='w-full min-w-[860px] text-xs sm:text-sm border-collapse'>
            <thead className='sticky top-0 bg-zinc-900 z-10'>
              <tr className='text-left text-[9px] sm:text-[11px] uppercase tracking-wide text-zinc-500'>
                <th className={HEAD_CELL}>Name</th>
                <th className={HEAD_CELL}>Bottle Size</th>
                <th className={HEAD_CELL}>Unit</th>
                <th className={HEAD_CELL}>Price / Bottle</th>
                <th className={HEAD_CELL}>Price / Case</th>
                <th className={HEAD_CELL}>Empties / Case</th>
                <th className={HEAD_CELL}>Total / Case</th>
                {isAdmin && (
                  <th className={`${HEAD_CELL} text-right`}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className='px-3 py-6 sm:py-8 text-center text-zinc-600 text-xs sm:text-sm'
                  >
                    {products.length === 0
                      ? isAdmin
                        ? 'No products yet. Click “Add Product” to create one.'
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
                    <td
                      className={`${CELL} text-[11px] sm:text-sm font-medium text-zinc-100`}
                    >
                      {p.product_name}
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-zinc-400`}
                    >
                      <div className='flex items-center gap-1.5 sm:gap-2 whitespace-nowrap'>
                        <span>{bs ? bs.label : '—'}</span>
                        {bs?.isPlastic && (
                          <span className='text-[8px] sm:text-[9px] uppercase tracking-wide text-sky-400 bg-sky-500/15 px-1 sm:px-1.5 py-0.5 rounded font-medium'>
                            Plastic
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-zinc-400 tabular-nums`}
                    >
                      {p.unit}
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-emerald-400/80 tabular-nums`}
                    >
                      {formatMoney(ppb)}
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-emerald-400 tabular-nums`}
                    >
                      {formatMoney(price)}
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-amber-400 tabular-nums`}
                    >
                      {Number(p.empties_per_case) > 0
                        ? formatMoney(p.empties_per_case)
                        : '—'}
                    </td>
                    <td
                      className={`${CELL} text-[11px] sm:text-sm text-zinc-100 font-medium tabular-nums`}
                    >
                      {formatMoney(total)}
                    </td>
                    {isAdmin && (
                      <td className={`${CELL} text-right`}>
                        <button
                          onClick={() => deleteProduct(p._id)}
                          className='p-1 -m-1 text-zinc-500 hover:text-rose-400 transition'
                          title='Delete product'
                          aria-label='Delete product'
                        >
                          <TbTrash size={15} />
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

      {isAdmin && (
        <AddProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={addProduct}
        />
      )}
    </>
  )
}
