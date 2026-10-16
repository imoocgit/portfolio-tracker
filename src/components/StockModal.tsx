import { useState } from 'react'
import { Stock } from '../api/services'
import { X } from 'lucide-react'

interface StockModalProps {
  stock: Stock | null
  onSave: (data: Omit<Stock, 'id'>) => Promise<void>
  onClose: () => void
}

export const StockModal: React.FC<StockModalProps> = ({ stock, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    symbol: stock?.symbol || '',
    shares: stock?.shares || 0,
    costBasis: stock?.costBasis || 0,
    lastPrice: stock?.lastPrice || 0, // Will be fetched from live API
    blockId: stock?.blockId || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {stock ? 'Edit Stock' : 'Add Stock'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              placeholder="e.g., AAPL"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Shares
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.shares}
              onChange={(e) => setFormData({ ...formData, shares: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Cost Basis (per share)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.costBasis}
              onChange={(e) => setFormData({ ...formData, costBasis: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Current price will be fetched from live market data automatically.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
