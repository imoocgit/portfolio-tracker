import 'dotenv/config'
import express, { Request, Response } from 'express'
import sqlite3 from 'sqlite3'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import axios from 'axios'

const app = express()
const db = new sqlite3.Database('./portfolio.db')

app.use(cors())
app.use(express.json())

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY

if (!FINNHUB_API_KEY && !ALPHA_VANTAGE_API_KEY) {
  console.warn('⚠️  No API keys configured. Add FINNHUB_API_KEY or ALPHA_VANTAGE_API_KEY to server/.env')
}

// ---------- DB helpers ----------
const run = (sql: string, params: unknown[] = []) =>
  new Promise<void>((resolve, reject) =>
    db.run(sql, params, (err: Error | null) => (err ? reject(err) : resolve()))
  )

const all = <T>(sql: string, params: unknown[] = []) =>
  new Promise<T[]>((resolve, reject) =>
    db.all(sql, params, (err: Error | null, rows: T[]) => (err ? reject(err) : resolve(rows)))
  )

const initDb = async () => {
  await run(`CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`)

  await run(`CREATE TABLE IF NOT EXISTS stocks (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    shares REAL NOT NULL,
    costBasis REAL NOT NULL,
    lastPrice REAL NOT NULL,
    blockId TEXT NOT NULL,
    FOREIGN KEY(blockId) REFERENCES blocks(id)
  )`)

  // One row per stock per price fetch, with every displayed attribute.
  await run(`CREATE TABLE IF NOT EXISTS stock_snapshots (
    id TEXT PRIMARY KEY,
    fetchId TEXT NOT NULL,
    fetchedAt TEXT NOT NULL,
    blockId TEXT NOT NULL,
    stockId TEXT NOT NULL,
    symbol TEXT NOT NULL,
    companyName TEXT,
    shares REAL NOT NULL,
    costBasis REAL NOT NULL,
    lastPrice REAL NOT NULL,
    marketValue REAL NOT NULL,
    dayReturn REAL NOT NULL,
    dayReturnPct REAL NOT NULL,
    totalReturn REAL NOT NULL,
    totalReturnPct REAL NOT NULL
  )`)

  await run(`CREATE INDEX IF NOT EXISTS idx_snap_block ON stock_snapshots(blockId, fetchedAt)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_snap_symbol ON stock_snapshots(symbol, fetchedAt)`)
}

// ---------- Market data ----------
const getQuoteFromFinnhub = async (symbol: string): Promise<number | null> => {
  if (!FINNHUB_API_KEY) return null
  try {
    const res = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token: FINNHUB_API_KEY }
    })
    const price = res.data?.c
    return typeof price === 'number' && price > 0 ? price : null
  } catch (err) {
    console.error(`Finnhub quote error for ${symbol}:`, (err as Error).message)
    return null
  }
}

const getQuoteFromAlphaVantage = async (symbol: string): Promise<number | null> => {
  if (!ALPHA_VANTAGE_API_KEY) return null
  try {
    const res = await axios.get('https://www.alphavantage.co/query', {
      params: { function: 'GLOBAL_QUOTE', symbol, apikey: ALPHA_VANTAGE_API_KEY }
    })
    const price = parseFloat(res.data?.['Global Quote']?.['05. price'])
    return Number.isFinite(price) && price > 0 ? price : null
  } catch (err) {
    console.error(`Alpha Vantage quote error for ${symbol}:`, (err as Error).message)
    return null
  }
}

const getLiveQuote = async (symbol: string): Promise<number | null> =>
  (await getQuoteFromFinnhub(symbol)) ?? (await getQuoteFromAlphaVantage(symbol))

const companyCache = new Map<string, string>()

const getCompanyName = async (symbol: string): Promise<string> => {
  const cached = companyCache.get(symbol)
  if (cached) return cached
  if (!FINNHUB_API_KEY) return symbol
  try {
    const res = await axios.get('https://finnhub.io/api/v1/stock/profile2', {
      params: { symbol, token: FINNHUB_API_KEY }
    })
    const name: string | undefined = res.data?.name
    if (name) {
      companyCache.set(symbol, name)
      return name
    }
  } catch (err) {
    console.error(`Finnhub profile error for ${symbol}:`, (err as Error).message)
  }
  return symbol
}

