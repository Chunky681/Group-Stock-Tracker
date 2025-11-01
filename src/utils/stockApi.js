// Stock API Integration
// Using Alpha Vantage API (free tier available)
// Get your free API key from: https://www.alphavantage.co/support/#api-key

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
    
    // Alpha Vantage returns error messages in the response
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      throw new Error(`API rate limit: ${data['Note']}`);
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
    
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      throw new Error(`No data found for ticker: ${symbol}`);
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
    // Alpha Vantage SYMBOL_SEARCH function
    const data = await makeRequest({
      function: 'SYMBOL_SEARCH',
      keywords: searchQuery,
    });
    
    console.log('Search API response:', data);
    
    if (!data.bestMatches || data.bestMatches.length === 0) {
      console.log('No matches found for:', searchQuery);
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
    // Return empty array on error to allow manual entry
    // If search fails, user can still enter ticker manually
    return [];
  }
};
