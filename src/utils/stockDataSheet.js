// Stock Data from Google Sheets (Sheet2)
// This replaces Alpha Vantage API calls
import { readSheetData } from './googleSheets';

// Cache for stock data to minimize read requests
let stockDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Column indices from Sheet2 (based on the structure shown)
// Visual Symbol, Symbol, Name, Price, Currency, Change ($), Change (%), Price Open, Day High, Day Low, 52w High, 52w Low, Volume, Market Cap, P/E Ratio, Beta
const COLUMNS = {
  VISUAL_SYMBOL: 0,
  SYMBOL: 1,
  NAME: 2,
  PRICE: 3,
  CURRENCY: 4,
  CHANGE_DOLLAR: 5,
  CHANGE_PERCENT: 6,
  PRICE_OPEN: 7,
  DAY_HIGH: 8,
  DAY_LOW: 9,
  WEEK52_HIGH: 10,
  WEEK52_LOW: 11,
  VOLUME: 12,
  MARKET_CAP: 13,
  PE_RATIO: 14,
  BETA: 15,
};

let readRequestCount = 0;
export const getReadRequestCount = () => readRequestCount;

// Parse a numeric value, handling empty strings and commas
const parseNumber = (value) => {
  if (!value || value === '' || value === '-') return 0;
  // Remove commas and parse
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Fetch all stock data from Sheet2
export const fetchStockDataFromSheet = async (forceRefresh = false) => {
  // Check cache first
  if (!forceRefresh && stockDataCache && cacheTimestamp) {
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION) {
      console.log('Using cached stock data');
      return stockDataCache;
    }
  }

  // Fetch fresh data
  readRequestCount++;
  try {
    const data = await readSheetData('Sheet2!A1:P1000');
    
    if (!data || data.length === 0) {
      throw new Error('No data found in Sheet2');
    }

    // Skip header row (row 0)
    const stocks = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3 || !row[COLUMNS.VISUAL_SYMBOL]) {
        continue; // Skip empty rows
      }

      const stock = {
        visualSymbol: row[COLUMNS.VISUAL_SYMBOL]?.trim() || '',
        symbol: row[COLUMNS.SYMBOL]?.trim() || row[COLUMNS.VISUAL_SYMBOL]?.trim() || '',
        name: row[COLUMNS.NAME]?.trim() || '',
        price: parseNumber(row[COLUMNS.PRICE]),
        currency: row[COLUMNS.CURRENCY]?.trim() || 'USD',
        changeDollar: parseNumber(row[COLUMNS.CHANGE_DOLLAR]),
        changePercent: parseNumber(row[COLUMNS.CHANGE_PERCENT]),
        priceOpen: parseNumber(row[COLUMNS.PRICE_OPEN]),
        dayHigh: parseNumber(row[COLUMNS.DAY_HIGH]),
        dayLow: parseNumber(row[COLUMNS.DAY_LOW]),
        week52High: parseNumber(row[COLUMNS.WEEK52_HIGH]),
        week52Low: parseNumber(row[COLUMNS.WEEK52_LOW]),
        volume: parseNumber(row[COLUMNS.VOLUME]),
        marketCap: parseNumber(row[COLUMNS.MARKET_CAP]),
        peRatio: parseNumber(row[COLUMNS.PE_RATIO]) || null,
        beta: parseNumber(row[COLUMNS.BETA]) || null,
      };

      // Only add if we have at least a symbol
      if (stock.symbol || stock.visualSymbol) {
        stocks.push(stock);
      }
    }

    // Update cache
    stockDataCache = stocks;
    cacheTimestamp = Date.now();

    return stocks;
  } catch (error) {
    console.error('Error fetching stock data from Sheet2:', error);
    throw error;
  }
};

// Search stocks by Visual Symbol or Symbol
export const searchStocksFromSheet = async (query) => {
  const stocks = await fetchStockDataFromSheet();
  const searchQuery = query.trim().toUpperCase();

  if (!searchQuery || searchQuery.length < 1) {
    return [];
  }

  return stocks
    .filter(stock => {
      const visualSymbol = (stock.visualSymbol || '').toUpperCase();
      const symbol = (stock.symbol || '').toUpperCase();
      const name = (stock.name || '').toUpperCase();
      
      return visualSymbol.includes(searchQuery) ||
             symbol.includes(searchQuery) ||
             name.includes(searchQuery);
    })
    .map(stock => ({
      symbol: stock.symbol || stock.visualSymbol,
      name: stock.name || stock.symbol || stock.visualSymbol,
      exchange: stock.currency || 'USD',
      visualSymbol: stock.visualSymbol,
    }))
    .slice(0, 10);
};

// Get stock quote by symbol or visual symbol
export const getStockQuoteFromSheet = async (symbolOrVisualSymbol) => {
  const stocks = await fetchStockDataFromSheet();
  const searchSymbol = symbolOrVisualSymbol.trim().toUpperCase();

  const stock = stocks.find(s => {
    const visualSymbol = (s.visualSymbol || '').toUpperCase();
    const symbol = (s.symbol || '').toUpperCase();
    return visualSymbol === searchSymbol || symbol === searchSymbol;
  });

  if (!stock) {
    throw new Error(`Stock not found: ${symbolOrVisualSymbol}`);
  }

  // Calculate previous close from price and change
  const previousClose = stock.price - stock.changeDollar;

  return {
    symbol: stock.symbol || stock.visualSymbol,
    visualSymbol: stock.visualSymbol,
    name: stock.name,
    price: stock.price,
    previousClose: previousClose,
    change: stock.changeDollar,
    changePercent: stock.changePercent,
    // Extended data
    currency: stock.currency,
    priceOpen: stock.priceOpen,
    dayHigh: stock.dayHigh,
    dayLow: stock.dayLow,
    week52High: stock.week52High,
    week52Low: stock.week52Low,
    volume: stock.volume,
    marketCap: stock.marketCap,
    peRatio: stock.peRatio,
    beta: stock.beta,
    dividendYield: 0, // Not in Sheet2, will need to add or use mock data
  };
};

// Clear cache (for debugging)
export const clearStockDataCache = () => {
  stockDataCache = null;
  cacheTimestamp = null;
};

// Reset read count (for session tracking)
export const resetReadCount = () => {
  readRequestCount = 0;
};

