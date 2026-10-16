import { useState } from 'react'
import { Block } from '../api/services'
import { useBlockStocks, usePortfolioHistory, useStockHistory } from '../hooks/usePortfolio'
import { fmt } from '../utils/calculations'

interface HistoryViewProps {
  blocks: Block[]
}

const signClass = (n: number) =>
  n >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'

const formatDateTime = (iso: string) => new Date(iso).toLocaleString()

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">{children}</div>
)

const Th = ({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) => (
  <th className={`px-4 py-3 font-semibold whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
)

export const HistoryView: React.FC<HistoryViewProps> = ({ blocks }) => {
  const [selectedBlockId, setSelectedBlockId] = useState('')
  const [symbol, setSymbol] = useState('')

  const blockId = selectedBlockId || blocks[0]?.id || ''

  const { data: stocks = [] } = useBlockStocks(blockId)
  const portfolio = usePortfolioHistory(blockId)
  const stockHistory = useStockHistory(symbol, blockId)

  const handleBlockChange = (id: string) => {
    setSelectedBlockId(id)
    setSymbol('')
  }

  if (blocks.length === 0) {
    return <Empty>Create a portfolio block first to see its history.</Empty>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">History</h2>
        <select
          value={blockId}
          onChange={e => handleBlockChange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          {blocks.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Portfolio history */}
      <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Portfolio History</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Totals saved at each price fetch</p>
        </div>

        {portfolio.data && portfolio.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <Th>Date & Time</Th>
                  <Th align="right">Positions</Th>
                  <Th align="right">Total Cost</Th>
                  <Th align="right">Market Value</Th>
                  <Th align="right">Day Return</Th>
                  <Th align="right">Total Return</Th>
                  <Th align="right">Total %</Th>
                </tr>
              </thead>
              <tbody className="text-slate-900 dark:text-white">
                {portfolio.data.map(p => (
                  <tr key={p.fetchId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(p.fetchedAt)}</td>
                    <td className="px-4 py-3 text-right">{p.positions}</td>
                    <td className="px-4 py-3 text-right">{fmt(p.totalCost)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(p.marketValue)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(p.dayReturn)}`}>{fmt(p.dayReturn)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(p.totalReturn)}`}>{fmt(p.totalReturn)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(p.totalReturn)}`}>{fmt(p.totalReturnPct, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No portfolio history yet. Snapshots are saved each time prices are fetched.</Empty>
        )}
      </section>

      {/* Stock history */}
      <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Stock History</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Every saved snapshot for a selected stock</p>
          </div>
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">Select a stock</option>
            {stocks.map(s => (
              <option key={s.id} value={s.symbol}>{s.symbol}</option>
            ))}
          </select>
        </div>

        {!symbol ? (
          <Empty>Select a stock to view its history.</Empty>
        ) : stockHistory.data && stockHistory.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <tr>
                  <Th>Date & Time</Th>
                  <Th>Company</Th>
                  <Th align="right">Shares</Th>
                  <Th align="right">Cost Basis</Th>
                  <Th align="right">Last Price</Th>
                  <Th align="right">Market Value</Th>
                  <Th align="right">Day Return</Th>
                  <Th align="right">Day %</Th>
                  <Th align="right">Total Return</Th>
                  <Th align="right">Total %</Th>
                </tr>
              </thead>
              <tbody className="text-slate-900 dark:text-white">
                {stockHistory.data.map(s => (
                  <tr key={s.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(s.fetchedAt)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.companyName ?? s.symbol}</td>
                    <td className="px-4 py-3 text-right">{s.shares}</td>
                    <td className="px-4 py-3 text-right">{fmt(s.costBasis)}</td>
                    <td className="px-4 py-3 text-right">{fmt(s.lastPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(s.marketValue)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(s.dayReturn)}`}>{fmt(s.dayReturn)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(s.dayReturn)}`}>{fmt(s.dayReturnPct, 'percent')}</td>
                    <td className={`px-4 py-3 text-right ${signClass(s.totalReturn)}`}>{fmt(s.totalReturn)}</td>
                    <td className={`px-4 py-3 text-right ${signClass(s.totalReturn)}`}>{fmt(s.totalReturnPct, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No history for {symbol} yet.</Empty>
        )}
      </section>
    </div>
  )
}
