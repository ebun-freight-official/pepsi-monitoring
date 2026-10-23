import { TbChevronRight, TbAlertTriangle, TbCircleCheck } from 'react-icons/tb'
import { formatDate, formatMoney, formatNumber } from '../utils/inventory'

const diffMeta = diff => {
  const isExact = Math.abs(diff) < 0.01
  const isOver = diff > 0.01
  if (isExact) {
    return { display: formatMoney(0), color: 'text-zinc-500' }
  }
  if (isOver) {
    return { display: `+${formatMoney(diff)}`, color: 'text-emerald-400' }
  }
  return {
    display: `-${formatMoney(Math.abs(diff))}`,
    color: 'text-rose-400'
  }
}

export default function HistoryTable ({ deployments, onRowClick }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-auto h-full'>
      <table className='w-full min-w-[840px] text-xs sm:text-sm border-collapse'>
        <thead>
          <tr className='text-left text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500'>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium whitespace-nowrap'>
              Date
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium whitespace-nowrap'>
              Truck
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-center whitespace-nowrap'>
              Loaded
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-center whitespace-nowrap'>
              Returned
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-center whitespace-nowrap'>
              Sold
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-right whitespace-nowrap'>
              Sales ₱
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-right whitespace-nowrap'>
              Cash Remit
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-right whitespace-nowrap'>
              Empties ₱
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 px-2 sm:px-3 py-2 font-medium text-right whitespace-nowrap'>
              Case Remit
            </th>
            <th className='sticky top-0 z-10 bg-zinc-900 w-8' />
          </tr>
        </thead>
        <tbody>
          {deployments.map(d => {
            const items = d.returnItems || []
            const remit = d.remit || {
              cash: 0,
              gcash: 0,
              credit: 0,
              case_remit: 0,
              credit_paid: false
            }

            const loaded = items.reduce(
              (s, i) => s + (Number(i.cases_deployed) || 0),
              0
            )
            const returned = items.reduce(
              (s, i) => s + (Number(i.cases_returned) || 0),
              0
            )
            const sold = items.reduce(
              (s, i) => s + (Number(i.cases_sold) || 0),
              0
            )
            const value = items.reduce(
              (s, i) => s + (Number(i.value_sold) || 0),
              0
            )
            const empties = items.reduce(
              (s, i) => s + (Number(i.empties_sold) || 0),
              0
            )

            const caseRemit = Number(remit.case_remit) || 0
            const cashRemit =
              (Number(remit.cash) || 0) +
              (Number(remit.gcash) || 0) +
              (Number(remit.credit) || 0)

            const cashDiff = cashRemit - value
            const caseDiff = caseRemit - empties

            const cashMeta = diffMeta(cashDiff)
            const caseMeta = diffMeta(caseDiff)

            const hasCredit = Number(remit.credit) > 0
            const creditPaid = !!remit.credit_paid
            const creditUnpaid = hasCredit && !creditPaid

            return (
              <tr
                key={d._id}
                onClick={() => onRowClick(d)}
                className='border-t border-zinc-800 hover:bg-zinc-800/40 transition cursor-pointer group'
              >
                <td className='px-2 sm:px-3 py-2 text-zinc-400 text-[11px] sm:text-xs whitespace-nowrap tabular-nums'>
                  {formatDate(d.returned_at)}
                </td>

                <td className='px-2 sm:px-3 py-2'>
                  <div className='flex items-center gap-1.5 sm:gap-2 min-w-0'>
                    <span className='text-[11px] sm:text-xs font-medium text-zinc-100 uppercase truncate'>
                      {d.truck}
                    </span>
                    {creditUnpaid && (
                      <span className='flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-800/50 px-1 sm:px-1.5 py-0.5 rounded font-medium shrink-0'>
                        <TbAlertTriangle size={9} />
                        Credit
                      </span>
                    )}
                    {hasCredit && creditPaid && (
                      <span className='flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-800/50 px-1 sm:px-1.5 py-0.5 rounded font-medium shrink-0'>
                        <TbCircleCheck size={9} />
                        Credit Paid
                      </span>
                    )}
                  </div>
                </td>

                <td className='px-2 sm:px-3 py-2 text-center text-[11px] sm:text-xs text-blue-400 tabular-nums'>
                  {formatNumber(loaded)}
                </td>
                <td className='px-2 sm:px-3 py-2 text-center text-[11px] sm:text-xs text-amber-400 tabular-nums'>
                  {formatNumber(returned)}
                </td>
                <td className='px-2 sm:px-3 py-2 text-center text-[11px] sm:text-xs text-emerald-400 tabular-nums'>
                  {formatNumber(sold)}
                </td>

                <td className='px-2 sm:px-3 py-2 text-right text-[11px] sm:text-xs text-emerald-400 tabular-nums whitespace-nowrap'>
                  {formatMoney(value)}
                </td>

                <td className='px-2 sm:px-3 py-2 text-right tabular-nums'>
                  <div className='flex flex-col items-end leading-tight gap-0.5'>
                    <span className='text-[11px] sm:text-xs text-teal-400 font-medium whitespace-nowrap'>
                      {formatMoney(cashRemit)}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${cashMeta.color}`}
                    >
                      {cashMeta.display}
                    </span>
                  </div>
                </td>

                <td className='px-2 sm:px-3 py-2 text-right text-[11px] sm:text-xs text-amber-400 tabular-nums whitespace-nowrap'>
                  {formatMoney(empties)}
                </td>

                <td className='px-2 sm:px-3 py-2 text-right tabular-nums'>
                  <div className='flex flex-col items-end leading-tight gap-0.5'>
                    <span className='text-[11px] sm:text-xs text-teal-400 font-medium whitespace-nowrap'>
                      {formatMoney(caseRemit)}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${caseMeta.color}`}
                    >
                      {caseMeta.display}
                    </span>
                  </div>
                </td>

                <td className='pr-2 text-zinc-600 group-hover:text-zinc-300 transition'>
                  <TbChevronRight size={13} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
