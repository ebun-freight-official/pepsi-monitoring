import { useState } from 'react'
import { TbSearch, TbAlertTriangle } from 'react-icons/tb'
import {
  calcOnTruckByProduct,
  calcSoldDetailsByProduct,
  formatMoney,
  formatNumber
} from '../utils/inventory'

const LOW_STOCK_THRESHOLD = 30

const formatCases = n => {
  const num = Number(n) || 0
  return Number.isInteger(num) ? num.toString() : num.toFixed(1)
}

function CaseBottleCell ({ cases, unit, colorClass, value, valueColor }) {
  const total = (Number(cases) || 0) * (Number(unit) || 0)
  return (
    <div className='flex flex-col leading-tight'>
      <span className={`font-medium ${colorClass}`}>
        {formatCases(cases)}{' '}
        <span className='text-[10px] uppercase tracking-wide opacity-70'>
          {Number(cases) === 1 ? 'case' : 'cases'}
        </span>
      </span>
      <span className='text-[10px] text-zinc-500'>
        {formatNumber(total)} {total === 1 ? 'btl' : 'btls'}
      </span>
      {value !== undefined && Number(value) > 0 && (
        <span className={`text-[10px] ${valueColor || 'text-emerald-400/70'}`}>
          {formatMoney(value)}
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
  { value: 'value_desc', label: 'Value (High → Low)' },
  { value: 'truck_desc', label: 'On Truck (High → Low)' }
]

const FILTER_OPTIONS = [
  { value: 'all', label: 'All products' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: `Low stock (≤ ${LOW_STOCK_THRESHOLD})` },
  { value: 'out_stock', label: 'Out of stock' },
  { value: 'on_truck', label: 'On Truck' },
  { value: 'has_sales', label: 'Has sales' }
]

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

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
    const totalCases = inHouse + free + onTruck
    const inHouseValue = inHouse * price

    const isOut = inHouse === 0
    const isLow = !isOut && inHouse <= LOW_STOCK_THRESHOLD

    return {
      stock,
      inHouse,
      free,
      onTruck,
      sold,
      soldValue,
      unit,
      price,
      emptiesPer,
      totalCases,
      inHouseValue,
      isOut,
      isLow
    }
  })

  const q = search.trim().toLowerCase()
  let list = decorated
  if (q) {
    list = list.filter(r => r.stock.product_name.toLowerCase().includes(q))
  }

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
      case 'value_desc':
        return b.inHouseValue - a.inHouseValue
      case 'truck_desc':
        return b.onTruck - a.onTruck
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
    if (r.isOut) {
      return 'bg-rose-500/10 border-l-2 border-l-rose-500 hover:bg-rose-500/15'
    }
    if (r.isLow) {
      return 'bg-amber-500/10 border-l-2 border-l-amber-500 hover:bg-amber-500/15'
    }
    return 'border-l-2 border-l-transparent hover:bg-zinc-800/40'
  }

  return (
    <div className='flex flex-col h-full min-h-0'>
      {/* FIXED FILTER BAR */}
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
            <TbAlertTriangle size={11} />
            {outOfStockCount} out
          </span>
        )}

        {lowStockCount > 0 && (
          <span className='flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-800/50 px-2 py-0.5 rounded tabular-nums'>
            <TbAlertTriangle size={11} />
            {lowStockCount} low
          </span>
        )}

        <span className='text-[10px] text-zinc-600 ml-auto tabular-nums'>
          {rows.length} of {stocks.length}
        </span>
      </div>

      {/* SCROLLABLE TABLE */}
      <div className='flex-1 min-h-0 overflow-auto'>
        <table className='w-full text-sm border-collapse'>
          <thead className='sticky top-0 bg-zinc-900 z-10'>
            <tr className='text-left text-[11px] uppercase tracking-wide text-zinc-500'>
              <th className='px-3 py-2 font-medium'>Product</th>
              <th className='px-3 py-2 font-medium'>Unit</th>
              <th className='px-3 py-2 font-medium'>In-House</th>
              <th className='px-3 py-2 font-medium'>Free</th>
              <th className='px-3 py-2 font-medium'>On Truck</th>
              <th className='px-3 py-2 font-medium'>Sold</th>
              <th className='px-3 py-2 font-medium'>Total</th>
              <th className='px-3 py-2 font-medium text-right'>
                Price / Empties
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className='px-3 py-8 text-center text-zinc-600'>
                  {stocks.length === 0
                    ? 'No stocks yet. Click “New Entry” to add products.'
                    : 'No products match your filter.'}
                </td>
              </tr>
            )}

            {rows.map(r => (
              <tr
                key={r.stock.id}
                className={`border-t border-zinc-800 transition align-top ${rowClassFor(
                  r
                )}`}
              >
                <td className='px-3 py-2 font-medium truncate'>
                  {r.stock.product_name}
                </td>
                <td className='px-3 py-2 text-zinc-400'>{r.stock.unit}</td>

                <td className='px-3 py-2'>
                  <CaseBottleCell
                    cases={r.inHouse}
                    unit={r.unit}
                    colorClass={
                      r.isOut
                        ? 'text-rose-400'
                        : r.isLow
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }
                    value={r.inHouseValue}
                  />
                </td>

                <td className='px-3 py-2'>
                  {r.free > 0 ? (
                    <CaseBottleCell
                      cases={r.free}
                      unit={r.unit}
                      colorClass='text-amber-400'
                    />
                  ) : (
                    <span className='text-zinc-700'>—</span>
                  )}
                </td>

                <td className='px-3 py-2'>
                  {r.onTruck > 0 ? (
                    <CaseBottleCell
                      cases={r.onTruck}
                      unit={r.unit}
                      colorClass='text-violet-400'
                    />
                  ) : (
                    <span className='text-zinc-700'>—</span>
                  )}
                </td>

                <td className='px-3 py-2'>
                  {r.sold > 0 ? (
                    <CaseBottleCell
                      cases={r.sold}
                      unit={r.unit}
                      colorClass='text-emerald-400'
                      value={r.soldValue}
                    />
                  ) : (
                    <span className='text-zinc-700'>—</span>
                  )}
                </td>

                <td className='px-3 py-2'>
                  <CaseBottleCell
                    cases={r.totalCases}
                    unit={r.unit}
                    colorClass='text-zinc-100'
                  />
                </td>

                <td className='px-3 py-2 text-right leading-tight'>
                  <div className='text-emerald-400 font-medium tabular-nums'>
                    {formatMoney(r.price)}
                  </div>
                  {r.emptiesPer > 0 ? (
                    <div className='text-[10px] text-amber-400 tabular-nums'>
                      {formatMoney(r.emptiesPer)} empties
                    </div>
                  ) : (
                    <div className='text-[10px] text-amber-400'>—</div>
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
