import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router'
import { TbPlus, TbCheck, TbX } from 'react-icons/tb'
import TruckOverviewCard from '../components/TruckOverviewCard'
import FocusedTruckView from '../components/FocusedTruckView'
import DeploymentHistoryCard from '../components/DeploymentHistoryCard'
import {
  calcDeploymentStats,
  formatMoney,
  formatNumber
} from '../utils/inventory'

function HeaderStat ({ label, value, color }) {
  return (
    <div className='text-right hidden sm:block'>
      <div className='text-[10px] uppercase text-zinc-500'>{label}</div>
      <div className={`text-sm font-medium tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

function CombinedStat ({ label, value, color }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 min-w-0'>
      <div className='text-[9px] uppercase tracking-wider text-zinc-500 truncate'>
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular-nums truncate leading-tight ${color}`}
      >
        {value}
      </div>
    </div>
  )
}

export default function Deployments () {
  const {
    stocks,
    deployments,
    trucks,
    truckLoadouts,
    truckAgents,
    addTruck,
    removeTruck,
    renameTruck,
    deployTruck,
    returnTruck,
    updateTruckLoadout,
    updateTruckAgent
  } = useOutletContext()

  const [viewMode, setViewMode] = useState('all')
  const [isAdding, setIsAdding] = useState(false)
  const [newTruckName, setNewTruckName] = useState('')
  const [addError, setAddError] = useState('')

  const stats = calcDeploymentStats(deployments)
  const history = deployments.filter(d => d.status === 'returned')

  const activeByTruck = {}
  deployments
    .filter(d => d.status === 'out')
    .forEach(d => {
      activeByTruck[d.truck] = d
    })

  if (viewMode !== 'all' && !trucks.includes(viewMode)) {
    setViewMode('all')
  }

  const combinedStats = useMemo(() => {
    let loadoutValue = 0
    let loadoutCases = 0
    let loadoutEmpties = 0
    let trucksOut = 0

    trucks.forEach(truck => {
      const active = activeByTruck[truck]
      if (active) {
        trucksOut++
        active.items.forEach(item => {
          const cases = Number(item.cases) || 0
          loadoutCases += cases
          loadoutValue += cases * (Number(item.price_per_case) || 0)
          loadoutEmpties += cases * (Number(item.empties_per_case) || 0)
        })
      } else {
        const lo = truckLoadouts[truck] || []
        lo.forEach(item => {
          const cases = Number(item.cases) || 0
          const stock = stocks.find(s => s.product_name === item.product_name)
          loadoutCases += cases
          loadoutValue +=
            cases * (stock ? Number(stock.price_per_case) || 0 : 0)
          loadoutEmpties +=
            cases * (stock ? Number(stock.empties_per_case) || 0 : 0)
        })
      }
    })

    return { loadoutValue, loadoutCases, loadoutEmpties, trucksOut }
  }, [trucks, activeByTruck, truckLoadouts, stocks])

  const handleRename = (oldName, newName) => {
    const ok = renameTruck(oldName, newName)
    if (!ok) return false
    // Keep the focus on the renamed truck
    if (viewMode === oldName) setViewMode(newName)
    return true
  }

  const truckProps = truck => ({
    truck,
    activeDeployment: activeByTruck[truck] || null,
    loadout: truckLoadouts[truck] || [],
    agent: truckAgents[truck],
    stocks,
    onDeploy: deployTruck,
    onReturn: returnTruck,
    onUpdateLoadout: updateTruckLoadout,
    onUpdateAgent: name => updateTruckAgent(truck, name),
    onRename: newName => handleRename(truck, newName),
    onRemove: handleRemoveTruck
  })

  const handleOpenAdd = () => {
    setIsAdding(true)
    setNewTruckName('')
    setAddError('')
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewTruckName('')
    setAddError('')
  }

  const handleAddTruck = e => {
    e.preventDefault()
    setAddError('')
    const ok = addTruck(newTruckName)
    if (!ok) {
      setAddError('Name is empty or already taken.')
      return
    }
    handleCancelAdd()
  }

  const handleRemoveTruck = truck => {
    const isOut = !!activeByTruck[truck]
    if (isOut) {
      alert('Return the truck first before removing it.')
      return
    }
    if (trucks.length <= 1) {
      alert('You must keep at least one truck.')
      return
    }
    if (!confirm(`Remove "${truck}"? This clears its loadout and agent.`))
      return
    const ok = removeTruck(truck)
    if (ok && viewMode === truck) setViewMode('all')
  }

  return (
    <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-2 flex flex-col overflow-hidden shadow-lg shadow-black/40'>
      <div className='flex justify-between items-center pb-2 border-b border-zinc-800 shrink-0'>
        <div className='uppercase font-medium text-lg'>Deployments</div>

        <div className='flex items-center gap-5'>
          <HeaderStat
            label='Trucks Out'
            value={formatNumber(stats.trucksOut)}
            color='text-blue-400'
          />
          <HeaderStat
            label='Cases Sold'
            value={formatNumber(stats.casesSold)}
            color='text-zinc-300'
          />
          <HeaderStat
            label='Price'
            value={formatMoney(stats.valueSold)}
            color='text-emerald-400'
          />
          <HeaderStat
            label='Empties'
            value={formatMoney(stats.emptiesSold)}
            color='text-amber-400'
          />
        </div>
      </div>

      <div className='flex-1 flex gap-3 mt-2 min-h-0'>
        <div className='flex-[3] min-w-0 flex flex-col min-h-0'>
          {/* View tabs */}
          <div className='flex items-center gap-2 pb-2 shrink-0 border-b border-zinc-800/60'>
            <div className='flex items-center gap-1 flex-wrap'>
              <button
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition tabular-nums ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                All
              </button>

              {trucks.map(truck => {
                const isActive = viewMode === truck
                const isOut = !!activeByTruck[truck]
                return (
                  <button
                    key={truck}
                    onClick={() => setViewMode(truck)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    {truck}
                    {isOut && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-white' : 'bg-blue-400'
                        }`}
                      />
                    )}
                  </button>
                )
              })}

              {isAdding ? (
                <form
                  onSubmit={handleAddTruck}
                  className='flex items-center gap-1'
                >
                  <input
                    autoFocus
                    type='text'
                    value={newTruckName}
                    onChange={e => setNewTruckName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') handleCancelAdd()
                    }}
                    placeholder='Truck name'
                    className={`w-28 bg-zinc-900 border rounded-md px-2 py-1 text-[11px] text-zinc-100 placeholder-zinc-600 focus:outline-none transition ${
                      addError
                        ? 'border-rose-700 focus:border-rose-500'
                        : 'border-zinc-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type='submit'
                    className='p-1 text-emerald-400 hover:text-emerald-300 transition'
                    title='Add'
                  >
                    <TbCheck size={14} />
                  </button>
                  <button
                    type='button'
                    onClick={handleCancelAdd}
                    className='p-1 text-zinc-500 hover:text-zinc-300 transition'
                    title='Cancel'
                  >
                    <TbX size={14} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={handleOpenAdd}
                  className='flex items-center justify-center w-7 h-7 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-blue-400 transition'
                  title='Add truck'
                >
                  <TbPlus size={14} />
                </button>
              )}
            </div>

            <span className='text-[10px] text-zinc-600 ml-auto tabular-nums'>
              {viewMode === 'all'
                ? `${trucks.length} truck${trucks.length === 1 ? '' : 's'}`
                : 'Single view'}
            </span>
          </div>

          {addError && (
            <div className='text-[10px] text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-2 py-1 mt-2 shrink-0'>
              {addError}
            </div>
          )}

          {/* Body */}
          <div className='flex-1 min-h-0 flex flex-col pt-2'>
            {viewMode === 'all' ? (
              <>
                <div className='shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 pb-3 mb-2 border-b border-zinc-800/60'>
                  <CombinedStat
                    label='Trucks Out'
                    value={`${combinedStats.trucksOut} / ${trucks.length}`}
                    color='text-blue-400'
                  />
                  <CombinedStat
                    label='Loadout Value'
                    value={formatMoney(combinedStats.loadoutValue)}
                    color='text-blue-400'
                  />
                  <CombinedStat
                    label='Loadout Cases'
                    value={formatNumber(combinedStats.loadoutCases)}
                    color='text-blue-400'
                  />
                  <CombinedStat
                    label='Loadout Empties'
                    value={formatMoney(combinedStats.loadoutEmpties)}
                    color='text-amber-400'
                  />
                </div>

                <div className='flex-1 min-h-0 overflow-auto'>
                  <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-3 min-h-0'>
                    {trucks.map(truck => (
                      <TruckOverviewCard
                        key={truck}
                        truck={truck}
                        activeDeployment={activeByTruck[truck] || null}
                        loadout={truckLoadouts[truck] || []}
                        agent={truckAgents[truck]}
                        stocks={stocks}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className='flex-1 min-h-0'>
                <FocusedTruckView {...truckProps(viewMode)} />
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className='w-72 shrink-0 flex flex-col min-h-0 border-l border-zinc-800 pl-3'>
          <div className='flex items-center justify-between mb-2 shrink-0'>
            <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
              History
            </div>
            {history.length > 0 && (
              <span className='text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded'>
                {history.length}
              </span>
            )}
          </div>

          <div className='flex-1 overflow-auto min-h-0'>
            {history.length === 0 ? (
              <div className='px-3 py-12 text-center text-zinc-600 text-sm'>
                No completed deployments yet.
              </div>
            ) : (
              <div className='space-y-2'>
                {history.map(d => (
                  <DeploymentHistoryCard key={d.id} deployment={d} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
