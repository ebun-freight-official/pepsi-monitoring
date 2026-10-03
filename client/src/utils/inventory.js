export const TRUCKS = ['Truck 1', 'Truck 2', 'Truck 3']

export const createEmptyItem = () => ({
  product_name: '',
  unit: 24,
  quantity: 1,
  promo: 0,
  price_per_case: 0
})

export const createEmptyDeployItem = () => ({
  product_name: '',
  cases: 1
})

export const calcEntryTotal = items =>
  items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.price_per_case) || 0),
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

  const casesSold = returned.reduce(
    (sum, d) =>
      sum +
      (d.returnItems || []).reduce(
        (s, i) => s + (Number(i.cases_sold) || 0),
        0
      ),
    0
  )

  return {
    trucksOut: active.length,
    casesOut,
    casesSold,
    totalDeployments: deployments.length
  }
}

// With-truck = cases on OUT trucks + cases reserved on IDLE truck loadouts
export const calcWithTruckByProduct = (deployments, truckLoadouts = {}) => {
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

export const calcSoldByProduct = deployments => {
  const map = {}
  deployments
    .filter(d => d.status === 'returned')
    .forEach(d => {
      ;(d.returnItems || []).forEach(item => {
        const name = item.product_name
        map[name] = (map[name] || 0) + (Number(item.cases_sold) || 0)
      })
    })
  return map
}
