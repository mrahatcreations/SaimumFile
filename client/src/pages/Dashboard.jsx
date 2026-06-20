import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBuckets, createBucket, deleteBucket, getStats } from '../api/client'
import Toast from '../components/Toast'

const folderIcon = (
  <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState([])
  const [stats, setStats] = useState({ buckets: 0, files: 0, size: 0 })
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [keyModal, setKeyModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { load(); loadStats() }, [])

  async function load() {
    const d = await getBuckets()
    setBuckets(d || [])
  }

  async function loadStats() {
    const d = await getStats()
    setStats(d)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const d = await createBucket(newName.trim(), newName.trim())
    if (d.error) { showToast(d.error, 'error'); return }
    setKeyModal(d)
    setShowModal(false)
    setNewName('')
    load(); loadStats()
  }

  async function handleDelete(name, e) {
    e.stopPropagation()
    if (!confirm('Delete bucket "' + name + '" and ALL files?')) return
    await deleteBucket(name)
    showToast('Bucket deleted', 'success')
    load(); loadStats()
  }

  function showToast(msg, type) {
    setToast({ msg, type })
  }

  function fmtSize(bytes) {
    if (!bytes) return '0 B'
    const u = ['B', 'KB', 'MB', 'GB']
    let i = 0, s = bytes
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++ }
    return s.toFixed(1) + ' ' + u[i]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-lg font-medium text-gray-700">SaimumFile</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
            className="text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Subheader bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-10 flex items-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Buckets: <strong className="text-gray-700">{stats.buckets}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Files: <strong className="text-gray-700">{stats.files}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Size: <strong className="text-gray-700">{fmtSize(stats.size)}</strong>
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-800">Buckets</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Bucket
          </button>
        </div>

        {buckets.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
            <p className="text-gray-500 text-sm">No buckets yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buckets.map(b => (
              <div
                key={b.id}
                onClick={() => navigate('/b/' + b.name)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group relative"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">{folderIcon}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{b.label || b.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{b.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(b.created_at || '').slice(0, 10)}</p>
                  </div>
                </div>
                <button
                  onClick={e => handleDelete(b.name, e)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create bucket modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-medium text-gray-800 mb-1">New Bucket</h3>
            <p className="text-xs text-gray-400 mb-4">Lowercase letters, numbers, hyphens only</p>
            <form onSubmit={handleCreate}>
              <input
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="bucket-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                required
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Key display modal */}
      {keyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-medium text-gray-800">Bucket: {keyModal.name}</h3>
              <button onClick={() => setKeyModal(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
              Save these credentials. Secret key won't be shown again.
            </p>
            {[
              { label: 'Access Key', val: keyModal.access_key },
              { label: 'Secret Key', val: keyModal.secret_key },
              { label: 'Bucket', val: keyModal.name },
            ].map(item => (
              <div key={item.label} className="border border-gray-200 rounded-lg p-3 mb-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">{item.label}</p>
                    <p className="text-sm font-mono text-gray-700 mt-0.5 break-all">{item.val}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(item.val); showToast('Copied!', 'success') }}
                    className="text-blue-500 hover:text-blue-600 shrink-0 ml-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setKeyModal(null)} className="w-full mt-2 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors cursor-pointer">Done</button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
