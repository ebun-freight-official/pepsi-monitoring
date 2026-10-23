require('dotenv').config()
const express = require('express')
const cors = require('cors')

const connectDB = require('./config/db')
const routes = require('./routes')
const {
  routeNotFoundHandler,
  globalErrorHandler
} = require('./middlewares/errorHandler')

const app = express()
const PORT = process.env.PORT || 5000

// ── Middlewares ─────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', routes)

// ── Error handling ──────────────────────────────────────────────────────
app.use(routeNotFoundHandler)
app.use(globalErrorHandler)

// ── Start ───────────────────────────────────────────────────────────────
async function start () {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})
