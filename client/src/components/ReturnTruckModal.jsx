import { useState, useEffect, useMemo } from 'react'
import { TbX, TbArrowDown, TbLoader2 } from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'
import {
  EMPTIES_RATES,
  EMPTIES_GROUPS,
  EMPTIES_GROUP_LABELS,
  EMPTY_EMPTIES,
  calcEmptiesGroupSubtotal
} from '../data/bottleSizes'

const GRID_RETURN =
  'grid grid-cols-[minmax(0,1fr)_2.5rem_3rem_2rem_4rem_4rem] sm:grid-cols-[minmax(0,1fr)_3.5rem_4rem_2.75rem_5rem_5rem] gap-1 sm:gap-2 items-center'

const diffMeta = diff => {
  const isExact = Math.abs(diff) < 0.01
  const isOver = diff > 0.01
  if (isExact) {
    return {
      label: 'Difference',
      display: formatMoney(0),
      color: 'text-zinc-400'
    }
  }
  if (isOver) {
    return {
      label: 'Over',
      display: `+${formatMoney(diff)}`,
      color: 'text-emerald-400'
    }
  }
  return {
    label: 'Short',
    display: `-${formatMoney(Math.abs(diff))}`,
    color: 'text-rose-400'
  }
}

export default function ReturnTruckModal ({
  isOpen,
  onClose,
  deployment,
  onReturn
}) {
  const [returns, setReturns] = useState({})
  const [empties, setEmpties] = useState(EMPTY_EMPTIES)
  const [remit, setRemit] = useState({ cash: 0, gcash: 0, credit: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && deployment) {
      const init = {}
      deployment.items.forEach(item => {
        init[item.product_name] = item.cases
      })
      setReturns(init)
      setEmpties(EMPTY_EMPTIES)
      setRemit({ cash: 0, gcash: 0, credit: 0 })
      setBusy(false)
      setError('')
    }
  }, [isOpen, deployment?._id])

  const emptiesSizes = useMemo(() => {
    return EMPTIES_RATES.fullCase.map(fc => {
      const co = EMPTIES_RATES.caseOnly.find(r => r.id === fc.id)
      const bo = EMPTIES_RATES.bottlesOnly.find(r => r.id === fc.id)
      return {
        id: fc.id,
        label: fc.label,
        rates: {
          fullCase: fc?.price ?? 0,
          caseOnly: co?.price ?? 0,
          bottlesOnly: bo?.price ?? 0
        }
      }
    })
  }, [])

  if (!isOpen || !deployment) return null

  const sortedItems = [...deployment.items].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  const soldTotals = deployment.items.reduce(
    (acc, item) => {
      const remaining = returns[item.product_name] ?? item.cases
      const sold = item.cases - remaining
      acc.value += sold * (Number(item.price_per_case) || 0)
      acc.empties += sold * (Number(item.empties_per_case) || 0)
      return acc
    },
    { value: 0, empties: 0 }
  )

  const returnedEmptiesValue =
    calcEmptiesGroupSubtotal('fullCase', empties.fullCase) +
    calcEmptiesGroupSubtotal('caseOnly', empties.caseOnly) +
    calcEmptiesGroupSubtotal('bottlesOnly', empties.bottlesOnly)

  const cashRemit =
    (Number(remit.cash) || 0) +
    (Number(remit.gcash) || 0) +
    (Number(remit.credit) || 0)

  const salesDiff = cashRemit - soldTotals.value
  const salesMeta = diffMeta(salesDiff)

  const emptiesDiff = returnedEmptiesValue - soldTotals.empties
  const emptiesMeta = diffMeta(emptiesDiff)

  const updateReturn = (productName, value) => {
    const deployed = deployment.items.find(i => i.product_name === productName)
    const max = deployed ? deployed.cases : 0
    const num = Math.min(Math.max(Number(value) || 0, 0), max)
    setReturns(prev => ({ ...prev, [productName]: num }))
  }

  const updateEmpties = (group, id, value) => {
    const num = Math.max(Number(value) || 0, 0)
    setEmpties(prev => ({ ...prev, [group]: { ...prev[group], [id]: num } }))
  }

  const updateRemit = (key, value) => {
    const num = Math.max(Number(value) || 0, 0)
    setRemit(prev => ({ ...prev, [key]: num }))
  }

  const handleSubmit = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const returnItems = deployment.items.map(item => ({
        product_name: item.product_name,
        cases_deployed: item.cases,
        cases_returned: returns[item.product_name] ?? item.cases
      }))
      const ok = await onReturn(
        deployment._id,
        returnItems,
        { ...remit, case_remit: returnedEmptiesValue },
        empties
      )
      if (ok === false) setError('Failed to return truck. Please try again.')
    } catch (err) {
      setError(err.message || 'Failed to return truck.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-5xl max-h-[80dvh] sm:max-h-[85vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <TbArrowDown className='text-emerald-400 shrink-0' size={16} />
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              Return Truck
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

        {/* Body — scrollable */}
        <div className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2 sm:space-y-3'>
          {/* Return items */}
          <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
            <div
              className={`${GRID_RETURN} px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500`}
            >
              <span>Product</span>
              <span className='text-center'>Loaded</span>
              <span className='text-center'>Left</span>
              <span className='text-center'>Sold</span>
              <span className='text-right'>Sold ₱</span>
              <span className='text-right'>Empties</span>
            </div>

            <div className='divide-y divide-zinc-800/50'>
              {sortedItems.map((item, i) => {
                const remaining = returns[item.product_name] ?? item.cases
                const sold = item.cases - remaining
                const price = Number(item.price_per_case) || 0
                const emptiesPer = Number(item.empties_per_case) || 0
                return (
                  <div
                    key={i}
                    className={`${GRID_RETURN} px-2 sm:px-3 py-1.5 sm:py-2 items-center transition-colors hover:bg-zinc-800/40`}
                  >
                    <div className='min-w-0'>
                      <div className='text-[11px] sm:text-sm text-zinc-100 font-medium truncate'>
                        {item.product_name}
                      </div>
                      <div className='text-[9px] sm:text-[10px] text-zinc-500 tabular-nums'>
                        {formatMoney(price)}/c · {formatNumber(item.unit)} btls
                      </div>
                    </div>
                    <div className='text-[11px] sm:text-sm text-blue-400 font-medium text-center tabular-nums'>
                      {formatNumber(item.cases)}
                    </div>
                    <input
                      type='number'
                      min='0'
                      max={item.cases}
                      step='1'
                      value={remaining}
                      onChange={e =>
                        updateReturn(item.product_name, e.target.value)
                      }
                      disabled={busy}
                      className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1 py-1 text-[11px] sm:text-sm text-center focus:outline-none focus:border-emerald-500 tabular-nums disabled:opacity-60'
                    />
                    <div className='text-[11px] sm:text-sm text-zinc-300 font-medium text-center tabular-nums'>
                      {sold}
                    </div>
                    <div className='text-[11px] sm:text-sm text-emerald-400 font-semibold text-right tabular-nums'>
                      {formatMoney(sold * price)}
                    </div>
                    <div className='text-[11px] sm:text-sm text-amber-400 font-semibold text-right tabular-nums'>
                      {formatMoney(sold * emptiesPer)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Empties Received */}
          <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
            <div className='flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60'>
              <span className='text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-amber-400'>
                Empties Received
              </span>
              <span className='text-xs sm:text-sm font-semibold text-amber-400 tabular-nums'>
                {formatMoney(returnedEmptiesValue)}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full min-w-[340px] border-collapse'>
                <thead>
                  <tr className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800'>
                    <th className='px-2 sm:px-3 py-1.5 sm:py-2 text-left font-medium whitespace-nowrap'>
                      Size
                    </th>
                    {EMPTIES_GROUPS.map(group => (
                      <th
                        key={group}
                        className='px-1 sm:px-2 py-1.5 sm:py-2 text-center font-medium'
                      >
                        {EMPTIES_GROUP_LABELS[group]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emptiesSizes.map(size => (
                    <tr
                      key={size.id}
                      className='border-t border-zinc-800/50 transition-colors hover:bg-zinc-800/30'
                    >
                      <td className='px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-zinc-300 font-medium whitespace-nowrap'>
                        {size.label}
                      </td>
                      {EMPTIES_GROUPS.map(group => {
                        const qty = empties[group]?.[size.id] || 0
                        const price = size.rates[group]
                        return (
                          <td
                            key={group}
                            className='px-1 sm:px-2 py-1 sm:py-1.5'
                          >
                            <div className='flex flex-col items-center gap-0.5'>
                              <input
                                type='number'
                                min='0'
                                step='1'
                                value={qty || ''}
                                placeholder='0'
                                onChange={e =>
                                  updateEmpties(group, size.id, e.target.value)
                                }
                                disabled={busy}
                                className='w-full max-w-[3.5rem] sm:max-w-[5.5rem] bg-zinc-950 border border-zinc-700 rounded-md px-1 py-1 text-[11px] sm:text-xs text-center focus:outline-none focus:border-amber-500 tabular-nums disabled:opacity-60'
                              />
                              <span className='text-[8px] sm:text-[9px] text-zinc-600 tabular-nums'>
                                {formatMoney(price)}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}

                  <tr className='border-t-2 border-zinc-700 bg-zinc-900/40'>
                    <td className='px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] uppercase tracking-wide text-zinc-400 font-semibold'>
                      Subtotal
                    </td>
                    {EMPTIES_GROUPS.map(group => (
                      <td
                        key={group}
                        className='px-1 sm:px-2 py-1.5 sm:py-2 text-center text-[11px] sm:text-xs text-amber-400 font-semibold tabular-nums'
                      >
                        {formatMoney(
                          calcEmptiesGroupSubtotal(group, empties[group])
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Split remit: Sales↔Cash | Empties↔Case */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3'>
            {/* Card A: Sales → Cash Remit */}
            <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
              <div className='flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 gap-2'>
                <span className='text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-emerald-400 truncate'>
                  Sales → Cash
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-medium tabular-nums shrink-0 ${salesMeta.color}`}
                >
                  {salesMeta.label} · {salesMeta.display}
                </span>
              </div>

              <div className='p-2 sm:p-3 space-y-1.5 sm:space-y-2'>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                    Sales Value
                  </span>
                  <span className='text-[11px] sm:text-xs font-semibold text-emerald-400 tabular-nums'>
                    {formatMoney(soldTotals.value)}
                  </span>
                </div>

                <div className='border-t border-zinc-800/60'>
                  <div className='flex items-center gap-1 sm:gap-2 bg-black/50'>
                    {[
                      { key: 'cash', label: 'Cash' },
                      { key: 'gcash', label: 'G-Cash' },
                      { key: 'credit', label: 'Credit' }
                    ].map(f => (
                      <div
                        key={f.key}
                        className='flex items-center gap-1 flex-1 min-w-0 py-1.5 sm:py-2'
                      >
                        <label className='text-[9px] sm:text-[10px] uppercase tracking-wide text-zinc-500 shrink-0'>
                          {f.label}:
                        </label>
                        <input
                          type='number'
                          min='0'
                          value={remit[f.key] || ''}
                          placeholder='0'
                          onChange={e => updateRemit(f.key, e.target.value)}
                          disabled={busy}
                          className='flex-1 min-w-0 bg-transparent border-0 px-1 py-0 text-[11px] text-right text-zinc-100 tabular-nums focus:outline-none focus:text-teal-400 transition disabled:opacity-60'
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className='pt-1.5 sm:pt-2 -mt-2 border-t border-zinc-800/60 space-y-1'>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-semibold'>
                      Total Cash Remit
                    </span>
                    <span className='text-xs sm:text-sm font-semibold text-teal-400 tabular-nums'>
                      {formatMoney(cashRemit)}
                    </span>
                  </div>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                      {salesMeta.label}
                    </span>
                    <span
                      className={`text-[11px] sm:text-xs font-medium tabular-nums ${salesMeta.color}`}
                    >
                      {salesMeta.display}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Empties → Case Remit */}
            <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
              <div className='flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60 gap-2'>
                <span className='text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-amber-400 truncate'>
                  Empties → Case
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-medium tabular-nums shrink-0 ${emptiesMeta.color}`}
                >
                  {emptiesMeta.label} · {emptiesMeta.display}
                </span>
              </div>

              <div className='p-2 sm:p-3 space-y-1.5 sm:space-y-2'>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                    Empties Value
                  </span>
                  <span className='text-[11px] sm:text-xs font-semibold text-amber-400 tabular-nums'>
                    {formatMoney(soldTotals.empties)}
                  </span>
                </div>

                <div className='pt-1.5 sm:pt-2 mt-1 border-t border-zinc-800/60 space-y-1'>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-semibold'>
                      Total Case Remit
                    </span>
                    <span className='text-xs sm:text-sm font-semibold text-teal-400 tabular-nums'>
                      {formatMoney(returnedEmptiesValue)}
                    </span>
                  </div>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                      {emptiesMeta.label}
                    </span>
                    <span
                      className={`text-[11px] sm:text-xs font-medium tabular-nums ${emptiesMeta.color}`}
                    >
                      {emptiesMeta.display}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
            onClick={handleSubmit}
            disabled={busy}
            className='flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2 sm:py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20'
          >
            {busy ? (
              <>
                <TbLoader2 size={12} className='animate-spin' />
                Returning…
              </>
            ) : (
              <>
                <TbArrowDown size={12} />
                Confirm Return
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
