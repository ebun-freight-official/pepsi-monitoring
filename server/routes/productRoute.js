const express = require('express')
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

router.route('/').get(getAllProducts).post(authorize('admin'), createProduct)

router
  .route('/:id')
  .patch(authorize('admin'), updateProduct)
  .delete(authorize('admin'), deleteProduct)

module.exports = router
