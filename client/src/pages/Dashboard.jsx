import { useMemo, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router'
import ReactECharts from 'echarts-for-react'
import {
  TbCurrencyPeso,
  TbTrendingUp,
  TbTruck,
  TbAlertTriangle,
  TbChevronLeft,
  TbChevronRight,
  TbCheck,
  TbPackage,
  TbCreditCard,
  TbInfoCircle
} from 'react-icons/tb'
import { formatMoney, formatNumber, formatDate } from '../utils/inventory'
import {
  EMPTIES_RATES,
  EMPTIES_GROUPS,
  EMPTIES_GROUP_LABELS,
  calcEmptiesGroupSubtotal
} from '../data/bottleSizes'
import { api } from '../lib/api'

const LOW_STOCK_THRESHOLD = 30

const COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  teal: '#14b8a6',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  sky: '#0ea5e9',
  zinc: '#71717a'
}

const AGENT_PALETTE = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#14b8a6',
  '#8b5cf6',
  '#0ea5e9',
  '#f43f5e',
  '#84cc16',
  '#eab308',
  '#a855f7'
]

const withAlpha = (hex, alpha) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const chartTheme = {
  textColor: '#a1a1aa',
  axisColor: '#3f3f46',
  splitColor: '#27272a',
  tooltipBg: '#18181b',
  tooltipBorder: '#3f3f46'
}

const baseGrid = { top: 20, right: 16, bottom: 30, left: 50 }

function tooltipStyle () {
  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 639px)').matches

  return {
    show: !isMobile,
    backgroundColor: chartTheme.tooltipBg,
    borderColor: chartTheme.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: '#fafafa', fontSize: 12 },
    extraCssText: 'box-shadow: 0 10px 30px rgba(0,0,0,0.6);'
  }
}

function moneyAxisFormatter (v) {
  if (Math.abs(v) >= 1000) return `₱${(v / 1000).toFixed(0)}k`
  return `₱${v}`
}

const formatDateRange = (start, end) => {
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  if (sameMonth) {
    const mon = start.toLocaleDateString('en-US', { month: 'short' })
    return `${mon} ${start.getDate()}-${end.getDate()}`
  }
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
  return `${startStr}-${endStr}`
}

const formatCompactMoney = n => {
  const v = Number(n) || 0
  if (v === 0) return ''
  if (v >= 1_000_000) {
    return `₱${(Math.floor(v / 100_000) / 10).toFixed(1)}m`
  }
  if (v >= 1_000) {
    return `₱${(Math.floor(v / 100) / 10).toFixed(1)}k`
  }
  return `₱${Math.floor(v)}`
}

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

