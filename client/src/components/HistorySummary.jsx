import {
  TbTruck,
  TbCurrencyPeso,
  TbTrendingUp,
  TbAlertTriangle,
  TbClock
} from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'

function Stat ({
  icon,
  label,
  value,
  valueNode,
  sub,
  subColor = 'text-zinc-500',
  accent = 'text-zinc-100',
  iconBg = 'bg-zinc-800/60'
}) {
  return (
    <div className='flex items-start gap-2 sm:gap-2.5 min-w-0 px-2 sm:px-3 py-2 sm:py-2.5'>
      <div
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${accent}`}
      >
        {icon}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
          {label}
        </div>
        <div
          className={`text-sm sm:text-base font-semibold tabular-nums truncate leading-tight mt-0.5 ${accent}`}
        >
          {valueNode || value}
        </div>
        {sub && (
          <div
            className={`text-[9px] sm:text-[10px] tabular-nums truncate mt-0.5 ${subColor}`}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowValue ({ from, to, fromClass, toClass }) {
  return (
    <span className='inline-flex items-baseline gap-1 whitespace-nowrap'>
      <span className={fromClass}>{from}</span>
      <span className='text-zinc-600 font-normal'>→</span>
      <span className={toClass}>{to}</span>
    </span>
  )
}

const diffMeta = diff => {
  const isExact = Math.abs(diff) < 0.01
  const isOver = diff > 0.01
  if (isExact) return { text: 'exact', color: 'text-zinc-500' }
  if (isOver)
    return {
      text: `+${formatMoney(diff)} over`,
      color: 'text-emerald-400'
    }
  return {
    text: `${formatMoney(Math.abs(diff))} short`,
    color: 'text-rose-400'
  }
}

export default function HistorySummary ({ deployments }) {
  const summary = deployments.reduce(
    (acc, d) => {
      const items = d.returnItems || []
      const soldValue = items.reduce(
        (s, i) => s + (Number(i.value_sold) || 0),
        0
      )
      const emptiesValue = items.reduce(
        (s, i) => s + (Number(i.empties_sold) || 0),
        0
      )
      const r = d.remit || {}
      const cashRemit =
        (Number(r.cash) || 0) + (Number(r.gcash) || 0) + (Number(r.credit) || 0)
      const caseRemit = Number(r.case_remit) || 0

      acc.trips += 1
      acc.sales += soldValue
      acc.empties += emptiesValue
      acc.cashRemit += cashRemit
      acc.caseRemit += caseRemit
      if (Number(r.credit) > 0 && !r.credit_paid) {
        acc.creditOutstanding += Number(r.credit) || 0
        acc.unpaidCreditCount += 1
      }
      return acc
    },
    {
      trips: 0,
      sales: 0,
      empties: 0,
      cashRemit: 0,
      caseRemit: 0,
      creditOutstanding: 0,
      unpaidCreditCount: 0
    }
  )

  const cashDiff = summary.cashRemit - summary.sales
  const caseDiff = summary.caseRemit - summary.empties

  const cashMeta = diffMeta(cashDiff)
  const caseMeta = diffMeta(caseDiff)

  const netDiff = cashDiff + caseDiff
  const netColor =
    Math.abs(netDiff) < 0.01
      ? 'text-zinc-300'
      : netDiff > 0
      ? 'text-emerald-400'
      : 'text-rose-400'

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 divide-x divide-zinc-800/60 rounded-md border border-zinc-800 bg-zinc-950/60'>
      <Stat
        icon={<TbTruck size={14} />}
        label='Trips'
        value={formatNumber(summary.trips)}
        sub='completed returns'
        accent='text-blue-400'
        iconBg='bg-blue-500/10'
      />

      <Stat
        icon={<TbCurrencyPeso size={14} />}
        label='Sales → Cash Remit'
        valueNode={
          <ArrowValue
            from={formatMoney(summary.sales)}
            to={formatMoney(summary.cashRemit)}
            fromClass='text-emerald-400'
            toClass='text-teal-400'
          />
        }
        sub={cashMeta.text}
        subColor={cashMeta.color}
        accent='text-emerald-400'
        iconBg='bg-emerald-500/10'
      />

      <Stat
        icon={<TbCurrencyPeso size={14} />}
        label='Empties → Case Remit'
        valueNode={
          <ArrowValue
            from={formatMoney(summary.empties)}
            to={formatMoney(summary.caseRemit)}
            fromClass='text-amber-400'
            toClass='text-teal-400'
          />
        }
        sub={caseMeta.text}
        subColor={caseMeta.color}
        accent='text-amber-400'
        iconBg='bg-amber-500/10'
      />

      <Stat
        icon={<TbTrendingUp size={14} />}
        label='Net Difference'
        value={
          Math.abs(netDiff) < 0.01
            ? formatMoney(0)
            : `${netDiff > 0 ? '+' : ''}${formatMoney(netDiff)}`
        }
        accent={netColor}
        iconBg='bg-zinc-800/60'
      />

      <Stat
        icon={
          summary.unpaidCreditCount > 0 ? (
            <TbAlertTriangle size={14} />
          ) : (
            <TbClock size={14} />
          )
        }
        label='Credit Outstanding'
        value={formatMoney(summary.creditOutstanding)}
        sub={
          summary.unpaidCreditCount > 0
            ? `${summary.unpaidCreditCount} trip${
                summary.unpaidCreditCount === 1 ? '' : 's'
              } unpaid`
            : 'all settled'
        }
        accent={
          summary.unpaidCreditCount > 0 ? 'text-amber-400' : 'text-zinc-400'
        }
        iconBg={
          summary.unpaidCreditCount > 0 ? 'bg-amber-500/10' : 'bg-zinc-800/60'
        }
      />
    </div>
  )
}
