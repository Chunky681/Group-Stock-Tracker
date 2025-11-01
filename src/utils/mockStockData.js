// Mock stock data for top 50 stocks by market cap
// Used when API rate limits are exceeded

export const mockStockData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, changePercent: 1.24 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: -1.23, changePercent: -0.32 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.56, change: 0.85, changePercent: 0.60 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 151.94, change: 1.45, changePercent: 0.96 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 492.98, change: 12.34, changePercent: 2.57 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.39, change: -3.21, changePercent: -0.66 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.50, change: 5.20, changePercent: 2.14 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 385.00, change: 2.50, changePercent: 0.65 },
  { symbol: 'V', name: 'Visa Inc.', price: 276.84, change: -0.56, changePercent: -0.20 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 538.21, change: 3.45, changePercent: 0.65 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', price: 112.34, change: 0.89, changePercent: 0.80 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 157.89, change: 0.23, changePercent: 0.15 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 164.56, change: 1.12, changePercent: 0.69 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 158.43, change: -0.67, changePercent: -0.42 },
  { symbol: 'PG', name: 'The Procter & Gamble Company', price: 162.34, change: 0.45, changePercent: 0.28 },
  { symbol: 'MA', name: 'Mastercard Incorporated', price: 434.56, change: 2.34, changePercent: 0.54 },
  { symbol: 'CVX', name: 'Chevron Corporation', price: 153.21, change: 1.23, changePercent: 0.81 },
  { symbol: 'HD', name: 'The Home Depot, Inc.', price: 378.45, change: -2.34, changePercent: -0.61 },
  { symbol: 'ABBV', name: 'AbbVie Inc.', price: 175.67, change: 0.89, changePercent: 0.51 },
  { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1298.45, change: 15.23, changePercent: 1.19 },
  { symbol: 'PEP', name: 'PepsiCo, Inc.', price: 173.56, change: 0.67, changePercent: 0.39 },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', price: 685.43, change: 4.56, changePercent: 0.67 },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 578.90, change: -2.34, changePercent: -0.40 },
  { symbol: 'MCD', name: "McDonald's Corporation", price: 278.34, change: 1.45, changePercent: 0.52 },
  { symbol: 'CRM', name: 'Salesforce, Inc.', price: 245.67, change: 2.34, changePercent: 0.96 },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.', price: 54.23, change: -0.23, changePercent: -0.42 },
  { symbol: 'NFLX', name: 'Netflix, Inc.', price: 485.21, change: 3.45, changePercent: 0.72 },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', price: 542.34, change: 4.56, changePercent: 0.85 },
  { symbol: 'ABT', name: 'Abbott Laboratories', price: 112.45, change: 0.67, changePercent: 0.60 },
  { symbol: 'ACN', name: 'Accenture plc', price: 345.67, change: 2.34, changePercent: 0.68 },
  { symbol: 'LIN', name: 'Linde plc', price: 435.21, change: 1.23, changePercent: 0.28 },
  { symbol: 'DHR', name: 'Danaher Corporation', price: 248.90, change: 0.45, changePercent: 0.18 },
  { symbol: 'DIS', name: 'The Walt Disney Company', price: 98.45, change: -1.23, changePercent: -1.23 },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', price: 40.67, change: 0.12, changePercent: 0.30 },
  { symbol: 'NKE', name: 'Nike, Inc.', price: 102.34, change: 1.45, changePercent: 1.44 },
  { symbol: 'PM', name: 'Philip Morris International Inc.', price: 98.76, change: -0.23, changePercent: -0.23 },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated', price: 178.90, change: 1.23, changePercent: 0.69 },
  { symbol: 'NEE', name: 'NextEra Energy, Inc.', price: 62.34, change: 0.45, changePercent: 0.73 },
  { symbol: 'RTX', name: 'RTX Corporation', price: 98.45, change: -0.67, changePercent: -0.68 },
  { symbol: 'HON', name: 'Honeywell International Inc.', price: 198.67, change: 1.89, changePercent: 0.96 },
  { symbol: 'AMGN', name: 'Amgen Inc.', price: 298.45, change: 2.34, changePercent: 0.79 },
  { symbol: 'UPS', name: 'United Parcel Service, Inc.', price: 156.78, change: -1.23, changePercent: -0.78 },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', price: 52.34, change: 0.23, changePercent: 0.44 },
  { symbol: 'DE', name: 'Deere & Company', price: 398.90, change: 4.56, changePercent: 1.16 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', price: 312.45, change: 2.67, changePercent: 0.86 },
  { symbol: 'GE', name: 'General Electric Company', price: 142.56, change: 1.45, changePercent: 1.03 },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', price: 3456.78, change: 23.45, changePercent: 0.68 },
  { symbol: 'AMAT', name: 'Applied Materials, Inc.', price: 198.67, change: 2.34, changePercent: 1.19 },
  { symbol: 'AXP', name: 'American Express Company', price: 198.45, change: 1.23, changePercent: 0.62 },
  { symbol: 'LOW', name: "Lowe's Companies, Inc.", price: 234.56, change: 2.34, changePercent: 1.01 },
  { symbol: 'ISRG', name: 'Intuitive Surgical, Inc.', price: 345.67, change: 4.56, changePercent: 1.34 },
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

