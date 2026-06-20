import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getFiles, uploadFile, downloadFile, deleteFile, renameFile,
  createFolder, deleteFolder, getBucketStats
} from '../api/client'
import Toast from '../components/Toast'

function fmtSize(bytes) {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0, s = bytes
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++ }
  return s.toFixed(1) + ' ' + u[i]
}

function fmtDate(d) {
  if (!d) return ''
  const date = new Date(d + 'Z')
  const now = new Date()
  const diff = now - date
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Browser() {
  const { bucket } = useParams()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [folderPath, setFolderPath] = useState('/')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    loadFiles()
  }, [folderPath])

  async function loadFiles() {
    setLoading(true)
    const d = await getFiles(bucket, folderPath)
    setFiles(d.files || [])
    setFolders(d.folders || [])
    setLoading(false)
  }

  function parts() {
    return folderPath.split('/').filter(Boolean)
  }

  function goUp() {
    const p = parts()
    p.pop()
    setFolderPath('/' + p.join('/'))
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const d = await uploadFile(bucket, file, folderPath)
    if (d.error) showToast(d.error, 'error')
    else showToast('Uploaded: ' + d.name, 'success')
    loadFiles()
    e.target.value = ''
  }

  async function handleDownload(id) {
    try {
      const blob = await downloadFile(bucket, id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Download failed', 'error') }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this file?')) return
    const d = await deleteFile(bucket, id)
    if (d.ok) { showToast('Deleted', 'success'); loadFiles() }
    else showToast(d.error, 'error')
  }

  async function handleFolderDelete(path) {
    if (!confirm('Delete folder and all contents?')) return
    const d = await deleteFolder(bucket, path)
    if (d.ok) { showToast('Folder deleted', 'success'); loadFiles() }
    else showToast(d.error, 'error')
  }

  async function handleRename() {
    if (!renameValue.trim() || !renameTarget) return
    const d = await renameFile(bucket, renameTarget.id, renameValue.trim())
    if (d.ok) { showToast('Renamed', 'success'); loadFiles() }
    else showToast(d.error, 'error')
    setRenameTarget(null)
    setRenameValue('')
  }

  async function handleCreateFolder(e) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    const path = (folderPath === '/' ? '/' : folderPath + '/') + newFolderName.trim()
    const d = await createFolder(bucket, path)
    if (d.ok) { showToast('Folder created', 'success'); loadFiles() }
    else showToast(d.error, 'error')
    setShowFolderModal(false)
    setNewFolderName('')
  }

  function showToast(msg, type) {
    setToast({ msg, type })
  }

  const emptyMsg = loading ? '' : (folders.length === 0 && files.length === 0 ? 'This folder is empty' : '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-base font-medium text-gray-700">{bucket}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-10 flex items-center gap-1 text-sm">
          <button onClick={() => navigate('/')} className="text-blue-500 hover:text-blue-700 cursor-pointer">My Buckets</button>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <button onClick={() => setFolderPath('/')} className="text-blue-500 hover:text-blue-700 cursor-pointer">{bucket}</button>
          {parts().map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <button
                onClick={() => setFolderPath('/' + parts().slice(0, i + 1).join('/'))}
                className="text-blue-500 hover:text-blue-700 cursor-pointer"
              >
                {p}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-2">
          <button
            onClick={goUp}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Go Up
          </button>
          <div className="w-px h-6 bg-gray-200"></div>
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-5 4h10a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            New Folder
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="px-4 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Upload
          </button>
          <input ref={fileInput} type="file" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span className="ml-2 text-sm text-gray-400">Loading...</span>
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">This folder is empty</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map(f => (
              <div
                key={f.path}
                onClick={() => setFolderPath(f.path)}
                className="bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  <svg className="w-14 h-14 text-amber-400 mb-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <p className="text-xs text-gray-700 truncate w-full">{f.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Folder</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleFolderDelete(f.path) }}
                  className="absolute top-1.5 right-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {files.map(f => (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-gray-200 p-3 group relative"
              >
                <div className="flex flex-col items-center text-center">
                  <svg className="w-14 h-14 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-xs text-gray-700 truncate w-full">{f.original_name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmtSize(f.size)}</p>
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setRenameTarget(f); setRenameValue(f.original_name) }} className="text-gray-400 hover:text-blue-500 p-0.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDownload(f.id)} className="text-gray-400 hover:text-blue-500 p-0.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                {renameTarget?.id === f.id && (
                  <div className="absolute inset-0 bg-white/95 rounded-xl flex items-center justify-center p-3 z-10" onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleRename} className="w-full">
                      <input
                        className="w-full px-2 py-1.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-1 mt-1.5 justify-center">
                        <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">Save</button>
                        <button type="button" onClick={() => setRenameTarget(null)} className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Name</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-24">Size</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-32">Date</th>
                  <th className="w-24 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {folders.map(f => (
                  <tr
                    key={f.path}
                    onClick={() => setFolderPath(f.path)}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer group"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-700">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
                        {f.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">—</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(f.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <button onClick={e => { e.stopPropagation(); handleFolderDelete(f.path) }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {files.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-blue-50/30 group">
                    <td className="px-4 py-2.5 text-sm text-gray-700">
                      {renameTarget?.id === f.id ? (
                        <form onSubmit={handleRename} className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <input className="border border-blue-300 rounded px-2 py-1 text-xs w-40 focus:outline-none" value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus />
                          <button type="submit" className="text-xs text-blue-600 cursor-pointer">Save</button>
                          <button type="button" onClick={() => setRenameTarget(null)} className="text-xs text-gray-500 cursor-pointer">Cancel</button>
                        </form>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {f.original_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{fmtSize(f.size)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(f.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setRenameTarget(f); setRenameValue(f.original_name) }} className="text-gray-400 hover:text-blue-500 p-0.5 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDownload(f.id)} className="text-gray-400 hover:text-blue-500 p-0.5 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-72">
            <h3 className="text-sm font-medium text-gray-800 mb-3">New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:border-blue-500" placeholder="Folder name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} autoFocus required />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
