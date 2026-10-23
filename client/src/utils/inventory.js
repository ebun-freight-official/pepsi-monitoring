// ── Formatters ────────────────────────────────────────────────────────
export const formatMoney = n => {
  const num = Number(n) || 0
  return `₱${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`
}

export const formatNumber = n => {
  const num = Number(n) || 0
  return num.toLocaleString(undefined)
}

export const formatDate = value => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(
    2,
    '0'
  )}, ${d.getFullYear()}`
}

// ── Empty shapes ──────────────────────────────────────────────────────
export const createEmptyDeployItem = () => ({
  product_name: '',
  cases: 1
})

// ── Calculation helpers ───────────────────────────────────────────────
export const calcEntryTotal = items =>
  items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) * (Number(item.price_per_case) || 0) -
      (Number(item.discount) || 0),
    0
  )

export const calcEmptiesTotal = items =>
  items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.empties_per_case) || 0),
    0
  )

export const calcItemCases = item =>
  (Number(item.quantity) || 0) + (Number(item.promo) || 0)

export const calcStockStats = stocks => ({
  totalCases: stocks.reduce((sum, s) => sum + calcItemCases(s), 0),
  totalFreeCases: stocks.reduce((sum, s) => sum + (Number(s.promo) || 0), 0),
  totalBottles: stocks.reduce(
    (sum, s) => sum + calcItemCases(s) * (Number(s.unit) || 0),
    0
  ),
  totalValue: stocks.reduce(
    (sum, s) =>
      sum + (Number(s.quantity) || 0) * (Number(s.price_per_case) || 0),
    0
  )
})

export const calcDeploymentStats = deployments => {
  const active = deployments.filter(d => d.status === 'out')
  const returned = deployments.filter(d => d.status === 'returned')

  const casesOut = active.reduce(
    (sum, d) => sum + d.items.reduce((s, i) => s + (Number(i.cases) || 0), 0),
    0
  )

  let casesSold = 0
  let valueSold = 0
  let emptiesSold = 0

  returned.forEach(d => {
    ;(d.returnItems || []).forEach(i => {
      const c = Number(i.cases_sold) || 0
      casesSold += c
      const price = Number(i.price_per_case) || 0
      const emptiesPer = Number(i.empties_per_case) || 0
      const storedValue = Number(i.value_sold)
      const storedEmpties = Number(i.empties_sold)
      valueSold +=
        !Number.isNaN(storedValue) && i.value_sold !== undefined
          ? storedValue
          : c * price
      emptiesSold +=
        !Number.isNaN(storedEmpties) && i.empties_sold !== undefined
          ? storedEmpties
          : c * emptiesPer
    })
  })

  return {
    trucksOut: active.length,
    casesOut,
    casesSold,
    valueSold,
    emptiesSold,
    totalDeployments: deployments.length
  }
}

export const calcOnTruckByProduct = (deployments, truckLoadouts = {}) => {
  const map = {}
  const outTrucks = new Set()

  deployments
    .filter(d => d.status === 'out')
    .forEach(d => {
      outTrucks.add(d.truck)
      d.items.forEach(item => {
        const name = item.product_name
        map[name] = (map[name] || 0) + (Number(item.cases) || 0)
      })
    })

  Object.entries(truckLoadouts).forEach(([truck, items]) => {
    if (outTrucks.has(truck)) return
    items.forEach(item => {
      const name = item.product_name
      map[name] = (map[name] || 0) + (Number(item.cases) || 0)
    })
  })

  return map
}

export const calcSoldDetailsByProduct = deployments => {
  const map = {}
  deployments
    .filter(d => d.status === 'returned')
    .forEach(d => {
      ;(d.returnItems || []).forEach(item => {
        const name = item.product_name
        const cases = Number(item.cases_sold) || 0
        const price = Number(item.price_per_case) || 0
        const emptiesPer = Number(item.empties_per_case) || 0
        const value = Number(item.value_sold) || cases * price
        const empties = Number(item.empties_sold) || cases * emptiesPer

        if (!map[name]) {
          map[name] = { cases: 0, value: 0, empties: 0 }
        }
        map[name].cases += cases
        map[name].value += value
        map[name].empties += empties
      })
    })
  return map
}
