# Portfolio Tracker - Build Plan

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  App (TanStack Query + Theme Context)             │   │
│  │  ├─ Header (Logo, Search, Theme Toggle)           │   │
│  │  ├─ Block[] (Portfolio Sections)                  │   │
│  │  │  ├─ StockRow[] (Symbol, Shares, Metrics)       │   │
│  │  │  └─ Modal (Add/Edit Stocks)                    │   │
│  │  └─ BlockModal (Create/Edit Sections)             │   │
│  └──────────────────────────────────────────────────┘   │
│  State: useBlocks, useBlockStocks, useQuotes            │
│  Styling: Tailwind CSS (Dark/Light)                     │
└─────────────────────────────────────────────────────────┘
           ↓ (Axios + Interceptors)
┌─────────────────────────────────────────────────────────┐
│                  Express.js Backend                      │
│  Routes:                                                │
│  ├─ GET/POST   /api/blocks                              │
│  ├─ PATCH/DEL  /api/blocks/:id                          │
│  ├─ GET        /api/blocks/:blockId/stocks              │
│  ├─ POST/PATCH /api/stocks                              │
│  ├─ DEL        /api/stocks/:id                          │
│  └─ GET/POST   /api/quotes/{symbol,/batch}              │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│                  SQLite Database                         │
│  blocks (id, name, company, createdAt)                  │
│  stocks (id, symbol, shares, costBasis, lastPrice, fk)  │
└─────────────────────────────────────────────────────────┘
```

## Features Implemented

✓ Portfolio blocks (create/edit/delete sections)
✓ Stock management (add/edit/delete holdings)
✓ Metrics calculated client-side:
  - Market Value = shares × lastPrice
  - Total Return = marketValue - costBasis
  - Day Return = change in price × shares
✓ Header with search, logo, theme toggle
✓ Dark/Light theme with localStorage persistence
✓ TanStack Query for data fetching & caching
✓ Axios with auth interceptors (token in header)
✓ Tailwind CSS responsive design
✓ Loading states & error handling

## Dev Workflow

1. Frontend: `npm run dev` → :3000
2. Backend: `npm run server` → :5000
3. Build: `npm run build`

## Live Quote Integration

**APIs Used:**
- **Finnhub** (Primary): 60 req/min free tier, real-time quotes
- **Alpha Vantage** (Fallback): 5 req/min free tier, batch quote support

**Flow:**
1. Frontend requests quotes via `/api/quotes/batch`
2. Backend fetches from Finnhub
3. If Finnhub fails/timeout, falls back to Alpha Vantage
4. Prices cached & auto-refresh every 60 seconds
5. Loading states & error handling on UI

**Environment Variables:**
```
FINNHUB_API_KEY=your_key
ALPHA_VANTAGE_API_KEY=your_backup_key
```

## Expandable
- Real-time WebSocket quotes (Finnhub WebSocket)
- User auth & multi-user portfolios
- Export to CSV/PDF
- Advanced analytics & charts
- Mobile app (React Native)
- Historical price charts
- Price alerts & notifications
