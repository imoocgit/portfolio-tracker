import client from './client'

export interface Stock {
  id: string
  symbol: string
  shares: number
  costBasis: number
  lastPrice: number
  blockId: string
}

export interface Block {
  id: string
  name: string
  company: string
  createdAt: string
}

export interface RefreshResult {
  fetchId: string
  fetchedAt: string
  prices: Record<string, number | null>
  companies: Record<string, string>
}

export interface PortfolioHistoryPoint {
  fetchId: string
  fetchedAt: string
  positions: number
  totalCost: number
  marketValue: number
  dayReturn: number
  dayReturnPct: number
  totalReturn: number
  totalReturnPct: number
}

export interface StockSnapshot {
  id: string
  fetchId: string
  fetchedAt: string
  blockId: string
  stockId: string
  symbol: string
  companyName: string | null
  shares: number
  costBasis: number
  lastPrice: number
  marketValue: number
  dayReturn: number
  dayReturnPct: number
  totalReturn: number
  totalReturnPct: number
}

export const stockApi = {
  getBlocks: () => client.get<Block[]>('/blocks'),
  createBlock: (data: Omit<Block, 'id' | 'createdAt'>) => client.post<Block>('/blocks', data),
  updateBlock: (id: string, data: Partial<Block>) => client.patch<Block>(`/blocks/${id}`, data),
  deleteBlock: (id: string) => client.delete(`/blocks/${id}`),

  getStocks: (blockId: string) => client.get<Stock[]>(`/blocks/${blockId}/stocks`),
  addStock: (blockId: string, data: Omit<Stock, 'id'>) => client.post<Stock>(`/blocks/${blockId}/stocks`, data),
  updateStock: (id: string, data: Partial<Stock>) => client.patch<Stock>(`/stocks/${id}`, data),
  deleteStock: (id: string) => client.delete(`/stocks/${id}`),

  refreshBlock: (blockId: string) =>
    client.post<RefreshResult>(`/blocks/${blockId}/refresh`).then(r => r.data),

  getPortfolioHistory: (blockId: string) =>
    client.get<PortfolioHistoryPoint[]>('/history/portfolio', { params: { blockId } }).then(r => r.data),

  getStockHistory: (symbol: string, blockId?: string) =>
    client.get<StockSnapshot[]>(`/history/stock/${symbol}`, { params: { blockId } }).then(r => r.data),
}
