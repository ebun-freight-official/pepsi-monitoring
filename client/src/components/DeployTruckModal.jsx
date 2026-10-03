import { useState, useEffect } from 'react'
import { TbX, TbPlus, TbTrash } from 'react-icons/tb'
import { TRUCKS, createEmptyDeployItem } from '../utils/inventory'

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500'

const labelClass = 'block text-xs uppercase tracking-wide text-slate-500 mb-1'

export default function DeployTruckModal ({
  isOpen,
  onClose,
  onDeploy,
  stocks
}) {
  const [truck, setTruck] = useState(TRUCKS[0])
  const [items, setItems] = useState([createEmptyDeployItem()])

  useEffect(() => {
    if (isOpen) {
      setTruck(TRUCKS[0])
      setItems([createEmptyDeployItem()])
    }
  }, [isOpen])

  if (!isOpen) return null

  const updateItem = (index, field, value) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const addItem = () => setItems([...items, createEmptyDeployItem()])

  const removeItem = index => setItems(items.filter((_, i) => i !== index))

  const getAvailable = productName => {
    const stock = stocks.find(s => s.product_name === productName)
    return stock ? Number(stock.quantity) || 0 : 0
  }

  const validate = () => {
    const grouped = {}
    items.forEach(i => {
      if (!i.product_name) return
      grouped[i.product_name] =
        (grouped[i.product_name] || 0) + (Number(i.cases) || 0)
    })

    for (const [name, total] of Object.entries(grouped)) {
      if (total > getAvailable(name)) return false
    }
    return Object.keys(grouped).length > 0
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (!validate()) return
    if (onDeploy(truck, items)) onClose()
  }

  const canSubmit = validate()

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-slate-900 outline outline-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl'>
        <div className='flex justify-between items-center px-4 py-3 border-b border-slate-800'>
          <div className='uppercase font-medium text-sm tracking-wide'>
            Deploy Truck
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
            <div>
              <label className={labelClass}>Select Truck</label>
              <select
                value={truck}
                onChange={e => setTruck(e.target.value)}
                className={inputClass}
              >
                {TRUCKS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {stocks.length === 0 && (
              <div className='text-center text-slate-600 text-sm py-4'>
                No stocks available to deploy. Add stocks first.
              </div>
            )}

            {stocks.length > 0 &&
              items.map((item, index) => {
                const available = getAvailable(item.product_name)
                const exceeds =
                  item.product_name && Number(item.cases) > available

                return (
                  <div
                    key={index}
                    className='bg-slate-950/60 border border-slate-800 rounded-lg p-3'
                  >
                    <div className='flex justify-between items-center mb-2'>
                      <span className='text-[11px] uppercase tracking-wide text-slate-500'>
                        Load {index + 1}
                      </span>

                      {items.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeItem(index)}
                          className='text-slate-500 hover:text-rose-400 transition'
                          title='Remove'
                        >
                          <TbTrash size={16} />
                        </button>
                      )}
                    </div>

                    <div className='grid grid-cols-12 gap-3 items-end'>
                      <div className='col-span-12 sm:col-span-7'>
                        <label className={labelClass}>Product</label>
                        <select
                          value={item.product_name}
                          onChange={e =>
                            updateItem(index, 'product_name', e.target.value)
                          }
                          className={inputClass}
                          required
                        >
                          <option value=''>— Select product —</option>
                          {stocks.map(s => (
                            <option key={s.id} value={s.product_name}>
                              {s.product_name} ({s.quantity} cases available)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className='col-span-6 sm:col-span-3'>
                        <label className={labelClass}>Cases</label>
                        <input
                          type='number'
                          min='1'
                          step='1'
                          value={item.cases}
                          onChange={e =>
                            updateItem(index, 'cases', e.target.value)
                          }
                          className={inputClass}
                        />
                      </div>

                      <div className='col-span-6 sm:col-span-2'>
                        <label className={labelClass}>Available</label>
                        <div
                          className={`px-3 py-1.5 text-sm rounded-md border ${
                            exceeds
                              ? 'border-rose-700 text-rose-400 bg-rose-500/10'
                              : 'border-slate-800 text-slate-400 bg-slate-950'
                          }`}
                        >
                          {item.product_name ? available : '—'}
                        </div>
                      </div>
                    </div>

                    {exceeds && (
                      <div className='text-xs text-rose-400 mt-2'>
                        Not enough stock for {item.product_name}. Only{' '}
                        {available} cases available.
                      </div>
                    )}
                  </div>
                )
              })}

            {stocks.length > 0 && (
              <button
                type='button'
                onClick={addItem}
                className='w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 text-sm py-2 rounded-lg transition'
              >
                <TbPlus size={16} />
                Add another product
              </button>
            )}
          </div>

          <div className='px-4 py-3 border-t border-slate-800 flex justify-end gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!canSubmit}
              className='px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed'
            >
              Deploy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
