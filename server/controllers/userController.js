const createError = require('http-errors')
const bcrypt = require('bcrypt')
const { validateFields, validateRole } = require('../utils/validationFields')
const { signToken } = require('../utils/token')
const User = require('../models/userModel')

const normaliseEmail = email =>
  typeof email === 'string' ? email.trim().toLowerCase() : email

const ROLE_LABEL = {
  admin: 'Admin',
  sales_agent: 'Sales agent',
  visitor: 'Visitor'
}

// ── Create User (admin only) ───────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, role } = req.body

    if (req.user.role !== 'admin') {
      return next(createError(403, 'Only admin can create users'))
    }

    validateFields({ firstname, lastname, email, password, role })
    validateRole(role)

    const normalisedEmail = normaliseEmail(email)
    const exists = await User.findOne({ email: normalisedEmail })
    if (exists) return next(createError(409, 'Email already exists'))

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalisedEmail,
      password: hashedPassword,
      role
    })

    const userResponse = newUser.toObject()
    delete userResponse.password

    res
      .status(201)
      .json({ message: 'User created successfully', user: userResponse })
  } catch (error) {
    next(error)
  }
}

// ── Login ──────────────────────────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return next(createError(400, 'Email and password are required'))
    }

    const user = await User.findOne({ email: normaliseEmail(email) }).select(
      '+password'
    )
    if (!user) return next(createError(401, 'Invalid email or password'))

    if (user.isSoftDeleted) {
      return next(createError(401, 'This account has been deleted'))
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return next(createError(401, 'Invalid email or password'))

    const token = signToken(user)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
}

// ── Get Current User ──────────────────────────────────────────────────
const getCurrentUser = async (req, res, next) => {
  res.status(200).json({ user: req.user })
}

// ── Get All Users (admin only) ────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(createError(403, 'Access denied'))
    }

    const query = { isSoftDeleted: { $ne: true } }
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })

    res.status(200).json({ total: users.length, users })
  } catch (error) {
    next(error)
  }
}

// ── Update User ───────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstname, lastname, email, password, role } = req.body

    if (req.user.role !== 'admin') {
      return next(createError(403, 'Access denied'))
    }

    const user = await User.findById(id)
    if (!user) return next(createError(404, 'User not found'))

    if (role !== undefined && role !== user.role) validateRole(role)

    if (password) {
      user.password = await bcrypt.hash(password, 12)
    }

    if (firstname !== undefined) user.firstname = firstname.trim()
    if (lastname !== undefined) user.lastname = lastname.trim()
    if (email !== undefined) user.email = normaliseEmail(email)
    if (role !== undefined) user.role = role

    await user.save()

    const userResponse = user.toObject()
    delete userResponse.password

    res
      .status(200)
      .json({ message: 'User updated successfully', user: userResponse })
  } catch (error) {
    next(error)
  }
}

// ── Soft Delete ───────────────────────────────────────────────────────
const softDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user.role !== 'admin') {
      return next(createError(403, 'Access denied'))
    }

    if (req.user._id.toString() === id) {
      return next(createError(400, 'You cannot delete your own account'))
    }

    const user = await User.findById(id)
    if (!user) return next(createError(404, 'User not found'))
    if (user.isSoftDeleted)
      return next(createError(400, 'User is already deleted'))

    user.isSoftDeleted = true
    await user.save()

    res
      .status(200)
      .json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    next(error)
  }
}

// ── Register (ADMIN ONLY — creates admin / sales_agent / visitor) ────
const registerUser = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, role } = req.body

    if (!firstname || !lastname || !email || !password) {
      return next(createError(400, 'All fields are required'))
    }

    if (password.length < 8) {
      return next(createError(400, 'Password must be at least 8 characters'))
    }

    const finalRole = ['admin', 'sales_agent', 'visitor'].includes(role)
      ? role
      : 'sales_agent'
    const normalisedEmail = normaliseEmail(email)

    const exists = await User.findOne({ email: normalisedEmail })
    if (exists) return next(createError(409, 'Email already exists'))

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalisedEmail,
      password: hashedPassword,
      role: finalRole
    })

    const userResponse = newUser.toObject()
    delete userResponse.password

    res.status(201).json({
      message: `${ROLE_LABEL[finalRole]} account created successfully`,
      user: userResponse
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  softDeleteUser,
  registerUser
}
