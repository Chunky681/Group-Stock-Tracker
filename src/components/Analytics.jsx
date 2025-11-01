import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, PieChart, Users, TrendingUp, Check } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { readSheetData, initializeSheet } from '../utils/googleSheets';
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

  useEffect(() => {
    loadPortfolio();
  }, [refreshKey]);

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
        
        return {
          id: index + 1,
          username: row[0]?.trim() || '',
          ticker,
          shares,
          price,
          dividendYield,
          value: shares * price,
          yearlyDividend: shares * price * (dividendYield / 100),
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

  // Get all unique users
  const allUsers = useMemo(() => {
    return [...new Set(portfolio.map(item => item.username).filter(Boolean))].sort();
  }, [portfolio]);

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

  // Group by ticker and calculate total value per stock
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

  // Data for stock distribution pie chart (by stock across all selected users)
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
        name: ticker,
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
    return `${entry.name}: ${((entry.value / totalValue) * 100).toFixed(1)}%`;
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
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 text-center">By User</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={totalValueByUser}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={120}
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
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock Distribution Pie Chart */}
            {totalValueByStock.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-4 text-center">By Stock</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={totalValueByStock}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={120}
                        innerRadius={0}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        stroke="none"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {totalValueByStock.map((entry, index) => (
                          <Cell key={`stock-cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
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
          {stockTotals.map((stock, stockIndex) => {
            const distribution = getStockDistribution(stock.ticker);
            
            return (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + stockIndex * 0.1 }}
                className="border-t border-slate-700 pt-6 first:border-t-0 first:pt-0"
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
                      <p className="text-lg font-bold text-white">{stock.totalShares.toFixed(2)}</p>
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
                      <div>
                        <h5 className="text-lg font-semibold text-white mb-4">
                          Distribution by User
                        </h5>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => 
                                  `${name}: ${(percent * 100).toFixed(1)}%`
                                }
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
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-lg font-semibold text-white mb-4">
                          Value by User
                        </h5>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                              <YAxis stroke="#94a3b8" fontSize={12} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1e293b', 
                                  border: '1px solid #475569',
                                  borderRadius: '8px'
                                }}
                                formatter={(value) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                              />
                              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]}>
                                {distribution.map((entry, index) => (
                                  <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
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

export default Analytics;

