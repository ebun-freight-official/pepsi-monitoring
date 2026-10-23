import { formatDate, formatMoney } from '../utils/inventory'

function Dashed ({ className = '' }) {
  return (
    <div className={`border-t border-dashed border-zinc-700/60 ${className}`} />
  )
}

function Solid ({ className = '' }) {
  return <div className={`border-t border-zinc-700 ${className}`} />
}

function Row ({ label, value, color = 'text-zinc-300' }) {
  return (
    <div className='flex justify-between items-baseline gap-3'>
      <span className='text-[11px] text-zinc-500'>{label}</span>
      <span className={`text-xs tabular-nums ${color}`}>{value}</span>
    </div>
  )
}

function TearEdge ({ position = 'top' }) {
  const isTop = position === 'top'
  return (
    <div
      className='h-2 shrink-0'
      style={{
        backgroundImage: `radial-gradient(circle at 4px ${
          isTop ? '0%' : '100%'
        }, #09090b 3.5px, transparent 3.5px)`,
        backgroundSize: '8px 100%',
        backgroundRepeat: 'repeat-x'
      }}
    />
  )
}

export default function DeploymentHistoryCard ({ deployment, onClick }) {
  const items = deployment.returnItems || []
  const remit = deployment.remit || {
    cash: 0,
    gcash: 0,
    credit: 0,
    case_remit: 0
  }

  const totalValue = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
  const totalEmpties = items.reduce(
    (s, i) => s + (Number(i.empties_sold) || 0),
    0
  )

  const caseRemit = Number(remit.case_remit) || 0
  const totalRemit =
    (Number(remit.cash) || 0) +
    (Number(remit.gcash) || 0) +
    (Number(remit.credit) || 0) +
    caseRemit

  const expectedCollect = totalValue + totalEmpties
  const remitDiff = totalRemit - expectedCollect

  const isExact = Math.abs(remitDiff) < 0.01
  const isOver = remitDiff > 0.01

  const clickable = typeof onClick === 'function'

  return (
    <div
      onClick={clickable ? () => onClick(deployment) : undefined}
      className={`flex flex-col items-stretch ${
        clickable ? 'cursor-pointer' : ''
      }`}
    >
      <TearEdge position='top' />

      <div
        className={`bg-zinc-950 border-x border-zinc-800 px-3.5 py-3 font-mono transition ${
          clickable ? 'group-hover:border-blue-600/60' : ''
        }`}
      >
        <div className='text-center'>
          <div className='font-semibold text-[13px] text-zinc-100 uppercase tracking-[0.18em] truncate'>
            {deployment.truck}
          </div>
          <div className='text-[10px] text-zinc-500 mt-1 tabular-nums'>
            {formatDate(deployment.returned_at)}
          </div>
        </div>

        <Dashed className='my-3' />

        {items.length > 0 ? (
          <div className='space-y-2'>
            {items.map((item, i) => {
              const sold = Number(item.cases_sold) || 0
              const returned = Number(item.cases_returned) || 0
              const value = Number(item.value_sold) || 0

              return (
                <div key={i}>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-[12px] text-zinc-100 truncate'>
                      {item.product_name}
                    </span>
                    <span className='text-[12px] text-zinc-100 tabular-nums shrink-0'>
                      {formatMoney(value)}
                    </span>
                  </div>
                  <div className='text-[10px] text-zinc-500 tabular-nums pl-0.5 mt-0.5'>
                    {sold} sold
                    {returned > 0 && ` · ${returned} back`}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='text-center text-[11px] text-zinc-600 py-2'>
            No items
          </div>
        )}

        <Dashed className='my-3' />

        <div className='space-y-1'>
          <Row
            label='Sub-total'
            value={formatMoney(totalValue)}
            color='text-zinc-200'
          />
          <Row
            label='Empties'
            value={formatMoney(totalEmpties)}
            color='text-amber-400'
          />
        </div>

        <Solid className='my-2' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-[11px] uppercase tracking-[0.12em] text-zinc-300 font-semibold'>
            Total
          </span>
          <span className='text-sm font-bold text-zinc-100 tabular-nums'>
            {formatMoney(expectedCollect)}
          </span>
        </div>

        <Dashed className='my-3' />

        <div className='text-[10px] uppercase tracking-[0.14em] text-teal-400/80 font-semibold mb-2'>
          Remit
        </div>

        <div className='space-y-1'>
          <Row label='Cash' value={formatMoney(remit.cash)} />
          <Row label='G-Cash' value={formatMoney(remit.gcash)} />
          <Row label='Credit' value={formatMoney(remit.credit)} />
          <Row
            label='Case'
            value={formatMoney(caseRemit)}
            color='text-teal-400'
          />
        </div>

        <Solid className='my-2' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-[11px] uppercase tracking-[0.12em] text-zinc-300 font-semibold'>
            Remitted
          </span>
          <span className='text-sm font-bold text-teal-400 tabular-nums'>
            {formatMoney(totalRemit)}
          </span>
        </div>

        <Dashed className='my-3' />

        <div className='text-center'>
          {isExact ? (
            <div className='text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-semibold'>
              ✓ Exact
            </div>
          ) : isOver ? (
            <>
              <div className='text-[10px] uppercase tracking-[0.16em] text-emerald-400 font-semibold'>
                Over
              </div>
              <div className='text-sm font-bold tabular-nums mt-0.5 text-emerald-400'>
                +{formatMoney(remitDiff)}
              </div>
            </>
          ) : (
            <>
              <div className='text-[10px] uppercase tracking-[0.16em] text-rose-400 font-semibold'>
                Short
              </div>
              <div className='text-sm font-bold tabular-nums mt-0.5 text-rose-400'>
                -{formatMoney(Math.abs(remitDiff))}
              </div>
            </>
          )}
        </div>
      </div>

      <TearEdge position='bottom' />
    </div>
  )
}
