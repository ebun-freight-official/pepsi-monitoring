import { useState, useMemo, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router'
import { TbUsers, TbHistory, TbArrowLeft, TbSearch } from 'react-icons/tb'
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
import { formatMoney, formatNumber, formatDate } from '../utils/inventory'
import { api } from '../lib/api'

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 sm:py-1.5 text-[11px] sm:text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

const HISTORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All returns' },
  { value: 'exact', label: 'Exact remit' },
  { value: 'over', label: 'Over' },
  { value: 'short', label: 'Short' },
  { value: 'unpaid_credit', label: 'Credit unpaid' },
  { value: 'paid_credit', label: 'Credit paid' },
  { value: 'with_empties', label: 'Has empties' }
]

const HISTORY_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'sales_desc', label: 'Sales (High → Low)' },
  { value: 'remit_desc', label: 'Remit (High → Low)' },
  { value: 'diff_over', label: 'Over (High → Low)' },
  { value: 'diff_short', label: 'Short (High → Low)' }
]

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

  // History-view filter state
  const [histSearch, setHistSearch] = useState('')
  const [histFilterBy, setHistFilterBy] = useState('all')
  const [histSortBy, setHistSortBy] = useState('date_desc')

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

  const history = useMemo(
    () => deployments.filter(d => d.status === 'returned'),
    [deployments]
  )

  const activeByTruck = useMemo(() => {
    const map = {}
    deployments
      .filter(d => d.status === 'out')
      .forEach(d => {
        map[d.truck] = d
      })
    return map
  }, [deployments])

  const sortedTrucks = useMemo(
    () => [...trucks].sort((a, b) => a.name.localeCompare(b.name)),
    [trucks]
  )

  const truckStatsMap = useMemo(() => {
    const map = {}
    trucks.forEach(t => {
      const active = activeByTruck[t.name]
      let cases = 0
      let value = 0
      let empties = 0

      if (active) {
        active.items.forEach(item => {
          const c = Number(item.cases) || 0
          cases += c
          value += c * (Number(item.price_per_case) || 0)
          empties += c * (Number(item.empties_per_case) || 0)
        })
      } else {
        const lo = truckLoadouts[t.name] || []
        lo.forEach(item => {
          const c = Number(item.cases) || 0
          const stock = stocks.find(s => s.product_name === item.product_name)
          cases += c
          value += c * (stock ? Number(stock.price_per_case) || 0 : 0)
          empties += c * (stock ? Number(stock.empties_per_case) || 0 : 0)
        })
      }

      map[t.name] = { cases, value, empties, isOut: !!active }
    })
    return map
  }, [trucks, activeByTruck, truckLoadouts, stocks])

  const combinedStats = useMemo(() => {
    let loadoutValue = 0
    let loadoutCases = 0
    let loadoutEmpties = 0
    let trucksOut = 0

    trucks.forEach(t => {
      const stats = truckStatsMap[t.name]
      if (!stats) return
      if (stats.isOut) trucksOut++
      loadoutValue += stats.value
      loadoutCases += stats.cases
      loadoutEmpties += stats.empties
    })

    return { loadoutValue, loadoutCases, loadoutEmpties, trucksOut }
  }, [trucks, truckStatsMap])

  // History-view: filter + sort
  const visibleHistory = useMemo(() => {
    const q = histSearch.trim().toLowerCase()

    const decorated = history.map(d => {
      const items = d.returnItems || []
      const value = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
      const empties = items.reduce(
        (s, i) => s + (Number(i.empties_sold) || 0),
        0
      )
      const r = d.remit || {}
      const cash =
        (Number(r.cash) || 0) + (Number(r.gcash) || 0) + (Number(r.credit) || 0)
      const caseRemit = Number(r.case_remit) || 0
      const remit = cash + caseRemit
      const diff = remit - (value + empties)
      const hasCredit = Number(r.credit) > 0
      const creditPaid = !!r.credit_paid

      const emptiesReceived = d.emptiesReceived || {}
      let emptiesQty = 0
      ;['fullCase', 'caseOnly', 'bottlesOnly'].forEach(g => {
        const src = emptiesReceived[g] || {}
        Object.values(src).forEach(v => {
          emptiesQty += Number(v) || 0
        })
      })

      return {
        deployment: d,
        value,
        empties,
        cash,
        caseRemit,
        remit,
        diff,
        hasCredit,
        creditPaid,
        emptiesQty
      }
    })

    let list = decorated.filter(row => {
      const d = row.deployment
      if (q) {
        const nameMatch = (d.truck || '').toLowerCase().includes(q)
        const dateMatch = formatDate(d.returned_at || d.createdAt || '')
          .toLowerCase()
          .includes(q)
        if (!nameMatch && !dateMatch) return false
      }

      switch (histFilterBy) {
        case 'exact':
          return Math.abs(row.diff) < 0.01
        case 'over':
          return row.diff > 0.01
        case 'short':
          return row.diff < -0.01
        case 'unpaid_credit':
          return row.hasCredit && !row.creditPaid
        case 'paid_credit':
          return row.hasCredit && row.creditPaid
        case 'with_empties':
          return row.emptiesQty > 0
        default:
          return true
      }
    })

    return [...list]
      .sort((a, b) => {
        const da = new Date(
          a.deployment.returned_at || a.deployment.createdAt || 0
        )
        const db = new Date(
          b.deployment.returned_at || b.deployment.createdAt || 0
        )
        switch (histSortBy) {
          case 'date_asc':
            return da - db
          case 'sales_desc':
            return b.value - a.value
          case 'remit_desc':
            return b.remit - a.remit
          case 'diff_over':
            return b.diff - a.diff
          case 'diff_short':
            return a.diff - b.diff
          case 'date_desc':
          default:
            return db - da
        }
      })
      .map(row => row.deployment)
  }, [history, histSearch, histFilterBy, histSortBy])

  // Keep the mobile tab selection valid
  useEffect(() => {
    if (sortedTrucks.length === 0) return
    setActiveTruckMobile(prev => {
      if (prev && sortedTrucks.some(t => t.name === prev)) return prev
      return sortedTrucks[0].name
    })
  }, [sortedTrucks])

  const hasHistFilter =
    histSearch !== '' || histFilterBy !== 'all' || histSortBy !== 'date_desc'

  const resetHistFilters = () => {
    setHistSearch('')
    setHistFilterBy('all')
    setHistSortBy('date_desc')
  }

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
    return ok
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
            className='flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-[11px] font-medium transition shrink-0 whitespace-nowrap text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-700'
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
                  <span className='text-[8px] sm:text-[9px] bg-zinc-800 text-zinc-400 px-1 sm:px-1.5 py-0.5 rounded tabular-nums'>
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
                      <div className='hidden md:block shrink-0 mb-1.5 sm:mb-2'>
                        <HistorySummary deployments={visibleHistory} />
                      </div>

                      {/* History filter bar */}
                      <div className='shrink-0 flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2 border-b border-zinc-800/60'>
                        <div className='relative w-full sm:w-auto sm:flex-1 sm:min-w-[140px]'>
                          <TbSearch
                            size={13}
                            className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
                          />
                          <input
                            type='text'
                            value={histSearch}
                            onChange={e => setHistSearch(e.target.value)}
                            placeholder='Search truck or date…'
                            className='w-full bg-zinc-900 border border-zinc-700 rounded-md pl-7 pr-2 py-1 sm:py-1.5 text-[11px] sm:text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'
                          />
                        </div>

                        <select
                          value={histFilterBy}
                          onChange={e => setHistFilterBy(e.target.value)}
                          className={`${selectClass} flex-1 sm:flex-none`}
                        >
                          {HISTORY_FILTER_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={histSortBy}
                          onChange={e => setHistSortBy(e.target.value)}
                          className={`${selectClass} flex-1 sm:flex-none`}
                        >
                          {HISTORY_SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>

                        {hasHistFilter && (
                          <button
                            onClick={resetHistFilters}
                            className='text-[10px] sm:text-[11px] text-zinc-500 hover:text-zinc-200 transition'
                          >
                            Reset
                          </button>
                        )}

                        <span className='text-[9px] sm:text-[10px] text-zinc-600 ml-auto tabular-nums'>
                          {visibleHistory.length} of {history.length}
                        </span>
                      </div>

                      <div className='flex-1 min-h-0'>
                        {visibleHistory.length === 0 ? (
                          <div className='h-full flex flex-col items-center justify-center text-center p-4'>
                            <div className='text-xs sm:text-sm text-zinc-400 font-medium mb-1'>
                              No returns match your filter
                            </div>
                            <p className='text-[11px] sm:text-xs text-zinc-600 mb-3'>
                              Try clearing the search or filter.
                            </p>
                            {hasHistFilter && (
                              <button
                                onClick={resetHistFilters}
                                className='text-[11px] sm:text-xs text-blue-400 hover:text-blue-300 font-medium transition'
                              >
                                Reset filters
                              </button>
                            )}
                          </div>
                        ) : (
                          <HistoryTable
                            deployments={visibleHistory}
                            onRowClick={handleOpenHistory}
                          />
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* All view */}
              {!focusedHistory && !isHistoryView && (
                <>
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

                  <div className='md:hidden shrink-0 overflow-x-auto pb-2 mb-1.5 border-b border-zinc-800/60'>
                    <div className='flex items-center gap-1 w-max'>
                      {sortedTrucks.map(t => {
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

                  <div className='flex-1 min-h-0 overflow-hidden'>
                    <div className='h-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-2 sm:gap-3'>
                      {sortedTrucks.map(t => {
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
