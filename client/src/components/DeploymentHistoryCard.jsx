import { TbTruck } from 'react-icons/tb'

export default function DeploymentHistoryCard ({ deployment }) {
  const totalSold = (deployment.returnItems || []).reduce(
    (s, i) => s + i.cases_sold,
    0
  )
  const totalDeployed = deployment.items.reduce((s, i) => s + i.cases, 0)

  return (
    <div className='border border-slate-800 bg-slate-950/40 rounded-lg p-3'>
      <div className='flex justify-between items-center mb-1'>
        <div className='flex items-center gap-2'>
          <TbTruck className='text-slate-500' size={14} />
          <span className='font-medium text-xs text-slate-200'>
            {deployment.truck}
          </span>
          <span className='text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium'>
            Returned
          </span>
        </div>
      </div>

      <div className='text-[10px] text-slate-500 mb-2'>
        {deployment.returned_at}
      </div>

      <div className='space-y-1 mb-2'>
        {(deployment.returnItems || []).map((item, i) => (
          <div key={i} className='flex justify-between text-xs gap-2'>
            <span className='truncate text-slate-300'>{item.product_name}</span>
            <span className='shrink-0 flex gap-2 text-[10px]'>
              <span className='text-emerald-400'>{item.cases_sold} sold</span>
              <span className='text-amber-400'>{item.cases_returned} back</span>
            </span>
          </div>
        ))}
      </div>

      <div className='flex justify-between items-center pt-2 border-t border-slate-800 text-[11px] text-slate-500'>
        <span>
          Out: <span className='text-slate-300'>{totalDeployed}</span>
        </span>
        <span>
          Sold:{' '}
          <span className='text-emerald-400 font-medium'>{totalSold}</span>
        </span>
      </div>
    </div>
  )
}
