import { TbX, TbPackage } from 'react-icons/tb'
import { formatMoney, formatNumber } from '../utils/inventory'
import { findBottleSize } from '../data/bottleSizes'

function SectionCard ({ title, accent, children }) {
  return (
    <div className='rounded-md border border-zinc-800 bg-zinc-950/60 overflow-hidden'>
      <div className='flex justify-between items-center px-2 sm:px-3 py-1.5 sm:py-2 border-b border-zinc-800 bg-zinc-900/60'>
        <span
          className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold ${accent}`}
        >
          {title}
        </span>
      </div>
      <div className='p-2 sm:p-3 space-y-1.5 sm:space-y-2'>{children}</div>
    </div>
  )
}

function Row ({ label, value, valueClass = 'text-zinc-100', extra }) {
  return (
    <div className='flex justify-between items-baseline gap-2'>
      <span className='text-[10px] sm:text-[11px] text-zinc-500'>{label}</span>
      <div className='flex items-baseline gap-1.5 min-w-0'>
        {extra}
        <span
          className={`text-[11px] sm:text-xs tabular-nums shrink-0 ${valueClass}`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export default function ProductDetailsModal ({ isOpen, onClose, row }) {
  if (!isOpen || !row) return null

  const {
    stock,
    inHouse,
    free,
    onTruck,
    totalOwned,
    sold,
    soldValue,
    unit,
    price,
    emptiesPer,
    stockValue,
    isOut,
    isLow
  } = row

  const bs = findBottleSize(stock.bottle_size)
  const pricePerBottle = unit > 0 ? price / unit : 0
  const emptiesTotal = sold * emptiesPer

  const statusBadge = isOut
    ? { label: 'Out', cls: 'bg-rose-500/15 text-rose-400' }
    : isLow
    ? { label: 'Low', cls: 'bg-amber-500/15 text-amber-400' }
    : { label: 'In Stock', cls: 'bg-emerald-500/15 text-emerald-400' }

  return (
    <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-md max-h-[80dvh] sm:max-h-[80vh] flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='uppercase font-medium text-sm tracking-wide truncate'>
              {stock.product_name}
            </span>
            <span
              className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold shrink-0 whitespace-nowrap ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className='p-1 -m-1 text-zinc-500 hover:text-zinc-100 transition shrink-0'
            aria-label='Close'
          >
            <TbX size={18} />
          </button>
        </div>

        {/* Meta strip */}
        <div className='shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-zinc-800/60 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-500'>
          <span>{bs ? bs.label : '—'}</span>
          {bs?.isPlastic && (
            <span className='text-[9px] uppercase tracking-wide text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded font-medium'>
              Plastic
            </span>
          )}
          <span className='text-zinc-700'>·</span>
          <span className='tabular-nums'>{formatNumber(unit)} btls/case</span>
        </div>

        {/* Body */}
        <div className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2 sm:space-y-2.5'>
          {/* PRICING */}
          <SectionCard title='Pricing' accent='text-emerald-400'>
            <Row
              label='Price / Case'
              value={formatMoney(price)}
              valueClass='text-emerald-400 font-semibold'
            />
            <Row
              label='Price / Bottle'
              value={formatMoney(pricePerBottle)}
              valueClass='text-zinc-300'
            />
            <Row
              label='Empties / Case'
              value={emptiesPer > 0 ? formatMoney(emptiesPer) : '—'}
              valueClass={emptiesPer > 0 ? 'text-amber-400' : 'text-zinc-600'}
            />
          </SectionCard>

          {/* STOCK */}
          <SectionCard title='Stock' accent='text-blue-400'>
            <Row
              label='In-House'
              value={formatNumber(inHouse)}
              valueClass={
                isOut
                  ? 'text-rose-400 font-semibold'
                  : isLow
                  ? 'text-amber-400 font-semibold'
                  : 'text-zinc-100 font-semibold'
              }
              extra={
                free > 0 && (
                  <span className='text-[10px] text-amber-300/80 tabular-nums'>
                    +{formatNumber(free)} free
                  </span>
                )
              }
            />
            <Row
              label='On Truck'
              value={formatNumber(onTruck)}
              valueClass='text-blue-400'
            />
            <div className='pt-1.5 mt-0.5 border-t border-zinc-800/60 space-y-1.5'>
              <Row
                label='Total Stock'
                value={formatNumber(totalOwned)}
                valueClass='text-zinc-100 font-semibold'
              />
              <Row
                label='Stock Value'
                value={formatMoney(stockValue)}
                valueClass='text-zinc-100 font-semibold'
              />
            </div>
          </SectionCard>

          {/* SALES */}
          <SectionCard title='Sales' accent='text-teal-400'>
            <Row
              label='Cases Sold'
              value={formatNumber(sold)}
              valueClass='text-emerald-400 font-semibold'
            />
            <Row
              label='Revenue'
              value={formatMoney(soldValue)}
              valueClass='text-emerald-400 font-semibold'
            />
            <Row
              label='Empties Value'
              value={emptiesTotal > 0 ? formatMoney(emptiesTotal) : '—'}
              valueClass={emptiesTotal > 0 ? 'text-amber-400' : 'text-zinc-600'}
            />
          </SectionCard>
        </div>

        {/* Footer */}
        <div className='shrink-0 border-t border-zinc-800 p-2.5 sm:p-3'>
          <button
            type='button'
            onClick={onClose}
            className='w-full border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2 sm:py-2.5 rounded-md transition text-zinc-300'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
