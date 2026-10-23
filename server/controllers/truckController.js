const User = require('../models/userModel')

// Build a truck-shaped object from a sales_agent user
const deriveTruck = user => {
  const name = `${user.firstname} ${user.lastname}`.trim().toUpperCase()
  return {
    _id: user._id,
    userId: user._id,
    name,
    agent: name,
    role: user.role
  }
}

const getAllTrucks = async (req, res, next) => {
  try {
    const users = await User.find({
      role: 'sales_agent',
      isSoftDeleted: { $ne: true }
    }).sort({ firstname: 1, lastname: 1 })

    const trucks = users.map(deriveTruck)
    res.status(200).json({ total: trucks.length, trucks })
  } catch (error) {
    next(error)
  }
}

module.exports = { getAllTrucks }
