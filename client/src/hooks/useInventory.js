import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useInventory () {
  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [entries, setEntries] = useState([])
  const [deployments, setDeployments] = useState([])
  const [truckLoadouts, setTruckLoadouts] = useState({})
  const [loadoutMeta, setLoadoutMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const [p, s, e, d, l] = await Promise.all([
        api.get('/products'),
        api.get('/stocks'),
        api.get('/entries'),
        api.get('/deployments'),
        api.get('/loadouts')
      ])

      setProducts(p.products || [])
      setStocks(s.stocks || [])
      setEntries(e.entries || [])
      setDeployments(d.deployments || [])

      const loadoutMap = {}
      const metaMap = {}
      ;(l.loadouts || []).forEach(lo => {
        loadoutMap[lo.truck] = lo.items || []
        metaMap[lo.truck] = {
          isLoadoutPrinted: !!lo.isLoadoutPrinted
        }
      })
      setTruckLoadouts(loadoutMap)
      setLoadoutMeta(metaMap)

      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const addProduct = useCallback(
    async data => {
      try {
        await api.post('/products', data)
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const deleteProduct = useCallback(
    async id => {
      try {
        await api.del(`/products/${id}`)
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const addEntry = useCallback(
    async (items, netAmount) => {
      try {
        await api.post('/entries', {
          items,
          net_amount: Number(netAmount)
        })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const updateTruckLoadout = useCallback(
    async (truck, items) => {
      try {
        await api.put(`/loadouts/${encodeURIComponent(truck)}`, { items })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const markLoadoutPrinted = useCallback(
    async truck => {
      try {
        await api.patch(`/loadouts/${encodeURIComponent(truck)}/print`, {})
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const deployTruck = useCallback(
    async (truck, items) => {
      try {
        await api.post('/deployments', { truck, items })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const reloadTruck = useCallback(
    async (deploymentId, items) => {
      try {
        await api.post(`/deployments/${deploymentId}/reload`, { items })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const returnTruck = useCallback(
    async (deploymentId, returnItems, remit, emptiesReceived) => {
      try {
        await api.post(`/deployments/${deploymentId}/return`, {
          returnItems,
          remit: {
            cash: Number(remit?.cash) || 0,
            gcash: Number(remit?.gcash) || 0,
            credit: Number(remit?.credit) || 0,
            case_remit: Number(remit?.case_remit) || 0
          },
          emptiesReceived: emptiesReceived || {
            fullCase: {},
            caseOnly: {},
            bottlesOnly: {}
          }
        })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  const markCreditPaid = useCallback(
    async (deploymentId, paid = true) => {
      try {
        await api.patch(`/deployments/${deploymentId}/credit-paid`, {
          credit_paid: paid
        })
        await refresh()
        return true
      } catch (err) {
        setError(err.message)
        return false
      }
    },
    [refresh]
  )

  return {
    products,
    stocks,
    entries,
    deployments,
    truckLoadouts,
    loadoutMeta,
    loading,
    error,
    refresh,
    addProduct,
    deleteProduct,
    addEntry,
    updateTruckLoadout,
    markLoadoutPrinted,
    deployTruck,
    reloadTruck,
    returnTruck,
    markCreditPaid
  }
}
