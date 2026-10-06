import { TbTruck } from 'react-icons/tb'
import { formatNumber, formatMoney } from '../utils/inventory'

export default function TruckOverviewCard ({
  truck,
  activeDeployment,
  loadout = [],
  agent,
  stocks
}) {
  const isDeployed = !!activeDeployment
  const hasLoadout = loadout.length > 0

  // Use deployment snapshot if out, otherwise the saved loadout
  const items = isDeployed
    ? [...activeDeployment.items].sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      )
    : [...loadout].sort((a, b) => a.product_name.localeCompare(b.product_name))

  // Enrich with price/empties (snapshot if deployed, live from stock if idle)
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

  return (
    <div className='border border-zinc-800 bg-zinc-950/60 rounded-lg flex flex-col h-full min-h-0 overflow-hidden shadow-lg shadow-black/40'>
      {/* header */}
      <div className='shrink-0 flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/70'>
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

        {agent && (
          <span className='text-[10px] font-semibold text-zinc-400 uppercase shrink-0 truncate max-w-[6rem]'>
            {agent}
          </span>
        )}
      </div>

      {/* body — product list */}
      <div className='flex-1 min-h-0 overflow-y-auto'>
        {!hasLoadout && !isDeployed ? (
          <div className='h-full flex items-center justify-center p-4 text-zinc-600 text-xs'>
            No loadout set
          </div>
        ) : (
          <div className='divide-y divide-zinc-800/40'>
            {enriched.map((item, i) => (
              <div
                key={i}
                className='flex items-center justify-between gap-2 px-3 py-1.5'
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

      {/* footer — loadout totals */}
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
    </div>
  )
}
