import {
  TbTruck,
  TbPencil,
  TbArrowUp,
  TbArrowDown,
  TbRefresh,
  TbPrinter,
  TbAlertTriangle,
  TbLoader2
} from 'react-icons/tb'
import { formatNumber, formatMoney } from '../utils/inventory'

export default function TruckOverviewCard ({
  truck,
  activeDeployment,
  loadout = [],
  isLoadoutPrinted = false,
  isPrinting = false,
  stocks,
  onDeploy,
  onEditLoadout,
  onReload,
  onReturn,
  onPrint,
  canManage = false
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0
  const canDeploy = hasLoadout && isLoadoutPrinted

  const items = isDeployed
    ? [...activeDeployment.items].sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      )
    : [...loadout].sort((a, b) => a.product_name.localeCompare(b.product_name))

  const enriched = items.map(i => {
    const stock = stocks.find(s => s.product_name === i.product_name)
    const price = isDeployed
      ? Number(i.price_per_case) || 0
      : stock
      ? Number(stock.price_per_case) || 0
      : 0
    const emptiesPer = isDeployed
      ? Number(i.empties_per_case) || 0
      : stock
      ? Number(stock.empties_per_case) || 0
      : 0
    const cases = Number(i.cases) || 0
    return {
      ...i,
      cases,
      price,
      emptiesPer,
      lineValue: cases * price,
      lineEmpties: cases * emptiesPer
    }
  })

  const totalCases = enriched.reduce((s, i) => s + i.cases, 0)
  const totalValue = enriched.reduce((s, i) => s + i.lineValue, 0)
  const totalEmpties = enriched.reduce((s, i) => s + i.lineEmpties, 0)

  const showActions = canManage

  const badge = (() => {
    if (isDeployed) {
      return { text: 'Out', cls: 'bg-blue-500/15 text-blue-400' }
    }
    if (!hasLoadout) {
      return { text: 'Idle', cls: 'bg-zinc-800 text-zinc-500' }
    }
    if (isLoadoutPrinted) {
      return {
        text: 'Loadout Printed',
        cls: 'bg-emerald-500/15 text-emerald-400'
      }
    }
    return {
      text: 'Loadout Not Printed',
      cls: 'bg-rose-500/15 text-rose-400'
    }
  })()

  return (
    <div className='border border-zinc-800 bg-zinc-950/60 rounded-lg flex flex-col h-full min-h-0 overflow-hidden shadow-lg shadow-black/40'>
      {/* HEADER */}
      <div className='shrink-0 flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/70'>
        <TbTruck className='text-blue-400 shrink-0' size={16} />
        <span className='font-medium text-sm truncate uppercase'>{truck}</span>
        <span
          className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold shrink-0 ml-auto whitespace-nowrap ${badge.cls}`}
        >
          {badge.text}
        </span>
      </div>

      {/* BODY */}
      <div className='flex-1 min-h-0 overflow-y-auto'>
        {enriched.length === 0 ? (
          <div className='h-full flex items-center justify-center p-4 text-zinc-600 text-xs'>
            No loadout set
          </div>
        ) : (
          <div className='divide-y divide-zinc-800/40'>
            {enriched.map((item, i) => (
              <div
                key={i}
                className='flex items-center justify-between gap-2 px-3 py-1.5 transition-colors hover:bg-zinc-800/40'
              >
                <span className='text-xs text-zinc-200 truncate'>
                  {item.product_name}
                </span>
                <span className='text-xs text-blue-400 font-medium tabular-nums shrink-0'>
                  {formatNumber(item.cases)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUMMARY */}
      {(hasLoadout || isDeployed) && (
        <div className='shrink-0 border-t border-zinc-800 bg-zinc-900/40'>
          <div className='grid grid-cols-3 divide-x divide-zinc-800/60'>
            <div className='px-2 py-2 flex flex-col items-center min-w-0'>
              <span className='text-[9px] uppercase tracking-wider text-zinc-600'>
                Price
              </span>
              <span className='text-xs font-semibold text-blue-400 tabular-nums truncate w-full text-center'>
                {formatMoney(totalValue)}
              </span>
            </div>
            <div className='px-2 py-2 flex flex-col items-center min-w-0'>
              <span className='text-[9px] uppercase tracking-wider text-zinc-600'>
                Cases
              </span>
              <span className='text-xs font-semibold text-blue-400 tabular-nums truncate w-full text-center'>
                {formatNumber(totalCases)}
              </span>
            </div>
            <div className='px-2 py-2 flex flex-col items-center min-w-0'>
              <span className='text-[9px] uppercase tracking-wider text-zinc-600'>
                Empties
              </span>
              <span className='text-xs font-semibold text-amber-400 tabular-nums truncate w-full text-center'>
                {formatMoney(totalEmpties)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      {showActions && (
        <div className='shrink-0 border-t border-zinc-800 bg-zinc-950/80 p-2'>
          {isDeployed && (
            <div className='flex gap-2'>
              <button
                onClick={onReload}
                className='flex-1 flex items-center justify-center gap-1.5 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-xs font-medium py-2 rounded-md transition text-zinc-300'
              >
                <TbRefresh size={12} />
                Reload
              </button>
              <button
                onClick={onReturn}
                className='flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-medium py-2 rounded-md transition shadow-md shadow-emerald-600/20'
              >
                <TbArrowDown size={12} />
                Return
              </button>
            </div>
          )}

          {!isDeployed && hasLoadout && (
            <div className='flex gap-2'>
              <button
                onClick={onPrint}
                disabled={isPrinting}
                className={`flex items-center justify-center px-2.5 rounded-md transition border disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLoadoutPrinted
                    ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                    : 'border-rose-700/60 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                }`}
                title={isLoadoutPrinted ? 'Reprint loadout' : 'Print loadout'}
              >
                {isPrinting ? (
                  <TbLoader2 size={14} className='animate-spin' />
                ) : (
                  <TbPrinter size={14} />
                )}
              </button>
              <button
                onClick={onEditLoadout}
                className='flex-1 flex items-center justify-center gap-1.5 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-xs font-medium py-2 rounded-md transition text-zinc-300'
              >
                <TbPencil size={12} />
                Edit
              </button>
              <button
                onClick={onDeploy}
                disabled={!canDeploy}
                title={
                  canDeploy
                    ? 'Deploy this truck'
                    : 'Print the loadout sheet first'
                }
                className='flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium py-2 rounded-md transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600'
              >
                {canDeploy ? (
                  <TbArrowUp size={12} />
                ) : (
                  <TbAlertTriangle size={12} />
                )}
                Deploy
              </button>
            </div>
          )}

          {!isDeployed && !hasLoadout && (
            <button
              onClick={onEditLoadout}
              className='w-full flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 hover:border-blue-500 hover:text-blue-400 text-zinc-400 text-xs font-medium py-2 rounded-md transition'
            >
              + Set Loadout
            </button>
          )}
        </div>
      )}
    </div>
  )
}
