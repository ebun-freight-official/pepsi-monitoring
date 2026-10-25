import {
  TbArrowLeft,
  TbTruck,
  TbCheck,
  TbTrendingUp,
  TbAlertTriangle,
  TbCircleCheck,
  TbLoader2
} from 'react-icons/tb'
import { useState } from 'react'
import { formatDate, formatMoney, formatNumber } from '../utils/inventory'

const GRID_HISTORY =
  'grid grid-cols-[minmax(0,1fr)_4rem_4rem_3.5rem_6rem_6rem] gap-2 items-center'

const diffMeta = diff => {
  const isExact = Math.abs(diff) < 0.01
  const isOver = diff > 0.01

  if (isExact) {
    return {
      isExact: true,
      isOver: false,
      label: 'Difference',
      display: formatMoney(0),
      color: 'text-zinc-400'
    }
  }
  if (isOver) {
    return {
      isExact: false,
      isOver: true,
      label: 'Over',
      display: `+${formatMoney(diff)}`,
      color: 'text-emerald-400'
    }
  }
  return {
    isExact: false,
    isOver: false,
    label: 'Short',
    display: `-${formatMoney(Math.abs(diff))}`,
    color: 'text-rose-400'
  }
}

function HeadCell ({ label, value, color, align = 'center' }) {
  const alignCls =
    align === 'right'
      ? 'items-end text-right'
      : align === 'left'
      ? 'items-start text-left'
      : 'items-center text-center'
  return (
    <div className={`flex flex-col ${alignCls} min-w-0`}>
      <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
        {label}
      </span>
      <span
        className={`text-xs sm:text-sm font-semibold tabular-nums mt-0.5 truncate ${color}`}
      >
        {value}
      </span>
    </div>
  )
}

