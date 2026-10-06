import { TbTruck } from 'react-icons/tb'
import { formatDate, formatMoney, formatNumber } from '../utils/inventory'

export default function DeploymentHistoryCard ({ deployment }) {
  const items = deployment.returnItems || []

  const totalDeployed = deployment.items.reduce(
    (s, i) => s + (Number(i.cases) || 0),
    0
  )
  const totalReturned = items.reduce(
    (s, i) => s + (Number(i.cases_returned) || 0),
    0
  )
  const totalSold = items.reduce((s, i) => s + (Number(i.cases_sold) || 0), 0)
  const totalBottles = items.reduce(
    (s, i) => s + (Number(i.cases_sold) || 0) * (Number(i.unit) || 0),
    0
  )
  const totalValue = items.reduce((s, i) => {
    const stored = Number(i.value_sold)
    if (!Number.isNaN(stored) && i.value_sold !== undefined) return s + stored
    return s + (Number(i.cases_sold) || 0) * (Number(i.price_per_case) || 0)
  }, 0)
  const totalEmpties = items.reduce((s, i) => {
    const stored = Number(i.empties_sold)
    if (!Number.isNaN(stored) && i.empties_sold !== undefined) return s + stored
    return s + (Number(i.cases_sold) || 0) * (Number(i.empties_per_case) || 0)
  }, 0)

  return (
    <div className='border border-zinc-800 bg-zinc-950/60 rounded-lg overflow-hidden hover:border-zinc-700 transition shadow-lg shadow-black/30'>
      <div className='flex justify-between items-center px-3 py-2 border-b border-zinc-800 bg-zinc-900/70 gap-2'>
        <div className='flex items-center gap-2 min-w-0'>
          <TbTruck className='text-zinc-500 shrink-0' size={14} />
          <span className='font-medium text-xs text-zinc-200 truncate uppercase'>
            {deployment.truck}
          </span>
          <span className='text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium shrink-0 tracking-wide'>
            Returned
          </span>
        </div>
        {deployment.agent && (
          <span className='text-[10px] font-semibold text-zinc-400 uppercase shrink-0 truncate max-w-[80px]'>
            {deployment.agent}
          </span>
        )}
      </div>

      <div className='px-3 py-1.5 border-b border-zinc-800/60 bg-zinc-900/30'>
        <span className='text-[10px] text-zinc-500'>
          {formatDate(deployment.returned_at)}
        </span>
      </div>

      <div className='divide-y divide-zinc-800/60'>
        {items.map((item, i) => {
          const sold = Number(item.cases_sold) || 0
          const returned = Number(item.cases_returned) || 0
          const unit = Number(item.unit) || 0
          const price = Number(item.price_per_case) || 0
          const emptiesPer = Number(item.empties_per_case) || 0
          const value = Number(item.value_sold) || sold * price
          const empties = Number(item.empties_sold) || sold * emptiesPer
          const bottles = sold * unit

          return (
            <div
              key={i}
              className='px-3 py-2 flex justify-between items-start gap-3'
            >
              <div className='min-w-0 flex-1'>
                <div className='text-xs font-medium text-zinc-100 truncate mb-0.5'>
                  {item.product_name}
                </div>
                <div className='flex items-center gap-1.5 text-[10px] flex-wrap'>
                  <span className='text-emerald-400/80 tabular-nums'>
                    {formatNumber(sold)} sold
                  </span>
                  <span className='text-zinc-700'>·</span>
                  <span className='text-amber-400/80 tabular-nums'>
                    {formatNumber(returned)} back
                  </span>
                  {bottles > 0 && (
                    <>
                      <span className='text-zinc-700'>·</span>
                      <span className='text-zinc-500 tabular-nums'>
                        {formatNumber(bottles)} btls
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className='shrink-0 text-right space-y-0.5'>
                <div className='text-xs font-semibold text-emerald-400 tabular-nums'>
                  {formatMoney(value)}
                </div>
                {empties > 0 && (
                  <div className='text-xs font-semibold text-amber-400 tabular-nums'>
                    +{formatMoney(empties)}
                  </div>
                )}
                {price > 0 && (
                  <div className='text-[10px] text-zinc-500 tabular-nums'>
                    {formatMoney(price)}/c
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className='px-3 py-2 border-t border-zinc-800 bg-zinc-900/50'>
        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] mb-2'>
          <div className='flex justify-between'>
            <span className='text-zinc-500'>Out</span>
            <span className='text-zinc-300 font-medium tabular-nums'>
              {formatNumber(totalDeployed)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-zinc-500'>Back</span>
            <span className='text-amber-400 font-medium tabular-nums'>
              {formatNumber(totalReturned)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-zinc-500'>Sold</span>
            <span className='text-emerald-400 font-medium tabular-nums'>
              {formatNumber(totalSold)}
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-zinc-500'>Bottles</span>
            <span className='text-sky-400 font-medium tabular-nums'>
              {formatNumber(totalBottles)}
            </span>
          </div>
        </div>

        <div className='space-y-1 pt-2 border-t border-zinc-800'>
          <div className='flex justify-between items-center'>
            <span className='text-[10px] uppercase tracking-wide text-zinc-500'>
              Price
            </span>
            <span className='text-sm font-semibold text-emerald-400 tabular-nums'>
              {formatMoney(totalValue)}
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[10px] uppercase tracking-wide text-zinc-500'>
              Empties
            </span>
            <span className='text-sm font-semibold text-amber-400 tabular-nums'>
              {formatMoney(totalEmpties)}
            </span>
          </div>
          <div className='flex justify-between items-center pt-2 border-t border-zinc-800'>
            <span className='text-[10px] uppercase tracking-wide text-zinc-400 font-medium'>
              Total Collect
            </span>
            <span className='text-sm font-semibold text-zinc-100 tabular-nums'>
              {formatMoney(totalValue + totalEmpties)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
