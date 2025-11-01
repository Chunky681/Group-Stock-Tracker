// Stock API Integration
// Now using Google Sheets Sheet2 instead of Alpha Vantage API
import { searchStocksFromSheet, getStockQuoteFromSheet } from './stockDataSheet';
import { searchMockStocks, getMockStockQuote } from './mockStockData';

export const getStockQuote = async (ticker) => {
  if (!ticker || !ticker.trim()) {
    throw new Error('Ticker symbol is required');
  }

  const symbol = ticker.trim().toUpperCase();
  
  try {
    // Get from Google Sheets Sheet2
    const quote = await getStockQuoteFromSheet(symbol);
    
    // Get dividend yield from mock data if available (for now)
    try {
      const mockQuote = getMockStockQuote(symbol);
      if (mockQuote.dividendYield) {
        quote.dividendYield = mockQuote.dividendYield;
      }
    } catch (e) {
      // No mock data, that's okay
    }
    
    return quote;
  } catch (error) {
    console.error('Error fetching stock quote from Sheet2:', error);
    
    // Fallback to mock data
    try {
      console.log('Sheet2 error, trying mock data for', symbol);
      return getMockStockQuote(symbol);
    } catch (mockError) {
      throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
    }
  }
};

export const searchTickers = async (query) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchQuery = query.trim().toUpperCase();
  
  try {
    // Search from Google Sheets Sheet2
    const results = await searchStocksFromSheet(searchQuery);
    
    if (results.length > 0) {
      console.log('Found stocks from Sheet2:', results.length);
      return results;
    }
    
    // Fallback to mock data if no results from Sheet2
    console.log('No results from Sheet2, trying mock data');
    const mockResults = searchMockStocks(searchQuery);
    if (mockResults.length > 0) {
      console.log('Found', mockResults.length, 'mock results as fallback');
      return mockResults;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching tickers:', error);
    // Try mock data as fallback
    console.log('Search error, trying mock data');
    const mockResults = searchMockStocks(searchQuery);
    if (mockResults.length > 0) {
      return mockResults;
    }
    // Return empty array on error to allow manual entry
    return [];
  }
};
