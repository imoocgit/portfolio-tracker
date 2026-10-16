# Portfolio Tracker

Stock ticker/portfolio display app. React + Vite + TS + Tailwind.

## Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **State**: TanStack Query (React Query)
- **API**: Axios with interceptors
- **Backend**: Express.js + SQLite
- **UI**: Lucide React icons

## Project Structure
```
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios instance with interceptors
│   │   └── services.ts        # API service layer
│   ├── components/
│   │   ├── Header.tsx         # App header with search & theme toggle
│   │   ├── Block.tsx          # Portfolio section component
│   │   ├── StockRow.tsx       # Stock display row
│   │   ├── StockModal.tsx     # Add/edit stock modal
│   │   └── BlockModal.tsx     # Add/edit block modal
│   ├── context/
│   │   └── ThemeContext.tsx   # Dark/light theme context
│   ├── hooks/
│   │   └── usePortfolio.ts    # TanStack Query hooks
│   ├── utils/
│   │   └── calculations.ts    # Portfolio metrics & formatting
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Tailwind imports
├── server/
│   └── server.ts              # Express API server
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Setup

### 1. Get API Keys (Free)
Choose one or both:

**Finnhub** (Recommended - 60 requests/min free):
- Go to https://finnhub.io
- Sign up for free
- Copy your API key

**Alpha Vantage** (Backup - 5 requests/min free):
- Go to https://www.alphavantage.co
- Get your free API key

### 2. Configure Environment

In `server/` folder, create `.env`:
```
FINNHUB_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_backup_key_here
```

### 3. Install & Run

```bash
# Frontend
npm install
npm run dev          # :3000

# Backend (new terminal)
cd server
npm install
npm run dev          # :5000
```

## Features
- **Live Stock Quotes** - Fetches real prices from Finnhub/Alpha Vantage APIs
- Create/edit portfolio blocks (sections)
- Add stocks with symbol, shares, cost basis
- Auto-calculate: market value, day return, total return
- Light/dark theme toggle
- Search across blocks & companies
- Real-time quote auto-refresh every 60 seconds
- Fallback quote service (if Finnhub fails, uses Alpha Vantage)

## Metrics Calculated Per Stock
- **Market Value**: shares × lastPrice
- **Day Return**: shares × (lastPrice - costBasis)
- **Day Return %**: (lastPrice - costBasis) / costBasis
- **Total Return**: marketValue - totalCost
- **Total Return %**: totalReturn / totalCost
