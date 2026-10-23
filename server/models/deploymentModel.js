const mongoose = require('mongoose')

const deployItemSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true, uppercase: true },
    bottle_size: { type: String, default: '' },
    unit: { type: Number, required: true },
    price_per_case: { type: Number, default: 0 },
    empties_per_case: { type: Number, default: 0 },
    cases: { type: Number, required: true, min: 0 }
  },
  { _id: false }
)

const returnItemSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true, trim: true, uppercase: true },
    bottle_size: { type: String, default: '' },
    unit: { type: Number, required: true },
    price_per_case: { type: Number, default: 0 },
    empties_per_case: { type: Number, default: 0 },
    cases_deployed: { type: Number, required: true },
    cases_returned: { type: Number, required: true },
    cases_sold: { type: Number, required: true },
    value_sold: { type: Number, default: 0 },
    empties_sold: { type: Number, default: 0 }
  },
  { _id: false }
)

const remitSchema = new mongoose.Schema(
  {
    cash: { type: Number, default: 0, min: 0 },
    gcash: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    case_remit: { type: Number, default: 0, min: 0 },
    credit_paid: { type: Boolean, default: false }
  },
  { _id: false }
)

// Empties received — physical count of empties handed back at return.
// Shape: { fullCase: { <sizeId>: qty, ... }, caseOnly: {...}, bottlesOnly: {...} }
// Stored as Mixed so the keys can grow with bottleSizes without a schema
// migration.
const deploymentSchema = new mongoose.Schema(
  {
    truck: { type: String, required: true, trim: true },
    agent: { type: String, default: '' },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: { type: [deployItemSchema], required: true },
    status: { type: String, enum: ['out', 'returned'], default: 'out' },
    returned_at: { type: Date, default: null },
    returnItems: { type: [returnItemSchema], default: null },
    remit: { type: remitSchema, default: null },
    emptiesReceived: {
      fullCase: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
      caseOnly: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
      bottlesOnly: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }
    }
  },
  { timestamps: true }
)

const Deployment = mongoose.model('Deployment', deploymentSchema)
module.exports = Deployment