function InfoHint ({ children }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const iconRef = useRef(null)

  useEffect(() => {
    if (!open || !iconRef.current) return
    const update = () => {
      const r = iconRef.current.getBoundingClientRect()
      setRect({
        top: r.bottom + 6,
        right: Math.max(8, window.innerWidth - r.right)
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  return (
    <>
      <span
        ref={iconRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className='text-zinc-500 hover:text-zinc-200 cursor-help transition shrink-0'
        aria-label='Info'
      >
        <TbInfoCircle size={14} />
      </span>
      {open &&
        rect &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: rect.top,
              right: rect.right,
              maxWidth: '300px'
            }}
            className='z-[200] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-300 shadow-2xl shadow-black/70 normal-case tracking-normal font-normal text-left whitespace-normal'
          >
            {children}
          </div>,
          document.body
        )}
    </>
  )
}

function Panel ({ title, action, info, children, className = '' }) {
  return (
    <div
      className={`bg-zinc-950/60 border border-zinc-800 rounded-lg overflow-hidden flex flex-col min-h-0 shrink-0 ${className}`}
    >
      <div className='flex justify-between items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-zinc-800 bg-zinc-900/60 shrink-0'>
        <div className='text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-zinc-300 truncate'>
          {title}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {action}
          {info && <InfoHint>{info}</InfoHint>}
        </div>
      </div>
      <div className='flex-1 min-h-0 overflow-hidden'>{children}</div>
    </div>
  )
}

function KpiCard ({
  icon,
  label,
  value,
  sub,
  accent = 'text-zinc-100',
  iconBg = 'bg-zinc-800/60'
}) {
  return (
    <div className='relative overflow-hidden bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 sm:p-3.5 flex items-start gap-2 sm:gap-3 min-w-0'>
      <div
        className={`pointer-events-none absolute right-2 bottom-2 flex items-center justify-center opacity-20 [&>svg]:w-12 [&>svg]:h-12 sm:static sm:opacity-100 sm:w-9 sm:h-9 sm:rounded-lg sm:[&>svg]:w-[18px] sm:[&>svg]:h-[18px] ${accent} ${iconBg}`}
      >
        {icon}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 truncate'>
          {label}
        </div>
        <div
          className={`text-sm sm:text-lg font-semibold tabular-nums truncate leading-tight mt-0.5 ${accent}`}
        >
          {value}
        </div>
        {sub && (
          <div className='text-[9px] sm:text-[10px] text-zinc-500 tabular-nums truncate mt-0.5'>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

const RANGE_OPTIONS = [
  { value: 'day', label: 'Day', count: 14 },
  { value: 'week', label: 'Week', count: 12 },
  { value: 'month', label: 'Month', count: 12 }
]

function buildBuckets (rangeMode) {
  const rangeOpt =
    RANGE_OPTIONS.find(r => r.value === rangeMode) || RANGE_OPTIONS[0]
  const { count } = rangeOpt
  const unit = rangeMode

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const bucketDefs = []
  for (let i = count - 1; i >= 0; i--) {
    if (unit === 'day') {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `D-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      bucketDefs.push({
        start: d,
        end: d,
        key,
        shortLabel: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        fullLabel: d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      })
    } else if (unit === 'week') {
      const end = new Date(now)
      end.setDate(end.getDate() - i * 7)
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      const key = `W-${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
      bucketDefs.push({
        start,
        end,
        key,
        shortLabel: formatDateRange(start, end),
        fullLabel: `Week of ${formatDateRange(
          start,
          end
        )}, ${end.getFullYear()}`
      })
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
      const key = `M-${start.getFullYear()}-${start.getMonth()}`
      bucketDefs.push({
        start,
        end,
        key,
        shortLabel: start.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: start.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })
      })
    }
  }

  const findKey = date => {
    const dt = new Date(date)
    dt.setHours(0, 0, 0, 0)
    for (const b of bucketDefs) {
      if (dt >= b.start && dt <= b.end) return b.key
    }
    return null
  }

  return { bucketDefs, findKey }
}

function RangeTabs ({ rangeMode, setRangeMode }) {
  return (
    <div className='flex justify-end px-3 pt-3 pb-0'>
      <div className='flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-md p-0.5'>
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setRangeMode(opt.value)}
            className={`px-2 sm:px-2.5 py-1 rounded text-[9px] sm:text-[11px] font-medium transition ${
              rangeMode === opt.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function FooterStat ({ dotColor, label, value, valueClass }) {
  return (
    <div className='px-1.5 sm:px-4 py-2 sm:py-3 flex flex-col items-center min-w-0'>
      <div className='flex items-center gap-1 sm:gap-1.5 min-w-0 max-w-full'>
        {dotColor && (
          <span
            className='w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0'
            style={{ background: dotColor }}
          />
        )}
        <span className='text-[8px] sm:text-[9px] uppercase tracking-normal sm:tracking-wider text-zinc-500 truncate'>
          {label}
        </span>
      </div>
      <div
        className={`text-[11px] sm:text-sm font-semibold tabular-nums mt-0.5 sm:mt-1 truncate w-full text-center ${valueClass}`}
      >
        {value}
      </div>
    </div>
  )
}

function FooterGrid ({ cols = 3, children }) {
  const colClass =
    cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3'
  return (
    <div
      className={`grid ${colClass} divide-x divide-zinc-800/60 border-t border-zinc-800/60`}
    >
      {children}
    </div>
  )
}

function SalesTrendChart ({ deployments }) {
  const [rangeMode, setRangeMode] = useState('day')

  const data = useMemo(() => {
    const { bucketDefs, findKey } = buildBuckets(rangeMode)

    const buckets = {}
    bucketDefs.forEach(b => {
      buckets[b.key] = { sales: 0, remit: 0 }
    })

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const key = findKey(raw)
        if (!key) return

        const items = d.returnItems || []
        const goods = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)

        const r = d.remit || {}
        const cashRemit =
          (Number(r.cash) || 0) +
          (Number(r.gcash) || 0) +
          (Number(r.credit) || 0)

        buckets[key].sales += goods
        buckets[key].remit += cashRemit
      })

    const r2 = n => Math.round(n * 100) / 100

    const totalSales = bucketDefs.reduce((s, b) => s + buckets[b.key].sales, 0)
    const totalRemit = bucketDefs.reduce((s, b) => s + buckets[b.key].remit, 0)
    const totalDiff = totalSales - totalRemit

    return {
      labels: bucketDefs.map(b => b.shortLabel),
      fullLabels: bucketDefs.map(b => b.fullLabel),
      sales: bucketDefs.map(b => r2(buckets[b.key].sales)),
      remit: bucketDefs.map(b => r2(buckets[b.key].remit)),
      totalSales,
      totalRemit,
      totalDiff
    }
  }, [deployments, rangeMode])

  const hasData = data.sales.some(v => v > 0)

  if (!hasData) {
    return (
      <div className='flex flex-col h-full min-h-0'>
        <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />
        <div className='flex-1 flex items-center justify-center text-zinc-600 text-xs'>
          No sales data yet.
        </div>
      </div>
    )
  }

  const option = {
    grid: { ...baseGrid, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle(),
      formatter: params => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const dateLabel = data.fullLabels[idx]
        const sales = data.sales[idx] || 0
        const remit = data.remit[idx] || 0
        const diff = sales - remit

        const isExact = Math.abs(diff) < 0.01
        const isShort = diff > 0
        const diffColor = isExact ? '#a1a1aa' : isShort ? '#f43f5e' : '#10b981'
        const diffLabel = isExact ? 'Difference' : isShort ? 'Short' : 'Over'
        const diffSign = isExact ? '' : isShort ? '−' : '+'

        const row = (
          color,
          label,
          value,
          valueColor = '#fafafa',
          bold = false
        ) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};"></span>
              <span style="color:#a1a1aa;font-size:11px;">${label}</span>
            </span>
            <span style="color:${valueColor};font-weight:${
          bold ? 600 : 500
        };font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${value}</span>
          </div>`

        return `
          <div style="min-width:220px;">
            <div style="font-weight:600;color:#fafafa;font-size:12px;margin-bottom:6px;white-space:nowrap;">${dateLabel}</div>
            ${row('#10b981', 'Sales', formatMoney(sales), '#10b981', true)}
            ${row(
              '#14b8a6',
              'Cash Remit',
              formatMoney(remit),
              '#14b8a6',
              false
            )}
            <div style="border-top:1px solid #3f3f46;margin-top:8px;padding-top:6px;">
              ${row(
                diffColor,
                diffLabel,
                `${diffSign}${formatMoney(Math.abs(diff))}`,
                diffColor,
                true
              )}
            </div>
          </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: { color: chartTheme.textColor, fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: moneyAxisFormatter
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Sales',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: COLORS.emerald, width: 2 },
        itemStyle: { color: COLORS.emerald },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.25)' },
              { offset: 1, color: 'rgba(16,185,129,0)' }
            ]
          }
        },
        data: data.sales
      }
    ],
    animationDuration: 400
  }

  const totalIsExact = Math.abs(data.totalDiff) < 0.01
  const totalIsShort = data.totalDiff > 0
  const totalDiffColor = totalIsExact
    ? 'text-zinc-300'
    : totalIsShort
    ? 'text-rose-400'
    : 'text-emerald-400'

  return (
    <div className='flex flex-col h-full min-h-0'>
      <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />

      <div className='flex-1 min-h-[240px] relative'>
        <div className='absolute inset-0 overflow-x-auto'>
          <div className='h-full min-w-[640px] sm:min-w-0 p-3'>
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>
        </div>
      </div>

      <FooterGrid cols={3}>
        <FooterStat
          dotColor={COLORS.emerald}
          label='Total Sales'
          value={formatMoney(data.totalSales)}
          valueClass='text-emerald-400'
        />
        <FooterStat
          dotColor={COLORS.teal}
          label='Total Cash Remit'
          value={formatMoney(data.totalRemit)}
          valueClass='text-teal-400'
        />
        <FooterStat
          dotColor='#a1a1aa'
          label={totalIsExact ? 'Difference' : totalIsShort ? 'Short' : 'Over'}
          value={
            totalIsExact
              ? formatMoney(0)
              : `${totalIsShort ? '−' : '+'}${formatMoney(
                  Math.abs(data.totalDiff)
                )}`
          }
          valueClass={totalDiffColor}
        />
      </FooterGrid>
    </div>
  )
}

function DailyAgentPerformance ({ deployments }) {
  const chartRef = useRef(null)
  const downplayTimer = useRef(null)
  const lastHovered = useRef(null)
  const [rangeMode, setRangeMode] = useState('day')

  useEffect(() => {
    return () => {
      if (downplayTimer.current) clearTimeout(downplayTimer.current)
    }
  }, [])

  const data = useMemo(() => {
    const { bucketDefs, findKey } = buildBuckets(rangeMode)

    const buckets = {}
    bucketDefs.forEach(b => {
      buckets[b.key] = {}
    })
    const agents = new Set()

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const key = findKey(raw)
        if (!key) return

        const agent = (d.truck || '').toUpperCase() || 'UNKNOWN'
        agents.add(agent)

        const sales = (d.returnItems || []).reduce(
          (s, i) => s + (Number(i.value_sold) || 0),
          0
        )
        const r = d.remit || {}
        const remit =
          (Number(r.cash) || 0) +
          (Number(r.gcash) || 0) +
          (Number(r.credit) || 0)

        if (!buckets[key][agent]) buckets[key][agent] = { sales: 0, remit: 0 }
        buckets[key][agent].sales += sales
        buckets[key][agent].remit += remit
      })

    return {
      labels: bucketDefs.map(b => b.shortLabel),
      fullLabels: bucketDefs.map(b => b.fullLabel),
      agents: [...agents].sort(),
      buckets: bucketDefs.map(b => buckets[b.key]),
      unit: rangeMode
    }
  }, [deployments, rangeMode])

  if (data.agents.length === 0) {
    return (
      <div className='flex flex-col h-full min-h-0'>
        <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />
        <div className='flex-1 flex items-center justify-center text-zinc-600 text-xs'>
          No agent data yet.
        </div>
      </div>
    )
  }

  const areaTopAlpha = Math.max(
    0.06,
    Math.min(0.18, 0.24 / Math.max(1, data.agents.length))
  )

  const series = data.agents.map((agent, i) => {
    const color = AGENT_PALETTE[i % AGENT_PALETTE.length]
    return {
      name: `${agent} · Sales`,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      showSymbol: false,
      lineStyle: { color, width: 2 },
      itemStyle: {
        color,
        borderColor: '#09090b',
        borderWidth: 2
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: withAlpha(color, areaTopAlpha) },
            { offset: 1, color: withAlpha(color, 0) }
          ]
        }
      },
      emphasis: {
        focus: 'series',
        scale: 1.5
      },
      data: data.buckets.map(b => b[agent]?.sales || 0)
    }
  })

  const option = {
    grid: { ...baseGrid, bottom: 16 },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'line',
        lineStyle: { color: '#3f3f46', type: 'dashed' }
      },
      ...tooltipStyle(),
      formatter: params => {
        const arr = Array.isArray(params) ? params : [params]
        if (arr.length === 0) return ''

        const hovered = lastHovered.current
        const picked = hovered
          ? arr.find(p => p.seriesName === hovered) || arr[0]
          : arr[0]

        const idx = picked.dataIndex
        const dateLabel = data.fullLabels[idx]
        const [agent] = picked.seriesName.split(' · ')

        const dayData = data.buckets[idx] || {}
        const agentData = dayData[agent] || { sales: 0, remit: 0 }

        const agentIdx = data.agents.indexOf(agent)
        const color =
          agentIdx >= 0
            ? AGENT_PALETTE[agentIdx % AGENT_PALETTE.length]
            : picked.color

        const diff = agentData.sales - agentData.remit
        const isExact = Math.abs(diff) < 0.01
        const isShort = diff > 0
        const diffColor = isExact ? '#a1a1aa' : isShort ? '#f43f5e' : '#10b981'
        const diffLabel = isExact ? 'Difference' : isShort ? 'Short' : 'Over'
        const diffSign = isExact ? '' : isShort ? '−' : '+'

        const row = (label, value, valueColor = '#fafafa', bold = false) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="color:#a1a1aa;font-size:11px;white-space:nowrap;padding-left:14px;">${label}</span>
            <span style="color:${valueColor};font-weight:${
          bold ? 600 : 500
        };font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${value}</span>
          </div>`

        return `
          <div style="min-width:220px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};"></span>
              <span style="font-weight:600;color:#fafafa;font-size:12px;white-space:nowrap;">${agent}</span>
            </div>
            <div style="color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${dateLabel}</div>
            ${row('Sales', formatMoney(agentData.sales), '#10b981', true)}
            ${row('Cash Remit', formatMoney(agentData.remit), '#14b8a6', false)}
            <div style="border-top:1px solid #3f3f46;margin-top:8px;padding-top:6px;">
              ${row(
                diffLabel,
                `${diffSign}${formatMoney(Math.abs(diff))}`,
                diffColor,
                true
              )}
            </div>
          </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: { color: chartTheme.textColor, fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: moneyAxisFormatter
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series,
    animationDuration: 400
  }

  const onEvents = {
    mouseover: params => {
      if (downplayTimer.current) {
        clearTimeout(downplayTimer.current)
        downplayTimer.current = null
      }
      const chart = chartRef.current?.getEchartsInstance()
      if (!chart || !params?.seriesName) return

      lastHovered.current = params.seriesName

      chart.dispatchAction({ type: 'downplay' })
      chart.dispatchAction({
        type: 'highlight',
        seriesName: params.seriesName,
        dataIndex: params.dataIndex
      })
    },
    mouseout: () => {
      if (downplayTimer.current) clearTimeout(downplayTimer.current)
      downplayTimer.current = setTimeout(() => {
        const chart = chartRef.current?.getEchartsInstance()
        if (chart) chart.dispatchAction({ type: 'downplay' })
        downplayTimer.current = null
      }, 30)
    }
  }

  return (
    <div className='flex flex-col h-full min-h-0'>
      <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />

      <div className='flex-1 min-h-[260px] relative'>
        <div className='absolute inset-0 overflow-x-auto'>
          <div className='h-full min-w-[720px] sm:min-w-0 p-3'>
            <ReactECharts
              ref={chartRef}
              option={option}
              onEvents={onEvents}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>
        </div>
      </div>

      <div className='flex flex-wrap justify-center gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 px-2 sm:px-4 py-2 sm:py-3 border-t border-zinc-800/60'>
        {data.agents.map((agent, i) => (
          <div
            key={agent}
            className='flex items-center gap-1 sm:gap-1.5 min-w-0'
          >
            <span
              className='w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-sm shrink-0'
              style={{ background: AGENT_PALETTE[i % AGENT_PALETTE.length] }}
            />
            <span className='text-[9px] sm:text-xs text-zinc-400 truncate'>
              {agent}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RemitHealthTrend ({ deployments }) {
  const data = useMemo(() => {
    const DAYS = 30
    const buckets = {}
    const order = []

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      buckets[key] = { over: 0, short: 0, net: 0 }
      order.push({ key, date: d })
    }

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const dt = new Date(raw)
        if (Number.isNaN(dt.getTime())) return
        dt.setHours(0, 0, 0, 0)
        const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`
        if (!buckets[key]) return

        const items = d.returnItems || []
        const value = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
        const empties = items.reduce(
          (s, i) => s + (Number(i.empties_sold) || 0),
          0
        )
        const r = d.remit || {}
        const remit =
          (Number(r.cash) || 0) +
          (Number(r.gcash) || 0) +
          (Number(r.credit) || 0) +
          (Number(r.case_remit) || 0)

        const expected = value + empties
        const diff = remit - expected

        if (diff > 0.01) buckets[key].over += diff
        else if (diff < -0.01) buckets[key].short += Math.abs(diff)
        buckets[key].net = buckets[key].over - buckets[key].short
      })

    const totals = order.reduce(
      (acc, { key }) => {
        acc.over += buckets[key].over
        acc.short += buckets[key].short
        acc.net += buckets[key].net
        return acc
      },
      { over: 0, short: 0, net: 0 }
    )

    return {
      labels: order.map(({ date }) =>
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      fullLabels: order.map(({ date }) =>
        date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      ),
      over: order.map(({ key }) => Math.round(buckets[key].over * 100) / 100),
      short: order.map(({ key }) => Math.round(buckets[key].short * 100) / 100),
      net: order.map(({ key }) => Math.round(buckets[key].net * 100) / 100),
      totals
    }
  }, [deployments])

  const hasData = data.over.some(v => v > 0) || data.short.some(v => v > 0)

  if (!hasData) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        No remit data in the last 30 days.
      </div>
    )
  }

  const netColorClass =
    Math.abs(data.totals.net) < 0.01
      ? 'text-zinc-300'
      : data.totals.net > 0
      ? 'text-emerald-400'
      : 'text-rose-400'

  const netDotColor =
    Math.abs(data.totals.net) < 0.01
      ? '#a1a1aa'
      : data.totals.net > 0
      ? COLORS.emerald
      : COLORS.rose

  const option = {
    grid: { ...baseGrid, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle(),
      formatter: params => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const dateLabel = data.fullLabels[idx]
        const over = data.over[idx] || 0
        const short = data.short[idx] || 0
        const net = data.net[idx] || 0
        const netColor =
          Math.abs(net) < 0.01 ? '#a1a1aa' : net > 0 ? '#10b981' : '#f43f5e'

        const row = (color, label, value) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};"></span>
              <span style="color:#a1a1aa;font-size:11px;white-space:nowrap;">${label}</span>
            </span>
            <span style="color:#fafafa;font-weight:500;font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${formatMoney(
              value
            )}</span>
          </div>`

        return `
          <div style="min-width:220px;">
            <div style="font-weight:600;color:#fafafa;font-size:12px;margin-bottom:6px;white-space:nowrap;">${dateLabel}</div>
            ${row('#10b981', 'Over', over)}
            ${row('#f43f5e', 'Short', short)}
            <div style="border-top:1px solid #3f3f46;margin-top:8px;padding-top:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;">
                <span style="color:#a1a1aa;font-size:11px;">Net</span>
                <span style="color:${netColor};font-weight:700;font-variant-numeric:tabular-nums;font-size:12px;">
                  ${net > 0 ? '+' : ''}${formatMoney(net)}
                </span>
              </div>
            </div>
          </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: { color: chartTheme.textColor, fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: moneyAxisFormatter
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Over',
        type: 'bar',
        stack: 'diff',
        barMaxWidth: 12,
        itemStyle: { color: withAlpha(COLORS.emerald, 0.7) },
        data: data.over
      },
      {
        name: 'Short',
        type: 'bar',
        stack: 'diff',
        barMaxWidth: 12,
        itemStyle: { color: withAlpha(COLORS.rose, 0.7) },
        data: data.short.map(v => -v)
      },
      {
        name: 'Net',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#fafafa', width: 2 },
        itemStyle: { color: '#fafafa', borderColor: '#09090b', borderWidth: 2 },
        data: data.net,
        z: 5
      }
    ],
    animationDuration: 400
  }

  return (
    <div className='flex flex-col h-full min-h-0'>
      <div className='flex-1 min-h-0 relative'>
        <div className='absolute inset-0 overflow-x-auto'>
          <div className='h-full min-w-[720px] sm:min-w-0 p-3'>
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>
        </div>
      </div>

      <FooterGrid cols={3}>
        <FooterStat
          dotColor={COLORS.emerald}
          label='Over'
          value={formatMoney(data.totals.over)}
          valueClass='text-emerald-400'
        />
        <FooterStat
          dotColor={COLORS.rose}
          label='Short'
          value={formatMoney(data.totals.short)}
          valueClass='text-rose-400'
        />
        <FooterStat
          dotColor={netDotColor}
          label='Net'
          value={`${data.totals.net > 0 ? '+' : ''}${formatMoney(
            data.totals.net
          )}`}
          valueClass={netColorClass}
        />
      </FooterGrid>
    </div>
  )
}

