const createError = require('http-errors')
const Deployment = require('../models/deploymentModel')
const Stock = require('../models/stockModel')
const TruckLoadout = require('../models/truckLoadoutModel')
const User = require('../models/userModel')

const cleanEmptiesCount = raw => {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  Object.entries(raw).forEach(([k, v]) => {
    const n = Math.max(0, Math.floor(Number(v) || 0))
    if (n > 0) out[k] = n
  })
  return out
}

const cleanEmptiesReceived = raw => ({
  fullCase: cleanEmptiesCount(raw?.fullCase),
  caseOnly: cleanEmptiesCount(raw?.caseOnly),
  bottlesOnly: cleanEmptiesCount(raw?.bottlesOnly)
})

const getAllDeployments = async (req, res, next) => {
  try {
    const deployments = await Deployment.find()
      .populate('user', 'firstname lastname email role')
      .sort({ createdAt: -1 })
    res.status(200).json({ total: deployments.length, deployments })
  } catch (error) {
    next(error)
  }
}

const deployTruck = async (req, res, next) => {
  try {
    const { truck, items } = req.body

    if (!truck || !Array.isArray(items) || items.length === 0) {
      return next(createError(400, 'Truck and items are required'))
    }

    const alreadyOut = await Deployment.findOne({ truck, status: 'out' })
    if (alreadyOut) return next(createError(400, `${truck} is already out`))

    // Guard: loadout must be printed first
    const loadout = await TruckLoadout.findOne({ truck })
    if (!loadout || !loadout.isLoadoutPrinted) {
      return next(
        createError(400, 'Loadout must be printed before deploying this truck')
      )
    }

    const cleaned = items
      .filter(i => i.product_name && Number(i.cases) > 0)
      .map(i => ({
        product_name: i.product_name.trim().toUpperCase(),
        cases: Number(i.cases)
      }))

    const withSnapshot = await Promise.all(
      cleaned.map(async i => {
        const stock = await Stock.findOne({ product_name: i.product_name })
        return {
          product_name: i.product_name,
          bottle_size: stock?.bottle_size || '',
          unit: stock ? Number(stock.unit) || 0 : 0,
          price_per_case: stock ? Number(stock.price_per_case) || 0 : 0,
          empties_per_case: stock ? Number(stock.empties_per_case) || 0 : 0,
          cases: i.cases
        }
      })
    )

    const agentUser = await User.findOne({
      role: 'sales_agent',
      isSoftDeleted: { $ne: true },
      $expr: {
        $eq: [
          { $toUpper: { $concat: ['$firstname', ' ', '$lastname'] } },
          truck.toUpperCase()
        ]
      }
    })

    const deployment = await Deployment.create({
      truck,
      agent: agentUser
        ? `${agentUser.firstname} ${agentUser.lastname}`.toUpperCase()
        : truck,
      user: req.user._id,
      items: withSnapshot,
      status: 'out',
      remit: null
    })

    res.status(201).json({ message: 'Truck deployed successfully', deployment })
  } catch (error) {
    next(error)
  }
}