// Same formulas the client uses for display, so stored values match what the user sees.
const computeMetrics = (shares: number, costBasis: number, price: number) => {
  const marketValue = shares * price
  const totalCost = shares * costBasis
  const totalReturn = marketValue - totalCost
  const totalReturnPct = totalCost ? (totalReturn / totalCost) * 100 : 0
  const dayReturn = shares * (price - costBasis)
  const dayReturnPct = costBasis ? ((price - costBasis) / costBasis) * 100 : 0
  return { marketValue, totalCost, totalReturn, totalReturnPct, dayReturn, dayReturnPct }
}

// Wraps async handlers so thrown errors become 500 responses.
const handle =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response) =>
    fn(req, res).catch((err: Error) => res.status(500).json({ error: err.message }))

// ---------- Blocks ----------
app.get('/api/blocks', handle(async (_req, res) => {
  res.json(await all('SELECT * FROM blocks ORDER BY createdAt'))
}))

app.post('/api/blocks', handle(async (req, res) => {
  const { name, company } = req.body
  const id = uuid()
  const createdAt = new Date().toISOString()
  await run('INSERT INTO blocks (id, name, company, createdAt) VALUES (?, ?, ?, ?)', [id, name, company, createdAt])
  res.json({ id, name, company, createdAt })
}))

app.patch('/api/blocks/:id', handle(async (req, res) => {
  const { name, company } = req.body
  await run('UPDATE blocks SET name = ?, company = ? WHERE id = ?', [name, company, req.params.id])
  res.json({ id: req.params.id, name, company })
}))

app.delete('/api/blocks/:id', handle(async (req, res) => {
  await run('DELETE FROM blocks WHERE id = ?', [req.params.id])
  res.json({ success: true })
}))

// ---------- Stocks ----------
app.get('/api/blocks/:blockId/stocks', handle(async (req, res) => {
  res.json(await all('SELECT * FROM stocks WHERE blockId = ?', [req.params.blockId]))
}))

app.post('/api/blocks/:blockId/stocks', handle(async (req, res) => {
  const { symbol, shares, costBasis, lastPrice } = req.body
  const id = uuid()
  await run('INSERT INTO stocks (id, symbol, shares, costBasis, lastPrice, blockId) VALUES (?, ?, ?, ?, ?, ?)',
    [id, String(symbol).toUpperCase(), shares, costBasis, lastPrice ?? 0, req.params.blockId])
  res.json({ id, symbol: String(symbol).toUpperCase(), shares, costBasis, lastPrice: lastPrice ?? 0, blockId: req.params.blockId })
}))

app.patch('/api/stocks/:id', handle(async (req, res) => {
  const { symbol, shares, costBasis, lastPrice } = req.body
  await run('UPDATE stocks SET symbol = ?, shares = ?, costBasis = ?, lastPrice = ? WHERE id = ?',
    [String(symbol).toUpperCase(), shares, costBasis, lastPrice, req.params.id])
  res.json({ id: req.params.id, symbol, shares, costBasis, lastPrice })
}))

app.delete('/api/stocks/:id', handle(async (req, res) => {
  await run('DELETE FROM stocks WHERE id = ?', [req.params.id])
  res.json({ success: true })
}))

// ---------- Refresh: fetch live prices for a block and save a snapshot of every stock ----------
interface StockRow {
  id: string
  symbol: string
  shares: number
  costBasis: number
  lastPrice: number
  blockId: string
}

