import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBuckets, createBucket, deleteBucket, getStats } from '../api/client'
import { FolderOpen, Plus, LogOut, Trash2, Copy, X } from 'lucide-react'
import Toast from '../components/Toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState([])
  const [stats, setStats] = useState({ buckets: 0, files: 0, size: 0, folders: 0 })
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
    load()
    loadStats()
  }

  async function handleDelete(name, e) {
    e.stopPropagation()
    if (!confirm('Delete bucket "' + name + '" and ALL files?')) return
    await deleteBucket(name)
    showToast('Bucket deleted', 'success')
    load()
    loadStats()
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
    <div>
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FolderOpen className="text-blue-500" size={20} />
          <h2 className="text-lg font-semibold"><span className="text-blue-500">Saimum</span>File</h2>
        </div>
        <button
          onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 bg-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </header>

      <div className="flex gap-6 px-6 py-2.5 bg-slate-800 border-b border-slate-700 text-xs text-slate-500">
        <span>Buckets: <strong className="text-slate-200 font-medium">{stats.buckets}</strong></span>
        <span>Files: <strong className="text-slate-200 font-medium">{stats.files}</strong></span>
        <span>Size: <strong className="text-slate-200 font-medium">{fmtSize(stats.size)}</strong></span>
        <span>Folders: <strong className="text-slate-200 font-medium">{stats.folders}</strong></span>
      </div>

      <div className="flex items-center justify-between px-6 pt-6 pb-3">
        <h3 className="text-base font-medium">Buckets</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer"
        >
          <Plus size={16} /> New Bucket
        </button>
      </div>

      <div className="px-6 pb-6 grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {buckets.length === 0 ? (
          <p className="col-span-full text-center pt-12 text-slate-500 text-sm">No buckets yet</p>
        ) : buckets.map(b => (
          <div
            key={b.id}
            onClick={() => navigate('/b/' + b.name)}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:bg-slate-750 relative group"
          >
            <h4 className="text-sm font-medium mb-1">{b.label || b.name}</h4>
            <p className="text-xs text-slate-500">{b.name} &middot; {(b.created_at || '').slice(0, 10)}</p>
            <span className="absolute top-3 right-3 bg-blue-600/20 text-blue-400 text-[10px] px-2 py-0.5 rounded">key</span>
            <button
              onClick={e => handleDelete(b.name, e)}
              className="absolute bottom-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-80">
            <h3 className="text-base font-medium mb-1">New Bucket</h3>
            <p className="text-xs text-slate-500 mb-3">Lowercase letters, numbers, hyphens only</p>
            <form onSubmit={handleCreate}>
              <input
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm mb-3 focus:outline-none focus:border-blue-500"
                placeholder="bucket-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 rounded-lg text-sm cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {keyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-96">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-medium">Bucket: {keyModal.name}</h3>
              <button onClick={() => setKeyModal(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Save these credentials. Secret key won't be shown again.</p>
            {['Access Key', 'Secret Key', 'Bucket'].map(label => {
              const field = { 'Access Key': 'access_key', 'Secret Key': 'secret_key', 'Bucket': 'name' }[label]
              const val = keyModal[field] || ''
              return (
                <div key={label} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 mb-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                    <p className="text-xs font-mono truncate">{val}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(val); showToast('Copied!', 'success') }}
                    className="text-blue-500 hover:text-blue-400 shrink-0 cursor-pointer"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )
            })}
            <button onClick={() => setKeyModal(null)} className="w-full mt-2 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm cursor-pointer">Done</button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
