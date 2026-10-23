import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import MyStocks from './pages/MyStocks'
import Deployments from './pages/Deployments'
import Users from './pages/Users'

export default function App () {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path='/login' element={<Login />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to='/stocks' replace />} />
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/products' element={<Products />} />
          <Route path='/stocks' element={<MyStocks />} />
          <Route path='/deployments' element={<Deployments />} />

          {/* Admin-only */}
          <Route
            path='/users'
            element={
              <ProtectedRoute role='admin'>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route path='*' element={<Navigate to='/stocks' replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
