
import React, { useEffect, useState, useRef } from 'react'
import { api } from '@/api/client'
import { RefreshCw, Terminal, AlertCircle } from 'lucide-react'

export default function DeveloperToolsPage() {
  const [logs, setLogs] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/admin/dev/logs')
      setLogs(res.data.content)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Erreur lors de la récupération des logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="text-gray-700" />
          <h1 className="text-xl font-bold text-gray-800">Explorateur de Logs (Laravel)</h1>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="flex-1 bg-[#1e1e1e] rounded-lg overflow-hidden border border-gray-700 flex flex-col shadow-xl">
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center gap-2 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-gray-400 font-mono ml-2">storage/logs/laravel.log (Last 200 lines)</span>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap">
          {logs ? logs : <span className="text-gray-500 italic">Aucun log disponible ou fichier vide.</span>}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

