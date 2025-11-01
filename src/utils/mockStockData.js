// Mock stock data for top 50 stocks by market cap + popular ETFs
// Used when API rate limits are exceeded

export const mockStockData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 188.63, change: 1.25, changePercent: 0.67 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.26, change: 2.85, changePercent: 0.69 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 156.78, change: 0.92, changePercent: 0.59 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 158.51, change: 1.43, changePercent: 0.91 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 512.89, change: 14.23, changePercent: 2.85 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 492.45, change: -2.15, changePercent: -0.43 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 244.35, change: 4.89, changePercent: 2.04 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 392.45, change: 2.67, changePercent: 0.68 },
  { symbol: 'V', name: 'Visa Inc.', price: 279.23, change: -0.45, changePercent: -0.16 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 542.89, change: 3.78, changePercent: 0.70 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', price: 114.56, change: 0.92, changePercent: 0.81 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 159.23, change: 0.34, changePercent: 0.21 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 166.78, change: 1.34, changePercent: 0.81 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 161.45, change: -0.52, changePercent: -0.32 },
  { symbol: 'PG', name: 'The Procter & Gamble Company', price: 164.89, change: 0.56, changePercent: 0.34 },
  { symbol: 'MA', name: 'Mastercard Incorporated', price: 438.92, change: 2.56, changePercent: 0.59 },
  { symbol: 'CVX', name: 'Chevron Corporation', price: 155.67, change: 1.45, changePercent: 0.94 },
  { symbol: 'HD', name: 'The Home Depot, Inc.', price: 381.23, change: -1.89, changePercent: -0.49 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', price: 178.34, change: 1.02, changePercent: 0.57 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1312.89, change: 18.45, changePercent: 1.42 },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', price: 175.67, change: 0.78, changePercent: 0.45 },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', price: 691.23, change: 5.12, changePercent: 0.75 },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 583.45, change: -1.89, changePercent: -0.32 },
  { symbol: 'MCD', name: "McDonald's Corporation", price: 281.56, change: 1.67, changePercent: 0.60 },
  { symbol: 'CRM', name: 'Salesforce, Inc.', price: 248.23, change: 2.67, changePercent: 1.09 },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', price: 54.89, change: -0.18, changePercent: -0.33 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', price: 489.45, change: 3.89, changePercent: 0.80 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', price: 547.89, change: 5.12, changePercent: 0.94 },
  { symbol: 'ABT', name: 'Abbott Laboratories', price: 113.67, change: 0.78, changePercent: 0.69 },
  { symbol: 'ACN', name: 'Accenture plc', price: 349.23, change: 2.67, changePercent: 0.77 },
  { symbol: 'LIN', name: 'Linde plc', price: 438.45, change: 1.45, changePercent: 0.33 },
  { symbol: 'DHR', name: 'Danaher Corporation', price: 251.23, change: 0.67, changePercent: 0.27 },
  { symbol: 'DIS', name: 'The Walt Disney Company', price: 99.78, change: -0.89, changePercent: -0.88 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 41.23, change: 0.23, changePercent: 0.56 },
  { symbol: 'NKE', name: 'Nike, Inc.', price: 103.89, change: 1.67, changePercent: 1.63 },
  { symbol: 'PM', name: 'Philip Morris International Inc.', price: 99.45, change: -0.12, changePercent: -0.12 },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', price: 181.23, change: 1.45, changePercent: 0.81 },
  { symbol: 'NEE', name: 'NextEra Energy, Inc.', price: 63.45, change: 0.67, changePercent: 1.07 },
  { symbol: 'RTX', name: 'RTX Corporation', price: 99.67, change: -0.45, changePercent: -0.45 },
  { symbol: 'HON', name: 'Honeywell International Inc.', price: 201.23, change: 2.34, changePercent: 1.18 },
  { symbol: 'AMGN', name: 'Amgen Inc.', price: 301.89, change: 2.67, changePercent: 0.89 },
  { symbol: 'UPS', name: 'United Parcel Service, Inc.', price: 158.45, change: -0.89, changePercent: -0.56 },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', price: 53.12, change: 0.34, changePercent: 0.64 },
  { symbol: 'DE', name: 'Deere & Company', price: 403.45, change: 5.23, changePercent: 1.31 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', price: 315.67, change: 3.12, changePercent: 1.00 },
  { symbol: 'GE', name: 'General Electric Company', price: 144.89, change: 1.67, changePercent: 1.17 },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', price: 3478.23, change: 24.56, changePercent: 0.71 },
  { symbol: 'AMAT', name: 'Applied Materials, Inc.', price: 201.45, change: 2.67, changePercent: 1.34 },
  { symbol: 'AXP', name: 'American Express Company', price: 200.23, change: 1.45, changePercent: 0.73 },
  { symbol: 'LOW', name: "Lowe's Companies, Inc.", price: 237.89, change: 2.67, changePercent: 1.14 },
  { symbol: 'ISRG', name: 'Intuitive Surgical, Inc.', price: 349.23, change: 5.12, changePercent: 1.49 },
  // Popular ETFs
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', price: 474.23, change: 2.45, changePercent: 0.52 },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', price: 79.45, change: 0.34, changePercent: 0.43 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 435.67, change: 3.89, changePercent: 0.90 },
  { symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', price: 172.34, change: 1.56, changePercent: 0.91 },
];

// Search mock stocks by symbol or name
export const searchMockStocks = (query) => {
  const searchQuery = query.trim().toUpperCase();
  if (!searchQuery || searchQuery.length < 1) {
    return [];
  }

  return mockStockData
    .filter(stock => 
      stock.symbol.toUpperCase().includes(searchQuery) ||
      stock.name.toUpperCase().includes(searchQuery)
    )
    .map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: 'NYSE/NASDAQ',
    }))
    .slice(0, 10);
};

// Get mock stock quote by symbol
export const getMockStockQuote = (symbol) => {
  const searchSymbol = symbol.trim().toUpperCase();
  const stock = mockStockData.find(s => s.symbol.toUpperCase() === searchSymbol);
  
  if (!stock) {
    throw new Error(`Mock data not available for ticker: ${symbol}`);
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    previousClose: stock.price - stock.change,
    change: stock.change,
    changePercent: stock.changePercent,
  };
};

// Check if rate limit is exceeded
export const isRateLimitExceeded = (apiResponse) => {
  if (!apiResponse) return false;
  
  // Check for various rate limit indicators
  if (apiResponse['Note']) {
    const note = apiResponse['Note'].toLowerCase();
    return note.includes('call frequency') || note.includes('rate limit');
  }
  
  if (apiResponse['Information']) {
    const info = apiResponse['Information'].toLowerCase();
    return info.includes('rate limit') || info.includes('requests per day');
  }
  
  if (apiResponse['Error Message']) {
    const error = apiResponse['Error Message'].toLowerCase();
    return error.includes('rate limit') || error.includes('call frequency');
  }
  
  return false;
};

