const createError = require('http-errors')
const Product = require('../models/productModel')

const createProduct = async (req, res, next) => {
  try {
    const {
      product_name,
      bottle_size,
      unit,
      price_per_case,
      empties_per_case
    } = req.body

    if (!product_name || !bottle_size || !unit) {
      return next(
        createError(400, 'Product name, bottle size, and unit are required')
      )
    }

    const exists = await Product.findOne({
      product_name: product_name.toUpperCase()
    })
    if (exists) return next(createError(409, 'Product already exists'))

    const product = await Product.create({
      product_name,
      bottle_size,
      unit,
      price_per_case: price_per_case || 0,
      empties_per_case: empties_per_case || 0
    })

    res.status(201).json({ message: 'Product created successfully', product })
  } catch (error) {
    next(error)
  }
}

const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isSoftDeleted: { $ne: true } }).sort({
      product_name: 1
    })
    res.status(200).json({ total: products.length, products })
  } catch (error) {
    next(error)
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)
    if (!product) return next(createError(404, 'Product not found'))

    const fields = [
      'product_name',
      'bottle_size',
      'unit',
      'price_per_case',
      'empties_per_case'
    ]
    fields.forEach(f => {
      if (req.body[f] !== undefined) product[f] = req.body[f]
    })

    await product.save()
    res.status(200).json({ message: 'Product updated successfully', product })
  } catch (error) {
    next(error)
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const product = await Product.findById(id)
    if (!product) return next(createError(404, 'Product not found'))

    await Product.findByIdAndDelete(id)
    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = { createProduct, getAllProducts, updateProduct, deleteProduct }
