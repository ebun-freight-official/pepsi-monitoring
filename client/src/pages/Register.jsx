import { useState } from 'react'
import { useNavigate } from 'react-router'
import { TbLoader2, TbUserPlus, TbCheck } from 'react-icons/tb'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'

const labelClass =
  'block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5'

const ROLE_LABEL = {
  admin: 'Admin',
  sales_agent: 'Sales agent',
  visitor: 'Visitor'
}

export default function Register () {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales_agent'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (field, value) => setForm({ ...form, [field]: value })

  const resetForm = () => {
    setForm({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'sales_agent'
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setBusy(true)
    try {
      const { user } = await register({
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        password: form.password,
        role: form.role
      })

      setSuccess(
        `${ROLE_LABEL[user.role] || user.role} "${user.firstname} ${
          user.lastname
        }" created successfully.`
      )
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-6 overflow-auto shadow-lg shadow-black/40'>
      <div className='max-w-lg mx-auto'>
        {/* Header */}
        <div className='flex items-center gap-3 pb-4 mb-6 border-b border-zinc-800'>
          <div className='w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400 shrink-0'>
            <TbUserPlus size={18} />
          </div>
          <div className='min-w-0'>
            <div className='uppercase font-medium text-base tracking-wide'>
              Create User
            </div>
            <div className='text-[11px] text-zinc-500'>
              Add an admin, sales agent, or visitor
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className='bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4'
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className={labelClass}>First Name</label>
              <input
                type='text'
                value={form.firstname}
                onChange={e => update('firstname', e.target.value)}
                required
                disabled={busy}
                placeholder='Juan'
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input
                type='text'
                value={form.lastname}
                onChange={e => update('lastname', e.target.value)}
                required
                disabled={busy}
                placeholder='Dela Cruz'
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type='email'
              value={form.email}
              onChange={e => update('email', e.target.value)}
              required
              disabled={busy}
              placeholder='user@pepsi.com'
              className={inputClass}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type='password'
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
                disabled={busy}
                placeholder='Min. 8 characters'
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type='password'
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                required
                disabled={busy}
                placeholder='Repeat password'
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select
              value={form.role}
              onChange={e => update('role', e.target.value)}
              disabled={busy}
              className={inputClass}
            >
              <option value='admin'>Admin — full access</option>
              <option value='sales_agent'>Sales Agent — gets a truck</option>
              <option value='visitor'>Visitor — view only, no truck</option>
            </select>
          </div>

          {error && (
            <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2'>
              {error}
            </div>
          )}

          {success && (
            <div className='flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-800/50 rounded-md px-3 py-2'>
              <TbCheck size={14} />
              {success}
            </div>
          )}

          <div className='flex gap-2 pt-1'>
            <button
              type='button'
              onClick={() => navigate('/stocks')}
              className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-sm font-medium py-2.5 rounded-md transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={busy}
              className='flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium py-2.5 rounded-md transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {busy ? (
                <>
                  <TbLoader2 size={16} className='animate-spin' />
                  Creating…
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>

        {/* Info block */}
        <div className='mt-4 text-[11px] text-zinc-500 leading-relaxed space-y-1'>
          <div>
            <span className='text-blue-400 font-medium'>Admin</span> — full
            access, can create/edit/delete everything.
          </div>
          <div>
            <span className='text-zinc-300 font-medium'>Sales Agent</span> —
            view only + appears as a truck in Deployments.
          </div>
          <div>
            <span className='text-violet-400 font-medium'>Visitor</span> — view
            only, no truck. For stakeholders / auditors.
          </div>
        </div>
      </div>
    </div>
  )
}