function Dashed ({ className = '' }) {
  return (
    <div className={`border-t border-dashed border-zinc-700/40 ${className}`} />
  )
}

function ExpectedVsRemitted ({ deployments }) {
  const data = useMemo(() => {
    let totalSales = 0
    let totalEmpties = 0
    let totalCash = 0
    let totalCase = 0

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const items = d.returnItems || []
        totalSales += items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
        totalEmpties += items.reduce(
          (s, i) => s + (Number(i.empties_sold) || 0),
          0
        )
        const r = d.remit || {}
        totalCash +=
          (Number(r.cash) || 0) +
          (Number(r.gcash) || 0) +
          (Number(r.credit) || 0)
        totalCase += Number(r.case_remit) || 0
      })

    const expected = totalSales + totalEmpties
    const remitted = totalCash + totalCase
    const diff = remitted - expected

    return {
      totalSales,
      totalEmpties,
      totalCash,
      totalCase,
      expected,
      remitted,
      diff
    }
  }, [deployments])

  if (data.expected === 0 && data.remitted === 0) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        No data yet.
      </div>
    )
  }

  const isExact = Math.abs(data.diff) < 0.01
  const isShort = data.diff < -0.01
  const absDiff = Math.abs(data.diff)

  const diffLabel = isExact ? 'Exact' : isShort ? 'Short' : 'Over'
  const diffColor = isExact
    ? 'text-zinc-400'
    : isShort
    ? 'text-rose-300/90'
    : 'text-emerald-300/90'

  return (
    <div className='px-3 sm:px-4 py-3 sm:py-5 font-mono'>
      <div>
        <div className='text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-emerald-400/70 font-semibold mb-1 sm:mb-2'>
          Expected
        </div>

        <div className='space-y-0.5 sm:space-y-1.5'>
          <div className='flex justify-between items-baseline gap-2'>
            <span className='text-[10px] sm:text-xs text-zinc-500'>Sales</span>
            <span className='text-[10px] sm:text-xs text-zinc-300 tabular-nums'>
              {formatMoney(data.totalSales)}
            </span>
          </div>
          <div className='flex justify-between items-baseline gap-2'>
            <span className='text-[10px] sm:text-xs text-zinc-500'>
              Empties
            </span>
            <span className='text-[10px] sm:text-xs text-zinc-300 tabular-nums'>
              {formatMoney(data.totalEmpties)}
            </span>
          </div>
        </div>

        <Dashed className='my-1.5 sm:my-2.5' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-[9px] sm:text-[11px] uppercase tracking-[0.12em] text-zinc-400 font-semibold'>
            Total Expected
          </span>
          <span className='text-[11px] sm:text-sm font-bold text-emerald-400/90 tabular-nums'>
            {formatMoney(data.expected)}
          </span>
        </div>
      </div>

      <Dashed className='my-2 sm:my-4' />

      <div>
        <div className='text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-teal-400/70 font-semibold mb-1 sm:mb-2'>
          Remitted
        </div>

        <div className='space-y-0.5 sm:space-y-1.5'>
          <div className='flex justify-between items-baseline gap-2'>
            <span className='text-[10px] sm:text-xs text-zinc-500'>Cash</span>
            <span className='text-[10px] sm:text-xs text-zinc-300 tabular-nums'>
              {formatMoney(data.totalCash)}
            </span>
          </div>
          <div className='flex justify-between items-baseline gap-2'>
            <span className='text-[10px] sm:text-xs text-zinc-500'>Case</span>
            <span className='text-[10px] sm:text-xs text-zinc-300 tabular-nums'>
              {formatMoney(data.totalCase)}
            </span>
          </div>
        </div>

        <Dashed className='my-1.5 sm:my-2.5' />

        <div className='flex justify-between items-baseline gap-2'>
          <span className='text-[9px] sm:text-[11px] uppercase tracking-[0.12em] text-zinc-400 font-semibold'>
            Total Remitted
          </span>
          <span className='text-[11px] sm:text-sm font-bold text-teal-400/90 tabular-nums'>
            {formatMoney(data.remitted)}
          </span>
        </div>
      </div>

      <Dashed className='my-2 sm:my-4' />

      <div className='text-center'>
        {isExact ? (
          <div className='text-[9px] sm:text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-semibold'>
            ✓ Exact
          </div>
        ) : (
          <>
            <div
              className={`text-[9px] sm:text-[10px] uppercase tracking-[0.16em] font-semibold ${diffColor}`}
            >
              {diffLabel}
            </div>
            <div
              className={`text-sm sm:text-lg font-bold tabular-nums mt-0.5 ${diffColor}`}
            >
              {isShort ? '−' : '+'}
              {formatMoney(absDiff)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PaymentMixChart ({ deployments }) {
  const [rangeMode, setRangeMode] = useState('day')

  const data = useMemo(() => {
    const { bucketDefs, findKey } = buildBuckets(rangeMode)

    const buckets = {}
    bucketDefs.forEach(b => {
      buckets[b.key] = { cash: 0, gcash: 0, credit: 0 }
    })

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const key = findKey(raw)
        if (!key) return

        const r = d.remit || {}
        buckets[key].cash += Number(r.cash) || 0
        buckets[key].gcash += Number(r.gcash) || 0
        buckets[key].credit += Number(r.credit) || 0
      })

    const totals = bucketDefs.reduce(
      (acc, b) => {
        acc.cash += buckets[b.key].cash
        acc.gcash += buckets[b.key].gcash
        acc.credit += buckets[b.key].credit
        return acc
      },
      { cash: 0, gcash: 0, credit: 0 }
    )

    return {
      labels: bucketDefs.map(b => b.shortLabel),
      fullLabels: bucketDefs.map(b => b.fullLabel),
      cash: bucketDefs.map(b => Math.round(buckets[b.key].cash * 100) / 100),
      gcash: bucketDefs.map(b => Math.round(buckets[b.key].gcash * 100) / 100),
      credit: bucketDefs.map(
        b => Math.round(buckets[b.key].credit * 100) / 100
      ),
      totals
    }
  }, [deployments, rangeMode])

  const hasData = data.totals.cash + data.totals.gcash + data.totals.credit > 0

  if (!hasData) {
    return (
      <div className='flex flex-col h-full min-h-0'>
        <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />
        <div className='flex-1 flex items-center justify-center text-zinc-600 text-xs'>
          No payment data yet.
        </div>
      </div>
    )
  }

  const option = {
    grid: { ...baseGrid, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter: params => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const dateLabel = data.fullLabels[idx]
        const cash = data.cash[idx] || 0
        const gcash = data.gcash[idx] || 0
        const credit = data.credit[idx] || 0
        const dayTotal = cash + gcash + credit

        const row = (color, label, value) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};"></span>
              <span style="color:#a1a1aa;font-size:11px;white-space:nowrap;">${label}</span>
            </span>
            <span style="color:#fafafa;font-weight:500;font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${formatMoney(
              value
            )}</span>
          </div>`

        return `
          <div style="min-width:230px;">
            <div style="font-weight:600;color:#fafafa;font-size:12px;margin-bottom:6px;white-space:nowrap;">${dateLabel}</div>
            ${row('#10b981', 'Cash', cash)}
            ${row('#0ea5e9', 'G-Cash', gcash)}
            ${row('#f59e0b', 'Credit', credit)}
            <div style="border-top:1px solid #3f3f46;margin-top:8px;padding-top:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;">
                <span style="color:#a1a1aa;font-size:11px;font-weight:600;">Total</span>
                <span style="color:#fafafa;font-weight:700;font-variant-numeric:tabular-nums;font-size:12px;">${formatMoney(
                  dayTotal
                )}</span>
              </div>
            </div>
          </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: { color: chartTheme.textColor, fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: moneyAxisFormatter
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Cash',
        type: 'bar',
        stack: 'pay',
        barMaxWidth: 22,
        itemStyle: { color: COLORS.emerald },
        data: data.cash
      },
      {
        name: 'G-Cash',
        type: 'bar',
        stack: 'pay',
        barMaxWidth: 22,
        itemStyle: { color: COLORS.sky },
        data: data.gcash
      },
      {
        name: 'Credit',
        type: 'bar',
        stack: 'pay',
        barMaxWidth: 22,
        itemStyle: { color: COLORS.amber, borderRadius: [4, 4, 0, 0] },
        data: data.credit
      }
    ],
    animationDuration: 400
  }

  return (
    <div className='flex flex-col h-full min-h-0'>
      <RangeTabs rangeMode={rangeMode} setRangeMode={setRangeMode} />

      <div className='flex-1 min-h-0 relative'>
        <div className='absolute inset-0 overflow-x-auto'>
          <div className='h-full min-w-[640px] sm:min-w-0 p-3'>
            <ReactECharts
              option={option}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>
        </div>
      </div>

      <FooterGrid cols={3}>
        <FooterStat
          dotColor={COLORS.emerald}
          label='Cash'
          value={formatMoney(data.totals.cash)}
          valueClass='text-emerald-400'
        />
        <FooterStat
          dotColor={COLORS.sky}
          label='G-Cash'
          value={formatMoney(data.totals.gcash)}
          valueClass='text-sky-400'
        />
        <FooterStat
          dotColor={COLORS.amber}
          label='Credit'
          value={formatMoney(data.totals.credit)}
          valueClass='text-amber-400'
        />
      </FooterGrid>
    </div>
  )
}

