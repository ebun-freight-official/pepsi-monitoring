const mongoose = require('mongoose')

const loadoutItemSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true, uppercase: true },
    cases: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const truckLoadoutSchema = new mongoose.Schema(
  {
    truck: { type: String, required: true, unique: true, trim: true },
    items: { type: [loadoutItemSchema], default: [] },
    isLoadoutPrinted: { type: Boolean, default: false }
  },
  { timestamps: true }
)

const TruckLoadout = mongoose.model('TruckLoadout', truckLoadoutSchema)
module.exports = TruckLoadout
