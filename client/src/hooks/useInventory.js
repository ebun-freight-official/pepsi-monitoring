import { useState, useCallback, useRef, useEffect } from 'react'
import { calcEntryTotal, TRUCKS } from '../utils/inventory'

export function useInventory () {
  const [stocks, setStocks] = useState([])
  const [entries, setEntries] = useState([])
  const [deployments, setDeployments] = useState([])
  const [truckLoadouts, setTruckLoadouts] = useState(() => {
    const init = {}
    TRUCKS.forEach(t => {
      init[t] = []
    })
    return init
  })

  // Refs so callbacks always read fresh state, even inside batched updates
  const stocksRef = useRef(stocks)
  const loadoutsRef = useRef(truckLoadouts)
  useEffect(() => {
    stocksRef.current = stocks
  }, [stocks])
  useEffect(() => {
    loadoutsRef.current = truckLoadouts
  }, [truckLoadouts])

  const addEntry = useCallback((items, netAmount) => {
    const cleaned = items
      .filter(item => item.product_name.trim() !== '')
      .map(item => ({
        ...item,
        product_name: item.product_name.trim().toUpperCase()
      }))

    if (cleaned.length === 0) return false

    const total = Number(netAmount) || calcEntryTotal(cleaned)

    setEntries(prev => [
      {
        id: Date.now(),
        date: new Date().toLocaleString(),
        items: cleaned,
        net_amount: total
      },
      ...prev
    ])

    setStocks(prev => {
      const next = prev.map(stock => ({ ...stock }))

      cleaned.forEach(item => {
        const cases = Number(item.quantity) || 0
        const freeCases = Number(item.promo) || 0
        const unit = Number(item.unit) || 0
        const price = Number(item.price_per_case) || 0

        const existing = next.find(
          stock =>
            stock.product_name.toLowerCase() === item.product_name.toLowerCase()
        )

        if (existing) {
          existing.quantity += cases
          existing.promo += freeCases
          existing.unit = unit
          existing.price_per_case = price
        } else {
          next.push({
            id: Date.now() + Math.random(),
            product_name: item.product_name,
            unit,
            quantity: cases,
            promo: freeCases,
            price_per_case: price
          })
        }
      })

      return next
    })

    return true
  }, [])

  // ---- Save loadout: reserves stock (reduces in-house) ----
  const updateTruckLoadout = useCallback((truck, newItems) => {
    const currentStocks = stocksRef.current
    const currentLoadouts = loadoutsRef.current

    const oldItems = currentLoadouts[truck] || []

    const group = list => {
      const g = {}
      list.forEach(i => {
        if (!i.product_name) return
        g[i.product_name] = (g[i.product_name] || 0) + (Number(i.cases) || 0)
      })
      return g
    }

    const oldGrouped = group(oldItems)
    const newGrouped = group(newItems)

    // Validate: current in-house + already-reserved-on-this-truck >= new loadout
    let valid = true
    Object.entries(newGrouped).forEach(([name, total]) => {
      const stock = currentStocks.find(s => s.product_name === name)
      const inHouse = stock ? Number(stock.quantity) || 0 : 0
      const releasedBack = oldGrouped[name] || 0
      if (total > inHouse + releasedBack) valid = false
    })
    if (!valid) return false

    // Apply: reduce in-house by net change
    setStocks(prev => {
      return prev.map(stock => {
        const name = stock.product_name
        const oldReserved = oldGrouped[name] || 0
        const newReserved = newGrouped[name] || 0
        const delta = newReserved - oldReserved // positive = more reserved
        return {
          ...stock,
          quantity: Math.max(0, (Number(stock.quantity) || 0) - delta)
        }
      })
    })

    setTruckLoadouts(prev => ({ ...prev, [truck]: newItems }))
    return true
  }, [])

  // ---- Deploy: loadout already reserved, no stock change ----
  const deployTruck = useCallback(
    (truck, items) => {
      const alreadyOut = deployments.some(
        d => d.truck === truck && d.status === 'out'
      )
      if (alreadyOut) return false

      const cleaned = items
        .filter(i => i.product_name && Number(i.cases) > 0)
        .map(i => ({
          product_name: i.product_name,
          cases: Number(i.cases)
        }))

      if (cleaned.length === 0) return false

      const deployItems = cleaned.map(i => {
        const stock = stocks.find(s => s.product_name === i.product_name)
        return {
          product_name: i.product_name,
          unit: stock ? Number(stock.unit) || 0 : 0,
          cases: i.cases
        }
      })

      setDeployments(prev => [
        {
          id: Date.now(),
          truck,
          date: new Date().toLocaleString(),
          items: deployItems,
          status: 'out',
          returned_at: null,
          returnItems: null
        },
        ...prev
      ])

      return true
    },
    [deployments, stocks]
  )

  // ---- Return: remaining stays reserved as next loadout, no stock change ----
  const returnTruck = useCallback(
    (deploymentId, returnItems) => {
      const deployment = deployments.find(d => d.id === deploymentId)
      if (!deployment || deployment.status !== 'out') return false

      const soldItems = deployment.items.map(item => {
        const match = returnItems.find(
          r => r.product_name === item.product_name
        )
        const returned = Math.min(
          Number(match?.cases_returned) || 0,
          item.cases
        )
        return {
          product_name: item.product_name,
          unit: item.unit,
          cases_deployed: item.cases,
          cases_returned: returned,
          cases_sold: item.cases - returned
        }
      })

      setDeployments(prev =>
        prev.map(d =>
          d.id === deploymentId
            ? {
                ...d,
                status: 'returned',
                returned_at: new Date().toLocaleString(),
                returnItems: soldItems
              }
            : d
        )
      )

      // Remaining cases stay reserved as the truck's next loadout.
      // No stock change — the reservation already accounts for them.
      const retained = soldItems
        .filter(item => item.cases_returned > 0)
        .map(item => ({
          product_name: item.product_name,
          cases: item.cases_returned
        }))

      setTruckLoadouts(prev => ({ ...prev, [deployment.truck]: retained }))

      return true
    },
    [deployments]
  )

  return {
    stocks,
    entries,
    deployments,
    truckLoadouts,
    addEntry,
    updateTruckLoadout,
    deployTruck,
    returnTruck
  }
}
