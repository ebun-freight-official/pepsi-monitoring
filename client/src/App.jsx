import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MyStocks from './pages/MyStocks'
import Deployments from './pages/Deployments'

export default function App () {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to='/stocks' replace />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/stocks' element={<MyStocks />} />
        <Route path='/deployments' element={<Deployments />} />
        <Route path='*' element={<Navigate to='/stocks' replace />} />
      </Route>
    </Routes>
  )
}
