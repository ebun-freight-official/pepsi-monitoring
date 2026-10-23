const express = require('express')
const {
  registerUser,
  createUser,
  loginUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  softDeleteUser
} = require('../controllers/userController')
const { authenticateToken, authorize } = require('../middlewares/auth')

const router = express.Router()

// ── Public routes (no auth) ─────────────────────────────────────────────
router.post('/login', loginUser)

// ── Protected routes ────────────────────────────────────────────────────
router.get('/current-user', authenticateToken, getCurrentUser)

// Admin-only user creation (was public)
router.post('/register', authenticateToken, authorize('admin'), registerUser)

router
  .route('/')
  .get(authenticateToken, getAllUsers)
  .post(authenticateToken, authorize('admin'), createUser)

router
  .route('/:id')
  .patch(authenticateToken, updateUser)
  .delete(authenticateToken, softDeleteUser)

module.exports = router
