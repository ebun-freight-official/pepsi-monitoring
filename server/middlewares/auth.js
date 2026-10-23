const jwt = require('jsonwebtoken')
const createError = require('http-errors')
const User = require('../models/userModel')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) return next(createError(401, 'Access denied'))

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password')
    if (!user) throw createError(404, 'User not found')

    if (user.isSoftDeleted) {
      throw createError(401, 'This account has been deleted')
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid session. Please log in again.'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Session expired. Please log in again.'))
    }
    next(error)
  }
}

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(createError(401, 'Not authenticated'))
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Access denied'))
    }
    next()
  }

module.exports = { authenticateToken, authorize }
