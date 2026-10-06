import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DEFAULT_TRUCKS,
  defaultAgentFor,
  calcEntryTotal
} from '../utils/inventory'
import { storage } from '../lib/storage'

const KEYS = {
  products: 'products',
  stocks: 'stocks',
  entries: 'entries',
  deployments: 'deployments',
  loadouts: 'loadouts',
  agents: 'agents',
  trucks: 'trucks'
}

export function useInventory () {
  const [products, setProducts] = useState(() => storage.get(KEYS.products, []))
  const [stocks, setStocks] = useState(() => storage.get(KEYS.stocks, []))
  const [entries, setEntries] = useState(() => storage.get(KEYS.entries, []))
  const [deployments, setDeployments] = useState(() =>
    storage.get(KEYS.deployments, [])
  )

  // Dynamic truck list — seeds from storage, defaults to DEFAULT_TRUCKS on first run
  const [trucks, setTrucks] = useState(() =>
    storage.get(KEYS.trucks, DEFAULT_TRUCKS)
  )

  const [truckLoadouts, setTruckLoadouts] = useState(() => {
    const saved = storage.get(KEYS.loadouts, {})
    const seed = storage.get(KEYS.trucks, DEFAULT_TRUCKS)
    const init = {}
    seed.forEach(t => {
      init[t] = saved[t] || []
    })
    // Preserve any extra loadouts that aren't in the seed list (from past runs)
    Object.keys(saved).forEach(t => {
      if (!(t in init)) init[t] = saved[t]
    })
    return init
  })

  const [truckAgents, setTruckAgents] = useState(() => {
    const saved = storage.get(KEYS.agents, {})
    const seed = storage.get(KEYS.trucks, DEFAULT_TRUCKS)
    const init = {}
    seed.forEach(t => {
      init[t] = saved[t] || defaultAgentFor(t)
    })
    Object.keys(saved).forEach(t => {
      if (!(t in init)) init[t] = saved[t]
    })
    return init
  })

  const stocksRef = useRef(stocks)
  const loadoutsRef = useRef(truckLoadouts)
  useEffect(() => {
    stocksRef.current = stocks
  }, [stocks])
  useEffect(() => {
    loadoutsRef.current = truckLoadouts
  }, [truckLoadouts])

  useEffect(() => {
    storage.set(KEYS.products, products)
  }, [products])
  useEffect(() => {
    storage.set(KEYS.stocks, stocks)
  }, [stocks])
  useEffect(() => {
    storage.set(KEYS.entries, entries)
  }, [entries])
  useEffect(() => {
    storage.set(KEYS.deployments, deployments)
  }, [deployments])
  useEffect(() => {
    storage.set(KEYS.loadouts, truckLoadouts)
  }, [truckLoadouts])
  useEffect(() => {
    storage.set(KEYS.agents, truckAgents)
  }, [truckAgents])
  useEffect(() => {
    storage.set(KEYS.trucks, trucks)
  }, [trucks])

  // ---------- Products ----------
  const addProduct = useCallback(
    data => {
      const cleaned = {
        product_name: (data.product_name || '').trim().toUpperCase(),
        bottle_size: data.bottle_size || '8oz_12oz',
        unit: Number(data.unit) || 0,
        price_per_case: Number(data.price_per_case) || 0,
        empties_per_case: Number(data.empties_per_case) || 0
      }
      if (!cleaned.product_name) return false
      if (products.some(p => p.product_name === cleaned.product_name))
        return false
      setProducts(prev => [{ id: Date.now(), ...cleaned }, ...prev])
      return true
    },
    [products]
  )

  const updateProduct = useCallback((id, data) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)))
  }, [])

  const deleteProduct = useCallback(id => {
    setProducts(prev => prev.filter(p => p.id !== id))
  }, [])

  const seedSampleProducts = useCallback(() => {
    const samples = [
      {
        product_name: 'PEPSI 8',
        bottle_size: '8oz_12oz',
        unit: 24,
        price_per_case: 0,
        empties_per_case: 90
      },
      {
        product_name: 'PEPSI 12',
        bottle_size: '8oz_12oz',
        unit: 24,
        price_per_case: 0,
        empties_per_case: 90
      },
      {
        product_name: 'PEPSI 750ML',
        bottle_size: '750ml',
        unit: 12,
        price_per_case: 0,
        empties_per_case: 100
      },
      {
        product_name: 'PEPSI 1L',
        bottle_size: '1l',
        unit: 24,
        price_per_case: 0,
        empties_per_case: 196
      },
      {
        product_name: 'PEPSI 290ML',
        bottle_size: '290ml',
        unit: 12,
        price_per_case: 0,
        empties_per_case: 0
      },
      {
        product_name: 'PEPSI 237ML',
        bottle_size: '237ml',
        unit: 24,
        price_per_case: 0,
        empties_per_case: 0
      },
      {
        product_name: 'PEPSI 1.5L',
        bottle_size: '1_5l_plastic',
        unit: 12,
        price_per_case: 0,
        empties_per_case: 0
      }
    ]
    setProducts(prev => {
      const names = new Set(prev.map(p => p.product_name))
      const add = samples.filter(s => !names.has(s.product_name))
      return [...add.map((s, i) => ({ id: Date.now() + i, ...s })), ...prev]
    })
  }, [])

  // ---------- Trucks ----------
  const addTruck = useCallback(
    name => {
      const cleaned = (name || '').trim()
      if (!cleaned) return false
      if (trucks.includes(cleaned)) return false
      setTrucks(prev => [...prev, cleaned])
      setTruckLoadouts(prev => ({ ...prev, [cleaned]: [] }))
      setTruckAgents(prev => ({
        ...prev,
        [cleaned]: defaultAgentFor(cleaned)
      }))
      return true
    },
    [trucks]
  )

  const removeTruck = useCallback(
    truck => {
      // Never allow removal while it's out on a route — must return first
      const isOut = deployments.some(
        d => d.truck === truck && d.status === 'out'
      )
      if (isOut) return false
      if (trucks.length <= 1) return false
      setTrucks(prev => prev.filter(t => t !== truck))
      setTruckLoadouts(prev => {
        const next = { ...prev }
        delete next[truck]
        return next
      })
      setTruckAgents(prev => {
        const next = { ...prev }
        delete next[truck]
        return next
      })
      return true
    },
    [trucks, deployments]
  )

  const renameTruck = useCallback(
    (oldName, newName) => {
      const cleaned = (newName || '').trim()
      if (!cleaned) return false
      if (cleaned === oldName) return true
      if (trucks.includes(cleaned)) return false
      const isOut = deployments.some(
        d => d.truck === oldName && d.status === 'out'
      )
      if (isOut) return false

      setTrucks(prev => prev.map(t => (t === oldName ? cleaned : t)))
      setTruckLoadouts(prev => {
        const next = { ...prev }
        next[cleaned] = next[oldName] || []
        delete next[oldName]
        return next
      })
      setTruckAgents(prev => {
        const next = { ...prev }
        next[cleaned] = next[oldName] || defaultAgentFor(cleaned)
        delete next[oldName]
        return next
      })
      return true
    },
    [trucks, deployments]
  )

  // ---------- Entry ----------
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
        const empties = Number(item.empties_per_case) || 0
        const bottleSize = item.bottle_size || ''

        const existing = next.find(
          stock =>
            stock.product_name.toLowerCase() === item.product_name.toLowerCase()
        )

        if (existing) {
          existing.quantity += cases
          existing.promo += freeCases
          existing.unit = unit
          existing.price_per_case = price
          existing.empties_per_case = empties
          if (bottleSize) existing.bottle_size = bottleSize
        } else {
          next.push({
            id: Date.now() + Math.random(),
            product_name: item.product_name,
            bottle_size: bottleSize,
            unit,
            quantity: cases,
            promo: freeCases,
            price_per_case: price,
            empties_per_case: empties
          })
        }
      })

      return next
    })

    return true
  }, [])

  // ---------- Loadout ----------
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

    let valid = true
    Object.entries(newGrouped).forEach(([name, total]) => {
      const stock = currentStocks.find(s => s.product_name === name)
      const inHouse = stock ? Number(stock.quantity) || 0 : 0
      const releasedBack = oldGrouped[name] || 0
      if (total > inHouse + releasedBack) valid = false
    })
    if (!valid) return false

    setStocks(prev =>
      prev.map(stock => {
        const name = stock.product_name
        const delta = (newGrouped[name] || 0) - (oldGrouped[name] || 0)
        return {
          ...stock,
          quantity: Math.max(0, (Number(stock.quantity) || 0) - delta)
        }
      })
    )

    setTruckLoadouts(prev => ({ ...prev, [truck]: newItems }))
    return true
  }, [])

  // ---------- Deploy ----------
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
          bottle_size: stock?.bottle_size || '',
          unit: stock ? Number(stock.unit) || 0 : 0,
          price_per_case: stock ? Number(stock.price_per_case) || 0 : 0,
          empties_per_case: stock ? Number(stock.empties_per_case) || 0 : 0,
          cases: i.cases
        }
      })

      setDeployments(prev => [
        {
          id: Date.now(),
          truck,
          agent: truckAgents[truck] || defaultAgentFor(truck),
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
    [deployments, stocks, truckAgents]
  )

  // ---------- Return ----------
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
        const sold = item.cases - returned
        const price = Number(item.price_per_case) || 0
        const emptiesPer = Number(item.empties_per_case) || 0
        return {
          product_name: item.product_name,
          bottle_size: item.bottle_size || '',
          unit: item.unit,
          price_per_case: price,
          empties_per_case: emptiesPer,
          cases_deployed: item.cases,
          cases_returned: returned,
          cases_sold: sold,
          value_sold: sold * price,
          empties_sold: sold * emptiesPer
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

  const updateTruckAgent = useCallback((truck, name) => {
    const cleaned = (name || '').trim().toUpperCase() || defaultAgentFor(truck)
    setTruckAgents(prev => ({ ...prev, [truck]: cleaned }))
  }, [])

  // ---------- Export / Import / Reset ----------
  const exportData = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      products,
      stocks,
      entries,
      deployments,
      truckLoadouts,
      truckAgents,
      trucks
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pepsi-inventory-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [
    products,
    stocks,
    entries,
    deployments,
    truckLoadouts,
    truckAgents,
    trucks
  ])

  const importData = useCallback(data => {
    if (!data || typeof data !== 'object') return false
    if (Array.isArray(data.products)) setProducts(data.products)
    if (Array.isArray(data.stocks)) setStocks(data.stocks)
    if (Array.isArray(data.entries)) setEntries(data.entries)
    if (Array.isArray(data.deployments)) setDeployments(data.deployments)

    const importedTrucks =
      Array.isArray(data.trucks) && data.trucks.length > 0
        ? data.trucks
        : DEFAULT_TRUCKS
    setTrucks(importedTrucks)

    if (data.truckLoadouts && typeof data.truckLoadouts === 'object') {
      const merged = {}
      importedTrucks.forEach(t => {
        merged[t] = data.truckLoadouts[t] || []
      })
      setTruckLoadouts(merged)
    }
    if (data.truckAgents && typeof data.truckAgents === 'object') {
      const merged = {}
      importedTrucks.forEach(t => {
        merged[t] = data.truckAgents[t] || defaultAgentFor(t)
      })
      setTruckAgents(merged)
    }
    return true
  }, [])

  const resetData = useCallback(() => {
    if (!confirm('Erase all local data? This cannot be undone.')) return
    storage.clearAll()
    setProducts([])
    setStocks([])
    setEntries([])
    setDeployments([])
    const initLoadouts = {}
    const initAgents = {}
    DEFAULT_TRUCKS.forEach(t => {
      initLoadouts[t] = []
      initAgents[t] = defaultAgentFor(t)
    })
    setTrucks(DEFAULT_TRUCKS)
    setTruckLoadouts(initLoadouts)
    setTruckAgents(initAgents)
  }, [])

  return {
    products,
    stocks,
    entries,
    deployments,
    trucks,
    truckLoadouts,
    truckAgents,
    addProduct,
    updateProduct,
    deleteProduct,
    seedSampleProducts,
    addTruck,
    removeTruck,
    renameTruck,
    addEntry,
    updateTruckLoadout,
    updateTruckAgent,
    deployTruck,
    returnTruck,
    exportData,
    importData,
    resetData
  }
}
