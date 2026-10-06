import { useState, useEffect } from 'react'
import {
  TbPlus,
  TbTrash,
  TbTruck,
  TbPencil,
  TbCheck,
  TbX
} from 'react-icons/tb'
import {
  createEmptyDeployItem,
  defaultAgentFor,
  formatDate,
  formatMoney,
  formatNumber
} from '../utils/inventory'

const fieldClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 uppercase focus:outline-none focus:border-blue-500 transition'

const EMPTIES_RATES = {
  fullCase: [
    { id: '8oz', label: '8oz / 12oz', price: 90 },
    { id: '750ml', label: '750ml', price: 100 },
    { id: '1l', label: '1L', price: 124 }
  ],
  caseOnly: [
    { id: '8oz', label: '8oz / 12oz', price: 42 },
    { id: '750ml1l', label: '750ml / 1L', price: 52 }
  ],
  bottlesOnly: [
    { id: '8oz', label: '8oz / 12oz', price: 2 },
    { id: '750ml', label: '750ml', price: 4 },
    { id: '1l', label: '1L', price: 6 }
  ]
}

const EMPTY_EMPTIES = { fullCase: {}, caseOnly: {}, bottlesOnly: {} }

const GRID_DEPLOYED =
  'grid grid-cols-[minmax(0,1fr)_3.5rem_4rem_2.75rem_5.5rem_5.5rem] gap-2 items-center'
const GRID_IDLE =
  'grid grid-cols-[minmax(0,1fr)_3.5rem_5rem_5.5rem_5.5rem] gap-2 items-center'
const GRID_EDIT =
  'grid grid-cols-[minmax(0,1fr)_4.5rem_2rem] gap-1.5 items-center'

