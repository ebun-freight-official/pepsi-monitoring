const express = require('express')
const {
  getAllLoadouts,
  upsertLoadout,
  markLoadoutPrinted
} = require('../controllers/truckLoadoutController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

router.get('/', getAllLoadouts)
router.put('/:truck', authorize('admin'), upsertLoadout)
router.patch('/:truck/print', authorize('admin'), markLoadoutPrinted)

module.exports = router
