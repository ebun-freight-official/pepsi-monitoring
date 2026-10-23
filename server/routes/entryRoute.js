const express = require('express')
const { getAllEntries, createEntry } = require('../controllers/entryController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

router.use(authenticateToken)

router.route('/').get(getAllEntries).post(authorize('admin'), createEntry)

module.exports = router