function SummaryRow ({
  label,
  value,
  color = 'text-zinc-200',
  emphasize = false
}) {
  return (
    <div className='flex items-baseline justify-between gap-3'>
      <span className='text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
        {label}
      </span>
      <span
        className={`tabular-nums truncate ${
          emphasize
            ? `text-base font-semibold ${color}`
            : `text-xs font-medium ${color}`
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function SummarySection ({ title, accent, rows }) {
  return (
    <div className='flex-1 min-w-0 rounded-md border border-zinc-800 bg-zinc-900/40 overflow-hidden'>
      <div
        className={`px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-wider font-semibold ${accent}`}
      >
        {title}
      </div>
      <div className='px-3 py-2 space-y-1.5'>
        {rows.map((r, i) => (
          <SummaryRow key={i} {...r} />
        ))}
      </div>
    </div>
  )
}

export default function FocusedTruckView ({
  truck,
  activeDeployment,
  loadout = [],
  agent = '',
  stocks,
  onDeploy,
  onReturn,
  onUpdateLoadout,
  onUpdateAgent,
  onRename,
  onRemove
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0
  const defaultAgent = defaultAgentFor(truck)

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [returns, setReturns] = useState({})
  const [empties, setEmpties] = useState(EMPTY_EMPTIES)

  const [agentInput, setAgentInput] = useState(agent || defaultAgent)
  const [nameInput, setNameInput] = useState(truck)
  const [renameError, setRenameError] = useState('')

  useEffect(() => {
    setAgentInput(agent || defaultAgent)
  }, [agent, defaultAgent])

  useEffect(() => {
    setNameInput(truck)
    setRenameError('')
  }, [truck])

  const commitAgent = () => {
    const cleaned = agentInput.trim().toUpperCase() || defaultAgent
    setAgentInput(cleaned)
    if (cleaned !== agent) onUpdateAgent(cleaned)
  }

  const commitName = () => {
    if (!onRename) {
      setNameInput(truck)
      return
    }
    const cleaned = nameInput.trim().toUpperCase()
    if (!cleaned || cleaned === truck) {
      setNameInput(truck)
      setRenameError('')
      return
    }
    if (isDeployed) {
      setRenameError('Return the truck before renaming.')
      setNameInput(truck)
      return
    }
    const ok = onRename(cleaned)
    if (!ok) {
      setRenameError('Name already in use.')
      setNameInput(truck)
      setTimeout(() => setRenameError(''), 2200)
    } else {
      setRenameError('')
    }
  }

  useEffect(() => {
    if (isDeployed) {
      const init = {}
      activeDeployment.items.forEach(item => {
        init[item.product_name] = item.cases
      })
      setReturns(init)
      setEmpties(EMPTY_EMPTIES)
      setIsEditing(false)
      setDraft([])
    }
  }, [activeDeployment?.id, isDeployed])

  const sortedStocks = [...stocks].sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )
  const sortedReturnItems = isDeployed
    ? [...activeDeployment.items].sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      )
    : []

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

  const handleReturn = () => {
    const returnItems = activeDeployment.items.map(item => ({
      product_name: item.product_name,
      cases_deployed: item.cases,
      cases_returned: returns[item.product_name] ?? item.cases
    }))
    onReturn(activeDeployment.id, returnItems)
  }

  const updateEmpties = (group, id, value) => {
    const num = Math.max(Number(value) || 0, 0)
    setEmpties(prev => ({
      ...prev,
      [group]: { ...prev[group], [id]: num }
    }))
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

  const groupSubtotal = group =>
    EMPTIES_RATES[group].reduce((sum, r) => {
      const qty = empties[group][r.id] || 0
      return sum + qty * r.price
    }, 0)

  const returnedEmptiesValue =
    groupSubtotal('fullCase') +
    groupSubtotal('caseOnly') +
    groupSubtotal('bottlesOnly')

  const emptiesDiff = returnedEmptiesValue - soldTotals.empties

  const allUsedNames = new Set(draft.map(i => i.product_name).filter(Boolean))
  const allProductsAdded =
    stocks.length > 0 && allUsedNames.size >= stocks.length

  const renderEmptiesColumn = () => (
    <div className='flex flex-col h-full min-h-0 w-80 shrink-0 border-l border-zinc-800 bg-zinc-900/20'>
      <div className='shrink-0 px-3 pt-3 pb-2 border-b border-zinc-800'>
        <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
          Empties Received
        </div>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-3 space-y-2'>
        {['fullCase', 'caseOnly', 'bottlesOnly'].map(group => {
          const title =
            group === 'fullCase'
              ? 'Full Case'
              : group === 'caseOnly'
              ? 'Case Only'
              : 'Bottles Only'
          return (
            <div
              key={group}
              className='bg-zinc-950/60 border border-zinc-800 rounded-md p-2.5'
            >
              <div className='text-[10px] uppercase tracking-wide text-zinc-500 mb-2'>
                {title}
              </div>

              <div className='grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] gap-1.5 pb-1 mb-1.5 border-b border-zinc-800/60 text-[9px] uppercase tracking-wide text-zinc-600'>
                <span>Size</span>
                <span className='text-center'>Qty</span>
                <span className='text-right'>₱/pc</span>
                <span className='text-right'>Amount</span>
              </div>

              <div className='space-y-1.5'>
                {EMPTIES_RATES[group].map(r => {
                  const qty = empties[group][r.id] || 0
                  const amount = qty * r.price
                  return (
                    <div
                      key={r.id}
                      className='grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] items-center gap-1.5'
                    >
                      <span className='text-[11px] text-zinc-300 truncate'>
                        {r.label}
                      </span>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        value={qty || ''}
                        placeholder='0'
                        onChange={e =>
                          updateEmpties(group, r.id, e.target.value)
                        }
                        className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1 py-1 text-xs text-center focus:outline-none focus:border-amber-500 tabular-nums'
                      />
                      <span className='text-[10px] text-zinc-500 text-right tabular-nums'>
                        ₱{r.price.toFixed(2)}
                      </span>
                      <span className='text-[11px] text-amber-400 font-medium text-right tabular-nums'>
                        {formatMoney(amount)}
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
          )
        })}
      </div>
    </div>
  )

  return (
    <div className='flex flex-col h-full min-h-0 border border-zinc-800 bg-zinc-950/60 rounded-lg overflow-hidden shadow-lg shadow-black/40'>
      {/* HEADER */}
      <div className='shrink-0 flex justify-between items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/70'>
        <div className='flex flex-col gap-1 min-w-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <TbTruck className='text-blue-400 shrink-0' size={18} />

            <input
              type='text'
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setNameInput(truck)
                  setRenameError('')
                  e.currentTarget.blur()
                }
              }}
              disabled={isDeployed}
              title={isDeployed ? 'Return the truck before renaming' : 'Rename'}
              className={`min-w-0 max-w-[16rem] bg-transparent border-0 p-0 font-semibold text-base text-zinc-100 uppercase focus:outline-none focus:text-white transition-colors disabled:cursor-not-allowed ${
                renameError ? 'text-rose-400' : ''
              }`}
              style={{ width: `${Math.max(nameInput.length, 6)}ch` }}
            />

            {isDeployed ? (
              <span className='text-[10px] uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium shrink-0'>
                Out
              </span>
            ) : (
              <span className='text-[10px] uppercase py-0.5 px-2 rounded bg-zinc-800 text-zinc-500 font-medium shrink-0'>
                Idle
              </span>
            )}
          </div>

          <div className='flex items-center gap-2 min-w-0'>
            <input
              type='text'
              value={agentInput}
              onChange={e => setAgentInput(e.target.value)}
              onBlur={commitAgent}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setAgentInput(agent || defaultAgent)
                  e.currentTarget.blur()
                }
              }}
              placeholder={defaultAgent}
              className='bg-transparent border-0 p-0 text-[11px] font-semibold text-zinc-400 uppercase focus:outline-none placeholder-zinc-600 focus:text-zinc-100 transition-colors truncate max-w-[10rem]'
            />
            {renameError && (
              <span className='text-[10px] text-rose-400 truncate'>
                {renameError}
              </span>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3 shrink-0'>
          {isDeployed && (
            <div className='text-right'>
              <div className='text-[9px] uppercase tracking-wide text-zinc-600'>
                Deployed
              </div>
              <div className='text-[11px] text-zinc-400 tabular-nums'>
                {formatDate(activeDeployment.date)}
              </div>
            </div>
          )}

          {onRemove && (
            <button
              onClick={() => onRemove(truck)}
              disabled={isDeployed}
              title={
                isDeployed ? 'Return the truck first' : 'Remove this truck'
              }
              className='p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-500 transition'
            >
              <TbTrash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* TWO-PANE BODY */}
      <div className='flex-1 min-h-0 flex'>
        <div className='flex-1 min-w-0 flex flex-col min-h-0'>
          {isDeployed && (
            <>
              <div className='shrink-0 px-4 pt-3 pb-2 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm'>
                <div
                  className={`${GRID_DEPLOYED} text-[10px] uppercase tracking-wide text-zinc-600`}
                >
                  <span>Product</span>
                  <span className='text-center'>Loaded</span>
                  <span className='text-center'>Left</span>
                  <span className='text-center'>Sold</span>
                  <span className='text-right'>Sold ₱</span>
                  <span className='text-right'>Empties</span>
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto px-4 pb-3'>
                <div className='divide-y divide-zinc-800/50'>
                  {sortedReturnItems.map((item, i) => {
                    const remaining = returns[item.product_name] ?? item.cases
                    const sold = item.cases - remaining
                    const price = Number(item.price_per_case) || 0
                    const emptiesPer = Number(item.empties_per_case) || 0
                    const valueSold = sold * price
                    const emptiesSold = sold * emptiesPer
                    const unit = Number(item.unit) || 0
                    const soldBottles = sold * unit

                    return (
                      <div key={i} className={`${GRID_DEPLOYED} py-2`}>
                        <div className='min-w-0'>
                          <div className='text-sm text-zinc-100 font-medium truncate'>
                            {item.product_name}
                          </div>
                          <div className='text-[10px] text-zinc-500 tabular-nums'>
                            {formatMoney(price)}/case · {formatNumber(unit)}{' '}
                            btls
                            {sold > 0 && ` · ${formatNumber(soldBottles)} sold`}
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

          {!isDeployed && (
            <div className='flex-1 min-h-0 overflow-y-auto'>
              {isEditing && (
                <div className='px-4 py-3'>
                  <div className='flex items-center justify-between mb-3'>
                    <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
                      Loadout — Editing
                    </div>
                    <span className='text-[10px] text-zinc-600'>
                      {draft.length} item{draft.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div
                    className={`${GRID_EDIT} pb-2 border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-600`}
                  >
                    <span>Product</span>
                    <span className='text-center'>Cases</span>
                    <span />
                  </div>

                  <div className='space-y-2 pt-2'>
                    {draft.map((item, index) => {
                      const available = getAvailable(item.product_name)
                      const exceeds =
                        item.product_name && Number(item.cases) > available
                      const taken = usedElsewhere(index)

                      return (
                        <div key={index}>
                          <div className={GRID_EDIT}>
                            <select
                              value={item.product_name}
                              onChange={e =>
                                updateDraft(
                                  index,
                                  'product_name',
                                  e.target.value
                                )
                              }
                              className={`${fieldClass} min-w-0`}
                            >
                              <option value=''>— Product —</option>
                              {sortedStocks
                                .filter(
                                  s =>
                                    !taken.has(s.product_name) ||
                                    s.product_name === item.product_name
                                )
                                .map(s => (
                                  <option key={s.id} value={s.product_name}>
                                    {s.product_name} ({s.quantity})
                                  </option>
                                ))}
                            </select>

                            <input
                              type='number'
                              min='1'
                              step='1'
                              value={item.cases}
                              onChange={e =>
                                updateDraft(index, 'cases', e.target.value)
                              }
                              className={`${fieldClass} text-center`}
                            />

                            {draft.length > 1 ? (
                              <button
                                type='button'
                                onClick={() => removeDraftItem(index)}
                                className='text-zinc-500 hover:text-rose-400 transition justify-self-center'
                                title='Remove'
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
              )}

              {!isEditing && hasLoadout && (
                <div className='px-4 py-3'>
                  <div
                    className={`${GRID_IDLE} pb-2 border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-600`}
                  >
                    <span>Product</span>
                    <span className='text-right'>Cases</span>
                    <span className='text-right'>₱/case</span>
                    <span className='text-right'>Line ₱</span>
                    <span className='text-right'>Empties</span>
                  </div>

                  <div className='divide-y divide-zinc-800/50'>
                    {loadout.map((item, i) => {
                      const stock = stocks.find(
                        st => st.product_name === item.product_name
                      )
                      const price = stock
                        ? Number(stock.price_per_case) || 0
                        : 0
                      const emptiesPer = stock
                        ? Number(stock.empties_per_case) || 0
                        : 0
                      const cases = Number(item.cases) || 0
                      return (
                        <div key={i} className={`${GRID_IDLE} py-2`}>
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

                  <div className='flex justify-end pt-3'>
                    <button
                      onClick={startEdit}
                      className='flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition'
                    >
                      <TbPencil size={12} />
                      Edit Loadout
                    </button>
                  </div>
                </div>
              )}

              {!isEditing && !hasLoadout && (
                <div className='h-full flex items-center justify-center p-8'>
                  <div className='text-center space-y-2'>
                    {stocks.length === 0 ? (
                      <div className='text-zinc-600 text-sm'>
                        Add stocks first.
                      </div>
                    ) : (
                      <>
                        <div className='text-zinc-500 text-sm'>
                          No loadout set.
                        </div>
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
          )}
        </div>

        {isDeployed && renderEmptiesColumn()}
      </div>

      {/* FIXED FOOTER — summary */}
      <div className='shrink-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm p-3'>
        {!isDeployed && hasLoadout && !isEditing && (
          <div className='space-y-2.5'>
            <div className='rounded-md border border-zinc-800 bg-zinc-900/40 overflow-hidden'>
              <div className='px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase tracking-wider font-semibold text-blue-400'>
                Loadout Summary
              </div>
              <div className='grid grid-cols-3 divide-x divide-zinc-800/60'>
                <div className='px-3 py-2 flex flex-col'>
                  <span className='text-[9px] uppercase tracking-wider text-zinc-500'>
                    Price
                  </span>
                  <span className='text-base font-semibold text-blue-400 tabular-nums leading-tight'>
                    {formatMoney(loadoutValue)}
                  </span>
                </div>
                <div className='px-3 py-2 flex flex-col'>
                  <span className='text-[9px] uppercase tracking-wider text-zinc-500'>
                    Cases
                  </span>
                  <span className='text-base font-semibold text-blue-400 tabular-nums leading-tight'>
                    {formatNumber(loadoutCases)}
                  </span>
                </div>
                <div className='px-3 py-2 flex flex-col'>
                  <span className='text-[9px] uppercase tracking-wider text-zinc-500'>
                    Empties
                  </span>
                  <span className='text-base font-semibold text-amber-400 tabular-nums leading-tight'>
                    {formatMoney(loadoutEmptiesValue)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type='button'
              onClick={handleDeploy}
              disabled={!hasLoadout}
              className='w-full bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30'
            >
              Deploy Truck
            </button>
          </div>
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
            <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
              <SummarySection
                title='Loadout'
                accent='text-blue-400'
                rows={[
                  {
                    label: 'Price',
                    value: formatMoney(loadoutValue),
                    color: 'text-blue-400',
                    emphasize: true
                  },
                  {
                    label: 'Cases',
                    value: formatNumber(loadoutCases),
                    color: 'text-blue-300'
                  },
                  {
                    label: 'Empties Value',
                    value: formatMoney(loadoutEmptiesValue),
                    color: 'text-amber-400'
                  }
                ]}
              />

              <SummarySection
                title='Sold'
                accent='text-emerald-400'
                rows={[
                  {
                    label: 'Price',
                    value: formatMoney(soldTotals.value),
                    color: 'text-emerald-400',
                    emphasize: true
                  },
                  {
                    label: 'Cases Sold',
                    value: formatNumber(totalSold),
                    color: 'text-emerald-300'
                  },
                  {
                    label: 'Cases Returned',
                    value: formatNumber(totalReturned),
                    color: 'text-amber-400'
                  }
                ]}
              />

              <SummarySection
                title='Empties'
                accent='text-amber-400'
                rows={[
                  {
                    label: 'Expected',
                    value: formatMoney(soldTotals.empties),
                    color: 'text-amber-400',
                    emphasize: true
                  },
                  {
                    label: 'Received',
                    value: formatMoney(returnedEmptiesValue),
                    color:
                      Math.abs(emptiesDiff) < 0.01
                        ? 'text-emerald-400'
                        : emptiesDiff > 0
                        ? 'text-sky-400'
                        : 'text-rose-400'
                  },
                  {
                    label: 'Difference',
                    value: `${emptiesDiff > 0 ? '+' : ''}${formatMoney(
                      emptiesDiff
                    )}`,
                    color:
                      Math.abs(emptiesDiff) < 0.01
                        ? 'text-zinc-400'
                        : emptiesDiff > 0
                        ? 'text-sky-400'
                        : 'text-rose-400'
                  }
                ]}
              />
            </div>

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
