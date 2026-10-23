import { useState, useEffect } from 'react'
import {
  TbPlus,
  TbTrash,
  TbTruck,
  TbPencil,
  TbCheck,
  TbX,
  TbArrowLeft
} from 'react-icons/tb'
import {
  createEmptyDeployItem,
  formatDate,
  formatMoney,
  formatNumber
} from '../utils/inventory'
import {
  EMPTIES_RATES,
  EMPTIES_GROUPS,
  EMPTIES_GROUP_LABELS,
  EMPTY_EMPTIES,
  calcEmptiesGroupSubtotal
} from '../data/bottleSizes'
import ProductCombobox from './ProductCombobox'

const EMPTY_REMIT = { cash: 0, gcash: 0, credit: 0 }

const GRID_DEPLOYED =
  'grid grid-cols-[minmax(0,1fr)_3.5rem_4rem_2.75rem_5.5rem_5.5rem] gap-2 items-center'
const GRID_IDLE =
  'grid grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem_5.5rem] gap-2 items-center'
const GRID_EDIT =
  'grid grid-cols-[minmax(0,1fr)_4.5rem_2rem] gap-1.5 items-center'

function HeadCell ({ label, value, color = 'text-zinc-300', align = 'center' }) {
  const alignCls =
    align === 'right'
      ? 'items-end text-right'
      : align === 'left'
      ? 'items-start text-left'
      : 'items-center text-center'
  return (
    <div className={`flex flex-col ${alignCls} min-w-0`}>
      <span className='text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
        {label}
      </span>
      {value !== undefined && value !== null && value !== '' ? (
        <span
          className={`text-sm font-semibold tabular-nums mt-0.5 truncate ${color}`}
        >
          {value}
        </span>
      ) : (
        <span className='text-sm font-semibold tabular-nums mt-0.5 truncate text-zinc-700'>
          —
        </span>
      )}
    </div>
  )
}

