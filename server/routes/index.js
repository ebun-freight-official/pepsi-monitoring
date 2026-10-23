const express = require('express')
const userRoute = require('./userRoute')
const productRoute = require('./productRoute')
const stockRoute = require('./stockRoute')
const entryRoute = require('./entryRoute')
const truckRoute = require('./truckRoute')
const truckLoadoutRoute = require('./truckLoadoutRoute')
const deploymentRoute = require('./deploymentRoute')

const router = express.Router()

router.use('/users', userRoute)
router.use('/products', productRoute)
router.use('/stocks', stockRoute)
router.use('/entries', entryRoute)
router.use('/trucks', truckRoute)
router.use('/loadouts', truckLoadoutRoute)
router.use('/deployments', deploymentRoute)

module.exports = router
