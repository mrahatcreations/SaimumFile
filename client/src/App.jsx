import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuth } from './api/client'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Browser from './pages/Browser'

function RequireAuth({ children }) {
  if (!isAuth()) return <Navigate to="/login" replace />
  return children
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/b/:bucket/*" element={<RequireAuth><Browser /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
