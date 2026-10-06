import {
  calcItemCases,
  formatDate,
  formatMoney,
  formatNumber
} from '../utils/inventory'

export default function RecentEntries ({ entries }) {
  return (
    <>
      <div className='flex items-center justify-between mb-2 sticky top-0 bg-zinc-900 z-10 pb-2'>
        <div className='text-[11px] uppercase tracking-wide text-zinc-500'>
          Recent Entries
        </div>
        {entries.length > 0 && (
          <span className='text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded'>
            {entries.length}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className='px-3 py-12 text-center text-zinc-600 text-sm'>
          No entries yet.
        </div>
      ) : (
        entries.map(entry => {
          const entryCases = entry.items.reduce(
            (sum, item) => sum + calcItemCases(item),
            0
          )
          const entryBottles = entry.items.reduce(
            (sum, item) => sum + calcItemCases(item) * (Number(item.unit) || 0),
            0
          )

          return (
            <div
              key={entry.id}
              className='border border-zinc-800 bg-zinc-950/60 rounded-lg p-3 mb-2 hover:border-zinc-700 transition'
            >
              <div className='flex justify-between items-center text-xs text-zinc-500 mb-2'>
                <span className='truncate mr-2'>{formatDate(entry.date)}</span>
                <span className='text-emerald-400 font-medium text-sm shrink-0 tabular-nums'>
                  {formatMoney(entry.net_amount)}
                </span>
              </div>

              <div className='flex gap-2 text-[10px] text-zinc-500 mb-2'>
                <span className='text-blue-400 tabular-nums'>
                  {formatNumber(entryCases)} cases
                </span>
                <span>·</span>
                <span className='text-sky-400 tabular-nums'>
                  {formatNumber(entryBottles)} btls
                </span>
              </div>

              <div className='space-y-1'>
                {entry.items.map((item, i) => {
                  const lineTotal =
                    (Number(item.quantity) || 0) *
                    (Number(item.price_per_case) || 0)

                  return (
                    <div
                      key={i}
                      className='flex justify-between text-xs text-zinc-300 gap-2'
                    >
                      <span className='truncate'>
                        {item.product_name}
                        <span className='text-zinc-500'>
                          {' · '}
                          {formatNumber(item.quantity)} cases
                          {Number(item.promo) > 0 && (
                            <span className='text-amber-400'>
                              {` + ${formatNumber(item.promo)} free`}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className='text-zinc-400 shrink-0 tabular-nums'>
                        {formatMoney(lineTotal)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
