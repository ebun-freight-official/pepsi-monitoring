const express = require('express')
const {
  getAllStocks,
  updateStock,
  deleteStock
} = require('../controllers/stockController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

router.get('/', getAllStocks)
router.patch('/:id', authorize('admin'), updateStock)
router.delete('/:id', authorize('admin'), deleteStock)

module.exports = router
