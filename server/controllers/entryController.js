const createError = require('http-errors')
const Entry = require('../models/entryModel')
const Stock = require('../models/stockModel')

const getAllEntries = async (req, res, next) => {
  try {
    const entries = await Entry.find()
      .populate('user', 'firstname lastname email role')
      .sort({ createdAt: -1 })
    res.status(200).json({ total: entries.length, entries })
  } catch (error) {
    next(error)
  }
}

const createEntry = async (req, res, next) => {
  try {
    const { items, net_amount } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return next(createError(400, 'At least one item is required'))
    }

    const cleaned = items
      .filter(i => i.product_name && i.product_name.trim() !== '')
      .map(i => ({
        product_name: i.product_name.trim().toUpperCase(),
        bottle_size: i.bottle_size || '',
        unit: Number(i.unit) || 0,
        quantity: Number(i.quantity) || 0,
        promo: Number(i.promo) || 0,
        price_per_case: Number(i.price_per_case) || 0,
        empties_per_case: Number(i.empties_per_case) || 0,
        discount: Number(i.discount) || 0
      }))

    if (cleaned.length === 0) {
      return next(createError(400, 'No valid products'))
    }

    const total =
      Number(net_amount) ||
      cleaned.reduce(
        (s, i) => s + i.quantity * i.price_per_case - i.discount,
        0
      )

    const entry = await Entry.create({
      user: req.user._id,
      items: cleaned,
      net_amount: total
    })

    // Upsert each stock — discount does NOT affect stock quantity
    for (const item of cleaned) {
      await Stock.findOneAndUpdate(
        { product_name: item.product_name },
        {
          $inc: { quantity: item.quantity, promo: item.promo },
          $set: {
            bottle_size: item.bottle_size,
            unit: item.unit,
            price_per_case: item.price_per_case,
            empties_per_case: item.empties_per_case
          }
        },
        { upsert: true, new: true }
      )
    }

    const populated = await Entry.findById(entry._id).populate(
      'user',
      'firstname lastname email role'
    )

    res
      .status(201)
      .json({ message: 'Entry created successfully', entry: populated })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAllEntries, createEntry }
