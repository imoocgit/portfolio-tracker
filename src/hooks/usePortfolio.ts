import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockApi, Stock, Block } from '../api/services'

const LIVE_INTERVAL = 1000 * 60 // refresh prices and save a snapshot once a minute

export const useBlocks = () =>
  useQuery({
    queryKey: ['blocks'],
    queryFn: async () => (await stockApi.getBlocks()).data,
    staleTime: 1000 * 60 * 5
  })

export const useBlockStocks = (blockId: string) =>
  useQuery({
    queryKey: ['stocks', blockId],
    queryFn: async () => (await stockApi.getStocks(blockId)).data,
    enabled: !!blockId,
    staleTime: 1000 * 60
  })

// Fetches live prices + company names, and the server saves a snapshot each time.
export const useBlockRefresh = (blockId: string, hasStocks: boolean) =>
  useQuery({
    queryKey: ['refresh', blockId],
    queryFn: () => stockApi.refreshBlock(blockId),
    enabled: !!blockId && hasStocks,
    refetchInterval: LIVE_INTERVAL,
    refetchOnWindowFocus: false,
    staleTime: LIVE_INTERVAL - 5000
  })

export const usePortfolioHistory = (blockId: string) =>
  useQuery({
    queryKey: ['history', 'portfolio', blockId],
    queryFn: () => stockApi.getPortfolioHistory(blockId),
    enabled: !!blockId,
    refetchInterval: LIVE_INTERVAL
  })

export const useStockHistory = (symbol: string, blockId: string) =>
  useQuery({
    queryKey: ['history', 'stock', symbol, blockId],
    queryFn: () => stockApi.getStockHistory(symbol, blockId),
    enabled: !!symbol && !!blockId,
    refetchInterval: LIVE_INTERVAL
  })

export const useCreateBlock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Block, 'id' | 'createdAt'>) => stockApi.createBlock(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] })
  })
}

export const useUpdateBlock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Block> }) =>
      stockApi.updateBlock(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] })
  })
}

export const useDeleteBlock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockApi.deleteBlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] })
  })
}

export const useAddStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ blockId, data }: { blockId: string; data: Omit<Stock, 'id'> }) =>
      stockApi.addStock(blockId, data).then(r => r.data),
    onSuccess: (_, { blockId }) => {
      qc.invalidateQueries({ queryKey: ['stocks', blockId] })
      qc.invalidateQueries({ queryKey: ['refresh', blockId] })
    }
  })
}

export const useUpdateStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Stock> }) =>
      stockApi.updateStock(id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stocks'] })
      qc.invalidateQueries({ queryKey: ['refresh'] })
    }
  })
}

export const useDeleteStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stockApi.deleteStock(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stocks'] })
      qc.invalidateQueries({ queryKey: ['refresh'] })
    }
  })
}
