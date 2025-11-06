// Stock Data from Google Sheets (Sheet2)
// Uses Visual Symbol column for lookups and display, but saves Symbol column value to Sheet1
import { readSheetData, appendRowToSheet2, appendRowToSheet2SymbolOnly, deleteRowFromSheet2 } from './googleSheets';
// Note: Read tracking is now handled in googleSheets.js

// Cache for stock data to minimize read requests
let stockDataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Column indices from Sheet2 (based on the structure shown)
// Visual Symbol, Symbol, Name, Price, Currency, Change ($), Change (%), Price Open, Day High, Day Low, 52w High, 52w Low, Volume, Market Cap, P/E Ratio, Beta, Divident Yeild (note: typo in column name)
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
  DIVIDEND_YIELD: 16, // Note: Column header has typo "Divident Yeild"
};

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
  try {
    const data = await readSheetData('Sheet2!A1:Q1000'); // Updated to Q to include Dividend Yield column
    
    if (!data || data.length === 0) {
      throw new Error('No data found in Sheet2');
    }

    // Skip header row (row 0)
    const stocks = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) {
        continue; // Skip empty rows
      }

      const visualSymbol = row[COLUMNS.VISUAL_SYMBOL]?.trim() || '';
      const symbol = row[COLUMNS.SYMBOL]?.trim() || '';
      
      // Include rows that have either Visual Symbol or Symbol
      if (!visualSymbol && !symbol) {
        continue; // Skip rows with neither symbol
      }

      const stock = {
        visualSymbol: visualSymbol,
        symbol: symbol, // Keep for reference but use visualSymbol for display (or symbol if visualSymbol is empty)
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
        dividendYield: parseNumber(row[COLUMNS.DIVIDEND_YIELD]) || 0, // From "Divident Yeild" column
      };

      stocks.push(stock);
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

// Search stocks by Visual Symbol (primary), Symbol (if Visual Symbol is empty), or Name
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
      
      // Search by Visual Symbol (primary), Symbol (if Visual Symbol is empty), or Name
      return visualSymbol.includes(searchQuery) || 
             symbol.includes(searchQuery) || 
             name.includes(searchQuery);
    })
    .map(stock => {
      // Use Symbol from Sheet2 (e.g., "BATS:FETH") for saving to Sheet1
      // Fallback to Visual Symbol if Symbol column is empty
      const symbolToSave = stock.symbol || stock.visualSymbol;
      // Keep Visual Symbol for display purposes
      const displaySymbol = stock.visualSymbol || stock.symbol;
      return {
        symbol: symbolToSave, // Use Symbol from Sheet2 for saving to Sheet1
        name: stock.name || displaySymbol,
        exchange: stock.currency || 'USD',
        visualSymbol: displaySymbol, // Use Visual Symbol for display
      };
    })
    .slice(0, 10);
};

// Get stock quote by Visual Symbol (primary lookup method) or Symbol (if Visual Symbol is empty)
export const getStockQuoteFromSheet = async (visualSymbolOrSymbol) => {
  const stocks = await fetchStockDataFromSheet();
  const searchSymbol = visualSymbolOrSymbol.trim().toUpperCase();

  // Prioritize Visual Symbol match, fallback to Symbol match
  const stock = stocks.find(s => {
    const visualSymbol = (s.visualSymbol || '').toUpperCase();
    const symbol = (s.symbol || '').toUpperCase();
    return visualSymbol === searchSymbol || symbol === searchSymbol;
  });

  if (!stock) {
    throw new Error(`Stock not found: ${visualSymbolOrSymbol}`);
  }

  // Calculate previous close from price and change
  const previousClose = stock.price - stock.changeDollar;

  // Use Symbol from Sheet2 (e.g., "BATS:FETH") for saving to Sheet1
  // Fallback to Visual Symbol if Symbol column is empty
  const symbolToSave = stock.symbol || stock.visualSymbol;
  // Keep Visual Symbol for display purposes
  const displaySymbol = stock.visualSymbol || stock.symbol;

  return {
    symbol: symbolToSave, // Use Symbol from Sheet2 for saving to Sheet1
    visualSymbol: displaySymbol, // Use Visual Symbol for display
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
    dividendYield: stock.dividendYield, // From Sheet2 "Divident Yeild" column
  };
};

// Clear cache (for debugging)
export const clearStockDataCache = () => {
  stockDataCache = null;
  cacheTimestamp = null;
};

