const mongoose = require('mongoose')

const stockSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      uppercase: true,
      unique: true
    },
    bottle_size: { type: String, trim: true, default: '' },
    unit: { type: Number, required: true, default: 24, min: 0 },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    promo: { type: Number, default: 0, min: 0 },
    price_per_case: { type: Number, default: 0, min: 0 },
    empties_per_case: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
)

const Stock = mongoose.model('Stock', stockSchema)
module.exports = Stock
