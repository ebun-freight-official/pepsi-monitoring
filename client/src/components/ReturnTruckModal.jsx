import { useState, useEffect } from 'react'
import { TbX } from 'react-icons/tb'

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500'

const labelClass = 'block text-xs uppercase tracking-wide text-slate-500 mb-1'

export default function ReturnTruckModal ({
  isOpen,
  onClose,
  onReturn,
  deployment
}) {
  const [returns, setReturns] = useState([])

  useEffect(() => {
    if (isOpen && deployment) {
      setReturns(
        deployment.items.map(item => ({
          product_name: item.product_name,
          cases_deployed: item.cases,
          cases_returned: item.cases
        }))
      )
    }
  }, [isOpen, deployment])

  if (!isOpen || !deployment) return null

  const updateReturned = (index, value) => {
    const max = returns[index].cases_deployed
    const num = Math.min(Math.max(Number(value) || 0, 0), max)
    setReturns(prev =>
      prev.map((r, i) => (i === index ? { ...r, cases_returned: num } : r))
    )
  }

  const totalDeployed = returns.reduce((sum, r) => sum + r.cases_deployed, 0)
  const totalReturned = returns.reduce((sum, r) => sum + r.cases_returned, 0)
  const totalSold = totalDeployed - totalReturned

  const handleSubmit = event => {
    event.preventDefault()
    if (onReturn(deployment.id, returns)) onClose()
  }

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-slate-900 outline outline-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl'>
        <div className='flex justify-between items-center px-4 py-3 border-b border-slate-800'>
          <div>
            <div className='uppercase font-medium text-sm tracking-wide'>
              Truck Return
            </div>
            <div className='text-xs text-slate-500 mt-0.5'>
              {deployment.truck} · {deployment.date}
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-slate-500 hover:text-slate-100 transition'
          >
            <TbX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col overflow-hidden'>
          <div className='p-4 overflow-auto space-y-3'>
            <div className='text-xs text-slate-500'>
              Enter the remaining cases left in the truck. The sold count will
              be calculated automatically.
            </div>

            {returns.map((item, index) => {
              const sold = item.cases_deployed - item.cases_returned
              return (
                <div
                  key={index}
                  className='bg-slate-950/60 border border-slate-800 rounded-lg p-3'
                >
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm font-medium text-slate-100'>
                      {item.product_name}
                    </span>
                    <span className='text-[11px] uppercase tracking-wide text-slate-500'>
                      {item.cases_deployed} cases loaded
                    </span>
                  </div>

                  <div className='grid grid-cols-12 gap-3 items-end'>
                    <div className='col-span-6 sm:col-span-4'>
                      <label className={labelClass}>Remaining</label>
                      <input
                        type='number'
                        min='0'
                        max={item.cases_deployed}
                        step='1'
                        value={item.cases_returned}
                        onChange={e => updateReturned(index, e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div className='col-span-6 sm:col-span-4'>
                      <label className={labelClass}>Sold</label>
                      <div className='px-3 py-1.5 text-sm rounded-md border border-emerald-800 text-emerald-400 bg-emerald-500/10'>
                        {sold}
                      </div>
                    </div>

                    <div className='col-span-12 sm:col-span-4'>
                      <label className={labelClass}>Bottles Sold</label>
                      <div className='px-3 py-1.5 text-sm rounded-md border border-slate-800 text-sky-400 bg-slate-950'>
                        {sold * (Number(item.unit) || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className='px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3'>
            <div className='flex gap-4 text-xs'>
              <span className='text-slate-500'>
                Deployed:{' '}
                <span className='text-slate-300 font-medium'>
                  {totalDeployed}
                </span>
              </span>
              <span className='text-slate-500'>
                Returned:{' '}
                <span className='text-amber-400 font-medium'>
                  {totalReturned}
                </span>
              </span>
              <span className='text-slate-500'>
                Sold:{' '}
                <span className='text-emerald-400 font-medium'>
                  {totalSold}
                </span>
              </span>
            </div>

            <div className='flex gap-2 w-full sm:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 font-medium transition'
              >
                Confirm Return
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
