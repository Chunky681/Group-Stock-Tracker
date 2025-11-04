import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, PieChart, Users, TrendingUp, Check, Trophy, TrendingDown, DollarSign } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';
import { readSheetData, initializeSheet, updateHoldingsHistoryChat } from '../utils/googleSheets';
import { getStockQuote } from '../utils/stockApi';

const COLORS = [
  '#0ea5e9', // primary-500
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#06b6d4', // cyan
];

const Analytics = ({ refreshKey }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [historyData, setHistoryData] = useState([]);
  const [holdingsHistory, setHoldingsHistory] = useState([]);
  const [timePeriod, setTimePeriod] = useState('ALL'); // '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'
  const [postingUser, setPostingUser] = useState('');

  useEffect(() => {
    loadPortfolio();
    loadHistoryData();
    loadHoldingsHistory();
  }, [refreshKey]);

  // Load holdings history from HoldingsHistory sheet (including chat data from column E)
  const loadHoldingsHistory = async () => {
    try {
      const data = await readSheetData('HoldingsHistory!A1:E10000');
      
      if (!data || data.length === 0) {
        setHoldingsHistory([]);
        return;
      }
      
      // Skip header row (row 0)
      const rows = data.slice(1).filter(row => row && row.length >= 4 && row[0] && row[1] && row[2] && row[3]);
      
      const history = rows.map(row => {
        const snapshotTime = row[0]?.trim() || '';
        const username = row[1]?.trim() || '';
        const ticker = row[2]?.trim().toUpperCase() || '';
        const shares = parseFloat(row[3]) || 0;
        const chats = row[4]?.trim() || ''; // Column E: ChatsOnDay
        
        // Parse date
        let date;
        try {
          if (snapshotTime.includes('T')) {
            date = new Date(snapshotTime);
          } else {
            date = new Date(snapshotTime);
          }
          
          if (isNaN(date.getTime())) {
            return null;
          }
        } catch (e) {
          return null;
        }
        
        if (!username || !ticker || shares < 0) {
          return null;
        }
        
        return {
          date,
          username,
          ticker,
          shares,
          chats,
        };
      }).filter(Boolean);
      
      setHoldingsHistory(history);
    } catch (error) {
      console.error('Error loading holdings history:', error);
      setHoldingsHistory([]);
    }
  };

  // Load history data from History sheet
  const loadHistoryData = async () => {
    try {
      const data = await readSheetData('History!A1:D10000');
      
      if (!data || data.length === 0) {
        setHistoryData([]);
        return;
      }
      
      // Skip header row (row 0)
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1] && row[2]);
      
      const history = rows.map(row => {
        const dateStr = row[0]?.trim() || '';
        const username = row[1]?.trim() || '';
        const totalValue = parseFloat(row[2]) || 0;
        const captureType = row[3]?.trim()?.toUpperCase() || ''; // Column D: CaptureType
        
        // Parse date (handle MM/DD/YYYY format and ISO timestamp format from Google Sheets)
        let date;
        try {
          // First try ISO timestamp format (YYYY-MM-DDTHH:MM:SS)
          if (dateStr.includes('T')) {
            date = new Date(dateStr);
          } else {
            // Try MM/DD/YYYY format (common in Google Sheets)
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const month = parseInt(parts[0]) - 1; // Month is 0-indexed
              const day = parseInt(parts[1]);
              const year = parseInt(parts[2]);
              date = new Date(year, month, day);
            } else {
              // Fallback to standard Date parsing
              date = new Date(dateStr);
            }
          }
          
          // Validate date
          if (isNaN(date.getTime())) {
            console.error('Invalid date format:', dateStr);
            return null;
          }
        } catch (e) {
          console.error('Error parsing date:', dateStr, e);
          return null;
        }
        
        // Store both the original date (with time) and normalized date (for grouping)
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (!username || isNaN(date.getTime()) || totalValue <= 0) {
          return null;
        }
        
        // Create date string in YYYY-MM-DD format for grouping
        const dateKey = `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')}`;
        
        return {
          date: date, // Original date with time information preserved
          dateNormalized: normalizedDate, // Normalized to midnight for grouping
          dateStr: dateKey, // YYYY-MM-DD format for grouping
          username,
          totalValue,
          captureType,
        };
      }).filter(Boolean);
      
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history data:', error);
      setHistoryData([]);
    }
  };

  const loadPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initializeSheet();
      const data = await readSheetData();
      
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
      
      // Get unique users and set them all as selected by default
      const uniqueUsers = [...new Set(rows.map(row => row[0]?.trim()).filter(Boolean))];
      if (selectedUsers.size === 0) {
        setSelectedUsers(new Set(uniqueUsers));
      }
      
      const uniqueTickers = [...new Set(rows.map(row => row[1]?.trim().toUpperCase()))];
      const quoteMap = {}; // Store full quote data with all metrics from Sheet2
      
      for (const ticker of uniqueTickers) {
        // Handle CASH entries - they don't need stock data lookup
        if (ticker === 'CASH' || ticker === 'USD') {
          quoteMap[ticker] = {
            price: 1.0, // Cash is always $1.00 per "share" (dollar)
            dividendYield: 0,
            changeDollar: 0,
            changePercent: 0,
            name: 'Cash',
            symbol: 'CASH',
            visualSymbol: 'CASH',
          };
          continue;
        }
        
        try {
          const quote = await getStockQuote(ticker);
          quoteMap[ticker] = quote; // Store full quote object with all Sheet2 data
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          quoteMap[ticker] = {
            price: 0,
            dividendYield: 0,
            changeDollar: 0,
            changePercent: 0,
          };
        }
      }
      
      const portfolioData = rows.map((row, index) => {
        const ticker = row[1]?.trim().toUpperCase() || '';
        const shares = parseFloat(row[2]) || 0;
        const quote = quoteMap[ticker] || { price: 0, dividendYield: 0 };
        const price = quote.price || 0;
        const dividendYield = quote.dividendYield || 0;
        
        // For cash, the "shares" is actually the dollar amount, and price is $1.00
        const isCash = ticker === 'CASH' || ticker === 'USD';
        
        return {
          id: index + 1,
          username: row[0]?.trim() || '',
          ticker,
          shares,
          price,
          dividendYield,
          value: shares * price, // For cash: amount * 1.0 = amount
          yearlyDividend: shares * price * (dividendYield / 100),
          isCash, // Flag to identify cash holdings
          // Store full quote data for detailed display
          fullQuote: quote,
        };
      });
      
      setPortfolio(portfolioData);
      
      // Ensure all users are selected if selection is empty
      if (selectedUsers.size === 0 && uniqueUsers.length > 0) {
        setSelectedUsers(new Set(uniqueUsers));
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError(error.message || 'Failed to load portfolio.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter portfolio for selected users
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter(item => selectedUsers.has(item.username));
  }, [portfolio, selectedUsers]);

  // Get all unique users from both portfolio and holdings history
  const allUsers = useMemo(() => {
    const portfolioUsers = portfolio.map(item => item.username).filter(Boolean);
    const historyUsers = holdingsHistory.map(item => item.username).filter(Boolean);
    const allUniqueUsers = [...new Set([...portfolioUsers, ...historyUsers])];
    return allUniqueUsers.sort();
  }, [portfolio, holdingsHistory]);

  // Toggle user selection
  const toggleUser = (username) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(username)) {
      newSelection.delete(username);
    } else {
      newSelection.add(username);
    }
    setSelectedUsers(newSelection);
  };

  // Select all users
  const selectAll = () => {
    setSelectedUsers(new Set(allUsers));
  };

  // Deselect all users
  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  // Calculate total value for selected users
  const totalValue = useMemo(() => {
    return filteredPortfolio.reduce((sum, item) => sum + item.value, 0);
  }, [filteredPortfolio]);

  // Calculate total yearly dividend for selected users
  const totalYearlyDividend = useMemo(() => {
    return filteredPortfolio.reduce((sum, item) => sum + (item.yearlyDividend || 0), 0);
  }, [filteredPortfolio]);

  // Group by ticker and calculate total value per stock (including cash)
  const stockTotals = useMemo(() => {
    const grouped = {};
    filteredPortfolio.forEach(item => {
      if (!grouped[item.ticker]) {
        grouped[item.ticker] = {
          ticker: item.ticker,
          totalValue: 0,
          totalShares: 0,
          price: item.price,
          dividendYield: item.dividendYield || 0,
          totalYearlyDividend: 0,
          isCash: item.isCash || false,
          fullQuote: item.fullQuote || {}, // Store full quote data for detailed metrics
        };
      }
      grouped[item.ticker].totalValue += item.value;
      grouped[item.ticker].totalShares += item.shares;
      grouped[item.ticker].totalYearlyDividend += item.yearlyDividend || 0;
    });
    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredPortfolio]);

  // Data for total value pie chart (by user)
  const totalValueByUser = useMemo(() => {
    const userTotals = {};
    filteredPortfolio.forEach(item => {
      if (!userTotals[item.username]) {
        userTotals[item.username] = 0;
      }
      userTotals[item.username] += item.value;
    });
    
    return Object.entries(userTotals)
      .map(([username, value]) => ({
        name: username,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPortfolio]);

  // Data for stock distribution pie chart (by stock across all selected users, including cash)
  const totalValueByStock = useMemo(() => {
    const stockTotals = {};
    filteredPortfolio.forEach(item => {
      if (!stockTotals[item.ticker]) {
        stockTotals[item.ticker] = 0;
      }
      stockTotals[item.ticker] += item.value;
    });
    
    return Object.entries(stockTotals)
      .map(([ticker, value]) => ({
        name: ticker === 'CASH' || ticker === 'USD' ? 'CASH' : ticker,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPortfolio]);

  // Data for pie chart by stock (for each stock, show user distribution)
  const getStockDistribution = (ticker) => {
    const stockItems = filteredPortfolio.filter(item => item.ticker === ticker);
    const userTotals = {};
    
    stockItems.forEach(item => {
      if (!userTotals[item.username]) {
        userTotals[item.username] = 0;
      }
      userTotals[item.username] += item.value;
    });
    
    return Object.entries(userTotals)
      .map(([username, value]) => ({
        name: username,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get all chat messages from all records for a username and ticker combination
  const getChatsForTicker = (ticker, username) => {
    if (!ticker || !username || holdingsHistory.length === 0) {
      return '';
    }
    
    // Collect all chat messages from all records matching this username and ticker
    const allChats = [];
    
    holdingsHistory
      .filter(item => item.ticker === ticker.toUpperCase() && item.username === username.trim())
      .forEach(item => {
        if (item.chats && item.chats.trim()) {
          // Split by newline to get individual chat messages
          const chatLines = item.chats.split('\n').filter(line => line.trim());
          allChats.push(...chatLines);
        }
      });
    
    // Remove duplicates (in case the same chat appears in multiple records)
    // and return as newline-separated string
    const uniqueChats = [...new Set(allChats)];
    return uniqueChats.join('\n');
  };

  // Calculate stock gains over the past 30 days for a specific ticker
  const getStockGains = (ticker) => {
    if (!ticker || holdingsHistory.length === 0 || selectedUsers.size === 0) {
      return [];
    }
    
    // Get current holdings for this ticker from portfolio (already filtered by selectedUsers)
    const currentHoldings = new Map();
    filteredPortfolio
      .filter(item => item.ticker === ticker)
      .forEach(item => {
        const currentShares = currentHoldings.get(item.username) || 0;
        currentHoldings.set(item.username, currentShares + item.shares);
      });
    
    // Get oldest holdings from HoldingsHistory - only for selected users
    const oldestHoldings = new Map();
    holdingsHistory
      .filter(item => item.ticker === ticker && selectedUsers.has(item.username))
      .forEach(item => {
        const existing = oldestHoldings.get(item.username);
        // Keep the oldest entry for each user
        if (!existing || item.date < existing.date) {
          oldestHoldings.set(item.username, {
            username: item.username,
            shares: item.shares,
            date: item.date,
          });
        }
      });
    
    // Calculate gains for each user (only selected users)
    const gains = [];
    
    // Calculate gains for users who have current holdings
    currentHoldings.forEach((currentShares, username) => {
      // Only process selected users
      if (!selectedUsers.has(username)) {
        return;
      }
      
      const oldest = oldestHoldings.get(username);
      const oldShares = oldest ? oldest.shares : 0;
      const gain = currentShares - oldShares;
      
      // Only include users who have a non-zero change
      if (gain !== 0) {
        gains.push({
          username,
          gain,
          currentShares,
          oldShares,
        });
      }
    });
    
    // Also include selected users who had holdings in the past but don't have any now (negative gain)
    oldestHoldings.forEach((old, username) => {
      // Only process selected users
      if (!selectedUsers.has(username)) {
        return;
      }
      
      if (!currentHoldings.has(username)) {
        const currentShares = 0;
        const gain = currentShares - old.shares;
        // Only include if gain is non-zero (negative gain means they sold all shares)
        if (gain !== 0) {
          gains.push({
            username,
            gain,
            currentShares,
            oldShares: old.shares,
          });
        }
      }
    });
    
    // Sort by gain (descending) - highest gains first
    return gains.sort((a, b) => b.gain - a.gain);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-primary-400">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    // Recharts passes an object with name, value, percent, etc.
    if (!entry || !entry.name) return '';
    
    const name = entry.name;
    const value = entry.value;
    // Recharts provides percent as a decimal (0.041 = 4.1%)
    const percent = entry.percent;
    
    // Use percent directly if available (Recharts calculates this automatically)
    // If percent is not available, calculate it from totalValue as fallback
    let percentValue = percent;
    if (percentValue === undefined || percentValue === null || isNaN(percentValue)) {
      if (totalValue > 0 && value) {
        percentValue = value / totalValue;
      } else {
        percentValue = 0;
      }
    }
    
    // Hide label if percentage is less than 4% (0.04)
    if (percentValue < 0.04) {
      return '';
    }
    return `${name}: ${(percentValue * 100).toFixed(1)}%`;
  };

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
          <BarChart3 className="w-8 h-8 mx-auto mb-4 text-primary-500" />
        </motion.div>
        <p className="text-slate-400">Loading analytics...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 border-red-500/50"
      >
        <p className="text-red-400">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <BarChart3 className="w-8 h-8 text-primary-500" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics</h2>
          <p className="text-slate-400">Portfolio insights for selected users</p>
        </div>
      </motion.div>

      {/* User Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            <h3 className="text-xl font-bold text-white">Select Users</h3>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={selectAll}
              className="btn-secondary text-sm py-2 px-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Select All
            </motion.button>
            <motion.button
              onClick={deselectAll}
              className="btn-secondary text-sm py-2 px-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Deselect All
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allUsers.map((username, index) => (
            <motion.button
              key={username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleUser(username)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedUsers.has(username)
                  ? 'bg-primary-500/20 border-primary-500/50'
                  : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
              }`} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedUsers.has(username)
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-slate-500'
                }`}>
                  {selectedUsers.has(username) && (
                  <Check className="w-3 h-3 text-white" />
                )}
                </div>
                <span className={`font-medium ${
                  selectedUsers.has(username) ? 'text-white' : 'text-slate-400'
                }`}>
                  {username}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Total Value and Dividends */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="text-center">
            <p className="text-slate-400 mb-2">Total Portfolio Value</p>
            <motion.p
              key={totalValue}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-5xl font-bold text-white mb-4"
            >
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.p>
            <p className="text-sm text-slate-500">
              Across {selectedUsers.size} {selectedUsers.size === 1 ? 'user' : 'users'}
            </p>
          </div>
        </motion.div>

        {totalYearlyDividend > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card p-6"
          >
            <div className="text-center">
              <p className="text-slate-400 mb-2">Estimated Yearly Dividend</p>
              <motion.p
                key={totalYearlyDividend}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-5xl font-bold text-primary-400 mb-4"
              >
                ${totalYearlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.p>
              <p className="text-sm text-slate-500">
                Based on current dividend yields
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Portfolio Value Over Time Chart */}
      {selectedUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h3 className="text-xl font-bold text-white">Portfolio Value Over Time</h3>
            </div>
            
            {/* Time Period Toggles */}
            <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    timePeriod === period
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          
          <PortfolioValueChart 
            historyData={historyData}
            selectedUsers={selectedUsers}
            timePeriod={timePeriod}
            currentTotalValue={totalValue}
          />
        </motion.div>
      )}

      {/* Total Value Distribution Pie Charts */}
      {totalValueByUser.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary-500" />
            <h3 className="text-xl font-bold text-white">Total Value Distribution</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* User Distribution Pie Chart */}
            <div className="flex flex-col">
              <h4 className="text-lg font-semibold text-white mb-1 text-center">By User</h4>
              <div className="flex-shrink-0" style={{ height: '384px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <Pie
                      data={totalValueByUser}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={100}
                      innerRadius={0}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      stroke="none"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {totalValueByUser.map((entry, index) => (
                        <Cell key={`user-cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-grow pt-1">
                <div className="flex flex-wrap justify-center gap-4">
                  {totalValueByUser.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Distribution Pie Chart */}
            {totalValueByStock.length > 0 && (
              <div className="flex flex-col">
                <h4 className="text-lg font-semibold text-white mb-1 text-center">By Stock</h4>
                <div className="flex-shrink-0" style={{ height: '384px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                      <Pie
                        data={totalValueByStock}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={100}
                        innerRadius={0}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        stroke="none"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {totalValueByStock.map((entry, index) => {
                          // Always use green for Cash
                          const isCash = entry.name === 'CASH';
                          const fillColor = isCash ? '#22c55e' : COLORS[index % COLORS.length];
                          return (
                            <Cell key={`stock-cell-${index}`} fill={fillColor} stroke="none" />
                          );
                        })}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex flex-wrap justify-center gap-4">
                    {totalValueByStock.map((entry, index) => {
                      // Always use green for Cash
                      const isCash = entry.name === 'CASH';
                      const color = isCash ? '#22c55e' : COLORS[index % COLORS.length];
                      return (
                        <div key={`legend-${index}`} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className={`text-sm ${isCash ? 'text-green-400' : 'text-slate-300'}`}>{entry.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stock Totals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="text-xl font-bold text-white">Stock Holdings</h3>
        </div>
        
        <div className="space-y-6">
          {/* Separate CASH and Stocks */}
          {(() => {
            const cashHoldings = stockTotals.filter(s => s.isCash);
            const stockHoldings = stockTotals.filter(s => !s.isCash);
            const sortedHoldings = [...cashHoldings, ...stockHoldings];
            
            return sortedHoldings.map((stock, stockIndex) => {
              const distribution = getStockDistribution(stock.ticker);
              
              // Special rendering for CASH
              if (stock.isCash) {
                return (
                  <motion.div
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="border-b border-slate-700 pb-6"
                  >
                    <div className="space-y-6">
                      {/* CASH Header */}
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-3xl font-bold text-green-400 mb-1">CASH</h4>
                          <p className="text-slate-400 text-sm">Cash Holdings</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            ${stock.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <p className="text-sm text-slate-400">Total Cash Value</p>
                        </div>
                      </div>

                      {/* User Distribution and Position Changes for CASH */}
                      {distribution.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                          <div className="flex flex-col">
                            <h5 className="text-lg font-semibold text-white mb-1">
                              Distribution by User
                            </h5>
                            <div className="flex-shrink-0" style={{ height: '256px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                  <Pie
                                    data={distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) => {
                                      if (percent < 0.04) {
                                        return '';
                                      }
                                      return `${name}: ${(percent * 100).toFixed(1)}%`;
                                    }}
                                    outerRadius={80}
                                    innerRadius={0}
                                    startAngle={90}
                                    endAngle={-270}
                                    paddingAngle={0}
                                    stroke="none"
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {distribution.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-grow pt-1">
                              <div className="flex flex-wrap justify-center gap-4">
                                {distribution.map((entry, index) => (
                                  <div key={`legend-${index}`} className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-sm text-slate-300">{entry.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <Trophy className="w-5 h-5 text-yellow-500" />
                              Position Changes (Past 30 days)
                            </h5>
                            <StockGainsLeaderboard 
                              ticker={stock.ticker} 
                              gains={getStockGains(stock.ticker)} 
                              getChatsForUserAndTicker={getChatsForTicker}
                              allUsers={allUsers}
                              postingUser={postingUser}
                              setPostingUser={setPostingUser}
                              onChatSubmit={async (ticker, message, postingUser, positionUsername) => {
                                try {
                                  await updateHoldingsHistoryChat(ticker, message, postingUser, positionUsername);
                                  loadHoldingsHistory(); // Refresh to show new chat
                                } catch (error) {
                                  console.error('Error submitting chat:', error);
                                  alert(`Failed to submit chat: ${error.message}`);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              }
              
              // Regular stock rendering
              return (
                <motion.div
                  key={stock.ticker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + stockIndex * 0.1 }}
                  className="border-t border-slate-700 pt-6"
                >
                  <div className="space-y-6">
                    {/* Stock Header with Price and Change */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-3xl font-bold text-white mb-1">
                          {stock.fullQuote?.symbol || stock.ticker}
                        </h4>
                        {stock.fullQuote?.name && (
                          <p className="text-slate-400 text-sm">{stock.fullQuote.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          ${stock.price.toFixed(2)}
                        </div>
                        {stock.fullQuote?.changeDollar !== undefined && (
                          <div className={`text-lg font-semibold ${
                            (stock.fullQuote.changeDollar || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(stock.fullQuote.changeDollar || 0) >= 0 ? '+' : ''}
                            ${(stock.fullQuote.changeDollar || 0).toFixed(2)} (
                            {(stock.fullQuote.changePercent || 0) >= 0 ? '+' : ''}
                            {(stock.fullQuote.changePercent || 0).toFixed(2)}%)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Portfolio Holdings Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Total Value</p>
                        <p className="text-lg font-bold text-white">
                          ${stock.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Total Shares</p>
                        <p className="text-lg font-bold text-white">
                          {stock.totalShares.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Dividend Yield</p>
                        <p className={`text-lg font-bold ${stock.dividendYield > 0 ? 'text-white' : 'text-slate-500'}`}>
                          {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '0.00%'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Yearly Dividend</p>
                        <p className={`text-lg font-bold ${stock.totalYearlyDividend > 0 ? 'text-primary-400' : 'text-slate-500'}`}>
                          ${stock.totalYearlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Comprehensive Stock Metrics */}
                    {stock.fullQuote && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Price Range Chart */}
                      <div className="card p-4">
                        <h5 className="text-sm font-semibold text-white mb-4">Price Range</h5>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Day Low</span>
                              <span>Day High</span>
                            </div>
                            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                              {stock.fullQuote.dayLow && stock.fullQuote.dayHigh && stock.fullQuote.price && (
                                <>
                                  <div 
                                    className="absolute h-full bg-primary-500/30"
                                    style={{
                                      left: '0%',
                                      width: `${((stock.fullQuote.price - stock.fullQuote.dayLow) / (stock.fullQuote.dayHigh - stock.fullQuote.dayLow)) * 100}%`
                                    }}
                                  />
                                  <div 
                                    className="absolute top-0 h-full w-1 bg-primary-400"
                                    style={{
                                      left: `${((stock.fullQuote.price - stock.fullQuote.dayLow) / (stock.fullQuote.dayHigh - stock.fullQuote.dayLow)) * 100}%`
                                    }}
                                  />
                                </>
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-white mt-1">
                              <span>${(stock.fullQuote.dayLow || 0).toFixed(2)}</span>
                              <span className="text-primary-400 font-semibold">${stock.price.toFixed(2)}</span>
                              <span>${(stock.fullQuote.dayHigh || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-700">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>52w Low</span>
                              <span>52w High</span>
                            </div>
                            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                              {stock.fullQuote.week52Low && stock.fullQuote.week52High && stock.price && (
                                <>
                                  <div 
                                    className="absolute h-full bg-green-500/20"
                                    style={{
                                      left: '0%',
                                      width: `${((stock.price - stock.fullQuote.week52Low) / (stock.fullQuote.week52High - stock.fullQuote.week52Low)) * 100}%`
                                    }}
                                  />
                                  <div 
                                    className="absolute top-0 h-full w-1 bg-green-400"
                                    style={{
                                      left: `${((stock.price - stock.fullQuote.week52Low) / (stock.fullQuote.week52High - stock.fullQuote.week52Low)) * 100}%`
                                    }}
                                  />
                                </>
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-white mt-1">
                              <span>${(stock.fullQuote.week52Low || 0).toFixed(2)}</span>
                              <span className="text-green-400 font-semibold">${stock.price.toFixed(2)}</span>
                              <span>${(stock.fullQuote.week52High || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="card p-4">
                        <h5 className="text-sm font-semibold text-white mb-4">Key Metrics</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-slate-800/50 rounded">
                            <p className="text-xs text-slate-400 mb-1">Price Open</p>
                            <p className="text-sm font-bold text-white">${(stock.fullQuote.priceOpen || 0).toFixed(2)}</p>
                          </div>
                          {(stock.fullQuote.volume || 0) > 0 && (
                            <div className="p-2 bg-slate-800/50 rounded">
                              <p className="text-xs text-slate-400 mb-1">Volume</p>
                              <p className="text-sm font-bold text-white">
                                {stock.fullQuote.volume >= 1000000 
                                  ? `${(stock.fullQuote.volume / 1000000).toFixed(2)}M`
                                  : stock.fullQuote.volume >= 1000
                                  ? `${(stock.fullQuote.volume / 1000).toFixed(2)}K`
                                  : stock.fullQuote.volume.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {(stock.fullQuote.marketCap || 0) > 0 && (
                            <div className="p-2 bg-slate-800/50 rounded">
                              <p className="text-xs text-slate-400 mb-1">Market Cap</p>
                              <p className="text-sm font-bold text-white">
                                {stock.fullQuote.marketCap >= 1000000000
                                  ? `$${(stock.fullQuote.marketCap / 1000000000).toFixed(2)}B`
                                  : stock.fullQuote.marketCap >= 1000000
                                  ? `$${(stock.fullQuote.marketCap / 1000000).toFixed(2)}M`
                                  : `$${stock.fullQuote.marketCap.toLocaleString()}`}
                              </p>
                            </div>
                          )}
                          <div className="p-2 bg-slate-800/50 rounded">
                            <p className="text-xs text-slate-400 mb-1">Dividend Yield</p>
                            <p className={`text-sm font-bold ${stock.dividendYield > 0 ? 'text-white' : 'text-slate-500'}`}>
                              {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '0.00%'}
                            </p>
                          </div>
                          {stock.fullQuote.peRatio && (
                            <div className="p-2 bg-slate-800/50 rounded">
                              <p className="text-xs text-slate-400 mb-1">P/E Ratio</p>
                              <p className="text-sm font-bold text-white">{stock.fullQuote.peRatio.toFixed(2)}</p>
                            </div>
                          )}
                          {stock.fullQuote.beta && (
                            <div className="p-2 bg-slate-800/50 rounded">
                              <p className="text-xs text-slate-400 mb-1">Beta</p>
                              <p className="text-sm font-bold text-white">{stock.fullQuote.beta.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Distribution - Pie Chart and Bar Chart */}
                  {distribution.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 mt-6">
                      <div className="flex flex-col">
                        <h5 className="text-lg font-semibold text-white mb-1">
                          Distribution by User
                        </h5>
                        <div className="flex-shrink-0" style={{ height: '256px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                              <Pie
                                data={distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => {
                                  // Hide label if percentage is less than 4%
                                  if (percent < 0.04) {
                                    return '';
                                  }
                                  return `${name}: ${(percent * 100).toFixed(1)}%`;
                                }}
                                outerRadius={80}
                                innerRadius={0}
                                startAngle={90}
                                endAngle={-270}
                                paddingAngle={0}
                                stroke="none"
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {distribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-grow pt-1">
                          <div className="flex flex-wrap justify-center gap-4">
                            {distribution.map((entry, index) => (
                              <div key={`legend-${index}`} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm text-slate-300">{entry.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          Position Changes (Past 30 days)
                        </h5>
                        <StockGainsLeaderboard 
                          ticker={stock.ticker} 
                          gains={getStockGains(stock.ticker)} 
                          getChatsForUserAndTicker={getChatsForTicker}
                          allUsers={allUsers}
                          postingUser={postingUser}
                          setPostingUser={setPostingUser}
                          onChatSubmit={async (ticker, message, postingUser, positionUsername) => {
                            try {
                              await updateHoldingsHistoryChat(ticker, message, postingUser, positionUsername);
                              loadHoldingsHistory(); // Refresh to show new chat
                            } catch (error) {
                              console.error('Error submitting chat:', error);
                              alert(`Failed to submit chat: ${error.message}`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
            });
          })()}
        </div>
      </motion.div>

      {selectedUsers.size === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-8 text-center"
        >
          <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg">No users selected</p>
          <p className="text-slate-500 text-sm mt-2">Select at least one user to view analytics</p>
        </motion.div>
      )}
    </div>
  );
};

// Portfolio Value Over Time Chart Component
const PortfolioValueChart = ({ historyData, selectedUsers, timePeriod, currentTotalValue }) => {
  // Filter and process history data
  const chartData = useMemo(() => {
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Initialize with empty array - will always have at least today's point
    let result = [];
    
    if (historyData && historyData.length > 0) {
      // Filter by selected users
      let filtered = historyData.filter(item => selectedUsers.has(item.username));
      
      if (filtered.length > 0) {
        // Determine allowed CaptureTypes based on time period
        let allowedCaptureTypes = [];
        switch (timePeriod) {
          case '1D':
            // Daily chart: Use Hourly, Daily, and Weekly
            allowedCaptureTypes = ['HOURLY', 'DAILY', 'WEEKLY'];
            break;
          case '1W':
            // 1 week chart: Use Daily and Weekly (no hourly)
            allowedCaptureTypes = ['DAILY', 'WEEKLY'];
            break;
          case '1M':
          case '3M':
            // 1M and 3M charts: Use Daily and Weekly
            allowedCaptureTypes = ['DAILY', 'WEEKLY'];
            break;
          case 'YTD':
          case '1Y':
          case 'ALL':
            // YTD, 1 year, and all time: Use Weekly
            allowedCaptureTypes = ['WEEKLY'];
            break;
          default:
            allowedCaptureTypes = ['HOURLY', 'DAILY', 'WEEKLY'];
        }
        
        // Filter by CaptureType
        filtered = filtered.filter(item => {
          const captureType = item.captureType?.toUpperCase() || '';
          return allowedCaptureTypes.includes(captureType);
        });
        
        // Calculate date range based on time period
        let startDate = new Date();
        
        switch (timePeriod) {
          case '1D':
            startDate.setDate(now.getDate() - 1);
            break;
          case '1W':
            startDate.setDate(now.getDate() - 7);
            break;
          case '1M':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case '3M':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'YTD':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case '1Y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          case 'ALL':
            startDate = new Date(0); // Beginning of time
            break;
          default:
            startDate = new Date(0);
        }
        
        // Filter by date range
        // For 1D, include today's hourly data; for other views, exclude today (we add current value separately)
        const dateFiltered = filtered.filter(item => {
          const itemDate = item.dateNormalized || item.date; // Use normalized date for comparison
          if (timePeriod === '1D') {
            // For 1D, include all data from the last 24 hours including today
            return itemDate >= startDate;
          } else {
            // For other views, exclude today's historical data since we'll use currentTotalValue
            return itemDate >= startDate && item.dateStr !== todayDateStr;
          }
        });
        
        // For 1D view, we want hourly granularity - preserve each distinct timestamp
        // For other views, we group by date and use the last value per day
        let dateMap = new Map();
        
        if (timePeriod === '1D') {
          // For daily view: Group by full timestamp (including time) for hourly granularity
          // Use the LAST value per user per hour to avoid double-counting
          const hourUserMap = new Map(); // Maps hourTimestamp -> Map of username -> last entry
          
          dateFiltered.forEach(item => {
            // Round to nearest hour to group entries within the same hour
            const date = item.date;
            const hourTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0).getTime();
            
            if (!hourUserMap.has(hourTimestamp)) {
              hourUserMap.set(hourTimestamp, new Map());
            }
            
            const userMap = hourUserMap.get(hourTimestamp);
            const existingEntry = userMap.get(item.username);
            
            // Keep the most recent entry for each user at this hour
            if (!existingEntry || date > existingEntry.date) {
              userMap.set(item.username, {
                date: date,
                totalValue: item.totalValue,
                username: item.username,
              });
            }
          });
          
          // Convert to array format, summing last values per user for each hour
          const now = new Date();
          result = Array.from(hourUserMap.entries())
            .map(([hourTimestamp, userMap]) => {
              // Sum the last value for each user at this hour
              const totalValue = Array.from(userMap.values()).reduce(
                (sum, entry) => sum + entry.totalValue,
                0
              );
              
              const dateObj = new Date(hourTimestamp);
              
              return {
                date: formatDateForChart(dateObj, timePeriod),
                value: totalValue,
                fullDate: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
                dateObj: dateObj,
                // Store timestamp for better X-axis positioning and snapping
                timestamp: dateObj.getTime(),
              };
            })
            .filter(point => {
              // Filter out any points beyond the current time for 1D view
              return point.timestamp <= now.getTime();
            })
            .sort((a, b) => a.dateObj - b.dateObj);
          
          // Always add today's current value as the final point
          // Show both the hour point (e.g., 7:00 PM) and the current time point (e.g., 7:52 PM) if they differ
          const lastHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
          const lastPointTime = result.length > 0 ? result[result.length - 1].dateObj : null;
          const lastPointHour = lastPointTime ? new Date(lastPointTime.getFullYear(), lastPointTime.getMonth(), lastPointTime.getDate(), lastPointTime.getHours(), 0, 0, 0) : null;
          const isCurrentHour = lastPointHour && lastPointHour.getTime() === lastHour.getTime();
          const isExactlyHour = lastPointTime && lastPointTime.getTime() === lastHour.getTime();
          const nowIsAfterHour = now.getTime() > lastHour.getTime();
          const hasMinutes = now.getMinutes() > 0 || now.getSeconds() > 0;
          
          // If we have a point at exactly the hour start (7:00 PM) and current time is later in that hour (7:52 PM),
          // add a separate point for the current time so both points show
          if (isExactlyHour && nowIsAfterHour && hasMinutes) {
            // Keep the hour point (already exists) and add current time point
            result.push({
              date: formatDateForChart(now, timePeriod),
              value: currentTotalValue || 0,
              fullDate: todayDateStr,
              dateObj: new Date(now),
              timestamp: now.getTime(),
            });
          } else if (isCurrentHour && !isExactlyHour) {
            // Update the last point if it's from current hour but not exactly at hour start
            result[result.length - 1].value = currentTotalValue || 0;
            result[result.length - 1].timestamp = now.getTime();
            result[result.length - 1].dateObj = new Date(now);
            result[result.length - 1].date = formatDateForChart(now, timePeriod);
          } else if (!isCurrentHour || !lastPointTime) {
            // Add new point if no point exists for current hour
            result.push({
              date: formatDateForChart(now, timePeriod),
              value: currentTotalValue || 0,
              fullDate: todayDateStr,
              dateObj: new Date(now),
              timestamp: now.getTime(),
            });
          }
        } else if (timePeriod === '1W') {
          // For weekly view: Preserve granularity (Hourly, Daily, Weekly) 
          // Use the LAST value per user per time period to avoid double-counting
          const periodUserMap = new Map(); // Maps periodKey -> Map of username -> last entry
          
          dateFiltered.forEach(item => {
            const date = item.date;
            const captureType = item.captureType?.toUpperCase() || '';
            
            // For hourly data, use hour-level grouping
            // For daily/weekly data, use day-level grouping
            let periodKey;
            let dateObj;
            
            if (captureType === 'HOURLY') {
              // Group by hour for hourly data
              const hourTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
              periodKey = hourTimestamp.getTime();
              dateObj = hourTimestamp;
            } else {
              // Group by day for daily/weekly data
              const dayTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
              periodKey = dayTimestamp.getTime();
              dateObj = dayTimestamp;
            }
            
            if (!periodUserMap.has(periodKey)) {
              periodUserMap.set(periodKey, {
                dateObj: dateObj,
                dateKey: item.dateStr,
                captureType: captureType, // Store capture type for later use
                userMap: new Map(),
              });
            }
            
            const periodEntry = periodUserMap.get(periodKey);
            const existingEntry = periodEntry.userMap.get(item.username);
            
            // Keep the most recent entry for each user at this time period
            // This prevents double-counting when multiple capture types exist for the same day
            if (!existingEntry || date > existingEntry.date) {
              periodEntry.userMap.set(item.username, {
                date: date,
                totalValue: item.totalValue,
                username: item.username,
              });
            }
          });
          
          // Convert to array, summing last values per user for each time period
          result = Array.from(periodUserMap.values())
            .map(periodEntry => {
              // Sum the last value for each user at this time period
              const totalValue = Array.from(periodEntry.userMap.values()).reduce(
                (sum, entry) => sum + entry.totalValue,
                0
              );
              
              // For hourly points in weekly view, ensure unique X position by using the exact timestamp
              // This helps with tooltip snapping accuracy
              const dateObjForPosition = periodEntry.dateObj;
              
              // Check if this is an hourly data point (has hour/minute component or is marked as HOURLY)
              const captureType = periodEntry.captureType || '';
              const isHourlyPoint = captureType === 'HOURLY' || 
                (periodEntry.dateObj.getHours() !== 0 || periodEntry.dateObj.getMinutes() !== 0);
              
              return {
                date: formatDateForChart(periodEntry.dateObj, timePeriod, isHourlyPoint),
                value: totalValue,
                fullDate: periodEntry.dateKey,
                dateObj: dateObjForPosition,
                // Store the original timestamp for better positioning
                timestamp: dateObjForPosition.getTime(),
                isHourly: isHourlyPoint,
              };
            })
            .sort((a, b) => a.dateObj - b.dateObj);
        } else {
          // For 1M, 3M, YTD, 1Y, ALL: Group by date and sum total values (existing logic)
          dateFiltered.forEach(item => {
            const dateKey = item.dateStr;
            const normalizedDate = item.dateNormalized || item.date;
            
            if (!dateMap.has(dateKey)) {
              dateMap.set(dateKey, {
                date: dateKey,
                dateObj: normalizedDate,
                totalValue: 0,
                userCount: 0,
              });
            }
            
            // Sum up the total values for all selected users on this date
            const dateEntry = dateMap.get(dateKey);
            dateEntry.totalValue += item.totalValue;
            dateEntry.userCount += 1;
          });
          
          // Convert to array, sort by date, and format for chart
          result = Array.from(dateMap.values())
            .sort((a, b) => a.dateObj - b.dateObj)
            .map(item => ({
              date: formatDateForChart(item.dateObj, timePeriod),
              value: item.totalValue,
              fullDate: item.date,
              dateObj: item.dateObj,
              // Store timestamp for better X-axis positioning and snapping
              timestamp: item.dateObj.getTime(),
            }));
        }
      }
    }
    
    // Always add/update today's point with the current Total Portfolio Value (except for 1D which already has it)
    if (timePeriod !== '1D') {
      // Normalize today's date for comparison (midnight)
      const todayMidnight = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate());
      
      // Check if today's point already exists (compare by normalized date string)
      const todayPointIndex = result.findIndex(item => {
        if (item.dateObj instanceof Date) {
          const itemMidnight = new Date(item.dateObj.getFullYear(), item.dateObj.getMonth(), item.dateObj.getDate());
          return itemMidnight.getTime() === todayMidnight.getTime();
        }
        // Fallback: compare date strings
        return item.fullDate === todayDateStr;
      });
      
      if (todayPointIndex >= 0) {
        // Update existing today's point with current value
        result[todayPointIndex].value = currentTotalValue || 0;
        result[todayPointIndex].dateObj = todayDateObj;
        result[todayPointIndex].timestamp = todayDateObj.getTime();
        result[todayPointIndex].date = formatDateForChart(todayDateObj, timePeriod);
      } else {
        // Add new today's point
        result.push({
          date: formatDateForChart(todayDateObj, timePeriod),
          value: currentTotalValue || 0,
          fullDate: todayDateStr,
          dateObj: todayDateObj,
          timestamp: todayDateObj.getTime(),
        });
      }
      
      // Re-sort after adding/updating today's point to ensure correct order
      result.sort((a, b) => {
        const aTime = a.timestamp || (a.dateObj?.getTime?.() || 0);
        const bTime = b.timestamp || (b.dateObj?.getTime?.() || 0);
        return aTime - bTime;
      });
      
      // Ensure the final point is always today's point with current value
      // (in case sorting didn't place it last, force it to be last)
      const finalIndex = result.length - 1;
      if (finalIndex >= 0) {
        const finalPointDate = result[finalIndex].dateObj;
        if (finalPointDate instanceof Date) {
          const finalMidnight = new Date(finalPointDate.getFullYear(), finalPointDate.getMonth(), finalPointDate.getDate());
          if (finalMidnight.getTime() === todayMidnight.getTime()) {
            // Final point is today, update it
            result[finalIndex].value = currentTotalValue || 0;
          } else {
            // Final point is not today, ensure today is the final point
            // Remove today if it's not last, then add it at the end
            const todayIndex = result.findIndex((item, idx) => {
              if (idx === finalIndex) return false; // Skip the last item
              const itemDate = item.dateObj;
              if (itemDate instanceof Date) {
                const itemMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
                return itemMidnight.getTime() === todayMidnight.getTime();
              }
              return false;
            });
            
            if (todayIndex >= 0 && todayIndex !== finalIndex) {
              // Remove today from its current position
              const todayPoint = result.splice(todayIndex, 1)[0];
              todayPoint.value = currentTotalValue || 0;
              result.push(todayPoint);
            } else if (todayIndex < 0) {
              // Today point doesn't exist, add it
              result.push({
                date: formatDateForChart(todayDateObj, timePeriod),
                value: currentTotalValue || 0,
                fullDate: todayDateStr,
                dateObj: todayDateObj,
                timestamp: todayDateObj.getTime(),
              });
            }
          }
        }
      }
    }
    
    return result;
  }, [historyData, selectedUsers, timePeriod, currentTotalValue]);
  
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <p>No historical data available for the selected time period</p>
      </div>
    );
  }
  
  // Current value is always the current Total Portfolio Value
  const currentValue = currentTotalValue || 0;
  
  // Calculate change percentage (from first historical point to current value)
  const firstValue = chartData.length > 0 ? chartData[0]?.value || 0 : currentValue;
  const change = currentValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0;
  
  // Calculate min and max values for Y-axis scaling
  const values = chartData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  
  // Add 10% padding above and below the data range for better visualization
  const padding = range * 0.1 || (maxValue * 0.05) || 1000; // At least 5% padding or $1000
  const yAxisMin = Math.max(0, minValue - padding); // Don't go below 0
  const yAxisMax = maxValue + padding;
  
  // Calculate custom ticks for 1D period to show every other hour (odd hours only: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)
  const xAxisTicks = timePeriod === '1D' && chartData.length > 0 ? (() => {
    // Filter data timestamps to only include odd hours (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)
    return chartData
      .map(d => {
        const date = new Date(d.timestamp);
        return { timestamp: d.timestamp, hour: date.getHours() };
      })
      .filter(item => item.hour % 2 === 1) // Only odd hours
      .map(item => item.timestamp)
      .sort((a, b) => a - b);
  })() : undefined;
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-end gap-6">
        <div>
          <p className="text-sm text-slate-400 mb-1">Current Value</p>
          <p className="text-3xl font-bold text-white">
            ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">
            {timePeriod === 'ALL' ? 'Total Change' : 'Period Change'}
          </p>
          <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}${change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm ${changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Line Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
            syncId="portfolioChart"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              ticks={xAxisTicks}
              tickFormatter={(value) => {
                const date = new Date(value);
                return formatDateForChart(date, timePeriod);
              }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={[yAxisMin, yAxisMax]}
            />
            <Tooltip
              content={(props) => {
                if (!props.active || !props.payload || !props.payload.length) {
                  return null;
                }
                
                // Use default tooltip behavior for all time periods (including ALL)
                // Recharts handles snapping automatically
                const payload = props.payload[0];
                // Get the formatted date from the payload data, or convert the timestamp label
                const dataPoint = payload.payload;
                const formattedDate = dataPoint?.date || (props.label ? formatDateForChart(new Date(props.label), timePeriod) : '');
                
                return (
                  <div 
                    className="bg-slate-800/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl"
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                    }}
                  >
                    <p style={{ color: '#94a3b8', marginBottom: '4px' }}>
                      {formattedDate}
                    </p>
                    <p style={{ color: '#ffffff', fontWeight: 'bold' }}>
                      ${payload.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              }}
              filterNull={false}
              shared={false}
              animationDuration={0}
              allowEscapeViewBox={{ x: false, y: false }}
              cursor={{ stroke: '#0ea5e9', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ 
                r: timePeriod === '1W' ? 4 : 5, 
                fill: '#0ea5e9', 
                strokeWidth: 2, 
                stroke: '#ffffff'
              }}
              activeDot={{ 
                r: timePeriod === '1W' ? 8 : 9, 
                fill: '#0ea5e9', 
                stroke: '#ffffff', 
                strokeWidth: 2,
                style: { cursor: 'pointer' }
              }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Stock Gains Leaderboard Component
const StockGainsLeaderboard = ({ ticker, gains, getChatsForUserAndTicker, allUsers = [], onChatSubmit, postingUser, setPostingUser }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get chats for the selected entry
  const chats = useMemo(() => {
    if (!selectedEntry || !getChatsForUserAndTicker) return '';
    return getChatsForUserAndTicker(ticker, selectedEntry.username);
  }, [selectedEntry, ticker, getChatsForUserAndTicker]);

  // Parse chat messages from the string (newline-separated)
  const parsedChats = useMemo(() => {
    if (!chats || !chats.trim()) return [];
    
    return chats.split('\n').filter(line => line.trim()).map(line => {
      // Parse format: "Username: Message (timestamp)"
      const match = line.match(/^(.+?):\s*(.+?)\s*\((.+?)\)$/);
      if (match) {
        return {
          username: match[1].trim(),
          message: match[2].trim(),
          timestamp: match[3].trim(),
        };
      }
      // Fallback: if format doesn't match, return as-is
      return {
        username: 'Unknown',
        message: line.trim(),
        timestamp: '',
      };
    });
  }, [chats]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !postingUser.trim() || !selectedEntry || !onChatSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onChatSubmit(ticker, chatMessage.trim(), postingUser.trim(), selectedEntry.username);
      setChatMessage('');
      setSelectedEntry(null);
    } catch (error) {
      console.error('Error submitting chat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!gains || gains.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400 text-center">No historical data available for this stock</p>
      </div>
    );
  }

  // Only show top 10 gainers
  const topGainers = gains.slice(0, 10);

  // Calculate max height to show approximately 5 items (each item is ~68px with spacing)
  const itemHeight = 68; // Approximate height per item including spacing
  const visibleItems = 5;
  const maxHeight = itemHeight * visibleItems;

  // Determine if this is cash
  const isCash = ticker === 'CASH' || ticker === 'USD';

  return (
    <div className="space-y-4">
      {/* Leaderboard */}
      <div 
        className={`space-y-2 ${topGainers.length > visibleItems ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800' : ''}`}
        style={topGainers.length > visibleItems ? { maxHeight: `${maxHeight}px` } : {}}
      >
        {topGainers.map((entry, index) => {
          const isPositive = entry.gain > 0;
          const isNegative = entry.gain < 0;
          const isSelected = selectedEntry?.username === entry.username;
          
          return (
            <motion.div
              key={`${entry.username}-${ticker}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary-500/20 border-primary-500/50'
                  : index === 0 && isPositive
                  ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/50'
                  : isPositive
                  ? 'bg-slate-800/50 border-green-500/30'
                  : isNegative
                  ? 'bg-slate-800/50 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              } hover:border-primary-500/50`}
              onClick={() => {
                setSelectedEntry(entry);
                if (!postingUser && allUsers.length > 0 && setPostingUser) {
                  setPostingUser(allUsers[0]);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 && isPositive
                      ? 'bg-yellow-500/30 text-yellow-400'
                      : index === 1 && isPositive
                      ? 'bg-slate-600 text-slate-300'
                      : index === 2 && isPositive
                      ? 'bg-amber-600/30 text-amber-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{entry.username}</p>
                    <p className="text-xs text-slate-400">
                      {isCash 
                        ? `$${entry.oldShares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → $${entry.currentShares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${entry.oldShares.toFixed(2)} → ${entry.currentShares.toFixed(2)} shares`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-bold ${
                    isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : isNegative ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    <span>
                      {isCash 
                        ? `${entry.gain >= 0 ? '+' : ''}$${Math.abs(entry.gain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${entry.gain > 0 ? '+' : ''}${entry.gain.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{isCash ? 'USD' : 'shares'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chat Section */}
      {selectedEntry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
        >
          <div className="mb-3">
            <p className="text-sm text-slate-400 mb-1">Chat for {selectedEntry.username}'s position</p>
            
            {/* Existing Chat Messages */}
            {parsedChats.length > 0 && (
              <div className="mb-3 max-h-32 overflow-y-auto space-y-2">
                {parsedChats.map((chat, idx) => (
                  <div key={idx} className="text-xs bg-slate-900/50 p-2 rounded border border-slate-700">
                    <span className="font-semibold text-primary-400">{chat.username}:</span>
                    <span className="text-slate-300 ml-1">{chat.message}</span>
                    {chat.timestamp && (
                      <span className="text-slate-500 ml-1">({chat.timestamp})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleChatSubmit} className="space-y-2">
            <div className="flex gap-2">
              <select
                value={postingUser}
                onChange={(e) => setPostingUser(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white"
                required
              >
                <option value="">Select user...</option>
                {allUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Enter your message..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
                required
                disabled={isSubmitting}
              />
              <motion.button
                type="submit"
                disabled={isSubmitting || !chatMessage.trim() || !postingUser}
                className="px-4 py-2 bg-primary-500 text-white rounded text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </motion.button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedEntry(null);
                setChatMessage('');
              }}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Cancel
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

// Helper function to format dates for chart display
const formatDateForChart = (dateInput, period, includeTime = false) => {
  let date;
  
  // Handle both date strings and Date objects
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's a date string in YYYY-MM-DD format, parse it as local date to avoid timezone issues
    const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      // Parse as local date (not UTC) to avoid day shift
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1; // Month is 0-indexed
      const day = parseInt(dateMatch[3]);
      date = new Date(year, month, day);
    } else if (dateInput.includes('T')) {
      // ISO timestamp string - parse normally
      date = new Date(dateInput);
    } else {
      // Fallback to standard parsing
      date = new Date(dateInput);
    }
  } else {
    return String(dateInput);
  }
  
  if (isNaN(date.getTime())) return String(dateInput);
  
  switch (period) {
    case '1D':
      // For daily view, show hour and minute
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    case '1W':
      // For weekly view with hourly data, include time to ensure unique X positions
      if (includeTime || date.getHours() !== 0 || date.getMinutes() !== 0) {
        // Include time for hourly points to ensure unique positioning
        return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    case '1M':
    case '3M':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'YTD':
    case '1Y':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'ALL':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

export default Analytics;

