const jwt = require('jsonwebtoken')

const signToken = user =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  })

module.exports = { signToken }
