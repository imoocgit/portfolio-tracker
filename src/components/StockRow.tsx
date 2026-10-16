import { Stock } from '../api/services'
import { calcPortfolioMetrics, fmt } from '../utils/calculations'
import { Trash2, Edit2 } from 'lucide-react'

interface StockRowProps {
  stock: Stock
  companyName?: string
  lastPrice?: number | null
  isLoadingPrice?: boolean
  onEdit: (stock: Stock) => void
  onDelete: (id: string) => void
}

export const StockRow: React.FC<StockRowProps> = ({ 
  stock, 
  companyName = 'Loading...',
  lastPrice = stock.lastPrice, 
  isLoadingPrice = false,
  onEdit, 
  onDelete 
}) => {
  const displayPrice = lastPrice !== null && lastPrice !== undefined ? lastPrice : stock.lastPrice
  const metrics = calcPortfolioMetrics(stock.shares, stock.costBasis, displayPrice)

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-700 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
      <span className="font-semibold text-slate-900 dark:text-white">{stock.symbol}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{companyName}</span>
      <span className="text-slate-600 dark:text-slate-400">{stock.shares}</span>
      <span className="text-slate-600 dark:text-slate-400">{fmt(stock.costBasis)}</span>
      <span className={`text-slate-600 dark:text-slate-400 ${isLoadingPrice ? 'animate-pulse' : ''}`}>
        {isLoadingPrice ? '...' : (lastPrice ? fmt(displayPrice) : '—')}
        {lastPrice === null && !isLoadingPrice && <span className="text-xs text-red-500 block">API Error</span>}
      </span>
      <span className="text-slate-600 dark:text-slate-400">{fmt(metrics.marketValue)}</span>
      <span className={`font-medium ${metrics.gainLossClass}`}>{fmt(metrics.dayReturn)}</span>
      <span className={`font-medium ${metrics.gainLossClass}`}>{fmt(metrics.dayReturnPct, 'percent')}</span>
      <span className={`font-medium ${metrics.gainLossClass}`}>{fmt(metrics.totalReturn)}</span>
      <span className={`font-medium ${metrics.gainLossClass}`}>{fmt(metrics.totalReturnPct, 'percent')}</span>
      
      <button
        onClick={() => onEdit(stock)}
        className="p-2 rounded hover:bg-blue-100 dark:hover:bg-slate-700 transition"
      >
        <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>
      
      <button
        onClick={() => onDelete(stock.id)}
        className="p-2 rounded hover:bg-red-100 dark:hover:bg-slate-700 transition"
      >
        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
      </button>
    </div>
  )
}
