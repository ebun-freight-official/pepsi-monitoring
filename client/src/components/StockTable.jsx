import { useState } from 'react'
import { TbSearch } from 'react-icons/tb'
import {
  calcOnTruckByProduct,
  calcSoldDetailsByProduct,
  formatMoney
} from '../utils/inventory'

const LOW_STOCK_THRESHOLD = 30

const formatCases = n => {
  const num = Number(n) || 0
  return Number.isInteger(num) ? num.toString() : num.toFixed(1)
}

function StackCell ({
  primary,
  primaryClass,
  secondary,
  secondaryClass = 'text-zinc-500'
}) {
  return (
    <div className='flex flex-col leading-tight'>
      <span className={`font-medium tabular-nums ${primaryClass}`}>
        {primary}
      </span>
      {secondary !== undefined && (
        <span className={`text-[11px] tabular-nums mt-0.5 ${secondaryClass}`}>
          {secondary}
        </span>
      )}
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'inhouse_desc', label: 'In-House (High → Low)' },
  { value: 'inhouse_asc', label: 'In-House (Low → High)' },
  { value: 'sold_desc', label: 'Sold (High → Low)' },
  { value: 'stock_value_desc', label: 'Stock Value (High → Low)' },
  { value: 'sold_value_desc', label: 'Sold Value (High → Low)' },
  { value: 'truck_desc', label: 'On Truck (High → Low)' },
  { value: 'empties_desc', label: 'Has Empties → Plastic' },
  { value: 'empties_asc', label: 'Plastic → Has Empties' }
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: `Low stock (≤ ${LOW_STOCK_THRESHOLD})` },
  { value: 'out_stock', label: 'Out of stock' },
  { value: 'on_truck', label: 'On Truck' },
  { value: 'has_sales', label: 'Has sales' },
  { value: 'has_empties', label: 'Has empties' }
]

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

const COL_DIVIDER = 'border-l border-zinc-800'