function RemitPanel ({ remit, onChange, caseRemit, total, diff }) {
  const isExact = Math.abs(diff) < 0.01
  const isOver = diff > 0.01

  const diffColor = isExact
    ? 'text-zinc-400'
    : isOver
    ? 'text-emerald-400'
    : 'text-rose-400'
  const diffLabel = isExact ? 'Exact' : isOver ? 'Over' : 'Short'
  const diffDisplay = isExact
    ? formatMoney(0)
    : isOver
    ? `+${formatMoney(diff)}`
    : `-${formatMoney(Math.abs(diff))}`

  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-900/40 overflow-hidden'>
      <div className='flex justify-between items-center px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60'>
        <span className='text-[10px] uppercase tracking-wider font-semibold text-teal-400'>
          Remit
        </span>
        <span className={`text-[10px] font-medium tabular-nums ${diffColor}`}>
          {diffLabel} · {diffDisplay}
        </span>
      </div>

      <div className='p-3 space-y-3'>
        <div className='grid grid-cols-3 gap-2'>
          {[
            { key: 'cash', label: 'Cash' },
            { key: 'gcash', label: 'G-Cash' },
            { key: 'credit', label: 'Credit' }
          ].map(f => (
            <div key={f.key}>
              <label className='block text-[9px] uppercase tracking-wide text-zinc-500 mb-1'>
                {f.label}
              </label>
              <input
                type='number'
                min='0'
                step='0.01'
                value={remit[f.key] || ''}
                placeholder='0'
                onChange={e => onChange(f.key, e.target.value)}
                className='w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-right text-zinc-100 tabular-nums focus:outline-none focus:border-teal-500 transition'
              />
            </div>
          ))}
        </div>

        <div className='flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/60'>
          <div className='flex items-center gap-2'>
            <span className='text-[9px] uppercase tracking-wide text-zinc-500'>
              Case Remit
            </span>
            <span className='text-xs text-amber-400 font-medium tabular-nums'>
              {formatMoney(caseRemit)}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[9px] uppercase tracking-wide text-zinc-400 font-medium'>
              Total
            </span>
            <span className='text-sm font-semibold text-teal-400 tabular-nums'>
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FocusedTruckView ({
  truck,
  activeDeployment,
  loadout = [],
  stocks,
  onDeploy,
  onReturn,
  onUpdateLoadout,
  onBack
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [returns, setReturns] = useState({})
  const [empties, setEmpties] = useState(EMPTY_EMPTIES)
  const [remit, setRemit] = useState(EMPTY_REMIT)

  useEffect(() => {
    if (isDeployed) {
      const init = {}
      activeDeployment.items.forEach(item => {
        init[item.product_name] = item.cases
      })
      setReturns(init)
      setEmpties(EMPTY_EMPTIES)
      setRemit(EMPTY_REMIT)
      setIsEditing(false)
      setDraft([])
    }
  }, [activeDeployment?._id, isDeployed])

  const sortedStocks = [...stocks].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )
  const sortedReturnItems = isDeployed
    ? [...activeDeployment.items].sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      )
    : []
  const sortedLoadout = [...loadout].sort((a, b) =>
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

  const startEdit = () => {
    setDraft(
      hasLoadout ? loadout.map(i => ({ ...i })) : [createEmptyDeployItem()]
    )
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft([])
  }

  const updateDraft = (index, field, value) => {
    setDraft(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const addDraftItem = () => setDraft([...draft, createEmptyDeployItem()])
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

  const saveDraft = () => {
    if (!draftValid) return
    const cleaned = draft
      .filter(i => i.product_name && Number(i.cases) > 0)
      .map(i => ({ product_name: i.product_name, cases: Number(i.cases) }))
    const ok = onUpdateLoadout(truck, cleaned)
    if (ok !== false) {
      setIsEditing(false)
      setDraft([])
    }
  }

  const handleDeploy = () => {
    if (!hasLoadout) return
    onDeploy(truck, loadout)
  }

  const updateReturn = (productName, value) => {
    const deployed = activeDeployment.items.find(
      i => i.product_name === productName
    )
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

  const totalDeployed = activeDeployment
    ? activeDeployment.items.reduce((s, i) => s + i.cases, 0)
    : 0
  const totalReturned = activeDeployment
    ? activeDeployment.items.reduce(
        (s, i) => s + (returns[i.product_name] ?? i.cases),
        0
      )
    : 0
  const totalSold = totalDeployed - totalReturned

  const soldTotals = activeDeployment
    ? activeDeployment.items.reduce(
        (acc, item) => {
          const remaining = returns[item.product_name] ?? item.cases
          const sold = item.cases - remaining
          const price = Number(item.price_per_case) || 0
          const emptiesPer = Number(item.empties_per_case) || 0
          acc.value += sold * price
          acc.empties += sold * emptiesPer
          return acc
        },
        { value: 0, empties: 0 }
      )
    : { value: 0, empties: 0 }

  const loadoutCases = isDeployed
    ? totalDeployed
    : loadout.reduce((s, i) => s + (Number(i.cases) || 0), 0)

  const loadoutValue = isDeployed
    ? activeDeployment.items.reduce(
        (s, i) => s + i.cases * (Number(i.price_per_case) || 0),
        0
      )
    : loadout.reduce((s, i) => {
        const stock = stocks.find(st => st.product_name === i.product_name)
        const price = stock ? Number(stock.price_per_case) || 0 : 0
        return s + i.cases * price
      }, 0)

  const loadoutEmptiesValue = isDeployed
    ? activeDeployment.items.reduce(
        (s, i) => s + i.cases * (Number(i.empties_per_case) || 0),
        0
      )
    : loadout.reduce((s, i) => {
        const stock = stocks.find(st => st.product_name === i.product_name)
        const emptiesPer = stock ? Number(stock.empties_per_case) || 0 : 0
        return s + i.cases * emptiesPer
      }, 0)

  const groupSubtotal = group => calcEmptiesGroupSubtotal(group, empties[group])

  const returnedEmptiesValue =
    groupSubtotal('fullCase') +
    groupSubtotal('caseOnly') +
    groupSubtotal('bottlesOnly')

  const totalRemit =
    (Number(remit.cash) || 0) +
    (Number(remit.gcash) || 0) +
    (Number(remit.credit) || 0) +
    returnedEmptiesValue

  const expectedCollect = soldTotals.value + soldTotals.empties
  const remitDiff = totalRemit - expectedCollect

  const handleReturn = () => {
    const returnItems = activeDeployment.items.map(item => ({
      product_name: item.product_name,
      cases_deployed: item.cases,
      cases_returned: returns[item.product_name] ?? item.cases
    }))
    onReturn(
      activeDeployment._id,
      returnItems,
      { ...remit, case_remit: returnedEmptiesValue },
      empties
    )
  }

  const allUsedNames = new Set(draft.map(i => i.product_name).filter(Boolean))
  const allProductsAdded =
    stocks.length > 0 && allUsedNames.size >= stocks.length

  const renderEmptiesColumn = () => (
    <div className='flex flex-col h-full min-h-0 w-72 shrink-0 border-l border-zinc-800 bg-zinc-900/20'>
      <div className='shrink-0 px-3 py-2 border-b border-zinc-800 flex items-baseline justify-between gap-2'>
        <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
          Empties Received
        </div>
        <div className='text-sm font-semibold text-amber-400 tabular-nums'>
          {formatMoney(returnedEmptiesValue)}
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-3 space-y-2'>
        {EMPTIES_GROUPS.map(group => (
          <div
            key={group}
            className='bg-zinc-950/60 border border-zinc-800 rounded-md p-2.5'
          >
            <div className='text-[10px] uppercase tracking-wide text-zinc-500 mb-2'>
              {EMPTIES_GROUP_LABELS[group]}
            </div>
            <div className='space-y-1.5'>
              {EMPTIES_RATES[group].map(r => {
                const qty = empties[group][r.id] || 0
                return (
                  <div
                    key={r.id}
                    className='grid grid-cols-[minmax(0,1fr)_3rem_4.5rem] items-center gap-2'
                  >
                    <div className='min-w-0'>
                      <div className='text-[11px] text-zinc-300 truncate'>
                        {r.label}
                      </div>
                      <div className='text-[9px] text-zinc-600 tabular-nums'>
                        ₱{r.price.toFixed(2)} each
                      </div>
                    </div>
                    <input
                      type='number'
                      min='0'
                      step='1'
                      value={qty || ''}
                      placeholder='0'
                      onChange={e => updateEmpties(group, r.id, e.target.value)}
                      className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-xs text-center focus:outline-none focus:border-amber-500 tabular-nums'
                    />
                    <span className='text-[11px] text-amber-400 font-medium text-right tabular-nums'>
                      {formatMoney(qty * r.price)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className='flex justify-between items-center mt-2 pt-2 border-t border-zinc-800/60'>
              <span className='text-[10px] uppercase tracking-wide text-zinc-600'>
                Subtotal
              </span>
              <span className='text-xs text-amber-400 font-semibold tabular-nums'>
                {formatMoney(groupSubtotal(group))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className='flex flex-col h-full min-h-0 border border-zinc-800 bg-zinc-950/60 rounded-lg overflow-hidden shadow-lg shadow-black/40'>
      {/* HEADER */}
      <div className='shrink-0 flex justify-between items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/70'>
        <div className='flex items-center gap-3 min-w-0'>
          {onBack && (
            <button
              onClick={onBack}
              className='flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-800 transition shrink-0'
            >
              <TbArrowLeft size={14} />
              Back
            </button>
          )}

          <div className='flex items-center gap-2 min-w-0'>
            <TbTruck className='text-blue-400 shrink-0' size={18} />
            <span className='font-semibold text-base truncate uppercase'>
              {truck}
            </span>
            {isDeployed ? (
              <span className='text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium shrink-0'>
                Out
              </span>
            ) : isEditing ? (
              <span className='text-[10px] uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium shrink-0'>
                Editing
              </span>
            ) : (
              <span className='text-[10px] uppercase py-0.5 px-2 rounded bg-zinc-800 text-zinc-500 font-medium shrink-0'>
                Idle
              </span>
            )}
          </div>
        </div>

        <div className='shrink-0 flex items-center gap-3'>
          {isDeployed && (
            <span className='text-[11px] text-zinc-500 tabular-nums'>
              {formatDate(activeDeployment.createdAt || activeDeployment.date)}
            </span>
          )}

          {!isDeployed && !isEditing && hasLoadout && (
            <button
              onClick={startEdit}
              className='flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition'
            >
              <TbPencil size={12} />
              Edit Loadout
            </button>
          )}
        </div>
      </div>

      {/* TWO-PANE BODY */}
      <div className='flex-1 min-h-0 flex'>
        <div className='flex-1 min-w-0 flex flex-col min-h-0'>
          {/* ─────────── DEPLOYED ─────────── */}
          {isDeployed && (
            <>
              <div className='shrink-0 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60'>
                <div className={GRID_DEPLOYED}>
                  <HeadCell
                    label='Product'
                    value={`${sortedReturnItems.length} ${
                      sortedReturnItems.length === 1 ? 'item' : 'items'
                    }`}
                    align='left'
                  />
                  <HeadCell
                    label='Loaded'
                    value={formatNumber(totalDeployed)}
                    color='text-blue-400'
                  />
                  <HeadCell
                    label='Left'
                    value={formatNumber(totalReturned)}
                    color='text-amber-400'
                  />
                  <HeadCell
                    label='Sold'
                    value={formatNumber(totalSold)}
                    color='text-emerald-400'
                  />
                  <HeadCell
                    label='Sold ₱'
                    value={formatMoney(soldTotals.value)}
                    color='text-emerald-400'
                    align='right'
                  />
                  <HeadCell
                    label='Empties'
                    value={formatMoney(soldTotals.empties)}
                    color='text-amber-400'
                    align='right'
                  />
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto pb-2'>
                <div className='divide-y divide-zinc-800/50'>
                  {sortedReturnItems.map((item, i) => {
                    const remaining = returns[item.product_name] ?? item.cases
                    const sold = item.cases - remaining
                    const price = Number(item.price_per_case) || 0
                    const emptiesPer = Number(item.empties_per_case) || 0
                    const valueSold = sold * price
                    const emptiesSold = sold * emptiesPer
                    return (
                      <div
                        key={i}
                        className={`${GRID_DEPLOYED} px-4 py-2 transition-colors hover:bg-zinc-800/40`}
                      >
                        <div className='min-w-0'>
                          <div className='text-sm text-zinc-100 font-medium truncate'>
                            {item.product_name}
                          </div>
                          <div className='text-[10px] text-zinc-500 tabular-nums'>
                            {formatMoney(price)}/case ·{' '}
                            {formatNumber(item.unit)} btls
                          </div>
                        </div>
                        <div className='text-sm text-blue-400 font-medium text-center tabular-nums'>
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
                          className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-sm text-center focus:outline-none focus:border-emerald-500 tabular-nums'
                        />
                        <div className='text-sm text-zinc-300 font-medium text-center tabular-nums'>
                          {sold}
                        </div>
                        <div className='text-sm text-emerald-400 font-semibold text-right tabular-nums'>
                          {formatMoney(valueSold)}
                        </div>
                        <div className='text-sm text-amber-400 font-semibold text-right tabular-nums'>
                          {formatMoney(emptiesSold)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ─────────── IDLE — Viewing loadout ─────────── */}
          {!isDeployed && !isEditing && hasLoadout && (
            <>
              <div className='shrink-0 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60'>
                <div className={GRID_IDLE}>
                  <HeadCell
                    label='Product'
                    value={`${loadout.length} ${
                      loadout.length === 1 ? 'item' : 'items'
                    }`}
                    align='left'
                  />
                  <HeadCell
                    label='Cases'
                    value={formatNumber(loadoutCases)}
                    color='text-blue-400'
                    align='right'
                  />
                  <HeadCell label='₱/case' align='right' />
                  <HeadCell
                    label='Line ₱'
                    value={formatMoney(loadoutValue)}
                    color='text-emerald-400'
                    align='right'
                  />
                  <HeadCell
                    label='Empties'
                    value={formatMoney(loadoutEmptiesValue)}
                    color='text-amber-400'
                    align='right'
                  />
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto pb-2'>
                <div className='divide-y divide-zinc-800/50'>
                  {sortedLoadout.map((item, i) => {
                    const stock = stocks.find(
                      st => st.product_name === item.product_name
                    )
                    const price = stock ? Number(stock.price_per_case) || 0 : 0
                    const emptiesPer = stock
                      ? Number(stock.empties_per_case) || 0
                      : 0
                    const cases = Number(item.cases) || 0
                    return (
                      <div
                        key={i}
                        className={`${GRID_IDLE} px-4 py-2 transition-colors hover:bg-zinc-800/40`}
                      >
                        <span className='text-sm text-zinc-100 font-medium truncate'>
                          {item.product_name}
                        </span>
                        <span className='text-sm text-blue-400 font-medium text-right tabular-nums'>
                          {formatNumber(cases)}
                        </span>
                        <span className='text-xs text-zinc-400 text-right tabular-nums'>
                          {formatMoney(price)}
                        </span>
                        <span className='text-sm text-emerald-400 font-semibold text-right tabular-nums'>
                          {formatMoney(cases * price)}
                        </span>
                        <span className='text-sm text-amber-400 font-semibold text-right tabular-nums'>
                          {formatMoney(cases * emptiesPer)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ─────────── IDLE — Editing loadout ─────────── */}
          {!isDeployed && isEditing && (
            <>
              <div className='shrink-0 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60'>
                <div
                  className={`${GRID_EDIT} text-[10px] uppercase tracking-wide text-zinc-600`}
                >
                  <span>
                    Product · {draft.length}{' '}
                    {draft.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className='text-center'>Cases</span>
                  <span />
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto px-4 py-3'>
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
                            className='w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-100 text-center placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'
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
              </div>
            </>
          )}

          {/* ─────────── IDLE — No loadout ─────────── */}
          {!isDeployed && !isEditing && !hasLoadout && (
            <div className='flex-1 min-h-0 flex items-center justify-center p-8'>
              <div className='text-center space-y-2'>
                {stocks.length === 0 ? (
                  <div className='text-zinc-600 text-sm'>Add stocks first.</div>
                ) : (
                  <>
                    <div className='text-zinc-500 text-sm'>No loadout set.</div>
                    <button
                      type='button'
                      onClick={startEdit}
                      className='text-blue-400 hover:text-blue-300 text-xs font-medium transition'
                    >
                      + Set Loadout
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {isDeployed && renderEmptiesColumn()}
      </div>

      {/* FIXED FOOTER */}
      <div className='shrink-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm p-3'>
        {!isDeployed && hasLoadout && !isEditing && (
          <button
            type='button'
            onClick={handleDeploy}
            disabled={!hasLoadout}
            className='w-full bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30'
          >
            Deploy Truck
          </button>
        )}

        {!isDeployed && isEditing && (
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={cancelEdit}
              className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2.5 rounded-md transition flex items-center justify-center gap-1'
            >
              <TbX size={12} />
              Cancel
            </button>
            <button
              type='button'
              onClick={saveDraft}
              disabled={!draftValid}
              className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-blue-600/30'
            >
              <TbCheck size={12} />
              Save Loadout
            </button>
          </div>
        )}

        {isDeployed && (
          <div className='space-y-2.5'>
            <RemitPanel
              remit={remit}
              onChange={updateRemit}
              caseRemit={returnedEmptiesValue}
              total={totalRemit}
              diff={remitDiff}
            />

            <button
              type='button'
              onClick={handleReturn}
              className='w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2.5 rounded-md transition shadow-md shadow-emerald-600/20'
            >
              Confirm Return
            </button>
          </div>
        )}

        {!isDeployed && !hasLoadout && !isEditing && (
          <div className='text-center text-[11px] text-zinc-600 py-1'>
            {stocks.length === 0
              ? 'Add stocks from My Stocks first.'
              : 'No loadout set.'}
          </div>
        )}
      </div>
    </div>
  )
}
