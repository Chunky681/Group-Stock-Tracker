// Stock API Integration
// Using Alpha Vantage API (free tier available)
// Get your free API key from: https://www.alphavantage.co/support/#api-key
import { mockStockData, searchMockStocks, getMockStockQuote, isRateLimitExceeded } from './mockStockData';

const getApiKey = () => {
  // Try to get API key from environment variable
  try {
    const apiKey = import.meta.env?.VITE_ALPHA_VANTAGE_API_KEY;
    
    if (apiKey && typeof apiKey === 'string' && apiKey !== 'your_api_key_here' && apiKey.trim() !== '') {
      return apiKey.trim();
    }
  } catch (error) {
    console.warn('Error reading environment variable:', error);
  }
  
  // Fallback to demo key (limited to 5 API calls per minute)
  // Users should get their own free key from alphavantage.co
  console.warn('Using demo API key. Get your free key at https://www.alphavantage.co/support/#api-key');
  return 'demo'; // Alpha Vantage demo key
};

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

const makeRequest = async (params) => {
  const apiKey = getApiKey();
  const queryParams = new URLSearchParams({
    ...params,
    apikey: apiKey,
  });
  
  const url = `${ALPHA_VANTAGE_BASE_URL}?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if rate limit is exceeded - if so, mark it
    if (isRateLimitExceeded(data)) {
      console.warn('Rate limit exceeded, will use mock data');
      data._rateLimitExceeded = true;
      return data;
    }
    
    // Alpha Vantage returns error messages in the response
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      // Check if it's a rate limit note
      if (data['Note'].toLowerCase().includes('call frequency') || data['Note'].toLowerCase().includes('rate limit')) {
        data._rateLimitExceeded = true;
        return data;
      }
      throw new Error(`API rate limit: ${data['Note']}`);
    }
    
    // Check for rate limit information
    if (data['Information']) {
      const info = data['Information'].toLowerCase();
      if (info.includes('rate limit') || info.includes('requests per day')) {
        console.warn('Rate limit detected in Information field');
        data._rateLimitExceeded = true;
        return data;
      }
      // Other information messages are just warnings
    }
    
    return data;
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    console.error('API Key used:', apiKey ? `${apiKey.substring(0, 4)}...` : 'none');
    throw error;
  }
};

export const getStockQuote = async (ticker) => {
  if (!ticker || !ticker.trim()) {
    throw new Error('Ticker symbol is required');
  }

  const symbol = ticker.trim().toUpperCase();
  
  try {
    // Use Alpha Vantage GLOBAL_QUOTE function
    const data = await makeRequest({
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
    });
    
    // If rate limit exceeded, use mock data
    if (data._rateLimitExceeded) {
      console.log('Rate limit exceeded, using mock data for', symbol);
      try {
        return getMockStockQuote(symbol);
      } catch (mockError) {
        throw new Error(`Rate limit exceeded and no mock data available for ${symbol}`);
      }
    }
    
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      // Try mock data as fallback
      try {
        console.log('No API data, trying mock data for', symbol);
        return getMockStockQuote(symbol);
      } catch (mockError) {
        throw new Error(`No data found for ticker: ${symbol}`);
      }
    }
    
    const quote = data['Global Quote'];
    
    const price = parseFloat(quote['05. price']) || 0;
    const previousClose = parseFloat(quote['08. previous close']) || price;
    const change = parseFloat(quote['09. change']) || 0;
    const changePercent = parseFloat(quote['10. change percent']?.replace('%', '')) || 0;
    
    return {
      symbol: quote['01. symbol'] || symbol,
      name: quote['01. symbol'] || symbol, // Alpha Vantage doesn't provide company name in GLOBAL_QUOTE
      price: Number(price.toFixed(2)),
      previousClose: Number(previousClose.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      dividendYield: 0, // Alpha Vantage GLOBAL_QUOTE doesn't provide dividend yield, use mock data fallback
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    
    // If error and not already tried, attempt mock data
    if (!error.message.includes('mock data')) {
      try {
        console.log('API error, trying mock data for', symbol);
        return getMockStockQuote(symbol);
      } catch (mockError) {
        throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
      }
    }
    
    throw error;
  }
};

export const searchTickers = async (query) => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchQuery = query.trim().toUpperCase();
  
  try {
    // Alpha Vantage SYMBOL_SEARCH function
    const data = await makeRequest({
      function: 'SYMBOL_SEARCH',
      keywords: searchQuery,
    });
    
    console.log('Search API response:', data);
    
    // Check for rate limit FIRST - prioritize mock data when rate limited
    // Check multiple indicators of rate limiting
    const hasRateLimit = data._rateLimitExceeded || 
                         isRateLimitExceeded(data) ||
                         (data['Information'] && (
                           data['Information'].toLowerCase().includes('rate limit') ||
                           data['Information'].toLowerCase().includes('requests per day') ||
                           data['Information'].toLowerCase().includes('call frequency')
                         )) ||
                         (data['Note'] && (
                           data['Note'].toLowerCase().includes('call frequency') ||
                           data['Note'].toLowerCase().includes('rate limit')
                         ));
    
    if (hasRateLimit) {
      console.log('Rate limit detected, using mock data for search');
      const mockResults = searchMockStocks(searchQuery);
      console.log('Mock search results for', searchQuery, ':', mockResults);
      if (mockResults.length > 0) {
        console.log('Found', mockResults.length, 'mock results');
        return mockResults;
      }
      // Even if no mock results found, return empty (but log for debugging)
      console.log('No mock results found for', searchQuery);
      return [];
    }
    
    // If no bestMatches from API, try mock data before returning empty
    if (!data.bestMatches || data.bestMatches.length === 0) {
      console.log('No API matches, trying mock data');
      const mockResults = searchMockStocks(searchQuery);
      if (mockResults.length > 0) {
        console.log('Found', mockResults.length, 'mock results as fallback');
        return mockResults;
      }
      return [];
    }
    
    // Map Alpha Vantage search results to our format
    const filtered = data.bestMatches
      .filter(match => {
        const type = match['3. type']?.toUpperCase() || '';
        // Filter for equity stocks only
        return type.includes('EQUITY') || type.includes('SHARE') || !type;
      })
      .map(match => ({
        symbol: match['1. symbol'] || searchQuery,
        name: match['2. name'] || match['1. symbol'] || searchQuery,
        exchange: match['4. region']?.split(' - ')[0] || 'N/A',
      }))
      .slice(0, 10);
    
    console.log('Filtered results:', filtered);
    return filtered;
  } catch (error) {
    console.error('Error searching tickers:', error);
    // Try mock data as fallback
    console.log('Search error, trying mock data');
    const mockResults = searchMockStocks(searchQuery);
    if (mockResults.length > 0) {
      return mockResults;
    }
    // Return empty array on error to allow manual entry
    // If search fails, user can still enter ticker manually
    return [];
  }
};