export default function StockTable ({
  stocks,
  deployments = [],
  truckLoadouts = {}
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name_asc')
  const [filterBy, setFilterBy] = useState('all')

  const onTruckMap = calcOnTruckByProduct(deployments, truckLoadouts)
  const soldMap = calcSoldDetailsByProduct(deployments)

  const decorated = stocks.map(stock => {
    const inHouse = Number(stock.quantity) || 0
    const free = Number(stock.promo) || 0
    const onTruck = onTruckMap[stock.product_name] || 0
    const soldInfo = soldMap[stock.product_name] || {
      cases: 0,
      value: 0,
      empties: 0
    }
    const sold = soldInfo.cases
    const soldValue = soldInfo.value
    const unit = Number(stock.unit) || 0
    const price = Number(stock.price_per_case) || 0
    const emptiesPer = Number(stock.empties_per_case) || 0

    const stockValue = (inHouse + onTruck) * price
    const totalOwned = inHouse + onTruck

    const isOut = inHouse === 0
    const isLow = !isOut && inHouse <= LOW_STOCK_THRESHOLD

    return {
      stock,
      inHouse,
      free,
      onTruck,
      totalOwned,
      sold,
      soldValue,
      unit,
      price,
      emptiesPer,
      stockValue,
      isOut,
      isLow
    }
  })

  const q = search.trim().toLowerCase()
  let list = decorated
  if (q) list = list.filter(r => r.stock.product_name.toLowerCase().includes(q))

  switch (filterBy) {
    case 'in_stock':
      list = list.filter(r => r.inHouse > 0)
      break
    case 'low_stock':
      list = list.filter(r => r.isLow)
      break
    case 'out_stock':
      list = list.filter(r => r.isOut)
      break
    case 'on_truck':
      list = list.filter(r => r.onTruck > 0)
      break
    case 'has_sales':
      list = list.filter(r => r.sold > 0)
      break
    case 'has_empties':
      list = list.filter(r => r.emptiesPer > 0)
      break
    default:
      break
  }

  const rows = [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name_desc':
        return b.stock.product_name.localeCompare(a.stock.product_name)
      case 'inhouse_desc':
        return b.inHouse - a.inHouse
      case 'inhouse_asc':
        return a.inHouse - b.inHouse
      case 'sold_desc':
        return b.sold - a.sold
      case 'stock_value_desc':
        return b.stockValue - a.stockValue
      case 'sold_value_desc':
        return b.soldValue - a.soldValue
      case 'truck_desc':
        return b.onTruck - a.onTruck
      case 'empties_desc': {
        const aGroup = a.emptiesPer > 0 ? 0 : 1
        const bGroup = b.emptiesPer > 0 ? 0 : 1
        if (aGroup !== bGroup) return aGroup - bGroup
        return a.stock.product_name.localeCompare(b.stock.product_name)
      }
      case 'empties_asc': {
        const aGroup = a.emptiesPer > 0 ? 1 : 0
        const bGroup = b.emptiesPer > 0 ? 1 : 0
        if (aGroup !== bGroup) return aGroup - bGroup
        return a.stock.product_name.localeCompare(b.stock.product_name)
      }
      case 'name_asc':
      default:
        return a.stock.product_name.localeCompare(b.stock.product_name)
    }
  })

  const hasActiveFilter =
    search !== '' || filterBy !== 'all' || sortBy !== 'name_asc'

  const resetFilters = () => {
    setSearch('')
    setFilterBy('all')
    setSortBy('name_asc')
  }

  const lowStockCount = decorated.filter(r => r.isLow).length
  const outOfStockCount = decorated.filter(r => r.isOut).length

  const rowClassFor = r => {
    if (r.isOut)
      return 'bg-rose-500/10 border-l-2 border-l-rose-500 hover:bg-rose-500/15'
    if (r.isLow)
      return 'bg-amber-500/10 border-l-2 border-l-amber-500 hover:bg-amber-500/15'
    return 'border-l-2 border-l-transparent hover:bg-zinc-800/40'
  }

  return (
    <div className='flex flex-col h-full min-h-0'>
      {/* FILTER BAR */}
      <div className='flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-zinc-800 shrink-0'>
        <div className='relative flex-1 min-w-[140px]'>
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

        {outOfStockCount > 0 && (
          <span className='flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-800/50 px-2 py-0.5 rounded tabular-nums'>
            <span className='w-1.5 h-1.5 rounded-full bg-rose-500' />
            {outOfStockCount} out
          </span>
        )}
        {lowStockCount > 0 && (
          <span className='flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-800/50 px-2 py-0.5 rounded tabular-nums'>
            <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
            {lowStockCount} low
          </span>
        )}

        <span className='text-[10px] text-zinc-600 ml-auto tabular-nums'>
          {rows.length} of {stocks.length}
        </span>
      </div>

      {/* TABLE */}
      <div className='flex-1 min-h-0 overflow-auto'>
        <table className='w-full text-sm border-collapse'>
          <thead className='sticky top-0 bg-zinc-900 z-10'>
            <tr className='text-left text-[11px] uppercase tracking-wider text-zinc-500'>
              <th className='px-3 py-2.5 font-medium'>Price</th>
              <th className='px-3 py-2.5 font-medium'>Product</th>
              <th className='px-3 py-2.5 font-medium text-center'>Unit</th>
              <th className='px-3 py-2.5 font-medium'>In-House</th>
              <th className='px-3 py-2.5 font-medium'>On Truck</th>
              <th className='px-3 py-2.5 font-medium'>Total Stock</th>
              <th className='px-3 py-2.5 font-medium text-right'>
                Stock Value
              </th>
              <th className={`px-3 py-2.5 font-medium ${COL_DIVIDER}`}>Sold</th>
              <th className='px-3 py-2.5 font-medium text-right'>Sold Value</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className='px-3 py-8 text-center text-zinc-600'>
                  {stocks.length === 0
                    ? 'No stocks yet. Click “New Entry” to add products.'
                    : 'No products match your filter.'}
                </td>
              </tr>
            )}

            {rows.map(r => (
              <tr
                key={r.stock._id}
                className={`border-t border-zinc-800 transition align-top ${rowClassFor(
                  r
                )}`}
              >
                {/* Price */}
                <td className='px-3 py-3'>
                  <StackCell
                    primary={formatMoney(r.price)}
                    primaryClass='text-zinc-100'
                    secondary={
                      r.emptiesPer > 0
                        ? `${formatMoney(r.emptiesPer)} empties`
                        : undefined
                    }
                    secondaryClass='text-amber-300'
                  />
                </td>

                {/* Product */}
                <td className='px-3 py-3'>
                  <span className='text-sm text-zinc-100 font-medium truncate block'>
                    {r.stock.product_name}
                  </span>
                </td>

                {/* Unit — zinc-100 */}
                <td className='px-3 py-3 text-center'>
                  <span className='text-sm text-zinc-100 font-medium tabular-nums'>
                    {r.unit}
                  </span>
                </td>

                {/* In-House */}
                <td className='px-3 py-3'>
                  <div className='flex items-baseline gap-1.5 flex-wrap'>
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        r.isOut
                          ? 'text-rose-400'
                          : r.isLow
                          ? 'text-amber-400'
                          : 'text-zinc-100'
                      }`}
                    >
                      {formatCases(r.inHouse)}
                    </span>
                    {r.free > 0 && (
                      <span className='text-[11px] text-amber-300 font-medium tabular-nums'>
                        +{formatCases(r.free)} free
                      </span>
                    )}
                  </div>
                </td>

                {/* On Truck */}
                <td className='px-3 py-3'>
                  {r.onTruck > 0 ? (
                    <span className='text-sm text-zinc-300 font-medium tabular-nums'>
                      {formatCases(r.onTruck)}
                    </span>
                  ) : (
                    <span className='text-sm text-zinc-600'>—</span>
                  )}
                </td>

                {/* Total Stock — zinc-100 */}
                <td className='px-3 py-3'>
                  <span className='text-sm text-zinc-100 font-semibold tabular-nums'>
                    {formatCases(r.totalOwned)}
                  </span>
                </td>

                {/* Stock Value */}
                <td className='px-3 py-3 text-right'>
                  <span className='text-sm text-zinc-100 font-semibold tabular-nums'>
                    {formatMoney(r.stockValue)}
                  </span>
                </td>

                {/* Sold */}
                <td className={`px-3 py-3 ${COL_DIVIDER}`}>
                  {r.sold > 0 ? (
                    <span className='text-sm text-emerald-400 font-medium tabular-nums'>
                      {formatCases(r.sold)}
                    </span>
                  ) : (
                    <span className='text-sm text-zinc-600'>—</span>
                  )}
                </td>

                {/* Sold Value */}
                <td className='px-3 py-3 text-right'>
                  {r.soldValue > 0 ? (
                    <span className='text-sm text-emerald-400 font-semibold tabular-nums'>
                      {formatMoney(r.soldValue)}
                    </span>
                  ) : (
                    <span className='text-sm text-zinc-600'>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
