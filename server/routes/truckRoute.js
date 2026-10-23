const express = require('express')
const { getAllTrucks } = require('../controllers/truckController')
const { authenticateToken } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

// Read-only — trucks are derived from sales_agent users
router.get('/', getAllTrucks)

module.exports = router
