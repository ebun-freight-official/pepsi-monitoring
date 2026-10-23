import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { TbLoader2 } from 'react-icons/tb'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'

const labelClass =
  'block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5'

export default function Login () {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/stocks'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='bg-zinc-950 h-screen flex items-center justify-center p-4 text-zinc-100'>
      <div className='w-full max-w-sm'>
        {/* Brand */}
        <div className='flex items-center justify-center gap-3 mb-6'>
          <div className='w-1.5 h-10 rounded-full overflow-hidden flex flex-col shrink-0'>
            <div className='flex-1 bg-red-500' />
            <div className='flex-1 bg-slate-200' />
            <div className='flex-1 bg-blue-600' />
          </div>
          <div className='min-w-0'>
            <div className='text-base font-bold text-blue-400 tracking-widest uppercase leading-tight'>
              Pepsi
            </div>
            <div className='text-[10px] text-zinc-500 tracking-widest uppercase leading-tight'>
              Inventory
            </div>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className='bg-zinc-900 outline outline-zinc-800 rounded-xl p-6 shadow-2xl shadow-black/60 space-y-4'
        >
          <div className='text-center'>
            <div className='uppercase font-medium text-sm tracking-wider text-zinc-300'>
              Sign In
            </div>
            <div className='text-[11px] text-zinc-500 mt-1'>
              Enter your credentials to continue
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete='email'
              autoFocus
              required
              disabled={busy}
              placeholder='you@pepsi.com'
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete='current-password'
              required
              disabled={busy}
              placeholder='••••••••'
              className={inputClass}
            />
          </div>

          {error && (
            <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2'>
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={busy || !email || !password}
            className='w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium py-2.5 rounded-md transition shadow-md shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed'
          >
            {busy ? (
              <>
                <TbLoader2 size={16} className='animate-spin' />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className='text-center text-[11px] text-zinc-600 mt-4'>
          Contact your administrator if you need an account.
        </p>
      </div>
    </div>
  )
}
