import { useState } from 'react'
import { Block as BlockType, Stock } from '../api/services'
import { useBlockStocks, useBlockRefresh, useDeleteStock, useAddStock, useUpdateStock } from '../hooks/usePortfolio'
import { StockRow } from './StockRow'
import { StockModal } from './StockModal'
import { calcPortfolioMetrics, fmt } from '../utils/calculations'
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'

interface BlockSectionProps {
  block: BlockType
  onDelete: (id: string) => void
  onEdit: (block: BlockType) => void
}

const signClass = (n: number) =>
  n >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

export const BlockSection: React.FC<BlockSectionProps> = ({ block, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStock, setEditingStock] = useState<Stock | null>(null)

  const { data: stocks = [], isLoading } = useBlockStocks(block.id)
  const refresh = useBlockRefresh(block.id, stocks.length > 0)
  const prices = refresh.data?.prices ?? {}
  const companies = refresh.data?.companies ?? {}

  const deleteStock = useDeleteStock()
  const addStock = useAddStock()
  const updateStock = useUpdateStock()

  const handleAddStock = async (data: Omit<Stock, 'id'>) => {
    await addStock.mutateAsync({ blockId: block.id, data })
    setModalOpen(false)
  }

  const handleUpdateStock = async (data: Omit<Stock, 'id'>) => {
    if (!editingStock) return
    await updateStock.mutateAsync({ id: editingStock.id, data })
    setEditingStock(null)
    setModalOpen(false)
  }

  // Per-stock metrics using the same live price the rows display
  const priced = stocks.map(stock => {
    const price = prices[stock.symbol] ?? stock.lastPrice
    return { stock, price, metrics: calcPortfolioMetrics(stock.shares, stock.costBasis, price) }
  })

  const totals = priced.reduce(
    (acc, { metrics }) => ({
      marketValue: acc.marketValue + metrics.marketValue,
      totalCost: acc.totalCost + metrics.totalCost,
      dayReturn: acc.dayReturn + metrics.dayReturn,
      totalReturn: acc.totalReturn + metrics.totalReturn,
    }),
    { marketValue: 0, totalCost: 0, dayReturn: 0, totalReturn: 0 }
  )

  const dayReturnPct = totals.totalCost ? (totals.dayReturn / totals.totalCost) * 100 : 0
  const totalReturnPct = totals.totalCost ? (totals.totalReturn / totals.totalCost) * 100 : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
          >
            <ChevronDown className={`w-5 h-5 transition ${expanded ? '' : '-rotate-90'}`} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{block.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{block.company}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(totals.marketValue)}</p>
          <p className={`text-sm font-medium ${signClass(totals.totalReturn)}`}>
            {fmt(totals.totalReturn)} ({fmt(totalReturnPct, 'percent')})
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(block)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-2 rounded hover:bg-red-100 dark:hover:bg-slate-700 transition"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {stocks.length > 0 && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Symbol</span>
                <span>Company</span>
                <span>Shares</span>
                <span>Cost Basis</span>
                <span>Last Price</span>
                <span>Market Value</span>
                <span>Day Return</span>
                <span>Day %</span>
                <span>Total Return</span>
                <span>Total %</span>
                <span></span>
                <span></span>
              </div>
              <div>
                {stocks.map(stock => (
                  <StockRow
                    key={stock.id}
                    stock={stock}
                    companyName={companies[stock.symbol] ?? 'Loading...'}
                    lastPrice={stock.symbol in prices ? prices[stock.symbol] : stock.lastPrice}
                    isLoadingPrice={refresh.isLoading}
                    onEdit={() => {
                      setEditingStock(stock)
                      setModalOpen(true)
                    }}
                    onDelete={(id) => deleteStock.mutate(id)}
                  />
                ))}
              </div>

              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                <span>TOTAL</span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span>{fmt(totals.marketValue)}</span>
                <span className={signClass(totals.dayReturn)}>{fmt(totals.dayReturn)}</span>
                <span className={signClass(totals.dayReturn)}>{fmt(dayReturnPct, 'percent')}</span>
                <span className={signClass(totals.totalReturn)}>{fmt(totals.totalReturn)}</span>
                <span className={signClass(totals.totalReturn)}>{fmt(totalReturnPct, 'percent')}</span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          {stocks.length === 0 && !isLoading && (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              <p>No stocks yet. Add one to get started.</p>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setEditingStock(null)
                setModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
            {refresh.isFetching && !refresh.isLoading && (
              <span className="text-xs text-slate-500 dark:text-slate-400">Updating prices…</span>
            )}
          </div>
        </>
      )}

      {modalOpen && (
        <StockModal
          stock={editingStock}
          onSave={editingStock ? handleUpdateStock : handleAddStock}
          onClose={() => {
            setModalOpen(false)
            setEditingStock(null)
          }}
        />
      )}
    </div>
  )
}
