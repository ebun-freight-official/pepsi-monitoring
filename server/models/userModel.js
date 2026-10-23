const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, 'Firstname is required'],
      trim: true,
      minlength: [2, 'Firstname must be at least 2 characters long'],
      maxlength: [50, 'Firstname cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'Firstname must contain letters only']
    },
    lastname: {
      type: String,
      required: [true, 'Lastname is required'],
      trim: true,
      minlength: [2, 'Lastname must be at least 2 characters long'],
      maxlength: [50, 'Lastname cannot exceed 50 characters'],
      match: [/^[a-zA-Z\s'-]+$/, 'Lastname must contain letters only']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [100, 'Email cannot exceed 100 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      lowercase: true,
      enum: {
        values: ['admin', 'sales_agent', 'visitor'],
        message: '{VALUE} is not a valid role'
      }
    },
    isSoftDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)
module.exports = User
