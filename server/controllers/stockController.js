const createError = require('http-errors')
const Stock = require('../models/stockModel')

const getAllStocks = async (req, res, next) => {
  try {
    const stocks = await Stock.find().sort({ product_name: 1 })
    res.status(200).json({ total: stocks.length, stocks })
  } catch (error) {
    next(error)
  }
}

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params
    const stock = await Stock.findById(id)
    if (!stock) return next(createError(404, 'Stock not found'))

    const fields = [
      'unit',
      'quantity',
      'promo',
      'price_per_case',
      'empties_per_case'
    ]
    fields.forEach(f => {
      if (req.body[f] !== undefined) stock[f] = req.body[f]
    })

    await stock.save()
    res.status(200).json({ message: 'Stock updated successfully', stock })
  } catch (error) {
    next(error)
  }
}

const deleteStock = async (req, res, next) => {
  try {
    const { id } = req.params
    const stock = await Stock.findById(id)
    if (!stock) return next(createError(404, 'Stock not found'))

    await Stock.findByIdAndDelete(id)
    res.status(200).json({ message: 'Stock deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAllStocks, updateStock, deleteStock }
