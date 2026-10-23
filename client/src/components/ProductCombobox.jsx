import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { TbChevronDown, TbSearch, TbCheck } from 'react-icons/tb'

/**
 * ProductCombobox
 * ─────────────────────────────────────────────────────────────────────
 * Type-to-filter dropdown for product selection.
 * Renders its dropdown via a portal so it never gets clipped by
 * modal/scroll containers.
 *
 * Props:
 *   value       – currently selected value (string)
 *   options     – [{ value, label, meta? }]
 *   onChange(v) – fires with the selected option's value
 *   placeholder – input placeholder
 *   disabled    – disables the input
 *   inputClassName – extra classes for the input (e.g. text size tweaks)
 */
export default function ProductCombobox ({
  value,
  options = [],
  onChange,
  placeholder = '— Search —',
  disabled = false,
  inputClassName = ''
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const [highlight, setHighlight] = useState(0)
  const [rect, setRect] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Keep input text in sync with external value when closed
  useEffect(() => {
    if (!open) setQuery(value || '')
  }, [value, open])

  // Position the portal dropdown
  useEffect(() => {
    if (!open) return
    const update = () => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDoc = e => {
      if (
        inputRef.current?.contains(e.target) ||
        dropdownRef.current?.contains(e.target)
      )
        return
      setOpen(false)
      setQuery(value || '')
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, value])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o =>
      `${o.label} ${o.value}`.toLowerCase().includes(q)
    )
  }, [options, query])

  useEffect(() => setHighlight(0), [query, open])

  const select = opt => {
    onChange(opt.value)
    setQuery(opt.value)
    setOpen(false)
  }

  const onKeyDown = e => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[highlight]) select(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery(value || '')
      e.stopPropagation()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !dropdownRef.current) return
    const el = dropdownRef.current.children[highlight]
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  return (
    <>
      <div className='relative'>
        <TbSearch
          size={13}
          className='absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
        />
        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete='off'
          className={`w-full bg-zinc-900 border border-zinc-700 rounded-md pl-7 pr-7 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 uppercase focus:outline-none focus:border-blue-500 transition ${inputClassName}`}
        />
        <TbChevronDown
          size={14}
          className={`absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </div>

      {open &&
        rect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: rect.top,
              left: rect.left,
              width: rect.width
            }}
            className='z-[100] max-h-56 overflow-auto bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl shadow-black/70'
          >
            {filtered.length === 0 ? (
              <div className='px-3 py-2.5 text-xs text-zinc-500'>
                No products match “{query}”
              </div>
            ) : (
              filtered.map((opt, i) => {
                const selected = opt.value === value
                return (
                  <button
                    type='button'
                    key={`${opt.value}-${i}`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => select(opt)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition ${
                      i === highlight
                        ? 'bg-blue-600/20 text-zinc-100'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className='truncate uppercase font-medium'>
                      {opt.label}
                    </span>
                    <span className='flex items-center gap-2 shrink-0'>
                      {opt.meta && (
                        <span className='text-[10px] text-zinc-500 tabular-nums'>
                          {opt.meta}
                        </span>
                      )}
                      {selected && (
                        <TbCheck size={12} className='text-blue-400' />
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>,
          document.body
        )}
    </>
  )
}
