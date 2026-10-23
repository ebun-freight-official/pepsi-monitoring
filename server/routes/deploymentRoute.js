const express = require('express')
const {
  getAllDeployments,
  deployTruck,
  reloadTruck,
  returnTruck,
  markCreditPaid
} = require('../controllers/deploymentController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

router.get('/', getAllDeployments)
router.post('/', authorize('admin'), deployTruck)
router.post('/:id/reload', authorize('admin'), reloadTruck)
router.post('/:id/return', authorize('admin'), returnTruck)
router.patch('/:id/credit-paid', authorize('admin'), markCreditPaid)

module.exports = router
