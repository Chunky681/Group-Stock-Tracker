import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { searchTickers, getStockQuote } from '../utils/stockApi';

const StockSearch = ({ onStockSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      console.log('Performing search for:', searchQuery);
      const results = await searchTickers(searchQuery);
      console.log('Search returned results:', results);
      setSearchResults(results);
      if (results.length === 0 && searchQuery.trim().length >= 2) {
        // Check if it's a rate limit issue
        console.warn('No search results - may be rate limited');
        setError('Search rate limit reached or no results found. You can still enter a ticker symbol manually (e.g., TSLA) and press Enter.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Search failed. You can still enter a ticker symbol manually.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch();
    }, 400);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, performSearch]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timeoutId = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [successMessage]);

  const handleStockSelect = async (stock) => {
    setSelectedStock(stock);
    setIsLoadingQuote(true);
    setError(null);
    setSuccessMessage(null);
    setSearchResults([]);
    
    try {
      const quote = await getStockQuote(stock.symbol);
      setStockData(quote);
      setSuccessMessage(`Successfully loaded ${quote.symbol}`);
      onStockSelected(quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setError(`Failed to fetch stock data: ${error.message}`);
      setSelectedStock(null);
      setStockData(null);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleManualEntry = async () => {
    if (searchQuery.trim().length >= 1) {
      setIsLoadingQuote(true);
      setError(null);
      setSuccessMessage(null);
      setSearchResults([]);
      
      try {
        const quote = await getStockQuote(searchQuery.trim());
        setStockData(quote);
        setSelectedStock({ symbol: quote.symbol, name: quote.name });
        setSuccessMessage(`Successfully loaded ${quote.symbol}`);
        onStockSelected(quote);
      } catch (error) {
        setError(`Failed to fetch stock data: ${error.message}`);
        setSelectedStock(null);
        setStockData(null);
      } finally {
        setIsLoadingQuote(false);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setError(null);
              setSuccessMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoadingQuote) {
                if (searchResults.length > 0 && searchResults[0]) {
                  handleStockSelect(searchResults[0]);
                } else if (searchQuery.trim().length >= 1) {
                  handleManualEntry();
                }
              }
            }}
            placeholder="Search for a stock ticker (e.g., AAPL, MSFT, GOOGL)..."
            className="input-field pl-12 pr-12"
            disabled={isLoadingQuote}
          />
          {(isSearching || isLoadingQuote) && (
            <Loader className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin ${isSearching ? 'text-primary-500' : 'text-primary-400'}`} />
          )}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && !isLoadingQuote && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-slate-700 max-h-64 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  whileHover={{ x: 4, backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
                  onClick={() => handleStockSelect(result)}
                  className="px-4 py-3 hover:bg-slate-700/80 cursor-pointer transition-all duration-200 border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{result.symbol}</div>
                      <div className="text-sm text-slate-400 truncate">{result.name}</div>
                    </div>
                    <div className="text-xs text-slate-500 ml-2">{result.exchange}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {selectedStock && stockData && (
          <motion.div
            key={`stock-${stockData.symbol}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-6 card p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between mb-4"
            >
              <div>
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white"
                >
                  {stockData.symbol}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-slate-400"
                >
                  {stockData.name}
                </motion.p>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <TrendingUp className="w-8 h-8 text-primary-500" />
              </motion.div>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <p className="text-sm text-slate-400 mb-1">Current Price</p>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="text-3xl font-bold text-white"
                >
                  ${stockData.price.toFixed(2)}
                </motion.p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-slate-400 mb-1">Change</p>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
                  className={`text-2xl font-bold ${
                    stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stockData.change >= 0 ? '+' : ''}
                  {stockData.change.toFixed(2)} (
                  <span className="text-lg">
                    {stockData.changePercent >= 0 ? '+' : ''}
                    {stockData.changePercent.toFixed(2)}%
                  </span>
                  )
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StockSearch;