const reloadTruck = async (req, res, next) => {
  try {
    const { id } = req.params
    const { items } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return next(createError(400, 'At least one item is required'))
    }

    const deployment = await Deployment.findById(id)
    if (!deployment) return next(createError(404, 'Deployment not found'))
    if (deployment.status !== 'out') {
      return next(createError(400, 'Truck is not currently out'))
    }

    const cleaned = items
      .filter(i => i.product_name && Number(i.cases) > 0)
      .map(i => ({
        product_name: i.product_name.trim().toUpperCase(),
        cases: Number(i.cases)
      }))

    if (cleaned.length === 0) {
      return next(createError(400, 'No valid items to reload'))
    }

    const grouped = {}
    cleaned.forEach(i => {
      grouped[i.product_name] = (grouped[i.product_name] || 0) + i.cases
    })

    const withSnapshot = []
    for (const [name, cases] of Object.entries(grouped)) {
      const stock = await Stock.findOne({ product_name: name })
      if (!stock) {
        return next(createError(404, `Product not found: ${name}`))
      }
      if (Number(stock.quantity) < cases) {
        return next(
          createError(
            400,
            `Not enough stock for ${name} (available: ${stock.quantity}, requested: ${cases})`
          )
        )
      }
      withSnapshot.push({
        product_name: name,
        bottle_size: stock.bottle_size || '',
        unit: Number(stock.unit) || 0,
        price_per_case: Number(stock.price_per_case) || 0,
        empties_per_case: Number(stock.empties_per_case) || 0,
        cases
      })
    }

    for (const item of withSnapshot) {
      await Stock.findOneAndUpdate(
        { product_name: item.product_name },
        { $inc: { quantity: -item.cases } }
      )
    }

    const existingByName = new Map()
    deployment.items.forEach((it, idx) => {
      existingByName.set(it.product_name, idx)
    })

    withSnapshot.forEach(item => {
      const idx = existingByName.get(item.product_name)
      if (idx !== undefined) {
        deployment.items[idx].cases += item.cases
      } else {
        deployment.items.push(item)
      }
    })

    await deployment.save()

    res.status(200).json({ message: 'Truck reloaded successfully', deployment })
  } catch (error) {
    next(error)
  }
}

const returnTruck = async (req, res, next) => {
  try {
    const { id } = req.params
    const { returnItems, remit, emptiesReceived } = req.body

    const deployment = await Deployment.findById(id)
    if (!deployment) return next(createError(404, 'Deployment not found'))
    if (deployment.status !== 'out') {
      return next(createError(400, 'Truck already returned'))
    }

    const soldItems = deployment.items.map(item => {
      const match = (returnItems || []).find(
        r => r.product_name === item.product_name
      )
      const returned = Math.min(Number(match?.cases_returned) || 0, item.cases)
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

    deployment.status = 'returned'
    deployment.returned_at = new Date()
    deployment.returnItems = soldItems
    deployment.remit = {
      cash: Number(remit?.cash) || 0,
      gcash: Number(remit?.gcash) || 0,
      credit: Number(remit?.credit) || 0,
      case_remit: Number(remit?.case_remit) || 0,
      credit_paid: false
    }
    deployment.emptiesReceived = cleanEmptiesReceived(emptiesReceived)
    deployment.markModified('emptiesReceived')
    await deployment.save()

    const retained = soldItems
      .filter(item => item.cases_returned > 0)
      .map(item => ({
        product_name: item.product_name,
        cases: item.cases_returned
      }))

    // Reset printed flag — next trip needs a fresh sheet
    await TruckLoadout.findOneAndUpdate(
      { truck: deployment.truck },
      {
        truck: deployment.truck,
        items: retained,
        isLoadoutPrinted: false
      },
      { upsert: true }
    )

    res.status(200).json({ message: 'Truck returned successfully', deployment })
  } catch (error) {
    next(error)
  }
}

const markCreditPaid = async (req, res, next) => {
  try {
    const { id } = req.params
    const { credit_paid } = req.body

    const deployment = await Deployment.findById(id)
    if (!deployment) return next(createError(404, 'Deployment not found'))
    if (deployment.status !== 'returned') {
      return next(createError(400, 'Truck has not been returned yet'))
    }
    if (!deployment.remit) {
      return next(createError(400, 'No remit record for this deployment'))
    }

    deployment.remit.credit_paid =
      credit_paid !== undefined ? Boolean(credit_paid) : true
    deployment.markModified('remit')
    await deployment.save()

    res.status(200).json({
      message: deployment.remit.credit_paid
        ? 'Credit marked as paid'
        : 'Credit marked as unpaid',
      deployment
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllDeployments,
  deployTruck,
  reloadTruck,
  returnTruck,
  markCreditPaid
}
