import { useEffect, useState, useMemo } from 'react'
import { useOutletContext } from 'react-router'
import {
  TbPlus,
  TbX,
  TbLoader2,
  TbUser,
  TbSearch,
  TbCheck
} from 'react-icons/tb'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatMoney, formatNumber } from '../utils/inventory'

const inputClass =
  'w-full bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'

const labelClass =
  'block text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5'

const selectClass =
  'bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition'

const ROLE_LABEL = {
  admin: 'Admin',
  sales_agent: 'Sales Agent',
  visitor: 'Visitor'
}

const roleBadgeClass = role => {
  if (role === 'admin') return 'bg-blue-500/15 text-blue-400 border-blue-800/60'
  if (role === 'visitor')
    return 'bg-violet-500/15 text-violet-400 border-violet-800/60'
  return 'bg-zinc-800/60 text-zinc-400 border-zinc-700'
}

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'trips_desc', label: 'Trips (High → Low)' },
  { value: 'sales_desc', label: 'Sales (High → Low)' },
  { value: 'remit_desc', label: 'Remit (High → Low)' },
  { value: 'diff_desc', label: 'Difference (High → Low)' }
]

// ═══════════════════════════════════════════════════════════════════════
//  Create User Modal
// ═══════════════════════════════════════════════════════════════════════
function CreateUserModal ({ isOpen, onClose, onCreated }) {
  const { register } = useAuth()

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales_agent'
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'sales_agent'
      })
      setError('')
      setBusy(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const update = (field, value) => setForm({ ...form, [field]: value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

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
      onCreated(user)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl shadow-black/60'>
        <div className='flex justify-between items-center px-5 py-4 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2.5 min-w-0'>
            <div className='w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center text-blue-400 shrink-0'>
              <TbPlus size={16} />
            </div>
            <div className='min-w-0'>
              <div className='uppercase font-medium text-sm tracking-wider'>
                Create User
              </div>
              <div className='text-[10px] text-zinc-500'>
                Add an admin, sales agent, or visitor
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-zinc-100 transition'
          >
            <TbX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col overflow-hidden'>
          <div className='p-5 overflow-y-auto space-y-4'>
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
          </div>

          <div className='px-5 py-4 border-t border-zinc-800 flex gap-2 shrink-0'>
            <button
              type='button'
              onClick={onClose}
              disabled={busy}
              className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-sm font-medium py-2.5 rounded-md transition disabled:opacity-40'
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
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  Users Page
// ═══════════════════════════════════════════════════════════════════════
export default function Users () {
  const { user: currentUser } = useAuth()
  const ctx = useOutletContext() || {}
  const deployments = ctx.deployments || []

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successBanner, setSuccessBanner] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name_asc')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/users')
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreated = createdUser => {
    setUsers(prev => [createdUser, ...prev])
    setSuccessBanner(
      `${createdUser.firstname} ${createdUser.lastname} created as ${
        ROLE_LABEL[createdUser.role]
      }.`
    )
    setTimeout(() => setSuccessBanner(''), 3500)
  }

  const statsByTruck = useMemo(() => {
    const map = {}
    deployments
      .filter(d => d.status === 'returned')
      .forEach(d => {
        const truck = (d.truck || '').toUpperCase()
        if (!truck) return

        if (!map[truck]) {
          map[truck] = {
            trips: 0,
            soldCases: 0,
            soldValue: 0,
            emptiesValue: 0,
            cashRemit: 0,
            caseRemit: 0,
            totalRemit: 0
          }
        }
        const m = map[truck]
        m.trips += 1
        ;(d.returnItems || []).forEach(i => {
          m.soldCases += Number(i.cases_sold) || 0
          m.soldValue += Number(i.value_sold) || 0
          m.emptiesValue += Number(i.empties_sold) || 0
        })

        const remit = d.remit || {}
        const cash =
          (Number(remit.cash) || 0) +
          (Number(remit.gcash) || 0) +
          (Number(remit.credit) || 0)
        const caseR = Number(remit.case_remit) || 0
        m.cashRemit += cash
        m.caseRemit += caseR
        m.totalRemit += cash + caseR
      })
    return map
  }, [deployments])

  const decorated = users.map(u => {
    const fullName = `${u.firstname} ${u.lastname}`.trim().toUpperCase()
    const stats = statsByTruck[fullName] || {
      trips: 0,
      soldCases: 0,
      soldValue: 0,
      emptiesValue: 0,
      cashRemit: 0,
      caseRemit: 0,
      totalRemit: 0
    }
    const expected = stats.soldValue + stats.emptiesValue
    const diff = stats.totalRemit - expected
    return { user: u, stats, expected, diff }
  })

  const q = search.trim().toLowerCase()
  let list = decorated
  if (q) {
    list = list.filter(d => {
      const full = `${d.user.firstname} ${d.user.lastname}`.toLowerCase()
      return full.includes(q) || (d.user.email || '').toLowerCase().includes(q)
    })
  }
  if (roleFilter !== 'all') {
    list = list.filter(d => d.user.role === roleFilter)
  }

  const rows = [...list].sort((a, b) => {
    switch (sortBy) {
      case 'name_desc':
        return `${b.user.firstname} ${b.user.lastname}`.localeCompare(
          `${a.user.firstname} ${a.user.lastname}`
        )
      case 'trips_desc':
        return b.stats.trips - a.stats.trips
      case 'sales_desc':
        return b.stats.soldValue - a.stats.soldValue
      case 'remit_desc':
        return b.stats.totalRemit - a.stats.totalRemit
      case 'diff_desc':
        return b.diff - a.diff
      case 'name_asc':
      default:
        return `${a.user.firstname} ${a.user.lastname}`.localeCompare(
          `${b.user.firstname} ${b.user.lastname}`
        )
    }
  })

  const adminCount = users.filter(u => u.role === 'admin').length
  const agentCount = users.filter(u => u.role === 'sales_agent').length
  const visitorCount = users.filter(u => u.role === 'visitor').length

  const formatDate = value => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(
      2,
      '0'
    )}, ${d.getFullYear()}`
  }

  return (
    <>
      <div className='bg-zinc-900 flex-1 outline outline-zinc-800 rounded-lg p-2 flex flex-col overflow-hidden shadow-lg shadow-black/40'>
        <div className='flex justify-between items-center pb-2 border-b border-zinc-800 shrink-0'>
          <div className='uppercase font-medium text-lg'>Users</div>

          <div className='flex items-center gap-5'>
            <div className='text-right hidden sm:block'>
              <div className='text-[10px] uppercase text-zinc-500'>Admins</div>
              <div className='text-sm font-medium text-blue-400 tabular-nums'>
                {adminCount}
              </div>
            </div>
            <div className='text-right hidden sm:block'>
              <div className='text-[10px] uppercase text-zinc-500'>
                Sales Agents
              </div>
              <div className='text-sm font-medium text-zinc-300 tabular-nums'>
                {agentCount}
              </div>
            </div>
            <div className='text-right hidden sm:block'>
              <div className='text-[10px] uppercase text-zinc-500'>
                Visitors
              </div>
              <div className='text-sm font-medium text-violet-400 tabular-nums'>
                {visitorCount}
              </div>
            </div>
            <div className='text-right hidden md:block'>
              <div className='text-[10px] uppercase text-zinc-500'>Total</div>
              <div className='text-sm font-medium text-zinc-100 tabular-nums'>
                {users.length}
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className='flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition text-sm font-medium px-3 py-1.5 rounded-md shadow-md shadow-blue-600/30'
            >
              <TbPlus size={16} />
              Create User
            </button>
          </div>
        </div>

        <div className='flex-1 min-h-0 flex flex-col pt-2'>
          <div className='flex flex-wrap items-center gap-2 pb-2 shrink-0 border-b border-zinc-800/60'>
            <div className='relative flex-1 min-w-[160px]'>
              <TbSearch
                size={14}
                className='absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none'
              />
              <input
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search by name or email…'
                className='w-full bg-zinc-900 border border-zinc-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition'
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className={selectClass}
            >
              <option value='all'>All roles</option>
              <option value='admin'>Admin</option>
              <option value='sales_agent'>Sales Agent</option>
              <option value='visitor'>Visitor</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={selectClass}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <span className='text-[10px] text-zinc-600 ml-auto tabular-nums'>
              {rows.length} of {users.length}
            </span>
          </div>

          {successBanner && (
            <div className='flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-800/50 rounded-md px-3 py-2 mt-2 shrink-0'>
              <TbCheck size={14} />
              {successBanner}
            </div>
          )}

          {error && (
            <div className='text-xs text-rose-400 bg-rose-500/10 border border-rose-800/50 rounded-md px-3 py-2 mt-2 shrink-0'>
              {error}
            </div>
          )}

          <div className='flex-1 min-h-0 overflow-auto mt-2'>
            <table className='w-full text-sm border-collapse'>
              <thead className='sticky top-0 bg-zinc-900 z-10'>
                <tr className='text-left text-[10px] uppercase tracking-wider text-zinc-500'>
                  <th className='px-3 py-2 font-medium'>User</th>
                  <th className='px-3 py-2 font-medium'>Role</th>
                  <th className='px-3 py-2 font-medium text-center'>Trips</th>
                  <th className='px-3 py-2 font-medium text-right'>Sold</th>
                  <th className='px-3 py-2 font-medium text-right'>Remit</th>
                  <th className='px-3 py-2 font-medium text-right'>
                    Difference
                  </th>
                  <th className='px-3 py-2 font-medium text-right'>Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-8 text-center text-zinc-600'
                    >
                      <div className='flex items-center justify-center gap-2'>
                        <TbLoader2 size={16} className='animate-spin' />
                        Loading users…
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-8 text-center text-zinc-600'
                    >
                      {users.length === 0
                        ? 'No users yet. Click “Create User” to add one.'
                        : 'No users match your filter.'}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map(({ user: u, stats, diff }) => {
                    const isSelf = currentUser && currentUser.id === u._id
                    const isAgent = u.role === 'sales_agent'

                    const isExact = Math.abs(diff) < 0.01
                    const isOver = diff > 0.01

                    const diffColor = isExact
                      ? 'text-zinc-400'
                      : isOver
                      ? 'text-emerald-400'
                      : 'text-rose-400'

                    const diffDisplay = isExact
                      ? formatMoney(0)
                      : isOver
                      ? `+${formatMoney(diff)}`
                      : `-${formatMoney(Math.abs(diff))}`

                    return (
                      <tr
                        key={u._id}
                        className='border-t border-zinc-800 hover:bg-zinc-800/40 transition align-top'
                      >
                        <td className='px-3 py-2.5'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <div className='w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0'>
                              <TbUser size={13} />
                            </div>
                            <div className='min-w-0'>
                              <div className='flex items-center gap-1.5'>
                                <span className='font-medium text-zinc-100 truncate capitalize'>
                                  {u.firstname} {u.lastname}
                                </span>
                                {isSelf && (
                                  <span className='text-[9px] uppercase tracking-wide text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded font-medium shrink-0'>
                                    You
                                  </span>
                                )}
                              </div>
                              <div className='text-[10px] text-zinc-500 truncate'>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className='px-3 py-2.5'>
                          <span
                            className={`inline-block text-[10px] uppercase tracking-wide px-2 py-0.5 rounded font-medium border ${roleBadgeClass(
                              u.role
                            )}`}
                          >
                            {ROLE_LABEL[u.role] || u.role}
                          </span>
                        </td>

                        <td className='px-3 py-2.5 text-center'>
                          {isAgent ? (
                            <span className='text-sm text-zinc-200 font-medium tabular-nums'>
                              {formatNumber(stats.trips)}
                            </span>
                          ) : (
                            <span className='text-zinc-700'>—</span>
                          )}
                        </td>

                        <td className='px-3 py-2.5 text-right'>
                          {isAgent && stats.soldValue > 0 ? (
                            <>
                              <div className='text-sm text-emerald-400 font-semibold tabular-nums'>
                                {formatMoney(stats.soldValue)}
                              </div>
                              <div className='text-[10px] text-zinc-500 tabular-nums'>
                                {formatNumber(stats.soldCases)} cases
                              </div>
                            </>
                          ) : (
                            <span className='text-zinc-700'>—</span>
                          )}
                        </td>

                        <td className='px-3 py-2.5 text-right'>
                          {isAgent && stats.totalRemit > 0 ? (
                            <>
                              <div className='text-sm text-teal-400 font-semibold tabular-nums'>
                                {formatMoney(stats.totalRemit)}
                              </div>
                              <div className='text-[10px] text-zinc-500 tabular-nums'>
                                {formatMoney(stats.cashRemit)} cash ·{' '}
                                {formatMoney(stats.caseRemit)} case
                              </div>
                            </>
                          ) : (
                            <span className='text-zinc-700'>—</span>
                          )}
                        </td>

                        <td className='px-3 py-2.5 text-right'>
                          {isAgent ? (
                            <span
                              className={`text-sm font-semibold tabular-nums ${diffColor}`}
                            >
                              {diffDisplay}
                            </span>
                          ) : (
                            <span className='text-zinc-700'>—</span>
                          )}
                        </td>

                        <td className='px-3 py-2.5 text-right text-[11px] text-zinc-500 tabular-nums whitespace-nowrap'>
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
