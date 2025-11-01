import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { readSheetData, appendRow, updateRow, initializeSheet } from '../utils/googleSheets';
import { getStockQuote } from '../utils/stockApi';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', shares: '' });

  useEffect(() => {
    loadPortfolio();
    initializeSheet();
  }, []);

  const loadPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initializeSheet();
      const data = await readSheetData();
      
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
      
      const uniqueTickers = [...new Set(rows.map(row => row[1]?.trim().toUpperCase()))];
      const priceMap = {};
      
      for (const ticker of uniqueTickers) {
        try {
          const quote = await getStockQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          priceMap[ticker] = 0;
        }
      }
      
      const portfolioData = rows.map((row, index) => {
        const ticker = row[1]?.trim().toUpperCase() || '';
        const shares = parseFloat(row[2]) || 0;
        const price = priceMap[ticker] || 0;
        
        return {
          id: index + 1,
          username: row[0]?.trim() || '',
          ticker: ticker,
          shares: shares,
          price: price,
          value: shares * price,
          lastUpdated: row[3] || new Date().toISOString(),
        };
      });
      
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError(error.message || 'Failed to load portfolio. Please check your Google Sheets configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshLoading(true);
    try {
      const uniqueTickers = [...new Set(portfolio.map(item => item.ticker))];
      const priceMap = {};
      
      for (const ticker of uniqueTickers) {
        try {
          const quote = await getStockQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
        }
      }
      
      setPortfolio(prev => prev.map(item => ({
        ...item,
        price: priceMap[item.ticker] || item.price,
        value: item.shares * (priceMap[item.ticker] || item.price),
      })));
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleEdit = (index) => {
    const item = portfolio[index];
    setEditingIndex(index);
    setEditForm({
      username: item.username,
      shares: item.shares.toString(),
    });
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;
    
    const item = portfolio[editingIndex];
    const username = editForm.username.trim();
    const shares = parseFloat(editForm.shares);
    
    if (!username || isNaN(shares) || shares < 0) {
      alert('Please enter a valid username and number of shares');
      return;
    }
    
    try {
      const rowData = [
        username,
        item.ticker,
        shares.toString(),
        new Date().toISOString(),
      ];
      
      await updateRow(editingIndex + 2, rowData);
      
      setPortfolio(prev => prev.map((p, i) => 
        i === editingIndex 
          ? { ...p, username, shares, value: shares * p.price }
          : p
      ));
      
      setEditingIndex(null);
      setEditForm({ username: '', shares: '' });
    } catch (error) {
      console.error('Error updating row:', error);
      alert('Failed to update portfolio. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ username: '', shares: '' });
  };

  const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);
  const groupedByTicker = portfolio.reduce((acc, item) => {
    if (!acc[item.ticker]) {
      acc[item.ticker] = [];
    }
    acc[item.ticker].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
        <p className="text-slate-400">Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 border-red-500/50">
        <p className="text-red-400 mb-4">{error}</p>
        <p className="text-sm text-slate-400 mb-4">
          Make sure you've configured your Google Sheets API key and Sheet ID in your environment variables.
        </p>
        <button onClick={loadPortfolio} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h2>
            <p className="text-slate-400">Total portfolio value across all users</p>
          </div>
          <button
            onClick={refreshPrices}
            disabled={refreshLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
            Refresh Prices
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-slate-400 mb-2">Total Portfolio Value</p>
          <p className="text-5xl font-bold text-white mb-4">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByTicker).map(([ticker, items]) => {
          const tickerTotalShares = items.reduce((sum, item) => sum + item.shares, 0);
          const tickerTotalValue = items.reduce((sum, item) => sum + item.value, 0);
          const avgPrice = items[0]?.price || 0;
          
          return (
            <motion.div
              key={ticker}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{ticker}</h3>
                  <p className="text-slate-400 text-sm">
                    ${avgPrice.toFixed(2)} per share
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    ${tickerTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-400">
                    {tickerTotalShares.toFixed(2)} shares
                  </p>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4 space-y-3">
                {items.map((item, index) => {
                  const globalIndex = portfolio.findIndex(p => p.id === item.id);
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      {editingIndex === globalIndex ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            placeholder="Username"
                            className="input-field flex-1 py-2 text-sm"
                          />
                          <input
                            type="number"
                            value={editForm.shares}
                            onChange={(e) => setEditForm({ ...editForm, shares: e.target.value })}
                            placeholder="Shares"
                            className="input-field w-24 py-2 text-sm"
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="btn-primary py-2 px-3 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-secondary py-2 px-3 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-semibold text-white">{item.username}</p>
                            <p className="text-sm text-slate-400">
                              {item.shares.toFixed(2)} shares
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold text-white">
                                ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleEdit(globalIndex)}
                              className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {portfolio.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-slate-400">No portfolio entries yet. Add stocks above to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;