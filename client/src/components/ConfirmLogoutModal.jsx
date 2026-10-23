import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TbX, TbLogout } from 'react-icons/tb'
import { useAuth } from '../context/AuthContext'

export default function ConfirmLogoutModal ({ isOpen, onClose }) {
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!isOpen) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    onClose()
    logout()
  }

  const initials =
    `${user?.firstname?.[0] || ''}${user?.lastname?.[0] || ''}`.toUpperCase() ||
    '?'
  const fullName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim()

  return createPortal(
    <div className='fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-zinc-900 outline outline-zinc-800 rounded-xl w-full max-w-md flex flex-col shadow-2xl shadow-black/60'>
        {/* Header */}
        <div className='flex justify-between items-center px-4 py-3 border-b border-zinc-800 shrink-0'>
          <div className='flex items-center gap-2 min-w-0'>
            <TbLogout className='text-rose-400 shrink-0' size={16} />
            <span className='uppercase font-medium text-sm tracking-wide truncate text-zinc-100'>
              Sign Out
            </span>
          </div>
          <button
            onClick={onClose}
            className='text-zinc-500 hover:text-zinc-100 transition'
          >
            <TbX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className='p-4 space-y-3'>
          <p className='text-xs text-zinc-400 leading-relaxed'>
            You're about to end your session. You'll need to sign in again to
            access the inventory.
          </p>

          <div className='flex items-center gap-2.5 bg-zinc-950/60 border border-zinc-800 rounded-md px-3 py-2'>
            <div className='w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[11px] font-bold shrink-0'>
              {initials}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-[12px] font-medium text-zinc-100 truncate capitalize'>
                {fullName || 'Unknown'}
              </div>
              <div className='text-[10px] text-zinc-500 truncate'>
                {user?.email || ''}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='shrink-0 border-t border-zinc-800 p-3 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 border border-zinc-700 hover:bg-zinc-800 text-xs font-medium py-2.5 rounded-md transition text-zinc-300'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleConfirm}
            className='flex-1 bg-rose-600 hover:bg-rose-500 text-xs font-medium py-2.5 rounded-md transition flex items-center justify-center gap-1 shadow-md shadow-rose-600/30 text-white'
          >
            <TbLogout size={12} />
            Sign Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
