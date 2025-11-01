// Stock API Integration
// Using Yahoo Finance API (free, no API key required)

export const getStockQuote = async (ticker) => {
  if (!ticker || !ticker.trim()) {
    throw new Error('Ticker symbol is required');
  }

  const symbol = ticker.trim().toUpperCase();
  
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error(`No data found for ticker: ${symbol}`);
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    
    const quote = result.indicators.quote[0];
    const closePrices = quote.close;
    
    let latestPrice = meta.regularMarketPrice || meta.previousClose;
    
    if (!latestPrice && closePrices) {
      for (let i = closePrices.length - 1; i >= 0; i--) {
        if (closePrices[i] !== null) {
          latestPrice = closePrices[i];
          break;
        }
      }
    }
    
    return {
      symbol: meta.symbol,
      name: meta.shortName || meta.longName || symbol,
      price: latestPrice || meta.previousClose || 0,
      previousClose: meta.previousClose || latestPrice || 0,
      change: meta.regularMarketPrice ? (meta.regularMarketPrice - (meta.previousClose || meta.regularMarketPrice)) : 0,
      changePercent: meta.regularMarketPrice && meta.previousClose 
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 
        : 0,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || meta.exchange || 'NYSE',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
  }
};

export const searchTickers = async (query) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchQuery = query.trim().toUpperCase();
  
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}&quotesCount=10`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to search: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.quotes || data.quotes.length === 0) {
      return [];
    }
    
    return data.quotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      exchange: quote.exchange || 'N/A',
      type: quote.quoteType || 'EQUITY',
    }));
  } catch (error) {
    console.error('Error searching tickers:', error);
    return [];
  }
};