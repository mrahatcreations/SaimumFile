import { useEffect } from 'react'

export default function Toast({ msg, type = '', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])

  const border = type === 'error' ? 'border-red-500' : type === 'success' ? 'border-green-500' : 'border-slate-600'

  return (
    <div className={`fixed bottom-6 right-6 bg-slate-800 border ${border} px-4 py-2.5 rounded-lg text-sm shadow-xl z-50 animate-fade-in`}>
      {msg}
    </div>
  )
}