function ProductTable ({ items, totals }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-900/40 overflow-hidden flex flex-col h-full min-h-0'>
      <div className='flex-1 min-h-0 overflow-auto'>
        <div className='min-w-[640px]'>
          <div
            className={`${GRID_HISTORY} px-2 sm:px-3 py-2 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10`}
          >
            <div className='min-w-0'>
              <div className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
                Product
              </div>
              <div className='text-xs sm:text-sm font-semibold text-zinc-300 tabular-nums mt-0.5 truncate'>
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            <HeadCell
              label='Loaded'
              value={formatNumber(totals.deployed)}
              color='text-blue-400'
            />
            <HeadCell
              label='Returned'
              value={formatNumber(totals.returned)}
              color='text-amber-400'
            />
            <HeadCell
              label='Sold'
              value={formatNumber(totals.sold)}
              color='text-emerald-400'
            />
            <HeadCell
              label='Sold ₱'
              value={formatMoney(totals.value)}
              color='text-emerald-400'
              align='right'
            />
            <HeadCell
              label='Empties ₱'
              value={formatMoney(totals.empties)}
              color='text-amber-400'
              align='right'
            />
          </div>

          <div className='divide-y divide-zinc-800/50'>
            {items.map((item, i) => (
              <div
                key={i}
                className={`${GRID_HISTORY} px-2 sm:px-3 py-2 sm:py-2.5 transition-colors hover:bg-zinc-800/40`}
              >
                <div className='min-w-0'>
                  <div className='text-xs sm:text-sm text-zinc-100 font-medium truncate'>
                    {item.product_name}
                  </div>
                  <div className='text-[9px] sm:text-[10px] text-zinc-500 tabular-nums mt-0.5'>
                    {formatMoney(item.price_per_case)}/case ·{' '}
                    {formatNumber(item.unit)} btls
                  </div>
                </div>
                <div className='text-xs sm:text-sm text-blue-400 font-medium text-center tabular-nums'>
                  {formatNumber(item.cases_deployed)}
                </div>
                <div className='text-xs sm:text-sm text-amber-400 font-medium text-center tabular-nums'>
                  {formatNumber(item.cases_returned)}
                </div>
                <div className='text-xs sm:text-sm text-emerald-400 font-medium text-center tabular-nums'>
                  {formatNumber(item.cases_sold)}
                </div>
                <div className='text-xs sm:text-sm text-emerald-400 font-semibold text-right tabular-nums'>
                  {formatMoney(item.value_sold)}
                </div>
                <div className='text-xs sm:text-sm text-amber-400 font-semibold text-right tabular-nums'>
                  {formatMoney(item.empties_sold)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BucketCard ({ title, accent, right, children }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
      <div className='flex justify-between items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60'>
        <span
          className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold truncate ${accent}`}
        >
          {title}
        </span>
        {right}
      </div>
      <div className='p-2 sm:p-3 space-y-1.5 sm:space-y-2'>{children}</div>
    </div>
  )
}

function InlineRemitRow ({ remit }) {
  return (
    <div className='mt-1 border-t border-zinc-800/60'>
      <div className='flex items-center gap-1 sm:gap-2 bg-black/50'>
        {[
          { key: 'cash', label: 'Cash' },
          { key: 'gcash', label: 'G-Cash' },
          { key: 'credit', label: 'Credit' }
        ].map(f => (
          <div
            key={f.key}
            className='flex items-center gap-1 flex-1 min-w-0 py-1.5 sm:py-2 px-1'
          >
            <label className='text-[9px] sm:text-[10px] uppercase tracking-wide text-zinc-500 shrink-0'>
              {f.label}:
            </label>
            <span className='flex-1 min-w-0 text-[10px] sm:text-[11px] text-right text-zinc-100 tabular-nums truncate'>
              {formatMoney(remit[f.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FocusedHistoryView ({
  deployment,
  onBack,
  onMarkCreditPaid
}) {
  const items = deployment.returnItems || []
  const remit = deployment.remit || {
    cash: 0,
    gcash: 0,
    credit: 0,
    case_remit: 0,
    credit_paid: false
  }

  const [busy, setBusy] = useState(false)

  const totalSold = items.reduce((s, i) => s + (Number(i.cases_sold) || 0), 0)
  const totalReturned = items.reduce(
    (s, i) => s + (Number(i.cases_returned) || 0),
    0
  )
  const totalDeployed = items.reduce(
    (s, i) => s + (Number(i.cases_deployed) || 0),
    0
  )
  const totalValue = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
  const totalEmpties = items.reduce(
    (s, i) => s + (Number(i.empties_sold) || 0),
    0
  )

  const totals = {
    deployed: totalDeployed,
    returned: totalReturned,
    sold: totalSold,
    value: totalValue,
    empties: totalEmpties
  }

  const cashRemit =
    (Number(remit.cash) || 0) +
    (Number(remit.gcash) || 0) +
    (Number(remit.credit) || 0)
  const cashDiff = cashRemit - totalValue
  const cashMeta = diffMeta(cashDiff)

  const caseRemit = Number(remit.case_remit) || 0
  const caseDiff = caseRemit - totalEmpties
  const caseMeta = diffMeta(caseDiff)

  const totalRemit = cashRemit + caseRemit
  const expectedCollect = totalValue + totalEmpties
  const remitDiff = totalRemit - expectedCollect
  const combinedMeta = diffMeta(remitDiff)

  const credit = Number(remit.credit) || 0
  const creditPaid = !!remit.credit_paid
  const hasCredit = credit > 0
  const creditUnpaid = hasCredit && !creditPaid

  const statusBadge = (() => {
    if (combinedMeta.isExact) {
      return {
        label: 'Exact',
        icon: <TbCheck size={11} />,
        cls: 'text-zinc-300 bg-zinc-800/60 border-zinc-700'
      }
    }
    if (combinedMeta.isOver) {
      return {
        label: `+${formatMoney(remitDiff)} Over`,
        icon: <TbTrendingUp size={11} />,
        cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-800/50'
      }
    }
    return {
      label: `${formatMoney(Math.abs(remitDiff))} Short`,
      icon: <TbAlertTriangle size={11} />,
      cls: 'text-rose-400 bg-rose-500/10 border-rose-800/50'
    }
  })()

  const handleMarkPaid = async () => {
    if (!onMarkCreditPaid) return
    setBusy(true)
    try {
      await onMarkCreditPaid(true)
    } finally {
      setBusy(false)
    }
  }

  const handleUnmarkPaid = async () => {
    if (!onMarkCreditPaid) return
    setBusy(true)
    try {
      await onMarkCreditPaid(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='flex flex-col h-full min-h-0 border border-zinc-800 bg-zinc-950/60 rounded-lg overflow-hidden shadow-lg shadow-black/40'>
      {/* HEADER */}
      <div className='shrink-0 flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 border-b border-zinc-800 bg-zinc-900/70'>
        <button
          onClick={onBack}
          className='flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-zinc-400 hover:text-zinc-100 px-1.5 sm:px-2 py-1 rounded-md hover:bg-zinc-800 transition shrink-0'
          aria-label='Back'
        >
          <TbArrowLeft size={13} />
          <span className='hidden sm:inline'>Back</span>
        </button>

        <div className='flex items-center gap-1.5 sm:gap-2 min-w-0'>
          <span className='font-semibold text-sm sm:text-base truncate uppercase'>
            {deployment.truck}
          </span>
        </div>

        <div className='ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0'>
          <span className='text-[10px] sm:text-[11px] text-zinc-500 tabular-nums hidden md:block'>
            {formatDate(deployment.returned_at)}
          </span>

          {creditUnpaid && (
            <span
              title='Credit Unpaid'
              className='flex items-center gap-1 text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium border text-amber-400 bg-amber-500/10 border-amber-800/50'
            >
              <TbAlertTriangle size={11} />
              <span className='hidden sm:inline'>Credit Unpaid</span>
            </span>
          )}

          <span
            className={`flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium border whitespace-nowrap ${statusBadge.cls}`}
          >
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* CONTENT — scrolls as one on mobile, split on desktop */}
      <div className='flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden'>
        {/* PRODUCT TABLE */}
        <div className='shrink-0 lg:flex-1 lg:min-h-0 p-2.5 sm:p-4'>
          <ProductTable items={items} totals={totals} />
        </div>

        {/* SUMMARY */}
        <div className='shrink-0 border-t border-zinc-800 bg-zinc-950/95 p-2.5 sm:p-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3'>
            {/* Card A: Sales → Cash Remit */}
            <BucketCard
              title='Sales → Cash Remit'
              accent='text-emerald-400'
              right={
                <span
                  className={`text-[9px] sm:text-[10px] font-medium tabular-nums shrink-0 ${cashMeta.color}`}
                >
                  {cashMeta.label} · {cashMeta.display}
                </span>
              }
            >
              <div className='flex justify-between items-baseline gap-2'>
                <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                  Sales Value
                </span>
                <span className='text-[11px] sm:text-xs font-semibold text-emerald-400 tabular-nums'>
                  {formatMoney(totalValue)}
                </span>
              </div>

              <InlineRemitRow remit={remit} />

              {hasCredit && (
                <div className='flex items-center gap-1.5'>
                  {creditUnpaid && (
                    <span className='text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-800/50 px-1.5 py-0.5 rounded font-medium'>
                      Credit Unpaid
                    </span>
                  )}
                  {creditPaid && (
                    <span className='text-[8px] sm:text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-800/50 px-1.5 py-0.5 rounded font-medium'>
                      Credit Paid
                    </span>
                  )}
                </div>
              )}

              <div className='pt-1.5 sm:pt-2 -mt-2 border-t border-zinc-800/60 space-y-1'>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-semibold'>
                    Total Cash Remit
                  </span>
                  <span className='text-xs sm:text-sm font-semibold text-teal-400 tabular-nums'>
                    {formatMoney(cashRemit)}
                  </span>
                </div>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                    {cashMeta.label}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-medium tabular-nums ${cashMeta.color}`}
                  >
                    {cashMeta.display}
                  </span>
                </div>
              </div>

              {hasCredit && onMarkCreditPaid && (
                <div className='pt-2 mt-1 border-t border-zinc-800/60'>
                  {creditUnpaid ? (
                    <button
                      onClick={handleMarkPaid}
                      disabled={busy}
                      className='w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-[11px] sm:text-xs font-medium py-1.5 sm:py-2.5 rounded-md transition shadow-md shadow-amber-600/20 disabled:opacity-40 disabled:cursor-not-allowed'
                    >
                      {busy ? (
                        <>
                          <TbLoader2 size={12} className='animate-spin' />
                          Marking…
                        </>
                      ) : (
                        <>
                          <TbCircleCheck size={12} />
                          Mark {formatMoney(credit)} Credit as Paid
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleUnmarkPaid}
                      disabled={busy}
                      className='w-full flex items-center justify-center gap-1.5 text-[10px] sm:text-xs text-zinc-500 hover:text-zinc-200 py-1.5 sm:py-2 rounded-md hover:bg-zinc-800/60 transition disabled:opacity-40'
                    >
                      {busy ? (
                        <>
                          <TbLoader2 size={12} className='animate-spin' />
                          Updating…
                        </>
                      ) : (
                        'Mark credit as unpaid'
                      )}
                    </button>
                  )}
                </div>
              )}
            </BucketCard>

            {/* Card B: Empties → Case Remit */}
            <BucketCard
              title='Empties → Case Remit'
              accent='text-amber-400'
              right={
                <span
                  className={`text-[9px] sm:text-[10px] font-medium tabular-nums shrink-0 ${caseMeta.color}`}
                >
                  {caseMeta.label} · {caseMeta.display}
                </span>
              }
            >
              <div className='flex justify-between items-baseline gap-2'>
                <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                  Empties Value
                </span>
                <span className='text-[11px] sm:text-xs font-semibold text-amber-400 tabular-nums'>
                  {formatMoney(totalEmpties)}
                </span>
              </div>

              <div className='pt-1.5 sm:pt-2 mt-1 border-t border-zinc-800/60 space-y-1'>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-400/80 font-semibold'>
                    Case Remit
                  </span>
                  <span className='text-[11px] sm:text-xs text-amber-400 font-medium tabular-nums'>
                    {formatMoney(caseRemit)}
                  </span>
                </div>
              </div>

              <div className='pt-1.5 sm:pt-2 mt-1 border-t border-zinc-800/60 space-y-1'>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-400 font-semibold'>
                    Total Case Remit
                  </span>
                  <span className='text-xs sm:text-sm font-semibold text-teal-400 tabular-nums'>
                    {formatMoney(caseRemit)}
                  </span>
                </div>
                <div className='flex justify-between items-baseline gap-2'>
                  <span className='text-[10px] sm:text-[11px] text-zinc-500'>
                    {caseMeta.label}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-medium tabular-nums ${caseMeta.color}`}
                  >
                    {caseMeta.display}
                  </span>
                </div>
              </div>
            </BucketCard>
          </div>
        </div>
      </div>
    </div>
  )
}