app.post('/api/blocks/:blockId/refresh', handle(async (req, res) => {
  const { blockId } = req.params
  const stocks = await all<StockRow>('SELECT * FROM stocks WHERE blockId = ?', [blockId])
  const symbols = [...new Set(stocks.map(s => s.symbol))]

  const priceEntries = await Promise.all(symbols.map(async s => [s, await getLiveQuote(s)] as const))
  const companyEntries = await Promise.all(symbols.map(async s => [s, await getCompanyName(s)] as const))
  const prices: Record<string, number | null> = Object.fromEntries(priceEntries)
  const companies: Record<string, string> = Object.fromEntries(companyEntries)

  const fetchId = uuid()
  const fetchedAt = new Date().toISOString()
  const rows = []

  for (const stock of stocks) {
    const live = prices[stock.symbol]
    const price = live ?? stock.lastPrice
    if (live !== null && live !== undefined) {
      await run('UPDATE stocks SET lastPrice = ? WHERE id = ?', [live, stock.id])
    }

    const m = computeMetrics(stock.shares, stock.costBasis, price)
    const companyName = companies[stock.symbol] ?? stock.symbol

    const snapshot = {
      id: uuid(),
      fetchId,
      fetchedAt,
      blockId,
      stockId: stock.id,
      symbol: stock.symbol,
      companyName,
      shares: stock.shares,
      costBasis: stock.costBasis,
      lastPrice: price,
      marketValue: m.marketValue,
      dayReturn: m.dayReturn,
      dayReturnPct: m.dayReturnPct,
      totalReturn: m.totalReturn,
      totalReturnPct: m.totalReturnPct,
    }

    await run(
      `INSERT INTO stock_snapshots
        (id, fetchId, fetchedAt, blockId, stockId, symbol, companyName, shares, costBasis, lastPrice,
         marketValue, dayReturn, dayReturnPct, totalReturn, totalReturnPct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [snapshot.id, snapshot.fetchId, snapshot.fetchedAt, snapshot.blockId, snapshot.stockId, snapshot.symbol,
       snapshot.companyName, snapshot.shares, snapshot.costBasis, snapshot.lastPrice, snapshot.marketValue,
       snapshot.dayReturn, snapshot.dayReturnPct, snapshot.totalReturn, snapshot.totalReturnPct]
    )
    rows.push(snapshot)
  }

  res.json({ fetchId, fetchedAt, prices, companies, rows })
}))

// ---------- Quotes & company info (standalone endpoints) ----------
app.get('/api/quotes/:symbol', handle(async (req, res) => {
  const price = await getLiveQuote(req.params.symbol)
  if (price === null) {
    return res.status(404).json({ error: `Symbol ${req.params.symbol} not found or API limit exceeded` })
  }
  res.json({ [req.params.symbol]: price })
}))

app.post('/api/quotes/batch', handle(async (req, res) => {
  const symbols: string[] = req.body.symbols ?? []
  const entries = await Promise.all(symbols.map(async s => [s, await getLiveQuote(s)] as const))
  res.json(Object.fromEntries(entries))
}))

app.get('/api/company/:symbol', handle(async (req, res) => {
  res.json({ symbol: req.params.symbol, name: await getCompanyName(req.params.symbol) })
}))

app.post('/api/company/batch', handle(async (req, res) => {
  const symbols: string[] = req.body.symbols ?? []
  const entries = await Promise.all(
    symbols.map(async s => [s, { symbol: s, name: await getCompanyName(s) }] as const)
  )
  res.json(Object.fromEntries(entries))
}))

// ---------- History ----------
// Portfolio history: one point per price fetch for a block, with totals.
app.get('/api/history/portfolio', handle(async (req, res) => {
  const blockId = req.query.blockId as string | undefined
  if (!blockId) return res.status(400).json({ error: 'blockId is required' })

  const rows = await all<{
    fetchId: string; fetchedAt: string; positions: number; totalCost: number
    marketValue: number; dayReturn: number; totalReturn: number
  }>(
    `SELECT fetchId,
            MAX(fetchedAt) AS fetchedAt,
            COUNT(*) AS positions,
            SUM(shares * costBasis) AS totalCost,
            SUM(marketValue) AS marketValue,
            SUM(dayReturn) AS dayReturn,
            SUM(totalReturn) AS totalReturn
       FROM stock_snapshots
      WHERE blockId = ?
      GROUP BY fetchId
      ORDER BY fetchedAt DESC
      LIMIT 500`,
    [blockId]
  )

  res.json(rows.map(r => ({
    ...r,
    dayReturnPct: r.totalCost ? (r.dayReturn / r.totalCost) * 100 : 0,
    totalReturnPct: r.totalCost ? (r.totalReturn / r.totalCost) * 100 : 0,
  })))
}))

// Stock history: every saved snapshot for a symbol, optionally limited to one block.
app.get('/api/history/stock/:symbol', handle(async (req, res) => {
  const blockId = req.query.blockId as string | undefined
  const params: unknown[] = [req.params.symbol.toUpperCase()]
  let sql = 'SELECT * FROM stock_snapshots WHERE symbol = ?'
  if (blockId) {
    sql += ' AND blockId = ?'
    params.push(blockId)
  }
  sql += ' ORDER BY fetchedAt DESC LIMIT 1000'
  res.json(await all(sql, params))
}))

const PORT = Number(process.env.PORT) || 5000
initDb()
  .then(() => app.listen(PORT, () => console.log(`Server on :${PORT}`)))
  .catch(err => {
    console.error('Failed to initialise database:', err)
    process.exit(1)
  })
