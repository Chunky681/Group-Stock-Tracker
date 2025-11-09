import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coins, Loader, AlertCircle } from 'lucide-react';
import { readSheetData, initializeSheet } from '../utils/googleSheets';

const CryptoSearch = ({ onCryptoSelected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoData, setCryptoData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [cryptoList, setCryptoList] = useState([]);

  // Load crypto list from Crypto sheet
  useEffect(() => {
    const loadCryptoList = async () => {
      try {
        await initializeSheet();
        const data = await readSheetData('Crypto!A1:E1000', false);
        
        if (data && data.length > 1) {
          // Skip header row, map to objects with Symbol, Name, Price_USD
          const cryptos = data.slice(1)
            .filter(row => row && row.length >= 3 && row[0] && row[1])
            .map(row => ({
              symbol: row[0]?.trim().toUpperCase() || '',
              name: row[1]?.trim() || '',
              priceUSD: parseFloat(row[2]) || 0,
            }))
            .filter(crypto => crypto.symbol && crypto.name);
          
          setCryptoList(cryptos);
        }
      } catch (error) {
        console.error('Error loading crypto list:', error);
        setError('Failed to load crypto list. Please try again.');
      }
    };

    loadCryptoList();
  }, []);

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const query = searchQuery.trim().toUpperCase();
      
      // Search by Symbol or Name
      const results = cryptoList.filter(crypto => {
        const symbolMatch = crypto.symbol.toUpperCase().includes(query);
        const nameMatch = crypto.name.toUpperCase().includes(query);
        return symbolMatch || nameMatch;
      });

      // Sort results: exact symbol matches first, then name matches
      const sortedResults = results.sort((a, b) => {
        const aSymbolExact = a.symbol.toUpperCase() === query;
        const bSymbolExact = b.symbol.toUpperCase() === query;
        if (aSymbolExact && !bSymbolExact) return -1;
        if (!aSymbolExact && bSymbolExact) return 1;
        
        const aNameExact = a.name.toUpperCase() === query.toUpperCase();
        const bNameExact = b.name.toUpperCase() === query.toUpperCase();
        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;
        
        return a.symbol.localeCompare(b.symbol);
      });

      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || 'Search failed.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, cryptoList]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, performSearch]);

  const handleCryptoSelect = (crypto) => {
    setSelectedCrypto(crypto);
    setIsLoadingData(true);
    setError(null);
    setSearchResults([]);
    
    // Create crypto data object similar to stock data
    const cryptoDataObj = {
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.priceUSD,
      // Crypto doesn't have daily change
      change: 0,
      changePercent: 0,
    };
    
    setCryptoData(cryptoDataObj);
    setIsLoadingData(false);
    onCryptoSelected(cryptoDataObj);
  };

  const handleManualEntry = () => {
    if (searchQuery.trim().length >= 1) {
      const query = searchQuery.trim().toUpperCase();
      
      // Try to find exact match
      const exactMatch = cryptoList.find(crypto => 
        crypto.symbol.toUpperCase() === query ||
        crypto.name.toUpperCase() === query.toUpperCase()
      );

      if (exactMatch) {
        handleCryptoSelect(exactMatch);
      } else {
        setError(`Crypto "${searchQuery.trim()}" is not supported. Please search for a supported cryptocurrency.`);
        setSelectedCrypto(null);
        setCryptoData(null);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoadingData) {
                if (searchResults.length > 0 && searchResults[0]) {
                  handleCryptoSelect(searchResults[0]);
                } else if (searchQuery.trim().length >= 1) {
                  handleManualEntry();
                }
              }
            }}
            placeholder="Search for crypto by symbol or name (e.g., BTC, Bitcoin, ETH)..."
            className={`input-field pl-12 ${isSearching || isLoadingData ? 'pr-12' : 'pr-12'}`}
            disabled={isLoadingData}
          />
          {(isSearching || isLoadingData) && (
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

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && !isLoadingData && (
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
                  onClick={() => handleCryptoSelect(result)}
                  className="px-4 py-3 hover:bg-slate-700/80 cursor-pointer transition-all duration-200 border-b border-slate-700/50 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{result.symbol}</div>
                      <div className="text-sm text-slate-400 truncate">{result.name}</div>
                    </div>
                    <div className="text-xs text-slate-500 ml-2">
                      ${result.priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {selectedCrypto && cryptoData && (
          <motion.div
            key={`crypto-${cryptoData.symbol}`}
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
                  {cryptoData.symbol}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-slate-400"
                >
                  {cryptoData.name}
                </motion.p>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                <Coins className="w-8 h-8 text-yellow-500" />
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <p className="text-sm text-slate-400 mb-1">Price (USD)</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="text-3xl font-bold text-white"
              >
                ${cryptoData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CryptoSearch;

