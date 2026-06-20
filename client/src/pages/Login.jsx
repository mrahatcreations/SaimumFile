import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, isAuth } from '../api/client'
import { FolderOpen } from 'lucide-react'

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-slate-800 p-10 rounded-2xl w-80 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="text-blue-500" size={24} />
          <h1 className="text-xl font-semibold"><span className="text-blue-500">Saimum</span>File</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">Sign in to manage files</p>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 mb-3 focus:outline-none focus:border-blue-500"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-200 mb-4 focus:outline-none focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium cursor-pointer">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
