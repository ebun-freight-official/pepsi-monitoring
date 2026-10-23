const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    bottle_size: {
      type: String,
      required: [true, 'Bottle size is required'],
      trim: true
    },
    unit: {
      type: Number,
      required: [true, 'Unit is required'],
      min: [1, 'Unit must be at least 1']
    },
    price_per_case: {
      type: Number,
      required: [true, 'Price per case is required'],
      min: [0, 'Price cannot be negative']
    },
    empties_per_case: {
      type: Number,
      default: 0,
      min: [0, 'Empties value cannot be negative']
    },
    isSoftDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const Product = mongoose.model('Product', productSchema)
module.exports = Product
