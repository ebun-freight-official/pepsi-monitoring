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
  DEFAULT_AGENTS,
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

function Group ({ title, primary, primaryColor = 'text-zinc-100', subs = [] }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-2.5 py-2 min-w-0 flex flex-col gap-1 flex-1'>
      <span className='text-[9px] uppercase tracking-wide text-zinc-500 truncate'>
        {title}
      </span>

      <span
        className={`text-sm font-semibold tabular-nums truncate ${primaryColor}`}
      >
        {primary}
      </span>

      {subs.length > 0 && (
        <div className='space-y-0.5 pt-1 border-t border-zinc-800/60'>
          {subs.map((s, i) => (
            <div
              key={i}
              className='flex justify-between items-baseline gap-2 text-[10px]'
            >
              <span className='text-zinc-600 uppercase tracking-wide truncate'>
                {s.label}
              </span>
              <span
                className={`tabular-nums shrink-0 font-medium ${
                  s.color || 'text-zinc-400'
                }`}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TruckCard ({
  truck,
  activeDeployment,
  loadout = [],
  agent = '',
  stocks,
  onDeploy,
  onReturn,
  onUpdateLoadout,
  onUpdateAgent
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0
  const defaultAgent = DEFAULT_AGENTS[truck] || ''

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [returns, setReturns] = useState({})
  const [empties, setEmpties] = useState(EMPTY_EMPTIES)

  const [agentInput, setAgentInput] = useState(agent || defaultAgent)
  useEffect(() => {
    setAgentInput(agent || defaultAgent)
  }, [agent, defaultAgent])

  const commitAgent = () => {
    const cleaned = agentInput.trim().toUpperCase() || defaultAgent
    setAgentInput(cleaned)
    if (cleaned !== agent) onUpdateAgent(cleaned)
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

  const canDeploy = loadout.length > 0

  const handleDeploy = () => {
    if (!canDeploy) return
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

  // ---- Derived: case counts ----
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

  // ---- Derived: money ----
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

  const groupSubtotal = group =>
    EMPTIES_RATES[group].reduce((sum, r) => {
      const qty = empties[group][r.id] || 0
      return sum + qty * r.price
    }, 0)

  const returnedEmptiesValue =
    groupSubtotal('fullCase') +
    groupSubtotal('caseOnly') +
    groupSubtotal('bottlesOnly')

  const allUsedNames = new Set(draft.map(i => i.product_name).filter(Boolean))
  const allProductsAdded =
    stocks.length > 0 && allUsedNames.size >= stocks.length

  const renderEmptiesGroup = (title, group) => (
    <div className='bg-zinc-900/40 border border-zinc-800 rounded-md p-2'>
      <div className='text-[10px] uppercase tracking-wide text-zinc-500 mb-1.5'>
        {title}
      </div>

      <div className='space-y-1.5'>
        {EMPTIES_RATES[group].map(r => {
          const qty = empties[group][r.id] || 0
          const amount = qty * r.price
          return (
            <div
              key={r.id}
              className='grid grid-cols-[1fr_3.5rem_4.25rem_4.5rem] items-center gap-1.5'
            >
              <span className='text-xs text-zinc-300 truncate'>{r.label}</span>
              <input
                type='number'
                min='0'
                step='1'
                value={qty || ''}
                placeholder='0'
                onChange={e => updateEmpties(group, r.id, e.target.value)}
                className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1.5 py-1 text-xs text-center focus:outline-none focus:border-amber-500 tabular-nums'
              />
              <span className='text-[10px] text-zinc-500 text-right tabular-nums'>
                ₱{r.price.toFixed(2)}
              </span>
              <span className='text-xs text-amber-400 font-medium text-right tabular-nums'>
                {formatMoney(amount)}
              </span>
            </div>
          )
        })}
      </div>

      <div className='flex justify-between items-center mt-1.5 pt-1.5 border-t border-zinc-800/60'>
        <span className='text-[10px] uppercase tracking-wide text-zinc-600'>
          Subtotal
        </span>
        <span className='text-xs text-amber-400 font-semibold tabular-nums'>
          {formatMoney(groupSubtotal(group))}
        </span>
      </div>
    </div>
  )

  return (
    <div className='border border-zinc-800 bg-zinc-950/60 rounded-lg overflow-hidden flex flex-col h-full min-h-0 shadow-lg shadow-black/40'>
      {/* HEADER */}
      <div className='px-3 py-2 border-b border-zinc-800 bg-zinc-900/70 shrink-0'>
        <div className='flex justify-between items-center gap-2'>
          <div className='flex items-center gap-2 min-w-0'>
            <TbTruck className='text-blue-400 shrink-0' size={16} />
            <span className='font-medium text-sm truncate'>{truck}</span>
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
            className='bg-transparent border-0 p-0 w-20 shrink-0 text-[11px] font-semibold text-zinc-300 text-right uppercase focus:outline-none placeholder-zinc-600 focus:text-zinc-100 transition-colors'
          />
        </div>

        {isDeployed && (
          <div className='text-[10px] text-zinc-500 mt-1'>
            {formatDate(activeDeployment.date)}
          </div>
        )}
      </div>

      {/* SCROLLABLE BODY */}
      <div className='flex-1 min-h-0 overflow-y-auto'>
        {/* LOADOUT */}
        <section className='p-3 border-b border-zinc-800'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
              Loadout
            </div>

            {!isDeployed && !isEditing && hasLoadout && (
              <button
                onClick={startEdit}
                className='text-[10px] uppercase tracking-wide text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition'
              >
                <TbPencil size={11} />
                Edit
              </button>
            )}

            {!isDeployed && isEditing && (
              <span className='text-[10px] uppercase tracking-wide text-blue-400 font-medium'>
                Editing
              </span>
            )}
          </div>

          {isDeployed && (
            <div className='grid grid-cols-2 gap-1.5'>
              {sortedReturnItems.map((item, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center text-xs bg-zinc-900/60 rounded-md px-2 py-1.5 min-w-0'
                >
                  <span className='text-zinc-200 truncate'>
                    {item.product_name}
                  </span>
                  <span className='text-blue-400 font-medium shrink-0 ml-2 tabular-nums'>
                    {formatNumber(item.cases)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isDeployed && isEditing && (
            <div className='space-y-2'>
              {draft.map((item, index) => {
                const available = getAvailable(item.product_name)
                const exceeds =
                  item.product_name && Number(item.cases) > available
                const taken = usedElsewhere(index)

                return (
                  <div key={index}>
                    <div className='flex gap-1.5 items-center'>
                      <select
                        value={item.product_name}
                        onChange={e =>
                          updateDraft(index, 'product_name', e.target.value)
                        }
                        className={`${fieldClass} flex-1 min-w-0`}
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
                        className={`${fieldClass} w-16 shrink-0 text-center`}
                      />

                      {draft.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeDraftItem(index)}
                          className='text-zinc-500 hover:text-rose-400 transition p-1 shrink-0'
                        >
                          <TbTrash size={14} />
                        </button>
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
                className='w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400 text-zinc-400 text-[11px] py-1.5 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-700 disabled:hover:text-zinc-400'
              >
                <TbPlus size={12} />
                {allProductsAdded ? 'All products added' : 'Add product'}
              </button>

              <div className='flex gap-2 pt-1'>
                <button
                  type='button'
                  onClick={cancelEdit}
                  className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2 rounded-md transition flex items-center justify-center gap-1'
                >
                  <TbX size={12} />
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={saveDraft}
                  disabled={!draftValid}
                  className='flex-1 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-md shadow-blue-600/30'
                >
                  <TbCheck size={12} />
                  Save
                </button>
              </div>
            </div>
          )}

          {!isDeployed && !isEditing && hasLoadout && (
            <div className='grid grid-cols-2 gap-1.5'>
              {loadout.map((item, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center text-xs bg-zinc-900/60 rounded-md px-2 py-1.5 min-w-0'
                >
                  <span className='text-zinc-200 truncate'>
                    {item.product_name}
                  </span>
                  <span className='text-blue-400 font-medium shrink-0 ml-2 tabular-nums'>
                    {formatNumber(item.cases)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isDeployed && !isEditing && !hasLoadout && (
            <div className='py-6 text-center text-xs space-y-2'>
              {stocks.length === 0 ? (
                <div className='text-zinc-600'>Add stocks first.</div>
              ) : (
                <>
                  <div className='text-zinc-600'>No loadout set.</div>
                  <button
                    type='button'
                    onClick={startEdit}
                    className='text-blue-400 hover:text-blue-300 text-[11px] font-medium transition'
                  >
                    + Set Loadout
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* RETURN */}
        {isDeployed && (
          <section className='border-b border-zinc-800'>
            <div className='flex justify-between items-center px-3 pt-3 pb-2'>
              <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
                Return
              </div>
              <span className='text-[10px] uppercase tracking-wide text-zinc-600'>
                Realtime
              </span>
            </div>

            <div className='grid grid-cols-[1fr_3rem_2.5rem_4.5rem_4.5rem] gap-1.5 px-3 pb-1 text-[10px] uppercase tracking-wide text-zinc-600 border-b border-zinc-800/60'>
              <span>Product</span>
              <span className='text-center'>Left</span>
              <span className='text-center'>Sold</span>
              <span className='text-right'>Price</span>
              <span className='text-right'>Empties</span>
            </div>

            <div className='px-3 divide-y divide-zinc-800/50'>
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
                  <div
                    key={i}
                    className='grid grid-cols-[1fr_3rem_2.5rem_4.5rem_4.5rem] gap-1.5 items-center py-1.5'
                  >
                    <div className='min-w-0'>
                      <div className='text-xs text-zinc-200 font-medium truncate'>
                        {item.product_name}
                      </div>
                      <div className='text-[10px] text-zinc-500 tabular-nums'>
                        {formatNumber(item.cases)} loaded ·{' '}
                        {formatNumber(soldBottles)} btls
                      </div>
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
                      className='w-full bg-zinc-950 border border-zinc-700 rounded-md px-1 py-1 text-xs text-center focus:outline-none focus:border-emerald-500 tabular-nums'
                    />

                    <div className='text-xs text-zinc-300 font-medium text-center tabular-nums'>
                      {sold}
                    </div>

                    <div className='text-right leading-tight'>
                      <div className='text-xs text-emerald-400 font-medium tabular-nums'>
                        {formatMoney(valueSold)}
                      </div>
                      {price > 0 && (
                        <div className='text-[10px] text-zinc-500 tabular-nums'>
                          {formatMoney(price)}/c
                        </div>
                      )}
                    </div>

                    <div className='text-right leading-tight'>
                      <div className='text-xs text-amber-400 font-medium tabular-nums'>
                        {formatMoney(emptiesSold)}
                      </div>
                      {emptiesPer > 0 && (
                        <div className='text-[10px] text-zinc-500 tabular-nums'>
                          {formatMoney(emptiesPer)}/c
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* EMPTIES RECEIVED */}
        {isDeployed && (
          <section className='p-3'>
            <div className='flex justify-between items-center mb-2'>
              <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
                Empties Received
              </div>
              <span className='text-[10px] text-zinc-600'>Physical count</span>
            </div>

            <div className='space-y-2'>
              {renderEmptiesGroup('Full Case', 'fullCase')}
              {renderEmptiesGroup('Case Only', 'caseOnly')}
              {renderEmptiesGroup('Bottles Only', 'bottlesOnly')}
            </div>
          </section>
        )}
      </div>

      {/* ============ FIXED FOOTER ============ */}
      <div className='shrink-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm'>
        {/* IDLE + has loadout */}
        {!isDeployed && hasLoadout && !isEditing && (
          <div className='p-3 space-y-2'>
            <div className='flex gap-2'>
              <Group
                title='Loadout'
                primary={formatMoney(loadoutValue)}
                primaryColor='text-blue-400'
                subs={[
                  {
                    label: 'Cases',
                    value: formatNumber(loadoutCases),
                    color: 'text-blue-400'
                  }
                ]}
              />
            </div>

            <button
              type='button'
              onClick={handleDeploy}
              disabled={!canDeploy}
              className='w-full bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30'
            >
              Deploy Truck
            </button>
          </div>
        )}

        {/* DEPLOYED */}
        {isDeployed && (
          <div className='p-3 space-y-2'>
            <div className='grid grid-cols-3 gap-2'>
              <Group
                title='Loadout'
                primary={formatMoney(loadoutValue)}
                primaryColor='text-blue-400'
                subs={[
                  {
                    label: 'Cases',
                    value: formatNumber(loadoutCases),
                    color: 'text-blue-400'
                  }
                ]}
              />

              <Group
                title='Sold'
                primary={formatMoney(soldTotals.value)}
                primaryColor='text-emerald-400'
                subs={[
                  {
                    label: 'Sold',
                    value: formatNumber(totalSold),
                    color: 'text-emerald-400'
                  },
                  {
                    label: 'Returned',
                    value: formatNumber(totalReturned),
                    color: 'text-amber-400'
                  }
                ]}
              />

              <Group
                title='Empties'
                primary={formatMoney(soldTotals.empties)}
                primaryColor='text-amber-400'
                subs={[
                  {
                    label: 'Returned',
                    value: formatMoney(returnedEmptiesValue),
                    color: 'text-amber-400/80'
                  }
                ]}
              />
            </div>

            <button
              type='button'
              onClick={handleReturn}
              className='w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2 rounded-md transition shadow-md shadow-emerald-600/20'
            >
              Confirm Return
            </button>
          </div>
        )}

        {/* IDLE + no loadout */}
        {!isDeployed && !hasLoadout && (
          <div className='p-3 text-center text-[11px] text-zinc-600'>
            {stocks.length === 0
              ? 'Add stocks from My Stocks first.'
              : 'No loadout set.'}
          </div>
        )}
      </div>
    </div>
  )
}