const ALERT_WINDOW = 30
const TARGET_COVER_DAYS = 30

function StockAlerts ({ stocks, deployments }) {
  const data = useMemo(() => {
    const soldMap = {}
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - ALERT_WINDOW)
    cutoff.setHours(0, 0, 0, 0)

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const dt = new Date(raw)
        if (Number.isNaN(dt.getTime())) return
        if (dt < cutoff) return
        ;(d.returnItems || []).forEach(item => {
          const name = item.product_name
          if (!name) return
          soldMap[name] = (soldMap[name] || 0) + (Number(item.cases_sold) || 0)
        })
      })

    const alerts = stocks
      .map(s => {
        const stock = Number(s.quantity) || 0
        const sold = soldMap[s.product_name] || 0
        const dailyRate = sold / ALERT_WINDOW
        const daysLeft = dailyRate > 0 ? stock / dailyRate : Infinity

        const targetStock = dailyRate * TARGET_COVER_DAYS
        const reorderQty = Math.max(0, Math.ceil(targetStock - stock))

        let level = null
        if (sold === 0 && stock > 0) level = 'dead'
        else if (stock === 0 && sold > 0) level = 'out'
        else if (dailyRate > 0 && daysLeft <= 3) level = 'critical'
        else if (dailyRate > 0 && daysLeft <= 7) level = 'low'
        else if (dailyRate > 0 && daysLeft <= 14) level = 'watch'

        return {
          name: s.product_name,
          stock,
          sold,
          dailyRate,
          daysLeft,
          reorderQty,
          level,
          price: Number(s.price_per_case) || 0
        }
      })
      .filter(r => r.level !== null)
      .sort((a, b) => {
        const rank = { out: 0, critical: 1, low: 2, watch: 3, dead: 4 }
        if (rank[a.level] !== rank[b.level]) {
          return rank[a.level] - rank[b.level]
        }
        return a.daysLeft - b.daysLeft
      })

    const counts = alerts.reduce((acc, r) => {
      acc[r.level] = (acc[r.level] || 0) + 1
      return acc
    }, {})

    return { alerts, counts, totalAlerts: alerts.length }
  }, [stocks, deployments])

  const LEVEL_META = {
    out: {
      label: 'Out',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-800/50'
    },
    critical: {
      label: 'Critical',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-800/50'
    },
    low: {
      label: 'Low',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-800/50'
    },
    watch: {
      label: 'Watch',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-800/50'
    },
    dead: {
      label: 'Dead',
      color: 'text-zinc-400',
      bg: 'bg-zinc-800/60',
      border: 'border-zinc-700'
    }
  }

  if (data.totalAlerts === 0) {
    return (
      <div className='p-6 flex flex-col items-center justify-center h-full text-center'>
        <div className='w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3'>
          <TbCheck size={22} />
        </div>
        <div className='text-xs font-medium text-zinc-200 mb-1'>
          All stock healthy
        </div>
        <div className='text-[11px] text-zinc-500'>
          No products need restocking right now
        </div>
      </div>
    )
  }

  const formatDays = d => {
    if (!Number.isFinite(d)) return '∞'
    if (d < 1) return '<1'
    return Math.round(d)
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex flex-wrap gap-2 px-3 pt-3 pb-2 text-[9px] sm:text-[10px]'>
        {Object.entries(LEVEL_META).map(([key, meta]) => {
          const count = data.counts[key] || 0
          if (count === 0) return null
          return (
            <span
              key={key}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border tabular-nums ${meta.bg} ${meta.border} ${meta.color}`}
            >
              {meta.label}
              <span className='font-semibold'>{count}</span>
            </span>
          )
        })}
        <span className='ml-auto text-zinc-600 tabular-nums uppercase tracking-wider'>
          {ALERT_WINDOW}d sell rate
        </span>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-800/60'>
        {data.alerts.map(r => {
          const meta = LEVEL_META[r.level]
          const isDead = r.level === 'dead'
          const isOut = r.level === 'out'

          return (
            <div
              key={r.name}
              className='px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors hover:bg-zinc-800/30'
            >
              <div className='flex items-start justify-between gap-3 mb-1.5'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span
                    className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold border shrink-0 ${meta.bg} ${meta.border} ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <span className='text-[10px] sm:text-xs font-medium text-zinc-100 truncate'>
                    {r.name}
                  </span>
                </div>
                {!isDead && (
                  <span
                    className={`text-[9px] sm:text-[10px] tabular-nums shrink-0 ${meta.color}`}
                  >
                    {isOut ? 'no stock' : `${formatDays(r.daysLeft)}d left`}
                  </span>
                )}
              </div>

              <div className='flex items-center justify-between gap-3 text-[9px] sm:text-[10px] text-zinc-500 tabular-nums'>
                <span>
                  Stock{' '}
                  <span className='text-zinc-300 font-medium'>
                    {formatNumber(r.stock)}
                  </span>
                  <span className='mx-1.5 text-zinc-700'>·</span>
                  Sold{' '}
                  <span className='text-emerald-400 font-medium'>
                    {formatNumber(r.sold)}
                  </span>{' '}
                  in {ALERT_WINDOW}d
                </span>

                {!isDead ? (
                  <span className='shrink-0 text-zinc-400'>
                    Reorder{' '}
                    <span className='text-amber-400 font-semibold'>
                      {formatNumber(r.reorderQty)} cs
                    </span>
                  </span>
                ) : (
                  <span className='shrink-0 text-zinc-600 italic'>
                    no movement · consider promo
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const WEEKDAYS = [
  { idx: 1, short: 'Mon', label: 'Monday' },
  { idx: 2, short: 'Tue', label: 'Tuesday' },
  { idx: 3, short: 'Wed', label: 'Wednesday' },
  { idx: 4, short: 'Thu', label: 'Thursday' },
  { idx: 5, short: 'Fri', label: 'Friday' },
  { idx: 6, short: 'Sat', label: 'Saturday' }
]

const PATTERN_WINDOW_DAYS = 30

function WeeklySellingPattern ({ deployments }) {
  const data = useMemo(() => {
    const buckets = WEEKDAYS.map(w => ({
      idx: w.idx,
      short: w.short,
      label: w.label,
      sales: 0,
      dayCount: 0
    }))

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - PATTERN_WINDOW_DAYS)
    cutoff.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < PATTERN_WINDOW_DAYS; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dow = d.getDay()
      if (dow === 0) continue
      const bucket = buckets.find(b => b.idx === dow)
      if (bucket) bucket.dayCount += 1
    }

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const raw = d.returned_at || d.createdAt
        if (!raw) return
        const dt = new Date(raw)
        if (Number.isNaN(dt.getTime())) return
        if (dt < cutoff) return

        const dow = dt.getDay()
        if (dow === 0) return
        const bucket = buckets.find(b => b.idx === dow)
        if (!bucket) return

        const items = d.returnItems || []
        const sales = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
        bucket.sales += sales
      })

    const enriched = buckets.map(b => ({
      ...b,
      avgSales: b.dayCount > 0 ? b.sales / b.dayCount : 0
    }))

    const ranked = [...enriched].sort((a, b) => b.avgSales - a.avgSales)
    const best = ranked[0]
    const worst = ranked[ranked.length - 1]

    return { rows: enriched, best, worst }
  }, [deployments])

  const hasData = data.rows.some(r => r.avgSales > 0)

  if (!hasData) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        Not enough sales data yet.
      </div>
    )
  }

  const option = {
    grid: { top: 20, right: 16, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter: params => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const row = data.rows[idx]

        const line = (label, value, valueColor = '#fafafa', bold = false) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="color:#a1a1aa;font-size:11px;white-space:nowrap;">${label}</span>
            <span style="color:${valueColor};font-weight:${
          bold ? 600 : 500
        };font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${value}</span>
          </div>`

        return `
          <div style="min-width:200px;">
            <div style="font-weight:600;color:#fafafa;font-size:12px;margin-bottom:6px;white-space:nowrap;">${
              row.label
            }</div>
            ${line('Avg Sales', formatMoney(row.avgSales), '#10b981', true)}
            ${line('Total Sales', formatMoney(row.sales))}
          </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.rows.map(r => r.short),
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: { color: chartTheme.textColor, fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: moneyAxisFormatter
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Avg Sales',
        type: 'bar',
        barMaxWidth: 26,
        data: data.rows.map(r => ({
          value: Math.round(r.avgSales * 100) / 100,
          itemStyle: {
            color:
              r.short === data.best.short
                ? COLORS.emerald
                : r.short === data.worst.short
                ? withAlpha(COLORS.zinc, 0.6)
                : withAlpha(COLORS.emerald, 0.45),
            borderRadius: [4, 4, 0, 0]
          }
        }))
      }
    ],
    animationDuration: 400
  }

  return (
    <>
      <FooterGrid cols={2}>
        <FooterStat
          dotColor={COLORS.emerald}
          label='Best Day'
          value={data.best.label}
          valueClass='text-emerald-400'
        />
        <FooterStat
          dotColor={COLORS.zinc}
          label='Slowest Day'
          value={data.worst.label}
          valueClass='text-zinc-300'
        />
      </FooterGrid>

      <div className='p-3 h-[220px]'>
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge
        />
      </div>

      <div className='px-4 pb-3 text-center text-[9px] sm:text-[10px] text-zinc-600'>
        Average sales per {PATTERN_WINDOW_DAYS}-day window · Mon–Sat only
      </div>
    </>
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

function AgentLeaderboard ({ deployments }) {
  const rows = useMemo(() => {
    const map = {}
    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const truck = (d.truck || '').toUpperCase()
        if (!truck) return

        if (!map[truck]) {
          map[truck] = {
            name: truck,
            trips: 0,
            sales: 0,
            empties: 0,
            cashRemit: 0,
            caseRemit: 0
          }
        }
        const m = map[truck]
        m.trips += 1

        const items = d.returnItems || []
        const value = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
        const empties = items.reduce(
          (s, i) => s + (Number(i.empties_sold) || 0),
          0
        )
        const r = d.remit || {}
        const cashRemit =
          (Number(r.cash) || 0) +
          (Number(r.gcash) || 0) +
          (Number(r.credit) || 0)
        const caseRemit = Number(r.case_remit) || 0

        m.sales += value
        m.empties += empties
        m.cashRemit += cashRemit
        m.caseRemit += caseRemit
      })

    return Object.values(map).sort((a, b) => b.sales - a.sales)
  }, [deployments])

  if (rows.length === 0) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        No agent data yet.
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-xs sm:text-sm border-collapse'>
        <thead className='bg-zinc-900/60'>
          <tr className='text-left text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500'>
            <th className='px-2 sm:px-3 py-2 font-medium w-12'>Rank</th>
            <th className='px-2 sm:px-3 py-2 font-medium'>Agent</th>
            <th className='px-2 sm:px-3 py-2 font-medium text-center'>Trips</th>
            <th className='px-2 sm:px-3 py-2 font-medium text-right'>
              Sales ₱
            </th>
            <th className='px-2 sm:px-3 py-2 font-medium text-right'>
              Cash Remit
            </th>
            <th className='px-2 sm:px-3 py-2 font-medium text-right'>
              Empties ₱
            </th>
            <th className='px-2 sm:px-3 py-2 font-medium text-right'>
              Case Remit
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTop3 = i < 3
            const cashDiff = r.cashRemit - r.sales
            const caseDiff = r.caseRemit - r.empties
            const cashMeta = diffMeta(cashDiff)
            const caseMeta = diffMeta(caseDiff)

            return (
              <tr
                key={r.name}
                className='border-t border-zinc-800/60 hover:bg-zinc-800/30 transition align-top'
              >
                <td className='px-2 sm:px-3 py-2 sm:py-2.5'>
                  <div className='flex items-center gap-1.5'>
                    {isTop3 ? (
                      <span className='text-base leading-none'>
                        {MEDALS[i]}
                      </span>
                    ) : (
                      <span className='text-[11px] sm:text-xs text-zinc-600 tabular-nums w-4 text-center'>
                        {i + 1}
                      </span>
                    )}
                  </div>
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5'>
                  <span className='text-[11px] sm:text-xs font-medium text-zinc-100 truncate'>
                    {r.name}
                  </span>
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5 text-center text-[10px] sm:text-xs text-zinc-300 tabular-nums'>
                  {formatNumber(r.trips)}
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5 text-right text-[10px] sm:text-xs text-emerald-400 tabular-nums whitespace-nowrap'>
                  {formatMoney(r.sales)}
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums'>
                  <div className='flex flex-col items-end leading-tight gap-0.5'>
                    <span className='text-[10px] sm:text-xs text-teal-400 font-medium whitespace-nowrap'>
                      {formatMoney(r.cashRemit)}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${cashMeta.color}`}
                    >
                      {cashMeta.display}
                    </span>
                  </div>
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5 text-right text-[10px] sm:text-xs text-amber-400 tabular-nums whitespace-nowrap'>
                  {formatMoney(r.empties)}
                </td>

                <td className='px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums'>
                  <div className='flex flex-col items-end leading-tight gap-0.5'>
                    <span className='text-[10px] sm:text-xs text-teal-400 font-medium whitespace-nowrap'>
                      {formatMoney(r.caseRemit)}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold whitespace-nowrap ${caseMeta.color}`}
                    >
                      {caseMeta.display}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function useTrendingProducts (deployments) {
  return useMemo(() => {
    const productTotals = {}

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        ;(d.returnItems || []).forEach(item => {
          const name = item.product_name
          if (!name) return

          const cases = Number(item.cases_sold) || 0
          const value = Number(item.value_sold) || 0

          if (!productTotals[name]) {
            productTotals[name] = { cases: 0, value: 0 }
          }
          productTotals[name].cases += cases
          productTotals[name].value += value
        })
      })

    return Object.entries(productTotals)
      .sort((a, b) => b[1].cases - a[1].cases)
      .map(([name, totals]) => ({ name, ...totals }))
  }, [deployments])
}

function TrendingProducts ({ deployments }) {
  const products = useTrendingProducts(deployments)

  if (products.length === 0) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        No product data yet.
      </div>
    )
  }

  const totalCases = products.reduce((s, p) => s + p.cases, 0)
  const rowHeight = 26
  const chartHeight = Math.max(240, products.length * rowHeight + 80)

  const option = {
    grid: { top: 8, right: 90, bottom: 32, left: 160 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      ...tooltipStyle(),
      formatter: params => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const p = products[idx]
        if (!p) return ''
        const rank = idx + 1
        const share = totalCases > 0 ? (p.cases / totalCases) * 100 : 0

        const row = (label, value, color = '#fafafa', bold = false) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:4px;">
            <span style="color:#a1a1aa;font-size:11px;">${label}</span>
            <span style="color:${color};font-weight:${
          bold ? 600 : 500
        };font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${value}</span>
          </div>`

        return `
          <div style="min-width:230px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="display:inline-block;padding:2px 6px;border-radius:3px;background:#10b981;color:#fff;font-size:10px;font-weight:600;">#${rank}</span>
              <span style="font-weight:600;color:#fafafa;font-size:12px;white-space:nowrap;">${
                p.name
              }</span>
            </div>
            ${row('Cases Sold', `${formatNumber(p.cases)} cs`, '#10b981', true)}
            ${row('Sales Value', formatMoney(p.value), '#6ee7b7')}
            ${row('Share', `${share.toFixed(1)}%`, '#a1a1aa')}
          </div>`
      }
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: chartTheme.textColor,
        fontSize: 10,
        formatter: v => formatNumber(v)
      },
      splitLine: {
        lineStyle: { color: chartTheme.splitColor, type: 'dashed' }
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: products.map(p => p.name),
      inverse: true,
      axisLine: { lineStyle: { color: chartTheme.axisColor } },
      axisLabel: {
        interval: 0,
        color: chartTheme.textColor,
        fontSize: 10,
        width: 150,
        overflow: 'truncate'
      },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Cases Sold',
        type: 'bar',
        barMaxWidth: 16,
        data: products.map((p, i) => ({
          value: p.cases,
          itemStyle: {
            color:
              i === 0
                ? COLORS.emerald
                : i < 3
                ? withAlpha(COLORS.emerald, 0.75)
                : withAlpha(COLORS.emerald, 0.4),
            borderRadius: [0, 3, 3, 0]
          }
        })),
        label: {
          show: true,
          position: 'right',
          formatter: params => formatNumber(params.value),
          color: '#a1a1aa',
          fontSize: 10
        },
        emphasis: {
          itemStyle: {
            color: COLORS.emerald,
            shadowBlur: 6,
            shadowColor: 'rgba(16,185,129,0.4)'
          }
        }
      }
    ],
    animationDuration: 400
  }

  return (
    <>
      <div className='max-h-[520px] overflow-auto p-3'>
        <div
          className='min-w-[640px] sm:min-w-0'
          style={{ height: chartHeight }}
        >
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
        </div>
      </div>

      <div className='px-4 pb-3 text-center text-[9px] sm:text-[10px] text-zinc-600'>
        Ranked by cases sold · Top 3 highlighted
        {products.length > 20 && ' · Scroll for more'}
      </div>
    </>
  )
}

