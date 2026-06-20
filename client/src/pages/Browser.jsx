import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getFiles, uploadFile, downloadFile, deleteFile, renameFile,
  createFolder, deleteFolder, getBucketStats
} from '../api/client'
import {
  ArrowLeft, Folder, File, Upload, Plus, Download, Trash2, Pencil, ChevronRight
} from 'lucide-react'
import Toast from '../components/Toast'

export default function Browser() {
  const { bucket } = useParams()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [folderPath, setFolderPath] = useState('/')
  const [loading, setLoading] = useState(true)
  const [bucketInfo, setBucketInfo] = useState(null)
  const [toast, setToast] = useState(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    loadFiles()
    loadBucketInfo()
  }, [bucket, folderPath])

  async function loadFiles() {
    setLoading(true)
    const d = await getFiles(bucket, folderPath)
    setFiles(d.files || [])
    setFolders(d.folders || [])
    setLoading(false)
  }

  async function loadBucketInfo() {
    const d = await getBucketStats(bucket)
    setBucketInfo(d)
  }

  function parts() {
    return folderPath.split('/').filter(Boolean)
  }

  function navigateTo(f) {
    setFolderPath(f)
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

  function fmtSize(bytes) {
    if (!bytes) return '0 B'
    const u = ['B', 'KB', 'MB', 'GB']
    let i = 0, s = bytes
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++ }
    return s.toFixed(1) + ' ' + u[i]
  }

  return (
    <div>
      <header className="flex items-center gap-3 px-6 py-3 bg-slate-800 border-b border-slate-700">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-200 cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-base font-medium flex-1">{bucket}</h3>
        {bucketInfo && (
          <span className="text-[11px] text-slate-500 bg-slate-700 px-2 py-1 rounded">
            Key: {(bucketInfo.access_key || '').slice(0, 12)}...
          </span>
        )}
      </header>

      <div className="flex items-center gap-1.5 px-6 py-2 bg-slate-800 border-b border-slate-700">
        <button onClick={goUp} className="text-sm text-slate-500 hover:text-blue-400 cursor-pointer">..</button>
        <span className="text-slate-600">/</span>
        <button onClick={() => navigateTo('/')} className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer">{bucket}</button>
        {parts().map((p, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight size={12} className="text-slate-600" />
            <button
              onClick={() => navigateTo('/' + parts().slice(0, i + 1).join('/'))}
              className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              {p}
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 border-b border-slate-700">
        <button
          onClick={() => setShowFolderModal(true)}
          className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
        >
          <Plus size={14} /> Folder
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
        >
          <Upload size={14} /> Upload
        </button>
        <input ref={fileInput} type="file" onChange={handleUpload} className="hidden" />
      </div>

      <div className="px-6 py-3">
        {loading ? (
          <p className="text-center py-10 text-slate-500 text-sm">Loading...</p>
        ) : folders.length === 0 && files.length === 0 ? (
          <p className="text-center py-10 text-slate-500 text-sm">This folder is empty</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wide">
                <th className="pb-2 pr-3 font-medium">Name</th>
                <th className="pb-2 pr-3 font-medium w-20">Size</th>
                <th className="pb-2 pr-3 font-medium w-28">Date</th>
                <th className="pb-2 w-24 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(f => (
                <tr
                  key={f.path}
                  onClick={() => navigateTo(f.path)}
                  className="group cursor-pointer border-t border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-2 pr-3 text-sm">
                    <span className="flex items-center gap-2">
                      <Folder size={16} className="text-amber-400 shrink-0" />
                      {f.name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-slate-500">—</td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{(f.created_at || '').slice(0, 10)}</td>
                  <td className="py-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleFolderDelete(f.path) }}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {files.map(f => (
                <tr key={f.id} className="group border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 pr-3 text-sm">
                    <span className="flex items-center gap-2">
                      <File size={16} className="text-slate-500 shrink-0" />
                      {renameTarget?.id === f.id ? (
                        <form onSubmit={handleRename} className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs w-40 focus:outline-none"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            autoFocus
                          />
                          <button type="submit" className="text-blue-400 text-xs cursor-pointer">Save</button>
                          <button type="button" onClick={() => setRenameTarget(null)} className="text-slate-500 text-xs cursor-pointer">Cancel</button>
                        </form>
                      ) : f.original_name}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{fmtSize(f.size)}</td>
                  <td className="py-2 pr-3 text-xs text-slate-500">{(f.created_at || '').slice(0, 10)}</td>
                  <td className="py-2">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setRenameTarget(f); setRenameValue(f.original_name) }}
                        className="text-slate-500 hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDownload(f.id)} className="text-slate-500 hover:text-slate-200 p-0.5 cursor-pointer">
                        <Download size={13} />
                      </button>
                      <button onClick={() => handleDelete(f.id)} className="text-slate-500 hover:text-red-400 p-0.5 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl w-72">
            <h3 className="text-sm font-medium mb-3">New Folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm mb-3 focus:outline-none focus:border-blue-500"
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-1.5 bg-slate-700 rounded-lg text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
