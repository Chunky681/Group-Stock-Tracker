// Stock API Integration
// Using Google Sheets Sheet2 as the data source
import { searchStocksFromSheet, getStockQuoteFromSheet } from './stockDataSheet';

export const getStockQuote = async (ticker) => {
  if (!ticker || !ticker.trim()) {
    throw new Error('Ticker symbol is required');
  }

  const visualSymbol = ticker.trim().toUpperCase();
  
  try {
    // Get from Google Sheets Sheet2 (uses Visual Symbol for lookup)
    const quote = await getStockQuoteFromSheet(visualSymbol);
    return quote;
  } catch (error) {
    console.error('Error fetching stock quote from Sheet2:', error);
    throw new Error(`Failed to fetch stock data for ${visualSymbol}: ${error.message}`);
  }
};

export const searchTickers = async (query) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchQuery = query.trim().toUpperCase();
  
  try {
    // Search from Google Sheets Sheet2 (searches by Visual Symbol and Name)
    const results = await searchStocksFromSheet(searchQuery);
    
    if (results.length > 0) {
      console.log('Found stocks from Sheet2:', results.length);
      return results;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching tickers:', error);
    // Return empty array on error to allow manual entry
    return [];
  }
};
