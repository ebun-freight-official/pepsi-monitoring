const createError = require('http-errors')

const routeNotFoundHandler = (req, res, next) => {
  next(createError(404, 'Route not found'))
}

const globalErrorHandler = (err, req, res, next) => {
  console.error('🚨 Error:', err)

  let statusCode = err.status || 500
  let message = err.message || 'Internal Server Error'

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map(error => error.message)[0]
  }

  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue)[0]
    message = `${field} already exists`
  }

  res.status(statusCode).json({ message })
}

module.exports = { routeNotFoundHandler, globalErrorHandler }
