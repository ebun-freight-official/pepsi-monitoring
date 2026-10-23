import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute ({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className='bg-zinc-950 h-screen flex items-center justify-center text-zinc-500 text-sm'>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  if (role && user.role !== role) {
    return <Navigate to='/stocks' replace />
  }

  return children
}
