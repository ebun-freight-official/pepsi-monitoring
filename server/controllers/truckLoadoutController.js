const createError = require('http-errors')
const TruckLoadout = require('../models/truckLoadoutModel')
const Stock = require('../models/stockModel')

const getAllLoadouts = async (req, res, next) => {
  try {
    const loadouts = await TruckLoadout.find()
    res.status(200).json({ total: loadouts.length, loadouts })
  } catch (error) {
    next(error)
  }
}

const upsertLoadout = async (req, res, next) => {
  try {
    const { truck } = req.params
    const { items } = req.body

    if (!Array.isArray(items)) {
      return next(createError(400, 'Items must be an array'))
    }

    const cleaned = items
      .filter(i => i.product_name && Number(i.cases) > 0)
      .map(i => ({
        product_name: i.product_name.trim().toUpperCase(),
        cases: Number(i.cases)
      }))

    const existing = await TruckLoadout.findOne({ truck })
    const oldItems = existing?.items || []

    const group = list => {
      const g = {}
      list.forEach(i => {
        if (!i.product_name) return
        g[i.product_name] = (g[i.product_name] || 0) + Number(i.cases || 0)
      })
      return g
    }

    const oldGrouped = group(oldItems)
    const newGrouped = group(cleaned)

    // Validate
    for (const [name, total] of Object.entries(newGrouped)) {
      const stock = await Stock.findOne({ product_name: name })
      const inHouse = stock ? Number(stock.quantity) || 0 : 0
      const releasedBack = oldGrouped[name] || 0
      if (total > inHouse + releasedBack) {
        return next(createError(400, `Not enough stock for ${name}`))
      }
    }

    // Apply reservation deltas
    const allNames = new Set([
      ...Object.keys(oldGrouped),
      ...Object.keys(newGrouped)
    ])
    for (const name of allNames) {
      const delta = (newGrouped[name] || 0) - (oldGrouped[name] || 0)
      if (delta !== 0) {
        await Stock.findOneAndUpdate(
          { product_name: name },
          { $inc: { quantity: -delta } }
        )
      }
    }

    // Detect item change to decide whether to reset the printed flag
    const normalise = obj =>
      Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
    const itemsChanged =
      !existing ||
      JSON.stringify(normalise(oldGrouped)) !==
        JSON.stringify(normalise(newGrouped))

    const updateData = { truck, items: cleaned }
    if (itemsChanged) updateData.isLoadoutPrinted = false

    const loadout = await TruckLoadout.findOneAndUpdate({ truck }, updateData, {
      upsert: true,
      new: true
    })

    res.status(200).json({ message: 'Loadout saved successfully', loadout })
  } catch (error) {
    next(error)
  }
}

const markLoadoutPrinted = async (req, res, next) => {
  try {
    const { truck } = req.params

    const loadout = await TruckLoadout.findOne({ truck })
    if (!loadout) return next(createError(404, 'Loadout not found'))

    loadout.isLoadoutPrinted = true
    await loadout.save()

    res.status(200).json({ message: 'Loadout marked as printed', loadout })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAllLoadouts, upsertLoadout, markLoadoutPrinted }
