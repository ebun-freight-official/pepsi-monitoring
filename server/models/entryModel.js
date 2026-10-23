const mongoose = require('mongoose')

const entryItemSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true, uppercase: true },
    bottle_size: { type: String, default: '' },
    unit: { type: Number, required: true },
    quantity: { type: Number, required: true },
    promo: { type: Number, default: 0 },
    price_per_case: { type: Number, default: 0 },
    empties_per_case: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
)

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: { type: [entryItemSchema], required: true },
    net_amount: { type: Number, required: true }
  },
  { timestamps: true }
)

const Entry = mongoose.model('Entry', entrySchema)
module.exports = Entry
