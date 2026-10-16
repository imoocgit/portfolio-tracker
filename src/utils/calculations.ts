export const calcPortfolioMetrics = (shares: number, costBasis: number, lastPrice: number) => {
  const marketValue = shares * lastPrice
  const totalCost = shares * costBasis
  const totalReturn = marketValue - totalCost
  const totalReturnPct = totalCost ? (totalReturn / totalCost) * 100 : 0
  const dayReturn = shares * (lastPrice - costBasis)
  const dayReturnPct = costBasis ? ((lastPrice - costBasis) / costBasis) * 100 : 0

  return {
    marketValue,
    totalCost,
    totalReturn,
    totalReturnPct,
    dayReturn,
    dayReturnPct,
    gainLossClass: totalReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }
}

export const fmt = (n: number | undefined, type: 'currency' | 'percent' = 'currency') => {
  if (n === undefined) return '—'
  return type === 'currency'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    : `${(n).toFixed(2)}%`
}
