import { TbX } from 'react-icons/tb'
import { calcItemCases, formatDate, formatMoney } from '../utils/inventory'

function Dashed ({ className = '' }) {
  return (
    <div className={`border-t border-dashed border-zinc-700/60 ${className}`} />
  )
}

function Solid ({ className = '' }) {
  return <div className={`border-t border-zinc-700 ${className}`} />
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

function EntryReceipt ({ entry }) {
  const totalCases = entry.items.reduce(
    (sum, item) => sum + calcItemCases(item),
    0
  )

  return (
    <div className='flex flex-col items-stretch'>
      <TearEdge position='top' />

      <div className='bg-zinc-950 border-x border-zinc-800 px-3 sm:px-4 py-3 sm:py-4 font-mono'>
        <div className='text-center'>
          <div className='font-semibold text-xs sm:text-sm text-zinc-100 uppercase tracking-[0.15em]'>
            Stock Entry
          </div>
          <div className='text-[10px] sm:text-xs text-zinc-500 mt-1 tabular-nums'>
            {formatDate(entry.createdAt || entry.date)}
          </div>
        </div>

        <Dashed className='my-3 sm:my-4' />

        {entry.items.length > 0 ? (
          <div className='space-y-2.5 sm:space-y-3'>
            {entry.items.map((item, i) => {
              const subtotal =
                (Number(item.quantity) || 0) *
                (Number(item.price_per_case) || 0)
              const discount = Number(item.discount) || 0
              const lineTotal = subtotal - discount

              return (
                <div key={i}>
                  <div className='flex justify-between items-baseline gap-2'>
                    <span className='text-xs sm:text-sm text-zinc-100 truncate'>
                      {item.product_name}
                    </span>
                    <span className='text-xs sm:text-sm text-zinc-100 tabular-nums shrink-0'>
                      {formatMoney(lineTotal)}
                    </span>
                  </div>
                  <div className='flex justify-between items-baseline gap-2 mt-1'>
                    <span className='text-[10px] sm:text-xs text-zinc-500 tabular-nums pl-0.5'>
                      {item.quantity} cases
                      {Number(item.promo) > 0 && ` + ${item.promo} free`}
                    </span>
                    {discount > 0 && (
                      <span className='text-[10px] sm:text-xs text-rose-400 tabular-nums shrink-0'>
                        − {formatMoney(discount)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='text-center text-[10px] sm:text-xs text-zinc-600 py-3'>
            No items
          </div>
        )}

        <Dashed className='my-3 sm:my-4' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-[10px] sm:text-xs uppercase tracking-[0.14em] text-zinc-500'>
            Cases
          </span>
          <span className='text-xs sm:text-sm text-zinc-300 tabular-nums'>
            {totalCases}
          </span>
        </div>

        <Solid className='my-2 sm:my-3' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-xs sm:text-sm uppercase tracking-[0.12em] text-zinc-300 font-semibold'>
            Net Amount
          </span>
          <span className='text-base sm:text-lg font-bold text-emerald-400 tabular-nums'>
            {formatMoney(entry.net_amount)}
          </span>
        </div>
      </div>

      <TearEdge position='bottom' />
    </div>
  )
}

export default function RecentEntries ({ entries, onClose }) {
  return (
    <>
      <div className='flex items-center justify-between mb-2 sticky top-0 bg-zinc-900 z-10 pb-2'>
        <div className='text-[10px] sm:text-[11px] uppercase tracking-wide text-zinc-500'>
          Recent Entries
        </div>
        <div className='flex items-center gap-1.5'>
          {entries.length > 0 && (
            <span className='text-[9px] sm:text-[10px] bg-zinc-800 text-zinc-400 px-1.5 sm:px-2 py-0.5 rounded tabular-nums'>
              {entries.length}
            </span>
          )}
          {onClose && (
            <button
              type='button'
              onClick={onClose}
              className='p-1 -m-1 text-zinc-500 hover:text-zinc-100 transition'
              aria-label='Close'
            >
              <TbX size={16} />
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <div className='px-3 py-10 sm:py-12 text-center text-zinc-600 text-xs sm:text-sm'>
          No entries yet.
        </div>
      ) : (
        <div className='space-y-2.5 sm:space-y-3 pb-1'>
          {entries.map(entry => (
            <EntryReceipt key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </>
  )
}
