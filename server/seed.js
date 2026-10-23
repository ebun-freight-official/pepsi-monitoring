require('dotenv').config()
const connectDB = require('./config/db')
const bcrypt = require('bcrypt')
const User = require('./models/userModel')

const [, , email, password, firstname = 'Admin', lastname = 'User'] =
  process.argv

if (!email || !password) {
  console.error(
    'Usage: npm run seed -- <email> <password> [firstname] [lastname]'
  )
  process.exit(1)
}

async function run () {
  await connectDB()

  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) {
    console.log('User already exists')
    process.exit(0)
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await User.create({
    firstname,
    lastname,
    email: email.toLowerCase(),
    password: hashed,
    role: 'admin'
  })

  console.log('✓ Admin created:', user.email)
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