// Add a new ticker to Sheet2 and validate that Currency column populates with USD
// Returns { success: boolean, message: string, rowIndex?: number }
export const addNewTickerToSheet2 = async (tickerSymbol) => {
  if (!tickerSymbol || !tickerSymbol.trim()) {
    return { success: false, message: 'Ticker symbol is required' };
  }

  const symbol = tickerSymbol.trim().toUpperCase();
  
  try {
    // Check if ticker already exists in Symbol column
    const stocks = await fetchStockDataFromSheet(true); // Force refresh to get latest data
    const existingStock = stocks.find(s => 
      (s.symbol || '').toUpperCase() === symbol || 
      (s.visualSymbol || '').toUpperCase() === symbol
    );
    
    if (existingStock) {
      return { 
        success: false, 
        message: `Ticker ${symbol} already exists in Sheet2` 
      };
    }

    // Get current Sheet2 data to find the next row index
    const data = await readSheetData('Sheet2!A1:Q1000');
    const nextRowIndex = data.length + 1; // Next row after current data

    // Only write to columns A (empty) and B (Symbol) to preserve formulas in other columns
    // This ensures formulas in columns C-Q (like Currency) can populate automatically
    await appendRowToSheet2SymbolOnly(symbol);
    
    // Wait for Google Sheets formulas to populate (Currency column likely has a formula)
    // Wait 5 seconds to allow formulas to recalculate (based on observed timing for JPM and similar tickers)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Refresh cache and check if Currency column populated with USD
    clearStockDataCache();
    const updatedData = await readSheetData('Sheet2!A1:Q1000');
    
    // Find the row we just added (should be the last row with our symbol)
    let addedRowIndex = -1;
    let currencyValue = '';
    
    for (let i = updatedData.length - 1; i >= 1; i--) { // Start from bottom, skip header
      const row = updatedData[i];
      if (row && row.length > 1 && row[COLUMNS.SYMBOL]?.trim().toUpperCase() === symbol) {
        addedRowIndex = i + 1; // 1-based index for Google Sheets
        currencyValue = row[COLUMNS.CURRENCY]?.trim() || '';
        break;
      }
    }

    if (addedRowIndex === -1) {
      return { 
        success: false, 
        message: 'Failed to find the added row in Sheet2' 
      };
    }

    // Check currency value and provide specific error messages
    const currencyUpper = currencyValue.toUpperCase();
    
    if (currencyValue === '' || currencyValue === null || currencyValue === undefined) {
      // Currency is blank - stock could not be tracked
      try {
        await deleteRowFromSheet2(addedRowIndex);
        clearStockDataCache();
        return { 
          success: false, 
          message: `Stock ${symbol} could not be tracked.` 
        };
      } catch (deleteError) {
        console.error('Error deleting invalid row:', deleteError);
        return { 
          success: false, 
          message: `Stock ${symbol} could not be tracked. Failed to remove invalid row: ${deleteError.message}` 
        };
      }
    } else if (currencyUpper !== 'USD') {
      // Currency is something other than USD - not listed on US exchange
      try {
        await deleteRowFromSheet2(addedRowIndex);
        clearStockDataCache();
        return { 
          success: false, 
          message: `Stock ${symbol} is not listed on a USA exchange.  Try looking up the full USA ticker and try again` 
        };
      } catch (deleteError) {
        console.error('Error deleting invalid row:', deleteError);
        return { 
          success: false, 
          message: `Stock ${symbol} is not listed on a USA exchange.  Try looking up the full USA ticker and try again. Failed to remove invalid row: ${deleteError.message}` 
        };
      }
    }

    // Success! Currency column populated with USD
    clearStockDataCache();
    return { 
      success: true, 
      message: `Ticker ${symbol} added successfully to Sheet2`,
      rowIndex: addedRowIndex
    };
  } catch (error) {
    console.error('Error adding new ticker to Sheet2:', error);
    return { 
      success: false, 
      message: `Failed to add ticker ${symbol}: ${error.message}` 
    };
  }
};

// Check if a ticker exists in Sheet2 (by Symbol column)
export const tickerExistsInSheet2 = async (tickerSymbol) => {
  if (!tickerSymbol || !tickerSymbol.trim()) {
    return false;
  }

  const symbol = tickerSymbol.trim().toUpperCase();
  
  try {
    const stocks = await fetchStockDataFromSheet();
    return stocks.some(s => 
      (s.symbol || '').toUpperCase() === symbol || 
      (s.visualSymbol || '').toUpperCase() === symbol
    );
  } catch (error) {
    console.error('Error checking if ticker exists:', error);
    return false;
  }
};

// Note: Reset functions moved to googleSheets.js for centralized tracking

