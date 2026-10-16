# Live Stock Quote Setup Guide

This app fetches real-time stock prices from free market data APIs. Follow these steps:

## Step 1: Get Finnhub API Key (Recommended)

1. Go to **https://finnhub.io**
2. Click "Get Free API Key"
3. Sign up with email
4. Copy your API key from dashboard

**Finnhub Benefits:**
- 60 API calls/minute (free tier)
- Real-time stock quotes
- Most reliable for this use case

## Step 2: Get Alpha Vantage Key (Optional Backup)

1. Go to **https://www.alphavantage.co**
2. Click "GET FREE API KEY"
3. Enter email
4. Copy API key from confirmation email

**Alpha Vantage Benefits:**
- Free tier available
- Used as fallback if Finnhub fails
- Wider data coverage

## Step 3: Configure Your App

In the `server/` folder, create a `.env` file:

```
FINNHUB_API_KEY=cnnq3d1r01qu47j5fh9gcnnq3d1r01qu47j5fh9g
ALPHA_VANTAGE_API_KEY=demo
```

Replace `cnnq3d1r01qu47j5fh9g` with your actual Finnhub key.

## Step 4: Run the App

```bash
# Terminal 1: Frontend
npm install
npm run dev

# Terminal 2: Backend
cd server
npm install
npm run dev
```

## Testing

1. Open http://localhost:3000
2. Create a new block (portfolio section)
3. Add a stock (e.g., AAPL, GOOGL, MSFT)
4. Prices should load within 2-3 seconds
5. Quotes refresh every 60 seconds automatically

## Troubleshooting

**"API Error" shown on stock prices:**
- Check `.env` file exists in `server/` folder
- Verify API keys are correct (no extra spaces)
- Check rate limits aren't exceeded (Finnhub: 60/min, Alpha Vantage: 5/min)
- Try with a different stock symbol

**Prices not updating:**
- Backend might not be running (check Terminal 2)
- Check browser console for errors (F12)
- Verify network requests in DevTools → Network tab

**Different price than web search:**
- Delays in data propagation (normal, usually 15-20 min behind)
- Different data sources may have slight variations
- Refresh page to get latest quote

## Free API Limits

| Service | Calls/Min | Calls/Day | Status |
|---------|-----------|-----------|--------|
| Finnhub | 60 | unlimited | ✅ Recommended |
| Alpha Vantage | 5 | 500 | ✅ Backup only |

Once you exceed free tier limits, upgrade to paid plans or implement caching.

## API Response Format

**Finnhub Quote Response:**
```json
{
  "c": 150.25,        // Current price
  "d": 2.15,          // Change
  "dp": 1.45,         // % change
  "h": 152.50,        // Day high
  "l": 149.80,        // Day low
  "o": 148.50,        // Open
  "pc": 148.10,       // Previous close
  "t": 1234567890     // Timestamp
}
```

**Alpha Vantage Quote Response:**
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "05. price": "150.25",
    ...
  }
}
```

Both are parsed to return just the current price (`c` for Finnhub, `05. price` for Alpha Vantage).
