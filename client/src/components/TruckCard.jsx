import { useState, useEffect } from 'react'
import {
  TbPlus,
  TbTrash,
  TbTruck,
  TbPencil,
  TbCheck,
  TbX
} from 'react-icons/tb'
import { createEmptyDeployItem } from '../utils/inventory'

const fieldClass =
  'bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100 placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500'

export default function TruckCard ({
  truck,
  activeDeployment,
  loadout = [],
  stocks,
  onDeploy,
  onReturn,
  onUpdateLoadout
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [returns, setReturns] = useState({})

  useEffect(() => {
    if (isDeployed) {
      const init = {}
      activeDeployment.items.forEach(item => {
        init[item.product_name] = item.cases
      })
      setReturns(init)
      setIsEditing(false)
      setDraft([])
    }
  }, [activeDeployment?.id, isDeployed])

  // Available = physical warehouse + whatever this truck's loadout currently holds.
  const getAvailable = productName => {
    const stock = stocks.find(s => s.product_name === productName)
    const baseQty = stock ? Number(stock.quantity) || 0 : 0
    const reservedQty = loadout
      .filter(i => i.product_name === productName)
      .reduce((s, i) => s + (Number(i.cases) || 0), 0)
    return baseQty + reservedQty
  }

  // ---------- Loadout editing ----------
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

  // ---------- Deploy ----------
  // Loadout was already validated and reserved when saved — just needs to exist.
  const canDeploy = loadout.length > 0

  const handleDeploy = () => {
    if (!canDeploy) return
    onDeploy(truck, loadout)
  }

  // ---------- Return ----------
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

  return (
    <div className='border border-slate-800 bg-slate-950/40 rounded-lg overflow-hidden flex flex-col'>
      <div className='flex justify-between items-center px-3 py-2 border-b border-slate-800 bg-slate-900/60'>
        <div className='flex items-center gap-2'>
          <TbTruck className='text-indigo-400' size={16} />
          <span className='font-medium text-sm'>{truck}</span>
          {isDeployed ? (
            <span className='text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-medium'>
              Out
            </span>
          ) : (
            <span className='text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-medium'>
              Idle
            </span>
          )}
        </div>
        {isDeployed && (
          <span className='text-[10px] text-slate-500'>
            {activeDeployment.date}
          </span>
        )}
      </div>

      <div className='flex-1 flex flex-col divide-y divide-slate-800'>
        {/* ============ LOADOUT ============ */}
        <section className='p-3'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-[11px] uppercase tracking-wide text-slate-500'>
              Loadout
            </div>

            {!isDeployed && !isEditing && hasLoadout && (
              <button
                onClick={startEdit}
                className='text-[10px] uppercase tracking-wide text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition'
              >
                <TbPencil size={11} />
                Edit
              </button>
            )}

            {!isDeployed && isEditing && (
              <span className='text-[10px] uppercase tracking-wide text-indigo-400 font-medium'>
                Editing
              </span>
            )}
          </div>

          {isDeployed && (
            <div className='space-y-1'>
              {activeDeployment.items.map((item, i) => (
                <div
                  key={i}
                  className='flex justify-between items-center text-xs bg-slate-900/50 rounded-md px-2 py-1.5'
                >
                  <span className='text-slate-200 truncate'>
                    {item.product_name}
                  </span>
                  <span className='text-indigo-400 font-medium shrink-0 ml-2'>
                    {item.cases}
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
                        {stocks.map(s => (
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
                          className='text-slate-500 hover:text-rose-400 transition p-1 shrink-0'
                          title='Remove'
                        >
                          <TbTrash size={14} />
                        </button>
                      )}
                    </div>

                    {exceeds && (
                      <div className='text-[10px] text-rose-400 mt-1'>
                        Only {available} available
                      </div>
                    )}
                  </div>
                )
              })}

              <button
                type='button'
                onClick={addDraftItem}
                className='w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 text-[11px] py-1.5 rounded-md transition'
              >
                <TbPlus size={12} />
                Add product
              </button>

              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={cancelEdit}
                  className='flex-1 border border-slate-700 hover:bg-slate-800 text-xs font-medium py-2 rounded-md transition flex items-center justify-center gap-1'
                >
                  <TbX size={12} />
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={saveDraft}
                  disabled={!draftValid}
                  className='flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1'
                >
                  <TbCheck size={12} />
                  Save Loadout
                </button>
              </div>
            </div>
          )}

          {!isDeployed && !isEditing && hasLoadout && (
            <div className='space-y-2'>
              <div className='space-y-1'>
                {loadout.map((item, i) => (
                  <div
                    key={i}
                    className='flex justify-between items-center text-xs bg-slate-900/50 rounded-md px-2 py-1.5'
                  >
                    <span className='text-slate-200 truncate'>
                      {item.product_name}
                    </span>
                    <span className='text-indigo-400 font-medium shrink-0 ml-2'>
                      {item.cases}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type='button'
                onClick={handleDeploy}
                disabled={!canDeploy}
                className='w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-medium py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed'
              >
                Deploy Truck
              </button>
            </div>
          )}

          {!isDeployed && !isEditing && !hasLoadout && (
            <div className='px-3 py-6 text-center text-xs space-y-2'>
              {stocks.length === 0 ? (
                <div className='text-slate-600'>Add stocks first.</div>
              ) : (
                <>
                  <div className='text-slate-600'>No loadout set.</div>
                  <button
                    type='button'
                    onClick={startEdit}
                    className='text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition'
                  >
                    + Set Loadout
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* ============ RETURN ============ */}
        <section
          className={`p-3 transition-opacity ${
            isDeployed ? '' : 'opacity-40 pointer-events-none select-none'
          }`}
        >
          <div className='flex justify-between items-center mb-2'>
            <div className='text-[11px] uppercase tracking-wide text-slate-500'>
              Return
            </div>
            {!isDeployed && (
              <span className='text-[10px] uppercase tracking-wide text-slate-600'>
                Locked
              </span>
            )}
          </div>

          {!isDeployed ? (
            <div className='px-3 py-8 text-center text-slate-600 text-xs'>
              Deploy first to unlock.
            </div>
          ) : (
            <div className='space-y-2'>
              {activeDeployment.items.map((item, i) => {
                const remaining = returns[item.product_name] ?? item.cases
                const sold = item.cases - remaining
                return (
                  <div key={i} className='bg-slate-900/50 rounded-md p-2'>
                    <div className='flex justify-between items-center mb-1.5'>
                      <span className='text-xs text-slate-200 font-medium truncate'>
                        {item.product_name}
                      </span>
                      <span className='text-[10px] text-slate-500 shrink-0 ml-2'>
                        {item.cases} loaded
                      </span>
                    </div>

                    <div className='grid grid-cols-3 gap-1.5'>
                      <div>
                        <label className='block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5'>
                          Left
                        </label>
                        <input
                          type='number'
                          min='0'
                          max={item.cases}
                          step='1'
                          value={remaining}
                          onChange={e =>
                            updateReturn(item.product_name, e.target.value)
                          }
                          className='w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-emerald-500'
                        />
                      </div>
                      <div>
                        <label className='block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5'>
                          Sold
                        </label>
                        <div className='px-2 py-1 text-xs rounded-md bg-emerald-500/10 text-emerald-400 font-medium text-center'>
                          {sold}
                        </div>
                      </div>
                      <div>
                        <label className='block text-[10px] uppercase tracking-wide text-slate-500 mb-0.5'>
                          Btls
                        </label>
                        <div className='px-2 py-1 text-xs rounded-md bg-slate-950 text-sky-400 text-center'>
                          {sold * (Number(item.unit) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className='flex justify-between text-[10px] text-slate-500 pt-1'>
                <span>
                  Out:{' '}
                  <span className='text-slate-300 font-medium'>
                    {totalDeployed}
                  </span>
                </span>
                <span>
                  Back:{' '}
                  <span className='text-amber-400 font-medium'>
                    {totalReturned}
                  </span>
                </span>
                <span>
                  Sold:{' '}
                  <span className='text-emerald-400 font-medium'>
                    {totalSold}
                  </span>
                </span>
              </div>

              <button
                type='button'
                onClick={handleReturn}
                className='w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2 rounded-md transition'
              >
                Confirm Return
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
