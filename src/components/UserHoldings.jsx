import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, TrendingUp, DollarSign, RefreshCw, Plus, Trash2, Home, Coins } from 'lucide-react';
import { readSheetData, updateRow, initializeSheet, deleteRow, formatHoldingsHistoryDate } from '../utils/googleSheets';
import { getStockQuote } from '../utils/stockApi';

const UserHoldings = ({ selectedUser, onUpdate, refreshKey }) => {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTicker, setEditingTicker] = useState(null);
  const [editShares, setEditShares] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Track which ticker is being deleted
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [sheetData, setSheetData] = useState([]); // Store raw sheet data to find row indices
  const [allRowIndices, setAllRowIndices] = useState(new Map()); // Store all row indices for each ticker
  const [cryptoMap, setCryptoMap] = useState(new Map()); // Store crypto symbol -> price map
  const lastRefreshKeyRef = useRef(null); // Track the last refreshKey to detect actual refreshes (null = first time)
  const lastSelectedUserRef = useRef(null); // Track last selected user

  useEffect(() => {
    if (selectedUser) {
      // Check if this is the first load ever, or if refreshKey actually changed
      const isFirstLoad = lastRefreshKeyRef.current === null;
      const refreshKeyChanged = refreshKey !== lastRefreshKeyRef.current;
      const userChanged = selectedUser !== lastSelectedUserRef.current;
      
      // Only force refresh if refreshKey actually changed (not just user switching)
      // On first load (refreshKey = 0), use cache. On refresh (refreshKey > 0), force refresh.
      const isInitialLoad = isFirstLoad && refreshKey === 0;
      const forceRefresh = refreshKeyChanged && refreshKey > 0; // Only force when refreshKey changed AND > 0
      const silent = !isInitialLoad && !userChanged; // Silent if not initial load and same user
      
      // Update refs to track state
      lastRefreshKeyRef.current = refreshKey;
      lastSelectedUserRef.current = selectedUser;
      
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      } else if (!refreshKeyChanged && !userChanged) {
        // Nothing changed, don't reload
        return;
      } else if (!refreshKeyChanged && userChanged) {
        // User switched but refreshKey didn't change - use cache, minimal loading
        setIsLoading(false);
      }
      
      loadHoldings(forceRefresh, silent);
    } else {
      setHoldings([]);
      setSheetData([]);
      setIsLoading(false);
    }
  }, [selectedUser, refreshKey]); // Add refreshKey to dependencies

  const loadHoldings = async (forceRefresh = false, silent = false) => {
    if (!selectedUser) return;
    
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      await initializeSheet();
      const data = await readSheetData(undefined, forceRefresh);
      setSheetData(data); // Store raw data for finding row indices
      
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
      
      // Filter to only selected user's holdings
      const userRows = rows.filter(row => 
        row[0]?.trim().toLowerCase() === selectedUser.trim().toLowerCase()
      );
      
      // Get unique tickers for this user
      const uniqueTickers = [...new Set(userRows.map(row => row[1]?.trim().toUpperCase()))];
      const priceMap = {};
      
      // Load crypto list from Crypto sheet to identify crypto tickers
      let cryptoMap = new Map(); // Map of symbol -> price
      try {
        const cryptoData = await readSheetData('Crypto!A1:E1000', forceRefresh);
        if (cryptoData && cryptoData.length > 1) {
          cryptoData.slice(1)
            .filter(row => row && row.length >= 3 && row[0] && row[2])
            .forEach(row => {
              const symbol = row[0]?.trim().toUpperCase();
              const price = parseFloat(row[2]) || 0;
              if (symbol && price > 0) {
                cryptoMap.set(symbol, price);
              }
            });
        }
      } catch (error) {
        console.error('Error loading crypto list:', error);
      }
      
      // Fetch prices for all tickers
      for (const ticker of uniqueTickers) {
        // Handle cash - price is always $1.00
        if (ticker === 'CASH' || ticker === 'USD') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        // Handle real estate - price is always $1.00
        if (ticker === 'REAL ESTATE') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        // Handle crypto - get price from Crypto sheet
        if (cryptoMap.has(ticker)) {
          priceMap[ticker] = cryptoMap.get(ticker);
          continue;
        }
        
        // Try to fetch as stock
        try {
          const quote = await getStockQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          priceMap[ticker] = 0;
        }
      }
      
      // Group by ticker and sum shares, keeping track of all row indices for each ticker
      const holdingsMap = new Map();
      const rowIndicesMap = new Map(); // Track all row indices for each ticker
      
      // First, collect all row indices for each ticker
      userRows.forEach((row, rowIdx) => {
        const ticker = row[1]?.trim().toUpperCase() || '';
        const username = row[0]?.trim() || '';
        
        // Find all matching rows in the full data array
        const matchingRows = [];
        data.forEach((r, idx) => {
          if (idx > 0 && // Skip header
              r && r.length >= 3 &&
              r[0]?.trim().toLowerCase() === username.toLowerCase() &&
              r[1]?.trim().toUpperCase() === ticker) {
            matchingRows.push(idx + 1); // +1 because sheet rows are 1-indexed (header is row 1)
          }
        });
        
        if (matchingRows.length > 0) {
          rowIndicesMap.set(ticker, matchingRows);
        }
      });
      
      // Now group by ticker and sum shares
      userRows.forEach((row) => {
        const ticker = row[1]?.trim().toUpperCase() || '';
        const shares = parseFloat(row[2]) || 0;
        
        if (holdingsMap.has(ticker)) {
          const existing = holdingsMap.get(ticker);
          existing.shares += shares;
        } else {
          const isCash = ticker === 'CASH' || ticker === 'USD';
          const isRealEstate = ticker === 'REAL ESTATE';
          const isCrypto = cryptoMap.has(ticker);
          const rowIndices = rowIndicesMap.get(ticker) || [];
          holdingsMap.set(ticker, {
            ticker,
            shares,
            price: priceMap[ticker] || 0,
            value: shares * (priceMap[ticker] || 0),
            rowIndex: rowIndices[0] || null, // Store first row index for updates
            isCash, // Flag to identify cash holdings
            isRealEstate, // Flag to identify real estate holdings
            isCrypto, // Flag to identify crypto holdings
          });
        }
      });
      
      setAllRowIndices(rowIndicesMap);
      
      const holdingsArray = Array.from(holdingsMap.values())
        .sort((a, b) => {
          // Sort by value (highest to lowest)
          return b.value - a.value;
        });
      
      // Store cryptoMap for use in refreshPrices
      setCryptoMap(cryptoMap);
      
      setHoldings(holdingsArray);
    } catch (error) {
      console.error('Error loading holdings:', error);
      if (!silent) {
        setError(error.message || 'Failed to load holdings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshLoading(true);
    try {
      const uniqueTickers = [...new Set(holdings.map(h => h.ticker))];
      const priceMap = {};
      
      // Reload crypto prices
      let currentCryptoMap = new Map();
      try {
        const cryptoData = await readSheetData('Crypto!A1:E1000', true);
        if (cryptoData && cryptoData.length > 1) {
          cryptoData.slice(1)
            .filter(row => row && row.length >= 3 && row[0] && row[2])
            .forEach(row => {
              const symbol = row[0]?.trim().toUpperCase();
              const price = parseFloat(row[2]) || 0;
              if (symbol && price > 0) {
                currentCryptoMap.set(symbol, price);
              }
            });
        }
      } catch (error) {
        console.error('Error loading crypto list for refresh:', error);
        currentCryptoMap = cryptoMap; // Use cached crypto map if refresh fails
      }
      
      for (const ticker of uniqueTickers) {
        // Handle cash - price is always $1.00
        if (ticker === 'CASH' || ticker === 'USD') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        // Handle real estate - price is always $1.00
        if (ticker === 'REAL ESTATE') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        // Handle crypto - get price from Crypto sheet
        if (currentCryptoMap.has(ticker)) {
          priceMap[ticker] = currentCryptoMap.get(ticker);
          continue;
        }
        
        // Try to fetch as stock
        try {
          const quote = await getStockQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
        }
      }
      
      setCryptoMap(currentCryptoMap);
      
      setHoldings(prev => prev.map(holding => ({
        ...holding,
        price: priceMap[holding.ticker] || holding.price,
        value: holding.shares * (priceMap[holding.ticker] || holding.price),
      })).sort((a, b) => {
        // Sort by value (highest to lowest)
        return b.value - a.value;
      }));
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleStartEdit = (ticker) => {
    const holding = holdings.find(h => h.ticker === ticker);
    if (holding) {
      setEditingTicker(ticker);
      // Show coin amount for crypto, shares for others
      setEditShares(holding.shares.toString());
    }
  };

  const handleCancelEdit = () => {
    setEditingTicker(null);
    setEditShares('');
  };

  const handleDelete = async (ticker) => {
    if (!window.confirm(`Are you sure you want to delete ${ticker === 'CASH' || ticker === 'USD' ? 'cash holdings' : ticker === 'REAL ESTATE' ? 'real estate holdings' : ticker}? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(ticker);
    setError(null);
    
    try {
      const rowIndices = allRowIndices.get(ticker) || [];
      
      if (rowIndices.length === 0) {
        throw new Error('No rows found to delete');
      }
      
      // Delete rows in reverse order to maintain correct indices
      const sortedIndices = [...rowIndices].sort((a, b) => b - a);
      
      for (const rowIndex of sortedIndices) {
        await deleteRow(rowIndex);
      }
      
      // Reload holdings after deletion
      if (onUpdate) {
        onUpdate();
      }
      await loadHoldings(true, false); // Force refresh after deletion, not silent
      
    } catch (error) {
      console.error('Error deleting holding:', error);
      setError(error.message || 'Failed to delete holding. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSaveEdit = async () => {
    if (editingTicker === null) return;
    
    const inputValue = parseFloat(editShares);
    if (isNaN(inputValue) || inputValue <= 0) {
      setError('Please enter a valid amount greater than 0. To remove a holding, use the Delete button.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Find the holding and its row index
      const holding = holdings.find(h => h.ticker === editingTicker);
      if (!holding || !holding.rowIndex) {
        throw new Error('Holding not found or invalid row index');
      }
      
      const rowIndex = holding.rowIndex;
      
      if (rowIndex < 2) {
        throw new Error('Invalid row index (must be >= 2 to account for header)');
      }
      
      // Use input directly as shares (coin amount for crypto, shares for stocks)
      const sharesNum = inputValue;
      
      // Calculate the change amount (new shares - old shares)
      const oldShares = holding.shares || 0;
      const changeAmount = sharesNum - oldShares;
      
      // Update the row - keep username and ticker, update shares, add change amount
      const rowData = [
        selectedUser.trim(),
        editingTicker,
        sharesNum.toFixed(8).replace(/\.?0+$/, ''), // Store shares/coin amount with up to 8 decimal places, remove trailing zeros
        formatHoldingsHistoryDate(),
        changeAmount.toFixed(8).replace(/\.?0+$/, ''), // LastPositionChange column
      ];
      
      await updateRow(rowIndex, rowData);
      
      // Update local state
      setHoldings(prev => prev.map(h => 
        h.ticker === editingTicker 
          ? { ...h, shares: sharesNum, value: sharesNum * h.price }
          : h
      ));
      
      setEditingTicker(null);
      setEditShares('');
      
      // Reload to ensure we have correct row indices if there were multiple rows
      if (onUpdate) {
        onUpdate();
      }
      await loadHoldings(true, false); // Force refresh after save, not silent
      
    } catch (error) {
      console.error('Error saving edit:', error);
      setError(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedUser) {
    return null;
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary-500" />
        </motion.div>
        <p className="text-slate-400">Loading holdings...</p>
      </motion.div>
    );
  }

  if (error && !isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 border-red-500/50"
      >
        <p className="text-red-400 mb-4">{error}</p>
        <motion.button
          onClick={loadHoldings}
          className="btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 sm:p-6"
      >
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            {selectedUser}'s Holdings
          </h3>
          <p className="text-slate-400 text-sm sm:text-base">View and edit your stock portfolio</p>
        </div>
        
        <div className="text-center mb-4 sm:mb-6">
          <p className="text-slate-400 mb-2 text-sm sm:text-base">Total Portfolio Value</p>
          <motion.p
            key={totalValue}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
          >
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.p>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {holdings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg mb-2">No holdings found</p>
          <p className="text-slate-500 text-sm">Search for stocks above to add them to your portfolio</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {holdings.map((holding, index) => (
            <motion.div
              key={holding.ticker}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="card p-4 sm:p-6"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  {holding.isCash && (
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  )}
                  {holding.isRealEstate && (
                    <Home className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#CC7722' }} />
                  )}
                  {holding.isCrypto && (
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  )}
                  {!(holding.isCash || holding.isRealEstate || holding.isCrypto) && (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  )}
                  <h4 className={`text-lg sm:text-xl font-bold mb-0 ${holding.isCash ? 'text-green-500' : holding.isRealEstate ? 'text-amber-600' : holding.isCrypto ? 'text-yellow-500' : 'text-blue-500'}`} style={holding.isRealEstate ? { color: '#CC7722' } : {}}>
                    {holding.isCash ? 'CASH' : holding.isRealEstate ? 'REAL ESTATE' : holding.ticker}
                  </h4>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3">
                  {holding.isCash 
                    ? 'Cash Holdings'
                    : holding.isRealEstate
                    ? 'Real Estate Holdings'
                    : holding.isCrypto
                    ? `$${holding.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit`
                    : `$${holding.price.toFixed(2)} per share`}
                </p>
                
                {editingTicker === holding.ticker ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-slate-400">
                        {holding.isCash ? 'Cash Amount ($)' : holding.isRealEstate ? 'Real Estate Value ($)' : holding.isCrypto ? `Coin Amount (${holding.ticker})` : 'Number of Shares'}
                      </label>
                      <input
                        type="number"
                        value={editShares}
                        onChange={(e) => {
                          setEditShares(e.target.value);
                          setError(null);
                        }}
                        placeholder={holding.isCash ? "0.00" : holding.isCrypto ? "0.00000000" : "0.00"}
                        className="input-field w-full sm:w-32"
                        min="0.00000001"
                        step={holding.isCrypto ? "0.00000001" : "0.01"}
                        autoFocus
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2 text-sm px-4 py-2 sm:px-6 sm:py-3 flex-1 sm:flex-initial"
                        whileHover={{ scale: isSaving ? 1 : 1.05 }}
                        whileTap={{ scale: isSaving ? 1 : 0.95 }}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            <span className="hidden sm:inline">Saving...</span>
                            <span className="sm:hidden">Save</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                            Save
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 sm:px-6 sm:py-3"
                        whileHover={{ scale: isSaving ? 1 : 1.05 }}
                        whileTap={{ scale: isSaving ? 1 : 0.95 }}
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-3 sm:mt-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      {holding.isCrypto && (
                        <div>
                          <p className="text-xs sm:text-sm text-slate-400 mb-1">Coin Amount</p>
                          <p className="text-base sm:text-lg font-semibold text-white">
                            {holding.shares.toFixed(8).replace(/\.?0+$/, '')} {holding.ticker}
                          </p>
                        </div>
                      )}
                      {!(holding.isRealEstate || holding.isCash || holding.isCrypto) && (
                        <div>
                          <p className="text-xs sm:text-sm text-slate-400 mb-1">Shares</p>
                          <p className="text-base sm:text-lg font-semibold text-white">
                            {holding.shares.toFixed(2)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs sm:text-sm text-slate-400 mb-1">Total Value</p>
                        <p className="text-base sm:text-lg font-semibold text-white">
                          ${holding.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    {editingTicker !== holding.ticker && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => handleStartEdit(holding.ticker)}
                          className="btn-secondary flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(holding.ticker)}
                          disabled={isDeleting === holding.ticker}
                          className="btn-secondary flex items-center gap-1 sm:gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/50 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2"
                          whileHover={{ scale: isDeleting === holding.ticker ? 1 : 1.05 }}
                          whileTap={{ scale: isDeleting === holding.ticker ? 1 : 0.95 }}
                        >
                          {isDeleting === holding.ticker ? (
                            <>
                              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              <span className="hidden sm:inline">Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Delete</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserHoldings;