function EmptiesReceived ({ deployments }) {
  const data = useMemo(() => {
    const groups = { fullCase: {}, caseOnly: {}, bottlesOnly: {} }

    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const er = d.emptiesReceived
        if (!er) return
        EMPTIES_GROUPS.forEach(g => {
          const src = er[g] || {}
          Object.entries(src).forEach(([sizeId, qty]) => {
            const n = Number(qty) || 0
            if (n <= 0) return
            groups[g][sizeId] = (groups[g][sizeId] || 0) + n
          })
        })
      })

    const perGroup = {}
    let grandQty = 0
    let grandValue = 0
    EMPTIES_GROUPS.forEach(g => {
      const qty = Object.values(groups[g]).reduce(
        (s, v) => s + (Number(v) || 0),
        0
      )
      const value = calcEmptiesGroupSubtotal(g, groups[g])
      perGroup[g] = { qty, value }
      grandQty += qty
      grandValue += value
    })

    return { groups, perGroup, grandQty, grandValue }
  }, [deployments])

  if (data.grandQty === 0) {
    return (
      <div className='px-4 py-12 text-center text-zinc-600 text-xs'>
        No empties received yet.
      </div>
    )
  }

  const GRID =
    'grid grid-cols-[minmax(0,1fr)_3rem_2rem_5.5rem] items-baseline gap-2'

  return (
    <div className='p-2.5 sm:p-3 space-y-2.5 h-full overflow-y-auto'>
      {EMPTIES_GROUPS.map(g => {
        const group = data.groups[g]
        const totals = data.perGroup[g]
        return (
          <div
            key={g}
            className='rounded-md border border-zinc-800 bg-zinc-900/40 overflow-hidden'
          >
            <div className='flex justify-between items-center px-2.5 sm:px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/60'>
              <span className='text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-amber-400'>
                {EMPTIES_GROUP_LABELS[g]}
              </span>
              <span className='text-[9px] sm:text-[10px] text-zinc-500 tabular-nums'>
                {formatNumber(totals.qty)} pcs
              </span>
            </div>

            <div className='px-2.5 sm:px-3 py-1.5 sm:py-2 space-y-1.5'>
              {EMPTIES_RATES[g].map(r => {
                const qty = Number(group[r.id]) || 0
                const value = qty * r.price
                return (
                  <div key={r.id} className={GRID}>
                    <span className='text-[9px] sm:text-[11px] text-zinc-400 truncate'>
                      {r.label}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs text-right tabular-nums ${
                        qty > 0 ? 'text-zinc-100 font-medium' : 'text-zinc-600'
                      }`}
                    >
                      {formatNumber(qty)}
                    </span>
                    <span className='text-[9px] text-zinc-600 uppercase tracking-wide'>
                      pcs
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs text-right tabular-nums ${
                        value > 0
                          ? 'text-amber-400 font-medium'
                          : 'text-zinc-700'
                      }`}
                    >
                      {formatMoney(value)}
                    </span>
                  </div>
                )
              })}

              <div
                className={`${GRID} pt-1.5 mt-0.5 border-t border-zinc-800/60`}
              >
                <span className='text-[9px] uppercase tracking-wider text-zinc-500 font-semibold'>
                  Total
                </span>
                <span className='text-[10px] sm:text-xs text-right text-zinc-100 font-semibold tabular-nums'>
                  {formatNumber(totals.qty)}
                </span>
                <span className='text-[9px] text-zinc-600 uppercase tracking-wide'>
                  pcs
                </span>
                <span className='text-[10px] sm:text-xs text-right text-amber-400 font-semibold tabular-nums'>
                  {formatMoney(totals.value)}
                </span>
              </div>
            </div>
          </div>
        )
      })}

      <div className='rounded-md border border-amber-700/50 bg-amber-500/5 overflow-hidden'>
        <div className='px-2.5 sm:px-3 py-2 sm:py-2.5'>
          <div className={GRID}>
            <span className='text-[9px] uppercase tracking-wider text-amber-400 font-semibold truncate'>
              Grand Total
            </span>
            <span className='text-[10px] sm:text-xs text-right text-amber-400 font-bold tabular-nums'>
              {formatNumber(data.grandQty)}
            </span>
            <span className='text-[9px] text-amber-400/70 uppercase tracking-wide'>
              pcs
            </span>
            <span className='text-[10px] sm:text-xs text-right text-amber-400 font-bold tabular-nums'>
              {formatMoney(data.grandValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeploymentCalendar ({ deployments }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const activityByDay = useMemo(() => {
    const map = {}
    deployments.forEach(d => {
      const raw = d.returned_at || d.createdAt
      if (!raw) return
      const dt = new Date(raw)
      if (Number.isNaN(dt.getTime())) return
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`
      if (!map[key]) map[key] = { count: 0, sales: 0 }
      map[key].count += 1
      ;(d.returnItems || []).forEach(i => {
        map[key].sales += Number(i.value_sold) || 0
      })
    })
    return map
  }, [deployments])

  const today = new Date()
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthName = cursor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))

  const monthDeployments = Object.entries(activityByDay)
    .filter(([key]) => {
      const [, m] = key.split('-').map(Number)
      return m === month
    })
    .reduce((sum, [, v]) => sum + v.count, 0)
  const monthSales = Object.entries(activityByDay)
    .filter(([key]) => {
      const [, m] = key.split('-').map(Number)
      return m === month
    })
    .reduce((sum, [, v]) => sum + v.sales, 0)

  const maxSales = Math.max(
    ...Object.values(activityByDay).map(a => a.sales),
    1
  )

  return (
    <div className='p-2.5 sm:p-3 space-y-3'>
      <div className='flex justify-between items-center'>
        <button
          onClick={prevMonth}
          className='w-7 h-7 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 flex items-center justify-center transition'
        >
          <TbChevronLeft size={16} />
        </button>
        <div className='text-[11px] sm:text-sm font-semibold text-zinc-200'>
          {monthName}
        </div>
        <button
          onClick={nextMonth}
          className='w-7 h-7 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 flex items-center justify-center transition'
        >
          <TbChevronRight size={16} />
        </button>
      </div>

      <div className='grid grid-cols-2 divide-x divide-zinc-800/60 rounded-md border border-zinc-800 bg-zinc-900/40 py-2'>
        <div className='flex flex-col items-center'>
          <span className='text-[9px] uppercase tracking-wider text-zinc-600'>
            Sales
          </span>
          <span className='text-[11px] sm:text-sm font-semibold text-emerald-400 tabular-nums'>
            {formatMoney(monthSales)}
          </span>
        </div>
        <div className='flex flex-col items-center'>
          <span className='text-[9px] uppercase tracking-wider text-zinc-600'>
            Trips
          </span>
          <span className='text-[11px] sm:text-sm font-semibold text-blue-400 tabular-nums'>
            {monthDeployments}
          </span>
        </div>
      </div>

      <div className='grid grid-cols-7 gap-1'>
        {weekdays.map((w, i) => (
          <div
            key={i}
            className='text-[9px] uppercase tracking-wider text-zinc-600 text-center py-1'
          >
            {w}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7 gap-1'>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = `${year}-${month}-${day}`
          const activity = activityByDay[key]
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day

          const intensity = activity
            ? Math.min(activity.sales / maxSales, 1)
            : 0
          const hasSales = activity && activity.sales > 0

          const bgAlpha = hasSales ? 0.1 + intensity * 0.35 : 0
          const bgColor = hasSales
            ? `rgba(16, 185, 129, ${bgAlpha})`
            : 'transparent'

          return (
            <div
              key={i}
              title={
                activity
                  ? `${activity.count} trip${
                      activity.count === 1 ? '' : 's'
                    } · ${formatMoney(activity.sales)}`
                  : undefined
              }
              style={{ background: bgColor }}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] relative transition cursor-default
                ${isToday ? 'ring-1 ring-blue-500/60' : ''}
                ${
                  activity
                    ? 'text-emerald-200'
                    : 'text-zinc-500 hover:bg-zinc-800/40'
                }`}
            >
              <span
                className={activity ? 'font-medium text-[10px]' : 'text-[10px]'}
              >
                {day}
              </span>
              {hasSales && (
                <span className='text-[9px] tabular-nums leading-none mt-0.5 text-emerald-400/90 font-medium'>
                  {formatCompactMoney(activity.sales)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className='flex items-center justify-center gap-4 pt-1 text-[9px] sm:text-[10px] text-zinc-600'>
        <div className='flex items-center gap-1.5'>
          <span
            className='w-2 h-2 rounded'
            style={{ background: 'rgba(16, 185, 129, 0.35)' }}
          />
          <span>Sales day</span>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='w-2 h-2 rounded ring-1 ring-blue-500/60' />
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard () {
  const { stocks, deployments } = useOutletContext() || {}

  const safeStocks = stocks || []
  const safeDeployments = deployments || []

  const [trucks, setTrucks] = useState([])
  useEffect(() => {
    let cancelled = false
    api
      .get('/trucks')
      .then(data => {
        if (!cancelled) setTrucks(data.trucks || [])
      })
      .catch(() => {
        if (!cancelled) setTrucks([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const outTruckNames = useMemo(() => {
    const set = new Set()
    safeDeployments
      .filter(d => d.status === 'out')
      .forEach(d => set.add(d.truck))
    return set
  }, [safeDeployments])

  const trucksOut = useMemo(
    () => trucks.filter(t => outTruckNames.has(t.name)).length,
    [trucks, outTruckNames]
  )
  const trucksIdle = Math.max(0, trucks.length - trucksOut)

  const stats = useMemo(() => {
    const returned = safeDeployments.filter(d => d.status === 'returned')
    const active = safeDeployments.filter(d => d.status === 'out')

    let totalSales = 0
    let totalEmpties = 0
    let totalRemit = 0
    let over = 0
    let short = 0
    let creditOutstanding = 0

    returned.forEach(d => {
      const items = d.returnItems || []
      const value = items.reduce((s, i) => s + (Number(i.value_sold) || 0), 0)
      const empties = items.reduce(
        (s, i) => s + (Number(i.empties_sold) || 0),
        0
      )
      const r = d.remit || {}
      const remit =
        (Number(r.cash) || 0) +
        (Number(r.gcash) || 0) +
        (Number(r.credit) || 0) +
        (Number(r.case_remit) || 0)

      totalSales += value
      totalEmpties += empties
      totalRemit += remit

      const diff = remit - (value + empties)
      if (diff > 0.01) over += diff
      if (diff < -0.01) short += Math.abs(diff)

      if (Number(r.credit) > 0 && !r.credit_paid) {
        creditOutstanding += Number(r.credit) || 0
      }
    })

    const lowStock = safeStocks.filter(s => {
      const q = Number(s.quantity) || 0
      return q > 0 && q <= LOW_STOCK_THRESHOLD
    }).length
    const outOfStock = safeStocks.filter(
      s => (Number(s.quantity) || 0) === 0
    ).length

    return {
      returned: returned.length,
      active: active.length,
      totalSales,
      totalEmpties,
      totalRemit,
      expectedCollect: totalSales + totalEmpties,
      over,
      short,
      creditOutstanding,
      lowStock,
      outOfStock,
      productCount: safeStocks.length
    }
  }, [safeStocks, safeDeployments])

  return (
    <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-3 overflow-auto shadow-lg shadow-black/40 flex flex-col gap-3'>
      <div className='flex justify-between items-center gap-2 pb-2 border-b border-zinc-800 shrink-0'>
        <div className='min-w-0'>
          <div className='uppercase font-medium text-sm sm:text-lg'>
            Dashboard
          </div>
        </div>
        <div className='text-[9px] sm:text-[11px] text-zinc-500 tabular-nums text-right shrink-0'>
          {formatDate(new Date())}
        </div>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0 order-1 lg:order-none'>
        <KpiCard
          icon={<TbCurrencyPeso size={18} />}
          label='Total Sales'
          value={formatMoney(stats.totalSales)}
          sub={`${stats.returned} trips`}
          accent='text-emerald-400'
          iconBg='bg-emerald-500/10'
        />
        <KpiCard
          icon={<TbPackage size={18} />}
          label='Total Empties'
          value={formatMoney(stats.totalEmpties)}
          sub='deposit value'
          accent='text-amber-400'
          iconBg='bg-amber-500/10'
        />
        <KpiCard
          icon={<TbTrendingUp size={18} />}
          label='Total Remit'
          value={formatMoney(stats.totalRemit)}
          sub={`of ${formatMoney(stats.expectedCollect)} expected`}
          accent='text-teal-400'
          iconBg='bg-teal-500/10'
        />
        <KpiCard
          icon={<TbTrendingUp size={18} />}
          label='Over'
          value={formatMoney(stats.over)}
          sub={
            stats.short > 0
              ? `${formatMoney(stats.short)} short`
              : 'no shortfalls'
          }
          accent='text-emerald-400'
          iconBg='bg-emerald-500/10'
        />
        <KpiCard
          icon={<TbCreditCard size={18} />}
          label='Credit Outstanding'
          value={formatMoney(stats.creditOutstanding)}
          sub={stats.creditOutstanding > 0 ? 'unsettled' : 'all settled'}
          accent={
            stats.creditOutstanding > 0 ? 'text-amber-400' : 'text-zinc-100'
          }
          iconBg={
            stats.creditOutstanding > 0 ? 'bg-amber-500/10' : 'bg-zinc-800/60'
          }
        />
        <KpiCard
          icon={<TbTruck size={18} />}
          label='Fleet'
          value={`${trucksOut} / ${trucks.length}`}
          sub={`${trucksIdle} idle`}
          accent='text-blue-400'
          iconBg='bg-blue-500/10'
        />
      </div>

      <div className='contents lg:grid lg:grid-cols-3 lg:gap-3'>
        <Panel
          title='Sales — Trend'
          className='order-2 lg:order-none lg:col-span-2 min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>Sales trend over time.</b>
              <br />
              Switch between <b>Day</b> (last 14 days), <b>Week</b> (12 weeks),
              or <b>Month</b> (12 months). Hover any point on the line to see
              that period&apos;s Sales, Cash Remit, and the Difference (Short if
              sales &gt; remit, Over if remit &gt; sales).
            </>
          }
        >
          <SalesTrendChart deployments={safeDeployments} />
        </Panel>

        <Panel
          title='Empties Received'
          className='order-6 lg:order-none min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>Physical empties returned.</b>
              <br />
              Actual count of empties handed back by agents, grouped by Full
              Case, Case Only, and Bottles Only. Shows both quantity (pcs) and
              peso value of the deposits.
            </>
          }
        >
          <EmptiesReceived deployments={safeDeployments} />
        </Panel>
      </div>

      <div className='contents lg:grid lg:grid-cols-3 lg:gap-3'>
        <Panel
          title='Agent Performance — Trend'
          className='order-3 lg:order-none lg:col-span-2'
          info={
            <>
              <b className='text-zinc-100'>Sales per agent over time.</b>
              <br />
              Each line is one agent. Switch between Day / Week / Month at the
              top. Hover any point to see that period&apos;s Sales, Cash Remit,
              and the Difference for that specific agent.
            </>
          }
        >
          <DailyAgentPerformance deployments={safeDeployments} />
        </Panel>

        <Panel
          title='Expected vs Remitted — All Time'
          className='order-4 lg:order-none'
          info={
            <>
              <b className='text-zinc-100'>Cumulative equation.</b>
              <br />
              <b>Expected</b> = Sales + Empties (what should be collected).
              <br />
              <b>Remitted</b> = Cash Remit + Case Remit (what was handed over).
              <br />
              The bottom shows whether the totals matched (Exact), came in under
              (Short), or over.
            </>
          }
        >
          <ExpectedVsRemitted deployments={safeDeployments} />
        </Panel>
      </div>

      <div className='contents lg:grid lg:grid-cols-2 lg:gap-3'>
        <Panel
          title='Remit Health — Over vs Short (30 days)'
          className='order-5 lg:order-none min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>Daily remittance accuracy.</b>
              <br />
              <b>Green bars</b> = Over (agent remitted more than expected).
              <br />
              <b>Red bars</b> = Short (agent remitted less than expected).
              <br />
              <b>White line</b> = Net position (Over − Short) per day.
            </>
          }
        >
          <RemitHealthTrend deployments={safeDeployments} />
        </Panel>

        <Panel
          title='Payment Mix'
          className='order-7 lg:order-none min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>How customers pay.</b>
              <br />
              Stacked bars show <b>Cash</b>, <b>G-Cash</b>, and <b>Credit</b>{' '}
              collected each period. Switch between Day / Week / Month at the
              top. Watch for Credit creeping up — that&apos;s a cashflow risk.
            </>
          }
        >
          <PaymentMixChart deployments={safeDeployments} />
        </Panel>
      </div>

      <Panel
        title='Trending Products'
        className='order-8 lg:order-none'
        info={
          <>
            <b className='text-zinc-100'>Which products sell best.</b>
            <br />
            Horizontal bars ranked by <b>cases sold</b> all time. Top 3
            highlighted in bright emerald — the rest are dimmed. Longer bar =
            more sales. Hover any bar to see cases, value, and share of total.
            Scrollable if there are more than ~20 products.
          </>
        }
      >
        <TrendingProducts deployments={safeDeployments} />
      </Panel>

      <Panel
        title='Agent Leaderboard'
        className='order-10 lg:order-none'
        info={
          <>
            <b className='text-zinc-100'>Agent ranking by total sales.</b>
            <br />
            <b>Sales</b> = goods value. <b>Cash Remit</b> = cash + gcash +
            credit. <b>Empties</b> = deposit value. <b>Case Remit</b> =
            empties-equivalent remitted.
            <br />
            Each remit column shows the bucket-specific diff — <b>
              cash short
            </b>{' '}
            means the agent under-remitted on goods, <b>case short</b> means
            they under-remitted on empties.
          </>
        }
      >
        <AgentLeaderboard deployments={safeDeployments} />
      </Panel>

      <div className='contents lg:grid lg:grid-cols-2 lg:gap-3'>
        <Panel
          title='Stock Alerts'
          className='order-9 lg:order-none min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>Products that need attention.</b>
              <br />
              Based on the last 30 days of sales, ranked by urgency:
              <br />
              <b>Out</b> — no stock, still selling
              <br />
              <b>Critical</b> — ≤ 3 days of stock left
              <br />
              <b>Low</b> — ≤ 7 days left
              <br />
              <b>Watch</b> — ≤ 14 days left
              <br />
              <b>Dead</b> — no movement in 30 days
              <br />
              The suggested <b>Reorder</b> quantity brings you back to 30 days
              of coverage.
            </>
          }
        >
          <StockAlerts stocks={safeStocks} deployments={safeDeployments} />
        </Panel>

        <Panel
          title='Weekly Selling Pattern'
          className='order-11 lg:order-none min-h-[420px]'
          info={
            <>
              <b className='text-zinc-100'>Which days sell best.</b>
              <br />
              Average sales per weekday (Mon–Sat) over the last 30 days.
              <br />
              The <b>Best Day</b> is highlighted in bright emerald; the{' '}
              <b>Slowest Day</b> is dimmed. Sunday excluded — deployments only
              run Mon–Sat.
            </>
          }
        >
          <WeeklySellingPattern deployments={safeDeployments} />
        </Panel>
      </div>

      <div className='order-12 lg:order-none max-w-2xl mx-auto w-full shrink-0'>
        <Panel
          title='Deployment Calendar'
          info={
            <>
              <b className='text-zinc-100'>Sales heatmap by day.</b>
              <br />
              Brighter green = higher sales that day. Hover any cell to see the
              exact amount and trip count. The header shows the month&apos;s
              totals.
            </>
          }
        >
          <DeploymentCalendar deployments={safeDeployments} />
        </Panel>
      </div>
    </div>
  )
}
