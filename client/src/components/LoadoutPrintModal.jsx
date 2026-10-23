import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TbPrinter, TbLoader2, TbCheck, TbTruck } from 'react-icons/tb'
import { formatMoney, formatNumber, formatDate } from '../utils/inventory'
import { EMPTIES_RATES } from '../data/bottleSizes'
import ebunLogo from '../assets/EBUN_NO_SLOGAN.png'

export default function LoadoutPrintModal ({
  isOpen,
  onClose,
  truck,
  loadout = [],
  stocks = [],
  onMarkPrinted
}) {
  const [busy, setBusy] = useState(false)
  const [printed, setPrinted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setBusy(false)
      setPrinted(false)
      setError('')
    }
  }, [isOpen, truck])

  if (!isOpen) return null

  const enriched = loadout.map((i, idx) => {
    const stock = stocks.find(s => s.product_name === i.product_name)
    const price = stock ? Number(stock.price_per_case) || 0 : 0
    const cases = Number(i.cases) || 0
    return {
      ...i,
      idx: idx + 1,
      cases,
      price,
      total: cases * price
    }
  })

  const totalCases = enriched.reduce((s, i) => s + i.cases, 0)
  const totalValue = enriched.reduce((s, i) => s + i.total, 0)

  const handlePrint = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      // Trigger browser print (blocks until dialog closes on most browsers)
      window.print()
      // Mark as printed on the server
      const ok = await onMarkPrinted()
      if (ok === false) {
        setError('Failed to record the print. Please try again.')
        setBusy(false)
        return
      }
      setPrinted(true)
      // Auto-close after brief success flash
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err) {
      setError(err.message || 'Print failed')
      setBusy(false)
    }
  }

  return createPortal(
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          body > #loadout-print-root { display: block !important; }
          #loadout-print-root .print-chrome { display: none !important; }
          #loadout-print-root {
            position: static !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          #loadout-print-root .loadout-sheet {
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          @page { margin: 10mm; }
        }
      `}</style>

      <div
        id='loadout-print-root'
        className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto'
      >
        {/* Print chrome (hidden on print) */}
        <div className='print-chrome fixed top-4 right-4 z-[60] flex items-center gap-2'>
          {printed ? (
            <div className='flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow-lg'>
              <TbCheck size={16} />
              Marked as printed
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={busy}
                className='px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm font-medium transition shadow-lg disabled:opacity-40'
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                disabled={busy}
                className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition shadow-lg disabled:opacity-40 flex items-center gap-2'
              >
                {busy ? (
                  <>
                    <TbLoader2 size={14} className='animate-spin' />
                    Printing…
                  </>
                ) : (
                  <>
                    <TbPrinter size={14} />
                    Print / Save PDF
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {error && (
          <div className='print-chrome fixed top-4 left-4 z-[60] bg-rose-600 text-white px-4 py-2 rounded-md text-sm shadow-lg max-w-sm'>
            {error}
          </div>
        )}

        {/* The printable sheet */}
        <div className='loadout-sheet bg-white text-black max-w-3xl w-full rounded-lg shadow-2xl overflow-hidden my-8'>
          {/* Header */}
          <div className='p-6 border-b-2 border-black'>
            <div className='flex justify-between items-center gap-4'>
              <img
                src={ebunLogo}
                alt='Ebun'
                className='h-14 max-w-[220px] object-contain'
                draggable={false}
              />
              <div className='text-right'>
                <div className='text-lg font-bold uppercase tracking-wider text-gray-900'>
                  Loadout Sheet
                </div>
                <div className='text-base font-semibold text-gray-800 mt-0.5 uppercase'>
                  {truck}
                </div>
                <div className='text-xs text-gray-600 mt-0.5 tabular-nums'>
                  {formatDate(new Date())}
                </div>
              </div>
            </div>
          </div>

          {/* Products table */}
          <div className='p-6'>
            <div className='text-[10px] uppercase tracking-wider font-bold text-gray-700 mb-2'>
              Products
            </div>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-100'>
                  <th className='border border-black px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide w-10'>
                    #
                  </th>
                  <th className='border border-black px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide'>
                    Product
                  </th>
                  <th className='border border-black px-2 py-1.5 text-right text-[11px] font-bold uppercase tracking-wide w-20'>
                    Qty
                  </th>
                  <th className='border border-black px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide w-24'>
                    Return
                  </th>
                  <th className='border border-black px-2 py-1.5 text-right text-[11px] font-bold uppercase tracking-wide w-24'>
                    Price
                  </th>
                  <th className='border border-black px-2 py-1.5 text-right text-[11px] font-bold uppercase tracking-wide w-28'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(item => (
                  <tr key={item.product_name}>
                    <td className='border border-black px-2 py-2 text-xs text-gray-600'>
                      {item.idx}
                    </td>
                    <td className='border border-black px-2 py-2 text-xs font-medium'>
                      {item.product_name}
                    </td>
                    <td className='border border-black px-2 py-2 text-xs text-right tabular-nums'>
                      {formatNumber(item.cases)}
                    </td>
                    <td className='border border-black px-2 py-2 h-8' />
                    <td className='border border-black px-2 py-2 text-xs text-right tabular-nums'>
                      {formatMoney(item.price)}
                    </td>
                    <td className='border border-black px-2 py-2 text-xs text-right tabular-nums font-medium'>
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}
                <tr className='bg-gray-100 font-bold'>
                  <td
                    className='border border-black px-2 py-2 text-xs uppercase'
                    colSpan={2}
                  >
                    Total
                  </td>
                  <td className='border border-black px-2 py-2 text-xs text-right tabular-nums'>
                    {formatNumber(totalCases)}
                  </td>
                  <td className='border border-black px-2 py-2' />
                  <td className='border border-black px-2 py-2' />
                  <td className='border border-black px-2 py-2 text-xs text-right tabular-nums'>
                    {formatMoney(totalValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Empties Received */}
          <div className='px-6 pb-6'>
            <div className='text-[10px] uppercase tracking-wider font-bold text-gray-700 mb-2'>
              Empties Received
            </div>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-100'>
                  <th className='border border-black px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide'>
                    Bottle Size
                  </th>
                  <th className='border border-black px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide w-32'>
                    Full Case
                  </th>
                  <th className='border border-black px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide w-32'>
                    Case Only
                  </th>
                  <th className='border border-black px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide w-32'>
                    Bottles Only
                  </th>
                </tr>
              </thead>
              <tbody>
                {EMPTIES_RATES.fullCase.map(r => (
                  <tr key={r.id}>
                    <td className='border border-black px-2 py-3 text-xs font-medium'>
                      {r.label}
                    </td>
                    <td className='border border-black px-2 py-3 h-10' />
                    <td className='border border-black px-2 py-3 h-10' />
                    <td className='border border-black px-2 py-3 h-10' />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className='px-6 pb-6'>
            <div className='grid grid-cols-2 gap-8 mt-4'>
              <div>
                <div className='h-12 border-b border-black' />
                <div className='text-[10px] uppercase tracking-wide text-gray-600 mt-1'>
                  Prepared By / Signature
                </div>
              </div>
              <div>
                <div className='h-12 border-b border-black' />
                <div className='text-[10px] uppercase tracking-wide text-gray-600 mt-1'>
                  Agent / Driver Signature
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='px-6 pb-4 border-t border-gray-300 pt-3'>
            <div className='text-[10px] text-gray-500 text-center'>
              System Generated · {formatDate(new Date())} · Pepsi Inventory
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
