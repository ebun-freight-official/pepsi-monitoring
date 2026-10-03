import { useState, useEffect } from 'react'
import { TbX, TbPlus, TbTrash } from 'react-icons/tb'
import {
  createEmptyItem,
  calcEntryTotal,
  calcItemCases
} from '../utils/inventory'

const inputClass =
  'w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 uppercase focus:outline-none focus:border-indigo-500'

const labelClass = 'block text-xs uppercase tracking-wide text-slate-500 mb-1'

export default function NewEntryModal ({ isOpen, onClose, onSave }) {
  const [items, setItems] = useState([createEmptyItem()])
  const [netAmount, setNetAmount] = useState('0.00')

  useEffect(() => {
    if (isOpen) {
      setItems([createEmptyItem()])
      setNetAmount('0.00')
    }
  }, [isOpen])

  if (!isOpen) return null

  const updateItem = (index, field, value) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setItems(next)
    setNetAmount(calcEntryTotal(next).toFixed(2))
  }

  const addItem = () => setItems([...items, createEmptyItem()])

  const removeItem = index => {
    const next = items.filter((_, i) => i !== index)
    setItems(next)
    setNetAmount(calcEntryTotal(next).toFixed(2))
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (onSave(items, netAmount)) onClose()
  }

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-slate-900 outline outline-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl'>
        <div className='flex justify-between items-center px-4 py-3 border-b border-slate-800'>
          <div className='uppercase font-medium text-sm tracking-wide'>
            New Entry
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
            {items.map((item, index) => (
              <div
                key={index}
                className='bg-slate-950/60 border border-slate-800 rounded-lg p-3'
              >
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-[11px] uppercase tracking-wide text-slate-500'>
                    Product {index + 1}
                  </span>

                  {items.length > 1 && (
                    <button
                      type='button'
                      onClick={() => removeItem(index)}
                      className='text-slate-500 hover:text-rose-400 transition'
                      title='Remove product'
                    >
                      <TbTrash size={16} />
                    </button>
                  )}
                </div>

                <div className='grid grid-cols-12 gap-3'>
                  <div className='col-span-12 sm:col-span-4'>
                    <label className={labelClass}>Product Name</label>
                    <input
                      type='text'
                      value={item.product_name}
                      onChange={e =>
                        updateItem(index, 'product_name', e.target.value)
                      }
                      placeholder='e.g. Coke 1.5L'
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className='col-span-6 sm:col-span-2'>
                    <label className={labelClass}>Unit (btls/case)</label>
                    <input
                      type='number'
                      min='1'
                      step='1'
                      value={item.unit}
                      onChange={e => updateItem(index, 'unit', e.target.value)}
                      placeholder='24'
                      className={inputClass}
                    />
                  </div>

                  <div className='col-span-6 sm:col-span-2'>
                    <label className={labelClass}>Cases</label>
                    <input
                      type='number'
                      min='0'
                      step='1'
                      value={item.quantity}
                      onChange={e =>
                        updateItem(index, 'quantity', e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className='col-span-6 sm:col-span-2'>
                    <label className={labelClass}>Free Cases</label>
                    <input
                      type='number'
                      min='0'
                      step='1'
                      value={item.promo}
                      onChange={e => updateItem(index, 'promo', e.target.value)}
                      placeholder='0'
                      className={inputClass}
                    />
                  </div>

                  <div className='col-span-6 sm:col-span-2'>
                    <label className={labelClass}>Price / Case</label>
                    <input
                      type='number'
                      min='0'
                      step='0.01'
                      value={item.price_per_case}
                      onChange={e =>
                        updateItem(index, 'price_per_case', e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className='flex justify-between text-xs mt-2'>
                  <span className='text-slate-500'>
                    {item.quantity || 0} cases
                    {Number(item.promo) > 0 && (
                      <span className='text-amber-400'>
                        {` + ${item.promo} free`}
                      </span>
                    )}
                    {` = ${calcItemCases(item)} total · ${
                      calcItemCases(item) * (Number(item.unit) || 0)
                    } bottles`}
                  </span>
                  <span className='text-slate-500'>
                    Line total: ₱
                    {(
                      (Number(item.quantity) || 0) *
                      (Number(item.price_per_case) || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            <button
              type='button'
              onClick={addItem}
              className='w-full flex items-center justify-center gap-1.5 border border-dashed border-slate-700 hover:border-indigo-500 hover:text-indigo-400 text-slate-400 text-sm py-2 rounded-lg transition'
            >
              <TbPlus size={16} />
              Add another product
            </button>
          </div>

          <div className='px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3'>
            <div>
              <label className={labelClass}>Net Amount</label>
              <div className='flex items-center gap-1'>
                <span className='text-slate-400 text-sm'>₱</span>
                <input
                  type='number'
                  step='0.01'
                  value={netAmount}
                  onChange={e => setNetAmount(e.target.value)}
                  className='w-32 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-sm font-semibold text-emerald-400 uppercase focus:outline-none focus:border-indigo-500'
                />
              </div>
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
                className='flex-1 sm:flex-none px-4 py-2 text-sm rounded-md bg-indigo-600 hover:bg-indigo-500 font-medium transition'
              >
                Save Entry
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
