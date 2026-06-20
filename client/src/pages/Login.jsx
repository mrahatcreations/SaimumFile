import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, isAuth } from '../api/client'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuth()) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const d = await login(username, password)
    if (d.token) navigate('/', { replace: true })
    else setError(d.error || 'Invalid credentials')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-gray-800">SaimumFile</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your files</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit}>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 mb-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 mb-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors mt-2 cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
