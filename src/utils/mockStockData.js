// Mock stock data for top 50 stocks by market cap + popular ETFs
// Used when API rate limits are exceeded

export const mockStockData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 188.63, change: 1.25, changePercent: 0.67, dividendYield: 0.51 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 415.26, change: 2.85, changePercent: 0.69, dividendYield: 0.72 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 156.78, change: 0.92, changePercent: 0.59, dividendYield: 0.0 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 158.51, change: 1.43, changePercent: 0.91, dividendYield: 0.0 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 512.89, change: 14.23, changePercent: 2.85, dividendYield: 0.03 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 492.45, change: -2.15, changePercent: -0.43, dividendYield: 0.41 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 244.35, change: 4.89, changePercent: 2.04, dividendYield: 0.0 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 392.45, change: 2.67, changePercent: 0.68, dividendYield: 0.0 },
  { symbol: 'V', name: 'Visa Inc.', price: 279.23, change: -0.45, changePercent: -0.16, dividendYield: 0.75 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 542.89, change: 3.78, changePercent: 0.70, dividendYield: 1.48 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', price: 114.56, change: 0.92, changePercent: 0.81, dividendYield: 3.42 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 159.23, change: 0.34, changePercent: 0.21, dividendYield: 3.01 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 166.78, change: 1.34, changePercent: 0.81, dividendYield: 1.38 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 161.45, change: -0.52, changePercent: -0.32, dividendYield: 2.23 },
  { symbol: 'PG', name: 'The Procter & Gamble Company', price: 164.89, change: 0.56, changePercent: 0.34, dividendYield: 2.47 },
  { symbol: 'MA', name: 'Mastercard Incorporated', price: 438.92, change: 2.56, changePercent: 0.59, dividendYield: 0.59 },
  { symbol: 'CVX', name: 'Chevron Corporation', price: 155.67, change: 1.45, changePercent: 0.94, dividendYield: 3.86 },
  { symbol: 'HD', name: 'The Home Depot, Inc.', price: 381.23, change: -1.89, changePercent: -0.49, dividendYield: 2.42 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', price: 178.34, change: 1.02, changePercent: 0.57, dividendYield: 3.58 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1312.89, change: 18.45, changePercent: 1.42, dividendYield: 1.55 },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', price: 175.67, change: 0.78, changePercent: 0.45, dividendYield: 2.95 },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', price: 691.23, change: 5.12, changePercent: 0.75, dividendYield: 0.62 },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 583.45, change: -1.89, changePercent: -0.32, dividendYield: 0.0 },
  { symbol: 'MCD', name: "McDonald's Corporation", price: 281.56, change: 1.67, changePercent: 0.60, dividendYield: 2.35 },
  { symbol: 'CRM', name: 'Salesforce, Inc.', price: 248.23, change: 2.67, changePercent: 1.09, dividendYield: 0.0 },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', price: 54.89, change: -0.18, changePercent: -0.33, dividendYield: 2.73 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', price: 489.45, change: 3.89, changePercent: 0.80, dividendYield: 0.0 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', price: 547.89, change: 5.12, changePercent: 0.94, dividendYield: 0.24 },
  { symbol: 'ABT', name: 'Abbott Laboratories', price: 113.67, change: 0.78, changePercent: 0.69, dividendYield: 1.87 },
  { symbol: 'ACN', name: 'Accenture plc', price: 349.23, change: 2.67, changePercent: 0.77, dividendYield: 1.39 },
  { symbol: 'LIN', name: 'Linde plc', price: 438.45, change: 1.45, changePercent: 0.33, dividendYield: 1.31 },
  { symbol: 'DHR', name: 'Danaher Corporation', price: 251.23, change: 0.67, changePercent: 0.27, dividendYield: 0.42 },
  { symbol: 'DIS', name: 'The Walt Disney Company', price: 99.78, change: -0.89, changePercent: -0.88, dividendYield: 0.50 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 41.23, change: 0.23, changePercent: 0.56, dividendYield: 6.83 },
  { symbol: 'NKE', name: 'Nike, Inc.', price: 103.89, change: 1.67, changePercent: 1.63, dividendYield: 1.58 },
  { symbol: 'PM', name: 'Philip Morris International Inc.', price: 99.45, change: -0.12, changePercent: -0.12, dividendYield: 5.43 },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', price: 181.23, change: 1.45, changePercent: 0.81, dividendYield: 3.04 },
  { symbol: 'NEE', name: 'NextEra Energy, Inc.', price: 63.45, change: 0.67, changePercent: 1.07, dividendYield: 2.95 },
  { symbol: 'RTX', name: 'RTX Corporation', price: 99.67, change: -0.45, changePercent: -0.45, dividendYield: 2.51 },
  { symbol: 'HON', name: 'Honeywell International Inc.', price: 201.23, change: 2.34, changePercent: 1.18, dividendYield: 2.09 },
  { symbol: 'AMGN', name: 'Amgen Inc.', price: 301.89, change: 2.67, changePercent: 0.89, dividendYield: 3.15 },
  { symbol: 'UPS', name: 'United Parcel Service, Inc.', price: 158.45, change: -0.89, changePercent: -0.56, dividendYield: 4.35 },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', price: 53.12, change: 0.34, changePercent: 0.64, dividendYield: 4.52 },
  { symbol: 'DE', name: 'Deere & Company', price: 403.45, change: 5.23, changePercent: 1.31, dividendYield: 1.39 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', price: 315.67, change: 3.12, changePercent: 1.00, dividendYield: 1.77 },
  { symbol: 'GE', name: 'General Electric Company', price: 144.89, change: 1.67, changePercent: 1.17, dividendYield: 0.34 },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', price: 3478.23, change: 24.56, changePercent: 0.71, dividendYield: 0.0 },
  { symbol: 'AMAT', name: 'Applied Materials, Inc.', price: 201.45, change: 2.67, changePercent: 1.34, dividendYield: 0.85 },
  { symbol: 'AXP', name: 'American Express Company', price: 200.23, change: 1.45, changePercent: 0.73, dividendYield: 1.50 },
  { symbol: 'LOW', name: "Lowe's Companies, Inc.", price: 237.89, change: 2.67, changePercent: 1.14, dividendYield: 1.93 },
  { symbol: 'ISRG', name: 'Intuitive Surgical, Inc.', price: 349.23, change: 5.12, changePercent: 1.49, dividendYield: 0.0 },
  // Popular ETFs
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', price: 627.33, change: 2.45, changePercent: 0.52, dividendYield: 1.38 },
  { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', price: 26.75, change: 0.34, changePercent: 0.43, dividendYield: 3.45 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 552.00, change: 3.89, changePercent: 0.90, dividendYield: 0.58 },
  { symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', price: 259.00, change: 1.56, changePercent: 0.91, dividendYield: 0.58 },
  // Cash and currency
  { symbol: 'USD', name: 'Currency', price: 1.00, change: 0.00, changePercent: 0.00, dividendYield: 3.75 },
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
    dividendYield: stock.dividendYield || 0,
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

