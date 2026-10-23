import { useState, useMemo, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router'
import { TbUsers, TbHistory, TbArrowLeft } from 'react-icons/tb'
import TruckOverviewCard from '../components/TruckOverviewCard'
import FocusedHistoryView from '../components/FocusedHistoryView'
import HistoryTable from '../components/HistoryTable'
import HistorySummary from '../components/HistorySummary'
import EditLoadoutModal from '../components/EditLoadoutModal'
import DeployConfirmModal from '../components/DeployConfirmModal'
import ReloadTruckModal from '../components/ReloadTruckModal'
import ReturnTruckModal from '../components/ReturnTruckModal'
import { printLoadoutSheet } from '../utils/printLoadout'
import { useAuth } from '../context/AuthContext'
import { formatMoney, formatNumber } from '../utils/inventory'
import { api } from '../lib/api'

function CombinedStat ({ label, value, color }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-900/40 px-2 sm:px-3 py-1.5 sm:py-2 min-w-0'>
      <div className='text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 truncate'>
        {label}
      </div>
      <div
        className={`text-xs sm:text-base font-semibold tabular-nums truncate leading-tight ${color}`}
      >
        {value}
      </div>
    </div>
  )
}

export default function Deployments () {
  const { isAdmin } = useAuth()
  const {
    stocks,
    deployments,
    truckLoadouts,
    loadoutMeta,
    deployTruck,
    reloadTruck,
    returnTruck,
    updateTruckLoadout,
    markLoadoutPrinted,
    markCreditPaid
  } = useOutletContext()

  const [trucks, setTrucks] = useState([])
  const [trucksLoading, setTrucksLoading] = useState(true)
  const [viewMode, setViewMode] = useState('all')
  const [focusedHistoryId, setFocusedHistoryId] = useState(null)
  const [activeTruckMobile, setActiveTruckMobile] = useState(null)

  const [editLoadoutTruck, setEditLoadoutTruck] = useState(null)
  const [deployingTruck, setDeployingTruck] = useState(null)
  const [reloadingTruck, setReloadingTruck] = useState(null)
  const [returningTruck, setReturningTruck] = useState(null)
  const [printingTruck, setPrintingTruck] = useState(null)

  const loadTrucks = async () => {
    setTrucksLoading(true)
    try {
      const data = await api.get('/trucks')
      setTrucks(data.trucks || [])
    } catch (err) {
      console.error('Failed to load trucks:', err)
      setTrucks([])
    } finally {
      setTrucksLoading(false)
    }
  }

  useEffect(() => {
    loadTrucks()
  }, [])

  // Keep the mobile tab selection valid
  useEffect(() => {
    if (trucks.length === 0) return
    setActiveTruckMobile(prev => {
      if (prev && trucks.some(t => t.name === prev)) return prev
      return trucks[0].name
    })
  }, [trucks])

  const history = deployments.filter(d => d.status === 'returned')

  const activeByTruck = {}
  deployments
    .filter(d => d.status === 'out')
    .forEach(d => {
      activeByTruck[d.truck] = d
    })

  const combinedStats = useMemo(() => {
    let loadoutValue = 0
    let loadoutCases = 0
    let loadoutEmpties = 0
    let trucksOut = 0

    trucks.forEach(t => {
      const active = activeByTruck[t.name]
      if (active) {
        trucksOut++
        active.items.forEach(item => {
          const cases = Number(item.cases) || 0
          loadoutCases += cases
          loadoutValue += cases * (Number(item.price_per_case) || 0)
          loadoutEmpties += cases * (Number(item.empties_per_case) || 0)
        })
      } else {
        const lo = truckLoadouts[t.name] || []
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

  const focusedHistory = focusedHistoryId
    ? history.find(d => d._id === focusedHistoryId)
    : null

  const handleOpenHistory = deployment => {
    setFocusedHistoryId(deployment._id)
  }

  const isHistoryView = viewMode === 'history'
  const toggleHistory = () => {
    setViewMode(isHistoryView ? 'all' : 'history')
    setFocusedHistoryId(null)
  }

  const handleDeploy = truckName => {
    const active = activeByTruck[truckName]
    const loadout = truckLoadouts[truckName] || []
    const meta = loadoutMeta[truckName] || {}
    if (active || loadout.length === 0) return
    if (!meta.isLoadoutPrinted) return
    setDeployingTruck(truckName)
  }

  const handleEditLoadout = truckName => {
    setEditLoadoutTruck(truckName)
  }

  const handleReload = truckName => {
    const active = activeByTruck[truckName]
    if (!active) return
    setReloadingTruck(truckName)
  }

  const handleReturn = truckName => {
    setReturningTruck(truckName)
  }

  const handlePrint = async truckName => {
    if (printingTruck) return
    const loadout = truckLoadouts[truckName] || []
    if (loadout.length === 0) return

    setPrintingTruck(truckName)
    try {
      await printLoadoutSheet({ truck: truckName, loadout, stocks })
      await markLoadoutPrinted(truckName)
    } catch (err) {
      console.error('Print failed:', err)
    } finally {
      setPrintingTruck(null)
    }
  }

  const confirmDeploy = async () => {
    const truckName = deployingTruck
    const loadout = truckLoadouts[truckName] || []
    const ok = await deployTruck(truckName, loadout)
    if (ok !== false) setDeployingTruck(null)
  }

  const saveLoadout = async (truckName, items) => {
    const ok = await updateTruckLoadout(truckName, items)
    if (ok !== false) setEditLoadoutTruck(null)
    return ok
  }

  const submitReload = async (deploymentId, items) => {
    const ok = await reloadTruck(deploymentId, items)
    if (ok !== false) setReloadingTruck(null)
    return ok
  }

  const submitReturn = async (
    deploymentId,
    returnItems,
    remit,
    emptiesReceived
  ) => {
    const ok = await returnTruck(
      deploymentId,
      returnItems,
      remit,
      emptiesReceived
    )
    if (ok !== false) setReturningTruck(null)
    return ok
  }

  if (!trucksLoading && trucks.length === 0) {
    return (
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center text-center shadow-lg shadow-black/40'>
        <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 sm:mb-4'>
          <TbUsers size={22} />
        </div>
        <div className='uppercase font-medium text-base sm:text-lg mb-1'>
          No Trucks Yet
        </div>
        <p className='text-xs sm:text-sm text-zinc-500 max-w-sm mb-4 sm:mb-5'>
          Trucks appear here automatically when you create a{' '}
          <span className='text-blue-400 font-medium'>Sales Agent</span>{' '}
          account.
        </p>
        {isAdmin && (
          <Link
            to='/users'
            className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-md shadow-md shadow-blue-600/30'
          >
            <TbUsers size={14} />
            Go to Users
          </Link>
        )}
      </div>
    )
  }

  return (
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-1.5 sm:p-2 flex flex-col overflow-hidden shadow-lg shadow-black/40'>
        {/* PAGE HEADER */}
        <div className='flex justify-between items-center gap-2 sm:gap-3 pb-1.5 sm:pb-2 border-b border-zinc-800 shrink-0'>
          <div className='uppercase font-medium text-sm sm:text-lg truncate'>
            Deployments
          </div>

          <button
            onClick={toggleHistory}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition shrink-0 whitespace-nowrap ${
              isHistoryView
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-700'
            }`}
          >
            {isHistoryView ? (
              <>
                <TbArrowLeft size={11} />
                All Trucks
              </>
            ) : (
              <>
                <TbHistory size={11} />
                History
                {history.length > 0 && (
                  <span className='text-[8px] sm:text-[9px] bg-white/15 px-1 sm:px-1.5 py-0.5 rounded tabular-nums'>
                    {history.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* BODY */}
        <div className='flex-1 min-h-0 flex gap-2 sm:gap-3 mt-1.5 sm:mt-2'>
          <div className='flex-1 min-w-0 flex flex-col min-h-0'>
            <div className='flex-1 min-h-0 flex flex-col'>
              {/* History detail */}
              {focusedHistory && (
                <div className='flex-1 min-h-0'>
                  <FocusedHistoryView
                    deployment={focusedHistory}
                    onBack={() => setFocusedHistoryId(null)}
                    onMarkCreditPaid={
                      isAdmin
                        ? paid => markCreditPaid(focusedHistory._id, paid)
                        : undefined
                    }
                  />
                </div>
              )}

              {/* History list */}
              {!focusedHistory && isHistoryView && (
                <>
                  {history.length === 0 ? (
                    <div className='flex-1 flex flex-col items-center justify-center text-center px-3 sm:px-4'>
                      <div className='w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-500 mb-2.5 sm:mb-3'>
                        <TbHistory size={20} />
                      </div>
                      <div className='text-xs sm:text-sm text-zinc-400 font-medium mb-1'>
                        No completed deployments yet
                      </div>
                      <p className='text-[11px] sm:text-xs text-zinc-600 max-w-sm'>
                        Returned trucks will show up here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className='shrink-0 mb-1.5 sm:mb-2'>
                        <HistorySummary deployments={history} />
                      </div>

                      <div className='flex-1 min-h-0'>
                        <HistoryTable
                          deployments={history}
                          onRowClick={handleOpenHistory}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* All view */}
              {!focusedHistory && !isHistoryView && (
                <>
                  {/* Summary */}
                  <div className='shrink-0 grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 pb-2 sm:pb-3 mb-1.5 sm:mb-2 border-b border-zinc-800/60'>
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

                  {/* Mobile truck tabs */}
                  <div className='md:hidden shrink-0 overflow-x-auto pb-2 mb-1.5 border-b border-zinc-800/60'>
                    <div className='flex items-center gap-1 w-max'>
                      {trucks.map(t => {
                        const isActive = activeTruckMobile === t.name
                        const isOut = !!activeByTruck[t.name]
                        return (
                          <button
                            key={t._id}
                            onClick={() => setActiveTruckMobile(t.name)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'text-zinc-400 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
                            }`}
                          >
                            <span className='max-w-[100px] truncate uppercase'>
                              {t.name}
                            </span>
                            {isOut && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isActive ? 'bg-white' : 'bg-blue-400'
                                }`}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className='flex-1 min-h-0 overflow-hidden'>
                    <div className='h-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-2 sm:gap-3'>
                      {trucks.map(t => {
                        const isActiveMobile = activeTruckMobile === t.name
                        return (
                          <div
                            key={t._id}
                            className={
                              isActiveMobile
                                ? 'min-h-0'
                                : 'hidden md:block min-h-0'
                            }
                          >
                            <TruckOverviewCard
                              truck={t.name}
                              activeDeployment={activeByTruck[t.name] || null}
                              loadout={truckLoadouts[t.name] || []}
                              isLoadoutPrinted={
                                !!loadoutMeta[t.name]?.isLoadoutPrinted
                              }
                              isPrinting={printingTruck === t.name}
                              stocks={stocks}
                              canManage={isAdmin}
                              onDeploy={() => handleDeploy(t.name)}
                              onEditLoadout={() => handleEditLoadout(t.name)}
                              onReload={() => handleReload(t.name)}
                              onReturn={() => handleReturn(t.name)}
                              onPrint={() => handlePrint(t.name)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals — admin only */}
      {isAdmin && (
        <>
          <EditLoadoutModal
            isOpen={!!editLoadoutTruck}
            onClose={() => setEditLoadoutTruck(null)}
            truck={editLoadoutTruck}
            loadout={
              editLoadoutTruck ? truckLoadouts[editLoadoutTruck] || [] : []
            }
            stocks={stocks}
            onSave={items => saveLoadout(editLoadoutTruck, items)}
          />

          <DeployConfirmModal
            isOpen={!!deployingTruck}
            onClose={() => setDeployingTruck(null)}
            onConfirm={confirmDeploy}
            truck={deployingTruck}
            loadout={deployingTruck ? truckLoadouts[deployingTruck] || [] : []}
            stocks={stocks}
          />

          <ReloadTruckModal
            isOpen={!!reloadingTruck}
            onClose={() => setReloadingTruck(null)}
            deployment={
              reloadingTruck ? activeByTruck[reloadingTruck] || null : null
            }
            stocks={stocks}
            onReload={submitReload}
          />

          <ReturnTruckModal
            isOpen={!!returningTruck}
            onClose={() => setReturningTruck(null)}
            deployment={
              returningTruck ? activeByTruck[returningTruck] || null : null
            }
            onReturn={submitReturn}
          />
        </>
      )}
    </>
  )
}
