const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const {
  routeNotFoundHandler,
  globalErrorHandler
} = require('./middlewares/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', routes)

app.use(routeNotFoundHandler)
app.use(globalErrorHandler)

module.exports = app
