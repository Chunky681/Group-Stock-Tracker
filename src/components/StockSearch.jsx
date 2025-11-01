import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, Loader } from 'lucide-react';
import { searchTickers, getStockQuote } from '../utils/stockApi';

const StockSearch = ({ onStockSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const results = await searchTickers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStockSelect = async (stock) => {
    setSelectedStock(stock);
    setIsLoadingQuote(true);
    try {
      const quote = await getStockQuote(stock.symbol);
      setStockData(quote);
      onStockSelected(quote);
    } catch (error) {
      console.error('Error fetching quote:', error);
      alert(`Failed to fetch stock data: ${error.message}`);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleManualEntry = async () => {
    if (searchQuery.trim().length >= 1) {
      setIsLoadingQuote(true);
      try {
        const quote = await getStockQuote(searchQuery.trim());
        setStockData(quote);
        setSelectedStock({ symbol: quote.symbol, name: quote.name });
        onStockSelected(quote);
      } catch (error) {
        alert(`Failed to fetch stock data: ${error.message}`);
      } finally {
        setIsLoadingQuote(false);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length === 0 && searchQuery.trim()) {
                handleManualEntry();
              }
            }}
            placeholder="Search for a stock ticker (e.g., AAPL, MSFT, GOOGL)..."
            className="input-field pl-12 pr-4"
          />
          {isSearching && (
            <Loader className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5 animate-spin" />
          )}
        </div>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 max-h-64 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStockSelect(result)}
                  className="px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{result.symbol}</div>
                      <div className="text-sm text-slate-400">{result.name}</div>
                    </div>
                    <div className="text-xs text-slate-500">{result.exchange}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedStock && stockData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white">{stockData.symbol}</h3>
              <p className="text-slate-400">{stockData.name}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Current Price</p>
              <p className="text-3xl font-bold text-white">
                ${stockData.price.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Change</p>
              <p
                className={`text-2xl font-bold ${
                  stockData.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stockData.change >= 0 ? '+' : ''}
                {stockData.change.toFixed(2)} ({stockData.changePercent >= 0 ? '+' : ''}
                {stockData.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StockSearch;