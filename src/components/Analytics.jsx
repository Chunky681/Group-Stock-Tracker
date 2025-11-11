import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, PieChart, Users, TrendingUp, Check, Trophy, TrendingDown, DollarSign, Home, ChevronDown, ChevronUp, MessageSquare, Bell, Coins, Building2, ArrowUp, ArrowDown } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid, XAxis, YAxis, ReferenceDot } from 'recharts';
import { readSheetData, initializeSheet, updateHoldingsHistoryChat } from '../utils/googleSheets';
import { getStockQuote } from '../utils/stockApi';

const COLORS = [
  '#0ea5e9', // primary-500
  '#10b981', // green
  '#f59e0b', // amber
  '#CC7722', // ochre (was red)
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#06b6d4', // cyan
];

// Colors for other stocks (excluding green, ochre, and orange which are reserved for CASH and REAL ESTATE)
const STOCK_COLORS = [
  '#0ea5e9', // primary-500 (blue)
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#f59e0b', // amber (yellow-gold)
  '#a855f7', // purple
];

// Memoized User Distribution Chart Component
const UserDistributionChart = memo(({ data, renderLabel, CustomTooltip }) => {
  return (
    <div className="flex flex-col">
      <h4 className="text-lg font-semibold text-white mb-1 text-center">By User</h4>
      <div className="flex-shrink-0" style={{ height: '384px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
            <Pie
              data={data}
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
              {data.map((entry, index) => (
                <Cell key={`user-cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-grow pt-1">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((entry, index) => (
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
  );
});

UserDistributionChart.displayName = 'UserDistributionChart';

// Custom comparison function for UserDistributionChart
const areUserChartPropsEqual = (prevProps, nextProps) => {
  // Compare data arrays by reference (they're already stable from useRef)
  if (prevProps.data !== nextProps.data) return false;
  // renderLabel is memoized, so reference should be stable
  if (prevProps.renderLabel !== nextProps.renderLabel) return false;
  // CustomTooltip is a component, should be stable
  return true;
};

const MemoizedUserDistributionChart = memo(UserDistributionChart, areUserChartPropsEqual);

// Memoized Stock Distribution Chart Component
const StockDistributionChart = memo(({ data, renderLabel, CustomTooltip }) => {
  return (
    <div className="flex flex-col">
      <h4 className="text-lg font-semibold text-white mb-1 text-center">By Asset</h4>
      <div className="flex-shrink-0" style={{ height: '384px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
            <Pie
              data={data}
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
              {data.map((entry, index) => {
                // Always use green for Cash, ochre for Real Estate
                const isCash = entry.name === 'CASH';
                const isRealEstate = entry.name === 'REAL ESTATE';
                let fillColor;
                if (isCash) {
                  fillColor = '#22c55e'; // green
                } else if (isRealEstate) {
                  fillColor = '#CC7722'; // ochre
                } else {
                  // For other stocks, use STOCK_COLORS (excluding green, ochre, and orange)
                  // Calculate index excluding CASH and REAL ESTATE
                  const otherStocksIndex = data
                    .slice(0, index)
                    .filter(e => e.name !== 'CASH' && e.name !== 'REAL ESTATE').length;
                  fillColor = STOCK_COLORS[otherStocksIndex % STOCK_COLORS.length];
                }
                return (
                  <Cell key={`stock-cell-${index}`} fill={fillColor} stroke="none" />
                );
              })}
            </Pie>
            <Tooltip content={CustomTooltip} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-grow pt-1">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((entry, index) => {
            // Always use green for Cash, ochre for Real Estate
            const isCash = entry.name === 'CASH';
            const isRealEstate = entry.name === 'REAL ESTATE';
            let color;
            if (isCash) {
              color = '#22c55e'; // green
            } else if (isRealEstate) {
              color = '#CC7722'; // ochre
            } else {
              // For other stocks, use STOCK_COLORS (excluding green, ochre, and orange)
              // Calculate index excluding CASH and REAL ESTATE
              const otherStocksIndex = data
                .slice(0, index)
                .filter(e => e.name !== 'CASH' && e.name !== 'REAL ESTATE').length;
              color = STOCK_COLORS[otherStocksIndex % STOCK_COLORS.length];
            }
            return (
              <div key={`legend-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-slate-300">{entry.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

StockDistributionChart.displayName = 'StockDistributionChart';

// Custom comparison function for StockDistributionChart
const areStockChartPropsEqual = (prevProps, nextProps) => {
  // Compare data arrays by reference (they're already stable from useRef)
  if (prevProps.data !== nextProps.data) return false;
  // renderLabel is memoized, so reference should be stable
  if (prevProps.renderLabel !== nextProps.renderLabel) return false;
  // CustomTooltip is a component, should be stable
  return true;
};

const MemoizedStockDistributionChart = memo(StockDistributionChart, areStockChartPropsEqual);

// Cash Particles Animation Component
const CashParticlesAnimation = ({ trigger, distribution }) => {
  const particles = Array.from({ length: 15 }, (_, i) => i);
  
  // Calculate origin point based on first place holder's position in pie chart
  // Pie chart starts at 90 degrees (top) and goes counterclockwise
  // First slice is at the top, so we'll position particles near the top-center
  const originX = 50; // Center horizontally
  const originY = 25; // Top portion of pie chart (where first slice is)
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {trigger && particles.map((i) => {
          // Spread particles in a burst pattern from the origin
          const angle = (i / particles.length) * 360;
          const distance = 60 + Math.random() * 80;
          const x = Math.cos((angle * Math.PI) / 180) * distance;
          const y = Math.sin((angle * Math.PI) / 180) * distance;
          
          return (
            <motion.div
              key={`cash-${i}-${trigger}`}
              initial={{ 
                opacity: 1, 
                scale: 1,
                x: 0,
                y: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                scale: [1, 0.5, 0],
                x: x,
                y: y + 180, // Particles fall downward
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5,
                delay: i * 0.05,
                ease: "easeOut"
              }}
              className="absolute"
              style={{
                left: `${originX}%`,
                top: `${originY}%`,
              }}
            >
              <DollarSign className="w-4 h-4 text-green-400" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Property Value Appreciation Animation Component
const RealEstateAnimation = ({ trigger }) => {
  const houses = Array.from({ length: 12 }, (_, i) => i);
  
  return (
    <AnimatePresence>
      {trigger && houses.map((i) => {
        // Pre-calculate random values for deterministic animation
        const randomSeed = i * 0.618; // Golden ratio for better distribution
        const xOffset = (Math.sin(randomSeed * Math.PI * 2) * 180); // Spread across width
        const delay = i * 0.08; // Stagger the animation
        const duration = 2.2 + (Math.sin(randomSeed) * 0.8); // Variable duration
        const rotation1 = Math.sin(randomSeed * 10) * 15;
        const rotation2 = Math.cos(randomSeed * 15) * 20;
        const rotation3 = Math.sin(randomSeed * 20) * 25;
        
        return (
          <motion.div
            key={`house-${i}-${trigger}`}
            initial={{ 
              opacity: 0,
              y: 100,
              scale: 0.5,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [100, -30, -30, -80],
              scale: [0.5, 1.2, 1, 0.8],
              rotate: [0, rotation1, rotation2, rotation3],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: duration,
              delay: delay,
              ease: "easeOut"
            }}
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${xOffset}px)`,
              bottom: '20%',
            }}
          >
            <Home className="w-6 h-6 text-amber-600 drop-shadow-lg" style={{ color: '#CC7722' }} />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

// Chart Arrow Animation Component
const ChartArrowAnimation = ({ trigger, changePercent = 0 }) => {
  const arrows = Array.from({ length: 5 }, (_, i) => i);
  const isPositive = changePercent >= 0;
  const arrowColor = isPositive ? '#22c55e' : '#ef4444'; // green for up/flat, red for down
  const ArrowComponent = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {trigger && arrows.map((i) => {
          const x = 20 + (i * 15);
          const y = isPositive ? 80 - (i * 10) : 20 + (i * 10); // Start from top for down arrows, bottom for up arrows
          
          return (
            <motion.div
              key={`arrow-${i}-${trigger}`}
              initial={{ 
                opacity: 0,
                y: isPositive ? 100 : -20, // Start from bottom for up arrows, top for down arrows
                x: x,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: isPositive ? [100, y, y, 50] : [-20, y, y, 80], // Move up for positive, down for negative
                scale: [0.8, 1, 1, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: i * 0.15,
                ease: "easeOut"
              }}
              className="absolute"
              style={{ left: `${x}%` }}
            >
              <ArrowComponent className="w-5 h-5" style={{ color: arrowColor }} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const Analytics = ({ refreshKey }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [historyData, setHistoryData] = useState([]);
  const [dailyTotalsData, setDailyTotalsData] = useState([]);
  const [holdingsHistory, setHoldingsHistory] = useState([]);
  const [usersFromSheet1, setUsersFromSheet1] = useState([]); // Store unique users from Sheet1
  const [timePeriod, setTimePeriod] = useState('1D'); // '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'
  const [chartType, setChartType] = useState('line'); // 'line' or 'stacked'
  const [postingUser, setPostingUser] = useState('');
  const [expandedHoldings, setExpandedHoldings] = useState(new Set()); // Track which holdings are expanded
  const [animationTrigger, setAnimationTrigger] = useState({}); // Track animation triggers for each holding
  const holdingRefs = useRef(new Map()); // Store refs for each holding section to enable scrolling
  const [pieChartDate, setPieChartDate] = useState(null); // Selected date for pie charts (null = current)
  const [selectedAssetTypes, setSelectedAssetTypes] = useState(new Set(['stocks', 'cash', 'realestate', 'crypto'])); // Asset type filters
  const [selectedAssetTab, setSelectedAssetTab] = useState(null); // Selected asset tab: 'cash', 'realestate', 'stocks', 'crypto' (null = auto-select first available)
  const [openStockTickers, setOpenStockTickers] = useState(new Set()); // Set of open stock tickers for accordion expansion
  const [openCryptoTickers, setOpenCryptoTickers] = useState(new Set()); // Set of open crypto tickers for accordion expansion
  
  useEffect(() => {
    // Determine if this is the initial load (refreshKey === 0)
    const isInitialLoad = refreshKey === 0;
    
    // If it's a refresh (not initial load), use silent mode with force refresh
    const silent = !isInitialLoad;
    const forceRefresh = !isInitialLoad;
    
    // Ensure loading state is set correctly
    if (isInitialLoad) {
      // Initial load: show loading spinner
      setIsLoading(true);
      setError(null);
    } else {
      // Refresh: ensure we're not stuck in loading state
      // (component may have remounted with refreshKey > 0 but isLoading was still true)
      setIsLoading(false);
    }
    
    // Load all data in parallel for better performance
    Promise.all([
      loadPortfolio(forceRefresh, silent),
      loadHistoryData(forceRefresh),
      loadDailyTotalsData(forceRefresh),
      loadHoldingsHistory(forceRefresh)
    ]).catch(error => {
      console.error('Error loading analytics data:', error);
      if (!silent) {
        setError(error.message || 'Failed to load analytics data.');
      }
      // Always clear loading state on error, even for silent refreshes
      setIsLoading(false);
    }).finally(() => {
      // Always clear loading state when data loading completes
      // This ensures we never get stuck in loading state
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]); // Only depend on refreshKey - load functions are stable

  // Auto-refresh is now handled by RefreshTimer component in App.jsx
  // This removes the duplicate refresh mechanism

  // Load holdings history from HoldingsHistory sheet (including chat data from column E)
  const loadHoldingsHistory = async (forceRefresh = false) => {
    try {
      const data = await readSheetData('HoldingsHistory!A1:E10000', forceRefresh);
      
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

  // Load daily totals data from DailyTotals sheet (columns A-F: Username, Total Stock Value, Total Cash Value, Total Real Estate Value, Total Crypto Value, Snapshot Date)
  const loadDailyTotalsData = async (forceRefresh = false) => {
    try {
      const data = await readSheetData('DailyTotals!A1:F10000', forceRefresh);
      
      if (!data || data.length === 0) {
        setDailyTotalsData([]);
        return;
      }
      
      // Skip header row (row 0)
      const rows = data.slice(1).filter(row => row && row.length >= 2 && row[0] && row[1]);
      
      // First pass: collect all entries and find the most recent valid date
      const entriesWithDates = [];
      const entriesWithoutDates = [];
      let mostRecentDate = null;
      
      rows.forEach(row => {
        const username = row[0]?.trim() || '';
        const stockValue = parseFloat(row[1]) || 0;
        const cashValue = parseFloat(row[2]) || 0;
        const realEstateValue = parseFloat(row[3]) || 0;
        const cryptoValue = parseFloat(row[4]) || 0;
        const snapshotDateStr = row[5]?.trim() || '';
        
        // Calculate total value from all asset types
        const totalValue = stockValue + cashValue + realEstateValue + cryptoValue;
        
        if (!username || totalValue <= 0) {
          return;
        }
        
        // Parse snapshot date (handle MM/DD/YYYY format and ISO timestamp format)
        let snapshotDate = null;
        if (snapshotDateStr) {
          try {
            if (snapshotDateStr.includes('T')) {
              snapshotDate = new Date(snapshotDateStr);
            } else {
              // Try MM/DD/YYYY format
              const parts = snapshotDateStr.split('/');
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1; // Month is 0-indexed
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                snapshotDate = new Date(year, month, day);
              } else {
                snapshotDate = new Date(snapshotDateStr);
              }
            }
            
            if (isNaN(snapshotDate.getTime())) {
              snapshotDate = null;
            } else {
              // Track the most recent date
              if (!mostRecentDate || snapshotDate > mostRecentDate) {
                mostRecentDate = snapshotDate;
              }
            }
          } catch (e) {
            snapshotDate = null;
          }
        }
        
        const entry = {
          username,
          totalValue,
          stockValue,
          cashValue,
          realEstateValue,
          cryptoValue,
        };
        
        if (snapshotDate) {
          entriesWithDates.push({
            ...entry,
            snapshotDate,
          });
        } else {
          entriesWithoutDates.push(entry);
        }
      });
      
      // Use most recent date for entries without dates, or use today if no dates exist
      const fallbackDate = mostRecentDate || new Date();
      
      // Combine entries: those with dates + those without dates using fallback date
      const dailyTotals = [
        ...entriesWithDates,
        ...entriesWithoutDates.map(entry => ({
          ...entry,
          snapshotDate: fallbackDate,
        })),
      ];
      
      setDailyTotalsData(dailyTotals);
    } catch (error) {
      console.error('Error loading daily totals data:', error);
      setDailyTotalsData([]);
    }
  };

  // Load history data from History sheet (columns A-G: Timestamp, Username, Total Stock Value (USD), Total Cash Value (USD), Total Real Estate Value (USD), Total Crypto Value (USD), CaptureType)
  const loadHistoryData = async (forceRefresh = false) => {
    try {
      const data = await readSheetData('History!A1:G10000', forceRefresh);
      
      if (!data || data.length === 0) {
        setHistoryData([]);
        return;
      }
      
      // Skip header row (row 0)
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1] && row[2]);
      
      const history = rows.map(row => {
        const dateStr = row[0]?.trim() || '';
        const username = row[1]?.trim() || '';
        const stockValue = parseFloat(row[2]) || 0; // Column C: Total Stock Value (USD)
        const cashValue = parseFloat(row[3]) || 0; // Column D: Total Cash Value
        const realEstateValue = parseFloat(row[4]) || 0; // Column E: Total Real Estate Value
        const cryptoValue = parseFloat(row[5]) || 0; // Column F: Total Crypto Value
        const captureType = row[6]?.trim()?.toUpperCase() || ''; // Column G: CaptureType
        
        // Calculate total value (stock + cash + real estate + crypto)
        const totalValue = stockValue + cashValue + realEstateValue + cryptoValue;
        
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
          stockValue,
          cashValue,
          realEstateValue,
          cryptoValue,
          captureType,
        };
      }).filter(Boolean);
      
      setHistoryData(history);
    } catch (error) {
      console.error('Error loading history data:', error);
      setHistoryData([]);
    }
  };

  const loadPortfolio = async (forceRefresh = false, silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      await initializeSheet();
      const data = await readSheetData('Sheet1!A1:E1000', forceRefresh); // Include column E for LastPositionChange
      
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
      
      // Get unique users from Sheet1 and store them in state
      const uniqueUsers = [...new Set(rows.map(row => row[0]?.trim()).filter(Boolean))].sort();
      setUsersFromSheet1(uniqueUsers);
      
      // Set them all as selected by default if no users are currently selected
      if (selectedUsers.size === 0) {
        setSelectedUsers(new Set(uniqueUsers));
      }
      
      const uniqueTickers = [...new Set(rows.map(row => row[1]?.trim().toUpperCase()))];
      const quoteMap = {}; // Store full quote data with all metrics from Sheet2
      
      // Load crypto prices from Crypto sheet to identify crypto tickers
      const cryptoMap = new Map();
      try {
        const cryptoData = await readSheetData('Crypto!A1:E1000', forceRefresh);
        if (cryptoData && cryptoData.length > 1) {
          const header = cryptoData[0];
          const symbolColIndex = header.indexOf('Symbol');
          const priceColIndex = header.indexOf('Price_USD');
          
          if (symbolColIndex !== -1 && priceColIndex !== -1) {
            cryptoData.slice(1).forEach(row => {
              const symbol = row[symbolColIndex]?.trim().toUpperCase();
              const price = parseFloat(row[priceColIndex]) || 0;
              if (symbol && price > 0) {
                cryptoMap.set(symbol, price);
              }
            });
          }
        }
      } catch (cryptoError) {
        console.error('Error loading crypto prices:', cryptoError);
      }
      
      // Pre-fetch Sheet2 data once before looping through tickers
      // This ensures we only make one API call to Sheet2 instead of one per ticker
      const { fetchStockDataFromSheet } = await import('../utils/stockDataSheet');
      const allStocks = await fetchStockDataFromSheet(forceRefresh); // Force refresh if requested
      
      // Create a lookup map from stocks array for faster access
      const stockLookup = new Map();
      allStocks.forEach(stock => {
        const visualSymbol = (stock.visualSymbol || '').toUpperCase();
        const symbol = (stock.symbol || '').toUpperCase();
        if (visualSymbol) stockLookup.set(visualSymbol, stock);
        if (symbol && symbol !== visualSymbol) stockLookup.set(symbol, stock);
      });
      
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
        
        // Handle REAL ESTATE entries - they don't need stock data lookup
        if (ticker === 'REAL ESTATE') {
          quoteMap[ticker] = {
            price: 1.0, // Real estate is always $1.00 per "share" (dollar)
            dividendYield: 0,
            changeDollar: 0,
            changePercent: 0,
            name: 'Real Estate',
            symbol: 'REAL ESTATE',
            visualSymbol: 'REAL ESTATE',
          };
          continue;
        }
        
        // Handle CRYPTO entries - use prices from Crypto sheet
        if (cryptoMap.has(ticker)) {
          const cryptoPrice = cryptoMap.get(ticker);
          quoteMap[ticker] = {
            price: cryptoPrice,
            dividendYield: 0,
            changeDollar: 0,
            changePercent: 0,
            name: ticker,
            symbol: ticker,
            visualSymbol: ticker,
          };
          continue;
        }
        
        try {
          // Use pre-fetched stock data instead of making individual API calls
          const stock = stockLookup.get(ticker);
          if (stock) {
            const previousClose = stock.price - stock.changeDollar;
            const displaySymbol = stock.visualSymbol || stock.symbol;
            
            quoteMap[ticker] = {
              symbol: displaySymbol,
              visualSymbol: stock.visualSymbol || stock.symbol,
              name: stock.name,
              price: stock.price,
              previousClose: previousClose,
              change: stock.changeDollar,
              changePercent: stock.changePercent,
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
              dividendYield: stock.dividendYield,
            };
          } else {
            // Fallback to API call if not found in pre-fetched data
            const quote = await getStockQuote(ticker);
            quoteMap[ticker] = quote;
          }
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
        const lastUpdated = row[3]?.trim() || ''; // Timestamp from Sheet1
        const lastPositionChange = row[4] ? parseFloat(row[4]) : null; // LastPositionChange column (E)
        const quote = quoteMap[ticker] || { price: 0, dividendYield: 0 };
        const price = quote.price || 0;
        const dividendYield = quote.dividendYield || 0;
        
        // For cash and real estate, the "shares" is actually the dollar amount, and price is $1.00
        const isCash = ticker === 'CASH' || ticker === 'USD';
        const isRealEstate = ticker === 'REAL ESTATE';
        const isCrypto = cryptoMap.has(ticker);
        
        return {
          id: index + 1,
          username: row[0]?.trim() || '',
          ticker,
          shares,
          price,
          dividendYield,
          value: shares * price, // For cash/real estate: amount * 1.0 = amount
          yearlyDividend: shares * price * (dividendYield / 100),
          isCash, // Flag to identify cash holdings
          isRealEstate, // Flag to identify real estate holdings
          isCrypto, // Flag to identify crypto holdings
          lastUpdated, // Timestamp from Sheet1
          lastPositionChange, // Change amount from LastPositionChange column
          // Store full quote data for detailed display
          fullQuote: quote,
        };
      });
      
      setPortfolio(portfolioData);
      
      // Ensure all users are selected if selection is empty (only on initial load, not during silent refresh)
      if (!silent && selectedUsers.size === 0 && uniqueUsers.length > 0) {
        setSelectedUsers(new Set(uniqueUsers));
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      if (!silent) {
        setError(error.message || 'Failed to load portfolio.');
        setIsLoading(false); // Always set loading to false on error
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  // Filter portfolio for selected users
  const filteredPortfolio = useMemo(() => {
    return portfolio.filter(item => selectedUsers.has(item.username));
  }, [portfolio, selectedUsers]);

  // Toggle expansion state for a holding
  const toggleHolding = (ticker) => {
    setExpandedHoldings(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(ticker);
      
      if (wasExpanded) {
        newSet.delete(ticker);
      } else {
        newSet.add(ticker);
        // Trigger animation when expanding
        setAnimationTrigger(prev => ({
          ...prev,
          [ticker]: Date.now()
        }));
        
        // Scroll to center the expanded section after a short delay to allow DOM update
        setTimeout(() => {
          const ref = holdingRefs.current.get(ticker);
          if (ref) {
            ref.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
        }, 100);
      }
      return newSet;
    });
  };

  // Get all unique users from Sheet1
  const allUsers = useMemo(() => {
    return usersFromSheet1;
  }, [usersFromSheet1]);

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

  // Calculate total value for selected users (filtered by asset type)
  const totalValue = useMemo(() => {
    // Use dailyTotalsData if available (more accurate), otherwise fall back to portfolio
    if (dailyTotalsData && dailyTotalsData.length > 0) {
      return dailyTotalsData
        .filter(item => selectedUsers.has(item.username))
        .reduce((sum, item) => sum + calculateFilteredValue(item, selectedAssetTypes), 0);
    }
    // Fallback to portfolio calculation
    return filteredPortfolio.reduce((sum, item) => {
      // Filter by asset type
      if (item.isCash && !selectedAssetTypes.has('cash')) return sum;
      if (item.isRealEstate && !selectedAssetTypes.has('realestate')) return sum;
      if (item.isCrypto && !selectedAssetTypes.has('crypto')) return sum;
      if (!item.isCash && !item.isRealEstate && !item.isCrypto && !selectedAssetTypes.has('stocks')) return sum;
      return sum + item.value;
    }, 0);
  }, [filteredPortfolio, dailyTotalsData, selectedUsers, selectedAssetTypes]);

  // Calculate total yearly dividend for selected users
  const totalYearlyDividend = useMemo(() => {
    return filteredPortfolio.reduce((sum, item) => sum + (item.yearlyDividend || 0), 0);
  }, [filteredPortfolio]);

  // Group by ticker and calculate total value per stock (including cash, real estate, and crypto)
  const stockTotals = useMemo(() => {
    const grouped = {};
    filteredPortfolio.forEach(item => {
      // Filter by asset type
      if (item.isCash && !selectedAssetTypes.has('cash')) return;
      if (item.isRealEstate && !selectedAssetTypes.has('realestate')) return;
      if (item.isCrypto && !selectedAssetTypes.has('crypto')) return;
      if (!item.isCash && !item.isRealEstate && !item.isCrypto && !selectedAssetTypes.has('stocks')) return;
      
      if (!grouped[item.ticker]) {
        grouped[item.ticker] = {
          ticker: item.ticker,
          totalValue: 0,
          totalShares: 0,
          price: item.price,
          dividendYield: item.dividendYield || 0,
          totalYearlyDividend: 0,
          isCash: item.isCash || false,
          isRealEstate: item.isRealEstate || false,
          isCrypto: item.isCrypto || false,
          fullQuote: item.fullQuote || {}, // Store full quote data for detailed metrics
        };
      }
      grouped[item.ticker].totalValue += item.value;
      grouped[item.ticker].totalShares += item.shares;
      grouped[item.ticker].totalYearlyDividend += item.yearlyDividend || 0;
    });
    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredPortfolio, selectedAssetTypes]);

  // Auto-select first available asset tab when stockTotals changes
  useEffect(() => {
    if (!selectedAssetTab && stockTotals.length > 0) {
      const cashHoldings = stockTotals.filter(s => s.isCash);
      const realEstateHoldings = stockTotals.filter(s => s.isRealEstate);
      const stockHoldings = stockTotals.filter(s => !s.isCash && !s.isRealEstate && !s.isCrypto);
      const cryptoHoldings = stockTotals.filter(s => s.isCrypto);
      
      const firstAvailable = cashHoldings.length > 0 ? 'cash' : 
                             realEstateHoldings.length > 0 ? 'realestate' :
                             stockHoldings.length > 0 ? 'stocks' :
                             cryptoHoldings.length > 0 ? 'crypto' : null;
      
      if (firstAvailable) {
        setSelectedAssetTab(firstAvailable);
      }
    }
  }, [stockTotals, selectedAssetTab]);

  // Get available weekly dates from historyData
  const availableWeeklyDates = useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    // Get unique weekly dates from historyData
    const weeklyDates = new Set();
    historyData.forEach(item => {
      if (item.captureType?.toUpperCase() === 'WEEKLY' && item.date) {
        const date = item.dateNormalized || item.date;
        if (date instanceof Date) {
          // Normalize to start of week (Monday)
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
          weekStart.setHours(0, 0, 0, 0);
          weeklyDates.add(weekStart.getTime());
        }
      }
    });
    
    // Convert to sorted array of Date objects
    return Array.from(weeklyDates)
      .map(timestamp => new Date(timestamp))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [historyData]);

  // Find closest weekly snapshot date for a given date
  const findClosestWeeklyDate = (targetDate) => {
    if (!targetDate || availableWeeklyDates.length === 0) return null;
    
    const targetTime = targetDate.getTime();
    let closest = availableWeeklyDates[0];
    let minDiff = Math.abs(closest.getTime() - targetTime);
    
    for (const date of availableWeeklyDates) {
      const diff = Math.abs(date.getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = date;
      }
    }
    
    return closest;
  };

  // Calculate historical portfolio distribution
  const getHistoricalDistribution = useMemo(() => {
    return (selectedDate) => {
      if (!selectedDate) {
        return { byUser: {}, byStock: {} };
      }
      
      // Find the closest weekly snapshot date
      const snapshotDate = findClosestWeeklyDate(selectedDate);
      if (!snapshotDate) {
        return { byUser: {}, byStock: {} };
      }
      
      // For "By User": Use historyData with WEEKLY captureType
      const byUser = {};
      if (historyData && historyData.length > 0) {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const weeklyData = historyData.filter(item => {
          if (!selectedUsers.has(item.username)) return false;
          if (item.captureType?.toUpperCase() !== 'WEEKLY') return false;
          const itemDate = item.dateNormalized || item.date;
          if (!(itemDate instanceof Date)) return false;
          const diff = Math.abs(itemDate.getTime() - snapshotDate.getTime());
          return diff <= threeDaysMs;
        });
        
        // Sum totalValue per user (take the latest entry per user)
        const userMap = new Map();
        weeklyData.forEach(item => {
          const existing = userMap.get(item.username);
          if (!existing || (item.dateNormalized || item.date) > (existing.dateNormalized || existing.date)) {
            userMap.set(item.username, item);
          }
        });
        
        userMap.forEach((item, username) => {
          byUser[username] = item.totalValue || 0;
        });
      }
      
      // For "By Asset": Use holdingsHistory filtered to the selected week
      const byStock = {};
      if (holdingsHistory && holdingsHistory.length > 0) {
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        const filteredHoldings = holdingsHistory.filter(item => {
          if (!selectedUsers.has(item.username)) return false;
          const itemDate = item.date;
          const diff = Math.abs(itemDate.getTime() - snapshotDate.getTime());
          return diff <= threeDaysMs;
        });
        
        // Group by user and ticker, taking the latest entry per user/ticker combination
        const holdingsMap = new Map();
        filteredHoldings.forEach(item => {
          const key = `${item.username}_${item.ticker}`;
          const existing = holdingsMap.get(key);
          if (!existing || item.date > existing.date) {
            holdingsMap.set(key, item);
          }
        });
        
        // Calculate values using current prices (since we don't have historical prices)
        holdingsMap.forEach((holding) => {
          const { username, ticker, shares } = holding;
          
          // Get price from current portfolio or use default
          let price = 1.0; // Default for CASH/USD/REAL ESTATE
          if (ticker === 'CASH' || ticker === 'USD') {
            price = 1.0;
          } else if (ticker === 'REAL ESTATE') {
            price = 1.0;
          } else {
            // Find price from current portfolio
            const portfolioItem = portfolio.find(p => p.ticker === ticker);
            if (portfolioItem) {
              price = portfolioItem.price || 0;
            }
          }
          
          const value = shares * price;
          
          // Sum by stock
          const stockName = ticker === 'CASH' || ticker === 'USD' ? 'CASH' : ticker === 'REAL ESTATE' ? 'REAL ESTATE' : ticker;
          if (!byStock[stockName]) {
            byStock[stockName] = 0;
          }
          byStock[stockName] += value;
        });
      }
      
      return { byUser, byStock };
    };
  }, [holdingsHistory, historyData, selectedUsers, portfolio, findClosestWeeklyDate]);

  // Data for total value pie chart (by user) - with stable reference to prevent unnecessary re-renders
  const totalValueByUserRef = useRef([]);
  const totalValueByUserKeyRef = useRef('');
  
  const totalValueByUser = useMemo(() => {
    let userTotals = {};
    
    if (pieChartDate) {
      // Use historical data
      const historical = getHistoricalDistribution(pieChartDate);
      userTotals = historical.byUser;
    } else {
      // Use current portfolio data (filtered by asset type)
      filteredPortfolio.forEach(item => {
        // Filter by asset type
        if (item.isCash && !selectedAssetTypes.has('cash')) return;
        if (item.isRealEstate && !selectedAssetTypes.has('realestate')) return;
        if (item.isCrypto && !selectedAssetTypes.has('crypto')) return;
        if (!item.isCash && !item.isRealEstate && !item.isCrypto && !selectedAssetTypes.has('stocks')) return;
        
        if (!userTotals[item.username]) {
          userTotals[item.username] = 0;
        }
        userTotals[item.username] += item.value;
      });
    }
    
    const newData = Object.entries(userTotals)
      .map(([username, value]) => ({
        name: username,
        value: Number(value.toFixed(2)),
      }))
      .filter(item => item.value > 0) // Only include users with value > 0
      .sort((a, b) => b.value - a.value);
    
    // Compare with previous data using JSON string
    const newKey = JSON.stringify(newData.map(d => ({ name: d.name, value: d.value })));
    
    // Only update if data actually changed
    if (newKey !== totalValueByUserKeyRef.current) {
      totalValueByUserKeyRef.current = newKey;
      totalValueByUserRef.current = newData;
    }
    
    return totalValueByUserRef.current;
  }, [filteredPortfolio, pieChartDate, getHistoricalDistribution, selectedAssetTypes]);

  // Data for stock distribution pie chart (by stock across all selected users, including cash) - with stable reference
  const totalValueByStockRef = useRef([]);
  const totalValueByStockKeyRef = useRef('');
  
  const totalValueByStock = useMemo(() => {
    let stockTotals = {};
    
    if (pieChartDate) {
      // Use historical data
      const historical = getHistoricalDistribution(pieChartDate);
      stockTotals = historical.byStock;
    } else {
      // Use current portfolio data (filtered by asset type)
      filteredPortfolio.forEach(item => {
        // Filter by asset type
        if (item.isCash && !selectedAssetTypes.has('cash')) return;
        if (item.isRealEstate && !selectedAssetTypes.has('realestate')) return;
        if (item.isCrypto && !selectedAssetTypes.has('crypto')) return;
        if (!item.isCash && !item.isRealEstate && !item.isCrypto && !selectedAssetTypes.has('stocks')) return;
        
        if (!stockTotals[item.ticker]) {
          stockTotals[item.ticker] = 0;
        }
        stockTotals[item.ticker] += item.value;
      });
    }
    
    const newData = Object.entries(stockTotals)
      .map(([ticker, value]) => ({
        name: ticker === 'CASH' || ticker === 'USD' ? 'CASH' : ticker === 'REAL ESTATE' ? 'REAL ESTATE' : ticker,
        value: Number(value.toFixed(2)),
      }))
      .filter(item => item.value > 0) // Only include stocks with value > 0
      .sort((a, b) => {
        // CASH always first
        if (a.name === 'CASH') return -1;
        if (b.name === 'CASH') return 1;
        // REAL ESTATE always second
        if (a.name === 'REAL ESTATE') return -1;
        if (b.name === 'REAL ESTATE') return 1;
        // Everything else sorted by value (descending)
        return b.value - a.value;
      });
    
    // Compare with previous data using JSON string
    const newKey = JSON.stringify(newData.map(d => ({ name: d.name, value: d.value })));
    
    // Only update if data actually changed
    if (newKey !== totalValueByStockKeyRef.current) {
      totalValueByStockKeyRef.current = newKey;
      totalValueByStockRef.current = newData;
    }
    
    return totalValueByStockRef.current;
  }, [filteredPortfolio, pieChartDate, getHistoricalDistribution, selectedAssetTypes]);

  // Cache for stock distributions with stable references
  const stockDistributionCacheRef = useRef(new Map());
  const stockDistributionKeyCacheRef = useRef(new Map());

  // Data for pie chart by stock (for each stock, show user distribution) - with stable references
  const getStockDistribution = useMemo(() => {
    return (ticker) => {
      const stockItems = filteredPortfolio.filter(item => item.ticker === ticker);
      const userTotals = {};
      
      stockItems.forEach(item => {
        if (!userTotals[item.username]) {
          userTotals[item.username] = 0;
        }
        userTotals[item.username] += item.value;
      });
      
      const newData = Object.entries(userTotals)
        .map(([username, value]) => ({
          name: username,
          value: Number(value.toFixed(2)),
        }))
        .sort((a, b) => b.value - a.value);
      
      // Create key for comparison
      const newKey = JSON.stringify(newData.map(d => ({ name: d.name, value: d.value })));
      
      // Check if we have a cached version for this ticker
      const cachedKey = stockDistributionKeyCacheRef.current.get(ticker);
      
      // Only update if data actually changed
      if (cachedKey !== newKey) {
        stockDistributionKeyCacheRef.current.set(ticker, newKey);
        stockDistributionCacheRef.current.set(ticker, newData);
      }
      
      // Return cached version (stable reference) or new data if ticker not in cache
      return stockDistributionCacheRef.current.get(ticker) || newData;
    };
  }, [filteredPortfolio]);

  // Helper function to render stock/crypto details
  const renderStockDetails = (stock, distribution, distributionKey, isExpanded, isCrypto = false) => {
    if (!holdingRefs.current.has(stock.ticker)) {
      holdingRefs.current.set(stock.ticker, null);
    }
    
    return (
      <motion.div
        ref={(el) => {
          if (el) holdingRefs.current.set(stock.ticker, el);
        }}
        key={stock.ticker}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-t border-slate-700 pt-6"
      >
        <div className="space-y-6">
          {/* Stock/Crypto Header - Clickable to toggle */}
          <div 
            className="flex items-start justify-between cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
            onClick={() => toggleHolding(stock.ticker)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`text-3xl font-bold mb-1 ${isCrypto ? 'text-yellow-400' : 'text-white'}`}>
                  {stock.fullQuote?.symbol || stock.ticker}
                </h4>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
              {stock.fullQuote?.name && !isCrypto && (
                <p className="text-slate-400 text-sm mb-3">{stock.fullQuote.name}</p>
              )}
              {!isExpanded && (
                <div className="flex flex-col items-start">
                  <div className="text-2xl font-bold text-white mb-1">
                    ${stock.price.toFixed(2)}
                  </div>
                  {!isCrypto && stock.fullQuote?.changePercent !== undefined && (
                    <div className={`text-sm font-semibold ${
                      (stock.fullQuote.changePercent || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(stock.fullQuote.changePercent || 0) >= 0 ? '+' : ''}
                      {(stock.fullQuote.changePercent || 0).toFixed(2)}%
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isExpanded && (
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  ${(stock.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-sm text-slate-400 mb-2">Total Value</p>
                <p className="text-base text-slate-400 font-semibold mb-2">
                  {isCrypto ? 'Coin Amount' : 'Total Shares'}: {(stock.totalShares || 0).toFixed(isCrypto ? 8 : 2)}
                </p>
              </div>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && distribution.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="flex flex-col">
                <h5 className="text-lg font-semibold text-white mb-1">
                  Distribution by User
                </h5>
                <div className="flex-shrink-0" style={{ height: '256px' }}>
                  <ResponsiveContainer width="100%" height="100%" key={`${isCrypto ? 'crypto' : 'stock'}-pie-${distributionKey}`}>
                    <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
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
                      loadHoldingsHistory(true);
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
    if (!ticker || selectedUsers.size === 0) {
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
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get holdings from HoldingsHistory that are at least 30 days old
    // Only for selected users - we want the most recent entry that is at least 30 days old
    const holdings30DaysAgo = new Map();
    
    if (holdingsHistory.length > 0) {
      holdingsHistory
        .filter(item => item.ticker === ticker && selectedUsers.has(item.username))
        .forEach(item => {
          const itemDate = new Date(item.date);
          const isAtLeast30DaysOld = itemDate <= thirtyDaysAgo;
          
          // Only consider entries that are at least 30 days old
          if (!isAtLeast30DaysOld) {
            return;
          }
          
          const existing = holdings30DaysAgo.get(item.username);
          
          if (!existing) {
            // No existing entry - store this one
            holdings30DaysAgo.set(item.username, {
              username: item.username,
              shares: item.shares,
              date: item.date,
            });
          } else {
            // We have an existing entry - keep the most recent one (closest to 30 days ago)
            const existingDate = new Date(existing.date);
            if (itemDate > existingDate) {
              holdings30DaysAgo.set(item.username, {
                username: item.username,
                shares: item.shares,
                date: item.date,
              });
            }
          }
        });
    }
    
    // Calculate gains for each user (only selected users)
    const gains = [];
    
    // Calculate gains for users who have current holdings
    currentHoldings.forEach((currentShares, username) => {
      // Only process selected users
      if (!selectedUsers.has(username)) {
        return;
      }
      
      const historical = holdings30DaysAgo.get(username);
      
      // If no historical record exists dating back 30 days,
      // assume the entire current position is a gain (oldShares = 0)
      const oldShares = historical ? historical.shares : 0;
      
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
    
    // Also include selected users who had holdings 30+ days ago but don't have any now (negative gain)
    holdings30DaysAgo.forEach((historical, username) => {
      // Only process selected users
      if (!selectedUsers.has(username)) {
        return;
      }
      
      // holdings30DaysAgo already only contains entries that are at least 30 days old
      if (!currentHoldings.has(username)) {
        const currentShares = 0;
        const gain = currentShares - historical.shares;
        // Only include if gain is non-zero (negative gain means they sold all shares)
        if (gain !== 0) {
          gains.push({
            username,
            gain,
            currentShares,
            oldShares: historical.shares,
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

  // Memoize renderLabel to prevent unnecessary re-renders of pie chart labels
  const renderLabel = useMemo(() => {
    return (entry) => {
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
  }, [totalValue]);

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
        className="flex items-center gap-2 sm:gap-3"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-500" />
        </motion.div>
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Analytics</h2>
          <p className="text-slate-400 text-sm sm:text-base">Portfolio insights for selected users</p>
        </div>
      </motion.div>

      {/* User Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Select Users</h3>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={selectAll}
              className="btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Select All
            </motion.button>
            <motion.button
              onClick={deselectAll}
              className="btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Deselect All
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {allUsers.map((username, index) => (
            <motion.button
              key={username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleUser(username)}
              className={`p-2 sm:p-3 rounded-lg border transition-all text-left ${
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

      {/* Asset Type Filters - Applies to entire analytics page */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
          <h3 className="text-lg sm:text-xl font-bold text-white">Filter by Asset Type</h3>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { key: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-blue-400' },
            { key: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-400' },
            { key: 'realestate', label: 'Real Estate', icon: Home, color: 'text-amber-400' },
            { key: 'crypto', label: 'Crypto', icon: Coins, color: 'text-yellow-400' },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => {
                const newSet = new Set(selectedAssetTypes);
                if (newSet.has(key)) {
                  newSet.delete(key);
                } else {
                  newSet.add(key);
                }
                setSelectedAssetTypes(newSet);
              }}
              className={`flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedAssetTypes.has(key)
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedAssetTypes.has(key) ? color : 'text-slate-500'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Total Value and Dividends */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 sm:p-6"
        >
          <div className="text-center">
            <p className="text-slate-400 mb-2 text-sm sm:text-base">Total Portfolio Value</p>
            <motion.p
              key={totalValue}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4"
            >
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.p>
            <p className="text-xs sm:text-sm text-slate-500">
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
          className="card p-4 sm:p-6 max-[600px]:px-0 max-[600px]:mx-[-0.75rem] max-[600px]:w-[calc(100%+1.5rem)]"
          style={{ position: 'relative', zIndex: 1000 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 max-[600px]:px-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Portfolio Value Over Time</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {/* Chart Type Toggle */}
              <div className="flex gap-1 sm:gap-2 bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2 py-1 sm:px-3 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                    chartType === 'line'
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('stacked')}
                  className={`px-2 py-1 sm:px-3 rounded text-[10px] sm:text-xs font-medium transition-colors ${
                    chartType === 'stacked'
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Stacked
                </button>
              </div>
              
              {/* Time Period Toggles */}
              <div className="flex gap-1 sm:gap-2 bg-slate-800 rounded-lg p-1 overflow-x-auto">
                {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-2 py-1 sm:px-3 rounded text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
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
          </div>
          
          {chartType === 'line' ? (
            <PortfolioValueChart 
              historyData={historyData}
              selectedUsers={selectedUsers}
              timePeriod={timePeriod}
              currentTotalValue={totalValue}
              portfolio={portfolio}
              selectedAssetTypes={selectedAssetTypes}
            />
          ) : (
            <StackedAreaChart 
              historyData={historyData}
              dailyTotalsData={dailyTotalsData}
              selectedUsers={selectedUsers}
              timePeriod={timePeriod}
              currentTotalValue={totalValue}
              selectedAssetTypes={selectedAssetTypes}
            />
          )}
        </motion.div>
      )}

      {/* Total Value Distribution Pie Charts */}
      {totalValueByUser.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 sm:p-6"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
            <h3 className="text-lg sm:text-xl font-bold text-white">Total Value Distribution</h3>
          </div>
          
          {/* Date Slider */}
          {availableWeeklyDates.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <label className="text-xs sm:text-sm text-slate-400">
                  {pieChartDate ? `Viewing data from: ${pieChartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Current Portfolio'}
                </label>
                <button
                  onClick={() => setPieChartDate(null)}
                  className={`text-xs px-2 py-1 sm:px-3 rounded transition-colors self-start sm:self-auto ${
                    pieChartDate === null
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Current
                </button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, availableWeeklyDates.length - 1)}
                  value={(() => {
                    if (!pieChartDate) return availableWeeklyDates.length - 1;
                    const index = availableWeeklyDates.findIndex(d => d.getTime() === pieChartDate.getTime());
                    return index >= 0 ? index : availableWeeklyDates.length - 1;
                  })()}
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    if (index >= 0 && index < availableWeeklyDates.length) {
                      setPieChartDate(availableWeeklyDates[index]);
                    }
                  }}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  style={{
                    background: (() => {
                      const maxIndex = Math.max(0, availableWeeklyDates.length - 1);
                      const currentIndex = pieChartDate 
                        ? (availableWeeklyDates.findIndex(d => d.getTime() === pieChartDate.getTime()) >= 0 
                            ? availableWeeklyDates.findIndex(d => d.getTime() === pieChartDate.getTime())
                            : maxIndex)
                        : maxIndex;
                      const percentage = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0;
                      return `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`;
                    })()
                  }}
                />
                <div className="text-xs text-slate-400 min-w-[60px] sm:min-w-[80px] text-right text-[10px] sm:text-xs">
                  {availableWeeklyDates.length > 0 && (
                    <>
                      {availableWeeklyDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {availableWeeklyDates[availableWeeklyDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* User Distribution Pie Chart */}
            <MemoizedUserDistributionChart 
              data={totalValueByUser}
              renderLabel={renderLabel}
              CustomTooltip={CustomTooltip}
            />

            {/* Stock Distribution Pie Chart */}
            {totalValueByStock.length > 0 && (
              <MemoizedStockDistributionChart 
                data={totalValueByStock}
                renderLabel={renderLabel}
                CustomTooltip={CustomTooltip}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Stock Totals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
          <h3 className="text-lg sm:text-xl font-bold text-white">Asset Holdings</h3>
        </div>
        
        {/* Asset Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(() => {
            const tabs = [
              { key: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-400' },
              { key: 'realestate', label: 'Real Estate', icon: Home, color: 'text-amber-400' },
              { key: 'stocks', label: 'Stocks', icon: TrendingUp, color: 'text-blue-400' },
              { key: 'crypto', label: 'Crypto', icon: Coins, color: 'text-yellow-400' },
            ];
            
            // Calculate holdings for each tab
            const tabsWithHoldings = tabs.map(tab => {
              const holdings = stockTotals.filter(s => 
                (tab.key === 'cash' && s.isCash) ||
                (tab.key === 'realestate' && s.isRealEstate) ||
                (tab.key === 'stocks' && !s.isCash && !s.isRealEstate && !s.isCrypto) ||
                (tab.key === 'crypto' && s.isCrypto)
              );
              return { ...tab, holdings, hasHoldings: holdings.length > 0 };
            });
            
            // Determine active tab (auto-select first available if none selected)
            const activeTab = selectedAssetTab || tabsWithHoldings.find(t => t.hasHoldings)?.key || null;
            
            return tabsWithHoldings.map(({ key, label, icon: Icon, color, holdings, hasHoldings }) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedAssetTab(key);
                  // Reset sub-tabs when switching main tabs
                  if (key !== 'stocks') setOpenStockTickers(new Set());
                  if (key !== 'crypto') setOpenCryptoTickers(new Set());
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                } ${!hasHoldings ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!hasHoldings}
              >
                <Icon className={`w-4 h-4 ${activeTab === key ? 'text-white' : color}`} />
                <span>{label}</span>
                {hasHoldings && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    activeTab === key ? 'bg-white/20' : 'bg-slate-700'
                  }`}>
                    {holdings.length}
                  </span>
                )}
              </button>
            ));
          })()}
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Render content based on selected tab */}
          {(() => {
            const cashHoldings = stockTotals.filter(s => s.isCash);
            const realEstateHoldings = stockTotals.filter(s => s.isRealEstate);
            const stockHoldings = stockTotals.filter(s => !s.isCash && !s.isRealEstate && !s.isCrypto);
            const cryptoHoldings = stockTotals.filter(s => s.isCrypto);
            
            // Determine active tab (use selectedAssetTab, fallback to first available)
            const activeTab = selectedAssetTab || 
              (cashHoldings.length > 0 ? 'cash' : 
               realEstateHoldings.length > 0 ? 'realestate' :
               stockHoldings.length > 0 ? 'stocks' :
               cryptoHoldings.length > 0 ? 'crypto' : null);
            
            // CASH Tab
            if (activeTab === 'cash' && cashHoldings.length > 0) {
              const stock = cashHoldings[0];
              const distribution = getStockDistribution(stock.ticker);
              const distributionKey = stockDistributionKeyCacheRef.current.get(stock.ticker) || '';
              const isExpanded = expandedHoldings.has(stock.ticker);
              
              if (!holdingRefs.current.has(stock.ticker)) {
                holdingRefs.current.set(stock.ticker, null);
              }
              
              return (
                <motion.div
                  ref={(el) => {
                    if (el) holdingRefs.current.set(stock.ticker, el);
                  }}
                  key={stock.ticker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-b border-slate-700 pb-6"
                >
                  <div className="space-y-6">
                    {/* CASH Header - Clickable to toggle */}
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                      onClick={() => toggleHolding(stock.ticker)}
                    >
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-3xl font-bold text-green-400 mb-1">CASH</h4>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">Cash Holdings</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          ${(stock.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Total Cash Value</p>
                      </div>
                    </div>

                    {/* User Distribution and Position Changes for CASH */}
                    {isExpanded && distribution.length > 0 && (
                      <div className="relative grid md:grid-cols-2 gap-6 mt-6">
                        {/* Cash Particles Animation */}
                        <CashParticlesAnimation trigger={animationTrigger[stock.ticker]} distribution={distribution} />
                        
                        <div className="flex flex-col">
                          <h5 className="text-lg font-semibold text-white mb-1">
                            Distribution by User
                          </h5>
                          <div className="flex-shrink-0" style={{ height: '256px' }}>
                            <ResponsiveContainer width="100%" height="100%" key={`cash-pie-${distributionKey}`}>
                              <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                <Pie
                                  data={distribution}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={renderLabel}
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
                                loadHoldingsHistory(true);
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
            
            // REAL ESTATE Tab
            if (activeTab === 'realestate' && realEstateHoldings.length > 0) {
              const stock = realEstateHoldings[0];
              const distribution = getStockDistribution(stock.ticker);
              const distributionKey = stockDistributionKeyCacheRef.current.get(stock.ticker) || '';
              const isExpanded = expandedHoldings.has(stock.ticker);
              
              if (!holdingRefs.current.has(stock.ticker)) {
                holdingRefs.current.set(stock.ticker, null);
              }
              
              return (
                <motion.div
                  ref={(el) => {
                    if (el) holdingRefs.current.set(stock.ticker, el);
                  }}
                  key={stock.ticker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-b border-slate-700 pb-6"
                >
                  <div className="space-y-6">
                    {/* REAL ESTATE Header - Clickable to toggle */}
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-2 rounded-lg transition-colors"
                      onClick={() => toggleHolding(stock.ticker)}
                    >
                      <div className="p-3 bg-amber-600/20 rounded-lg" style={{ backgroundColor: 'rgba(204, 119, 34, 0.2)' }}>
                        <Home className="w-6 h-6 text-amber-600" style={{ color: '#CC7722' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-3xl font-bold text-amber-600 mb-1" style={{ color: '#CC7722' }}>REAL ESTATE</h4>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">Real Estate Holdings</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          ${(stock.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">Total Real Estate Value</p>
                      </div>
                    </div>

                    {/* User Distribution and Position Changes for REAL ESTATE */}
                    {isExpanded && (
                      <>
                        {distribution.length > 0 && (
                          <div className="relative grid md:grid-cols-2 gap-6 mt-6">
                            {/* Property Value Appreciation Animation */}
                            {animationTrigger[stock.ticker] && (
                              <div className="absolute inset-0 pointer-events-none overflow-visible z-10" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
                                <RealEstateAnimation trigger={animationTrigger[stock.ticker]} />
                              </div>
                            )}
                            
                            <div className="flex flex-col">
                              <h5 className="text-lg font-semibold text-white mb-1">
                                Distribution by User
                              </h5>
                              <div className="flex-shrink-0" style={{ height: '256px' }}>
                                <ResponsiveContainer width="100%" height="100%" key={`re-pie-${distributionKey}`}>
                                  <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                    <Pie
                                      data={distribution}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={renderLabel}
                                      outerRadius={80}
                                      innerRadius={0}
                                      startAngle={90}
                                      endAngle={-270}
                                      paddingAngle={0}
                                      stroke="none"
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {distribution.map((entry, index) => {
                                        const isRealEstate = entry.name === 'REAL ESTATE';
                                        const fillColor = isRealEstate ? '#CC7722' : COLORS[index % COLORS.length];
                                        return (
                                          <Cell key={`cell-${index}`} fill={fillColor} stroke="none" />
                                        );
                                      })}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex-grow pt-1">
                                <div className="flex flex-wrap justify-center gap-4">
                                  {distribution.map((entry, index) => {
                                    const isRealEstate = entry.name === 'REAL ESTATE';
                                    const color = isRealEstate ? '#CC7722' : COLORS[index % COLORS.length];
                                    return (
                                      <div key={`legend-${index}`} className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: color }}
                                        />
                                        <span className={`text-sm ${isRealEstate ? 'text-amber-600' : 'text-slate-300'}`} style={isRealEstate ? { color: '#CC7722' } : {}}>{entry.name}</span>
                                      </div>
                                    );
                                  })}
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
                                    loadHoldingsHistory(true);
                                  } catch (error) {
                                    console.error('Error submitting chat:', error);
                                    alert(`Failed to submit chat: ${error.message}`);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            }
            
            // STOCKS Tab - Show sub-tabs for each stock
            if (activeTab === 'stocks') {
              if (stockHoldings.length === 0) {
                return (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">No stock holdings found</p>
                  </div>
                );
              }
              
              // Show accordion-style list view for stocks
              return (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Select a Stock</h4>
                  <div className="space-y-0">
                    {stockHoldings.map((stock) => {
                      // Calculate daily change metrics
                      const changePercent = stock.fullQuote?.changePercent || 0;
                      const changePerShare = stock.fullQuote?.change || 0;
                      const dollarChange = changePerShare * (stock.totalShares || 0);
                      const isPositive = dollarChange >= 0;
                      const isPositivePerShare = changePerShare >= 0;
                      const currentPrice = stock.price || stock.fullQuote?.price || 0;
                      const isOpen = openStockTickers.has(stock.ticker);
                      const quote = stock.fullQuote || {};
                      
                      return (
                        <div
                          key={stock.ticker}
                          className="border-b border-slate-700"
                        >
                          {/* Clickable header */}
                          <div
                            onClick={() => {
                              const wasOpen = openStockTickers.has(stock.ticker);
                              setOpenStockTickers(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(stock.ticker)) {
                                  newSet.delete(stock.ticker);
                                } else {
                                  newSet.add(stock.ticker);
                                }
                                return newSet;
                              });
                              // Scroll to content if opening (not closing)
                              if (!wasOpen) {
                                setTimeout(() => {
                                  const element = document.querySelector(`[data-stock-ticker="${stock.ticker}"]`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 150);
                              }
                            }}
                            className="py-4 px-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              {/* Left Column: Asset Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-2xl font-bold text-white">
                                    {quote.symbol || stock.ticker}
                                  </h4>
                                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                                {quote.name && (
                                  <p className="text-sm text-slate-400 mb-2">{quote.name}</p>
                                )}
                                <div className="text-xl font-bold text-white mb-1">
                                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-sm font-medium ${isPositivePerShare ? 'text-green-400' : 'text-red-400'}`}>
                                  {isPositivePerShare ? '+' : ''}${changePerShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositivePerShare ? '+' : ''}{changePercent.toFixed(2)}%)
                                </div>
                              </div>
                              
                              {/* Right Column: Portfolio Summary */}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">
                                  ${(stock.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-sm text-slate-400 mb-2">Total Value</p>
                                <p className="text-sm text-slate-400 mb-2">
                                  Total Shares: {(stock.totalShares || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-400 mb-1">Total Daily Change</p>
                                <div className={`text-sm font-medium flex items-center justify-end gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                  {isPositive ? (
                                    <span>↑</span>
                                  ) : (
                                    <span>↓</span>
                                  )}
                                  {isPositive ? '+' : ''}${dollarChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded content with full detailed view */}
                          {isOpen && (() => {
                            const distribution = getStockDistribution(stock.ticker);
                            const distributionKey = stockDistributionKeyCacheRef.current.get(stock.ticker) || '';
                            const yearlyDividend = (stock.totalYearlyDividend || 0);
                            const dividendYield = quote.dividendYield || 0; // Already a percentage from spreadsheet (e.g., 3.2 = 3.2%)
                            const changePerShare = quote.change || 0;
                            const changePercent = quote.changePercent || 0;
                            const isPositiveChange = changePerShare >= 0;
                            
                            return (
                              <div 
                                data-stock-ticker={stock.ticker}
                                className="px-4 pb-4 pt-4 relative overflow-hidden"
                              >
                                {/* Animated Arrow Background - One-time animation on open */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute inset-0 pointer-events-none overflow-hidden"
                                    >
                                      {/* Animated arrows based on direction - one-time animation */}
                                      {Array.from({ length: 12 }).map((_, i) => {
                                        // When stock is down (negative change), arrows point down
                                        // When stock is up or even (positive/zero change), arrows point up
                                        const ArrowIcon = isPositiveChange ? ArrowUp : ArrowDown;
                                        const color = isPositiveChange ? 'text-green-400/60' : 'text-red-400/60';
                                        // Deterministic positioning based on index for stable animation
                                        const delay = i * 0.05;
                                        const left = 5 + ((i * 7.5) % 90);
                                        const duration = 1.2;
                                        // For up arrows: start from bottom, move up
                                        // For down arrows: start from top, move down
                                        const startY = isPositiveChange ? 100 : -100;
                                        const endY = isPositiveChange ? -30 : 30;
                                        
                                        return (
                                          <motion.div
                                            key={`arrow-${stock.ticker}-${i}`}
                                            initial={{ 
                                              y: startY,
                                              opacity: 0,
                                              scale: 0.3
                                            }}
                                            animate={{ 
                                              y: endY,
                                              opacity: [0, 0.8, 0.8, 0],
                                              scale: [0.3, 1.2, 1, 0.3]
                                            }}
                                            transition={{
                                              duration: duration,
                                              delay: delay,
                                              ease: [0.4, 0, 0.6, 1], // Custom easing for smooth motion
                                              times: [0, 0.3, 0.7, 1] // Control opacity timing
                                            }}
                                            className={`absolute ${color}`}
                                            style={{ 
                                              left: `${left}%`,
                                              top: isPositiveChange ? '85%' : '15%'
                                            }}
                                          >
                                            <ArrowIcon className="w-5 h-5 drop-shadow-lg" />
                                          </motion.div>
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Summary Statistics - 3 columns */}
                                <div className="mb-6">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Dividend Yield</p>
                                      <p className="text-xl font-bold text-white">{dividendYield.toFixed(2)}%</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Yearly Dividend</p>
                                      <p className="text-xl font-bold text-primary-400">${yearlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Shares Held</p>
                                      <p className="text-xl font-bold text-white">{(stock.totalShares || 0).toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Price Range and Key Metrics - Two Columns */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                  {/* Left Column: Price Range */}
                                  <div>
                                    <h5 className="text-lg font-semibold text-white mb-3">Price Range</h5>
                                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                                      {quote.dayLow !== undefined && quote.dayHigh !== undefined && (
                                        <div className="mb-6">
                                          <div className="flex justify-between text-xs text-slate-400 mb-2">
                                            <span>Day Low</span>
                                            <span>Day High</span>
                                          </div>
                                          <div className="mb-6">
                                            {(() => {
                                              const pricePercent = Math.max(0, Math.min(100, ((currentPrice - quote.dayLow) / (quote.dayHigh - quote.dayLow)) * 100));
                                              return (
                                                <>
                                                  {/* Bar container */}
                                                  <div className="relative h-8 rounded-full overflow-hidden">
                                                    {/* Colored portion (left) - transparent blue */}
                                                    <div 
                                                      className="absolute left-0 top-0 bottom-0 bg-blue-500/40 rounded-l-full"
                                                      style={{ width: `${pricePercent}%` }}
                                                    ></div>
                                                    {/* Grey portion (right) - transparent grey */}
                                                    <div 
                                                      className="absolute right-0 top-0 bottom-0 bg-slate-600/30 rounded-r-full"
                                                      style={{ width: `${100 - pricePercent}%` }}
                                                    ></div>
                                                    {/* Current price marker line */}
                                                    <div 
                                                      className="absolute top-0 bottom-0 w-0.5 bg-blue-400 z-10"
                                                      style={{ left: `${pricePercent}%` }}
                                                    ></div>
                                                  </div>
                                                  {/* Values below bar - low, current (centered), and high */}
                                                  <div className="relative mt-2 w-full flex items-end justify-between" style={{ height: '24px' }}>
                                                    {/* Day Low - left aligned */}
                                                    <div className="text-xs text-white font-medium whitespace-nowrap">
                                                      ${quote.dayLow.toFixed(2)}
                                                    </div>
                                                    {/* Current price - centered in container */}
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-blue-400 font-semibold whitespace-nowrap" style={{ bottom: 0 }}>
                                                      ${currentPrice.toFixed(2)}
                                                    </div>
                                                    {/* Day High - right aligned */}
                                                    <div className="text-xs text-white font-medium whitespace-nowrap">
                                                      ${quote.dayHigh.toFixed(2)}
                                                    </div>
                                                  </div>
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                      {quote.week52Low !== undefined && quote.week52High !== undefined && (
                                        <div>
                                          <div className="flex justify-between text-xs text-slate-400 mb-2">
                                            <span>52w Low</span>
                                            <span>52w High</span>
                                          </div>
                                          <div className="mb-2">
                                            {(() => {
                                              const pricePercent = Math.max(0, Math.min(100, ((currentPrice - quote.week52Low) / (quote.week52High - quote.week52Low)) * 100));
                                              return (
                                                <>
                                                  {/* Bar container */}
                                                  <div className="relative h-8 rounded-full overflow-hidden">
                                                    {/* Colored portion (left) - transparent green */}
                                                    <div 
                                                      className="absolute left-0 top-0 bottom-0 bg-green-500/40 rounded-l-full"
                                                      style={{ width: `${pricePercent}%` }}
                                                    ></div>
                                                    {/* Grey portion (right) - transparent grey */}
                                                    <div 
                                                      className="absolute right-0 top-0 bottom-0 bg-slate-600/30 rounded-r-full"
                                                      style={{ width: `${100 - pricePercent}%` }}
                                                    ></div>
                                                    {/* Current price marker line */}
                                                    <div 
                                                      className="absolute top-0 bottom-0 w-0.5 bg-green-400 z-10"
                                                      style={{ left: `${pricePercent}%` }}
                                                    ></div>
                                                  </div>
                                                  {/* Values below bar - low, current (centered), and high */}
                                                  <div className="relative mt-2 w-full flex items-end justify-between" style={{ height: '24px' }}>
                                                    {/* 52w Low - left aligned */}
                                                    <div className="text-xs text-white font-medium whitespace-nowrap">
                                                      ${quote.week52Low.toFixed(2)}
                                                    </div>
                                                    {/* Current price - centered in container */}
                                                    <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-semibold whitespace-nowrap" style={{ bottom: 0 }}>
                                                      ${currentPrice.toFixed(2)}
                                                    </div>
                                                    {/* 52w High - right aligned */}
                                                    <div className="text-xs text-white font-medium whitespace-nowrap">
                                                      ${quote.week52High.toFixed(2)}
                                                    </div>
                                                  </div>
                                                </>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right Column: Key Metrics */}
                                  <div>
                                    <h5 className="text-lg font-semibold text-white mb-3">Key Metrics</h5>
                                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        {quote.priceOpen !== undefined && (
                                          <div>
                                            <p className="text-xs text-slate-400 mb-1">Price Open</p>
                                            <p className="text-lg font-bold text-white">${quote.priceOpen.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                          </div>
                                        )}
                                        {quote.volume !== undefined && quote.volume !== null && (
                                          <div>
                                            <p className="text-xs text-slate-400 mb-1">Volume</p>
                                            <p className="text-lg font-bold text-white">
                                              {quote.volume >= 1000000 
                                                ? `${(quote.volume / 1000000).toFixed(2)}M`
                                                : quote.volume >= 1000
                                                ? `${(quote.volume / 1000).toFixed(2)}K`
                                                : quote.volume.toLocaleString()}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-xs text-slate-400 mb-1">Change %</p>
                                          <div className={`text-lg font-bold ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositiveChange ? '+' : ''}${changePerShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isPositiveChange ? '+' : ''}{changePercent.toFixed(2)}%)
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-xs text-slate-400 mb-1">Dividend Yield</p>
                                          <p className="text-lg font-bold text-white">{dividendYield.toFixed(2)}%</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Distribution by User and Position Changes */}
                                {distribution.length > 0 && (
                                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div className="flex flex-col">
                                      <h5 className="text-lg font-semibold text-white mb-1">
                                        Distribution by User
                                      </h5>
                                      <div className="flex-shrink-0" style={{ height: '256px' }}>
                                        <ResponsiveContainer width="100%" height="100%" key={`stock-pie-${distributionKey}`}>
                                          <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                            <Pie
                                              data={distribution}
                                              cx="50%"
                                              cy="50%"
                                              labelLine={false}
                                              label={renderLabel}
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
                                            loadHoldingsHistory(true);
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
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // CRYPTO Tab - Show accordion-style list view for crypto
            if (activeTab === 'crypto') {
              if (cryptoHoldings.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">No crypto holdings found</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Select a Crypto</h4>
                  <div className="space-y-0">
                    {cryptoHoldings.map((crypto) => {
                      const isOpen = openCryptoTickers.has(crypto.ticker);
                      const totalValue = crypto.totalValue || 0;
                      const coinAmount = crypto.totalShares || 0;
                      const price = crypto.price || 0;
                      
                      return (
                        <div
                          key={crypto.ticker}
                          className="border-b border-slate-700"
                        >
                          {/* Clickable header */}
                          <div
                            onClick={() => {
                              const wasOpen = openCryptoTickers.has(crypto.ticker);
                              setOpenCryptoTickers(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(crypto.ticker)) {
                                  newSet.delete(crypto.ticker);
                                } else {
                                  newSet.add(crypto.ticker);
                                }
                                return newSet;
                              });
                              // Scroll to content if opening (not closing)
                              if (!wasOpen) {
                                setTimeout(() => {
                                  const element = document.querySelector(`[data-crypto-ticker="${crypto.ticker}"]`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 150);
                              }
                            }}
                            className="py-4 px-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              {/* Left Column: Asset Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-2xl font-bold text-yellow-400">
                                    {crypto.ticker}
                                  </h4>
                                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                                <div className="text-xl font-bold text-white mb-1">
                                  ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-sm text-slate-400">
                                  Price per unit
                                </div>
                              </div>
                              
                              {/* Right Column: Portfolio Summary */}
                              <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">
                                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-sm text-slate-400 mb-2">Total Value</p>
                                <p className="text-sm text-slate-400 mb-2">
                                  Coin Amount: {coinAmount.toFixed(8)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded content - Full detailed view with pie chart and leaderboard */}
                          {isOpen && (() => {
                            const distribution = getStockDistribution(crypto.ticker);
                            const distributionKey = stockDistributionKeyCacheRef.current.get(crypto.ticker) || '';
                            
                            return (
                              <div 
                                data-crypto-ticker={crypto.ticker}
                                className="px-4 pb-4 pt-4 relative overflow-hidden"
                              >
                                {/* Animated Crypto Coins Background - One-time animation on open */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute inset-0 pointer-events-none overflow-hidden"
                                    >
                                      {/* Animated floating coins */}
                                      {Array.from({ length: 15 }).map((_, i) => {
                                        // Deterministic positioning based on index for stable animation
                                        const delay = i * 0.06;
                                        const left = 5 + ((i * 6) % 90);
                                        const duration = 2 + ((i * 0.2) % 1);
                                        const startY = 100;
                                        const endY = -50;
                                        const rotation = (i * 45) % 360;
                                        
                                        return (
                                          <motion.div
                                            key={`coin-${crypto.ticker}-${i}`}
                                            initial={{ 
                                              y: startY,
                                              opacity: 0,
                                              scale: 0.3,
                                              rotate: 0
                                            }}
                                            animate={{ 
                                              y: endY,
                                              opacity: [0, 0.8, 0.8, 0],
                                              scale: [0.3, 1.2, 1, 0.3],
                                              rotate: [0, rotation, rotation * 2, rotation * 3]
                                            }}
                                            transition={{
                                              duration: duration,
                                              delay: delay,
                                              ease: [0.4, 0, 0.6, 1],
                                              times: [0, 0.3, 0.7, 1]
                                            }}
                                            className="absolute text-yellow-400/60"
                                            style={{ 
                                              left: `${left}%`,
                                              top: '80%',
                                              filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))'
                                            }}
                                          >
                                            <Coins className="w-6 h-6" />
                                          </motion.div>
                                        );
                                      })}
                                      {/* Additional sparkle effects */}
                                      {Array.from({ length: 8 }).map((_, i) => {
                                        const delay = (i * 0.1) + 0.3;
                                        const left = 10 + ((i * 11) % 80);
                                        const top = 20 + ((i * 12) % 60);
                                        
                                        return (
                                          <motion.div
                                            key={`sparkle-${crypto.ticker}-${i}`}
                                            initial={{ 
                                              scale: 0,
                                              opacity: 0
                                            }}
                                            animate={{ 
                                              scale: [0, 1.5, 0],
                                              opacity: [0, 1, 0]
                                            }}
                                            transition={{
                                              duration: 0.8,
                                              delay: delay,
                                              repeat: 1,
                                              ease: "easeInOut"
                                            }}
                                            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                            style={{ 
                                              left: `${left}%`,
                                              top: `${top}%`,
                                              boxShadow: '0 0 8px rgba(250, 204, 21, 0.8)'
                                            }}
                                          />
                                        );
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Summary Statistics */}
                                <div className="mb-6">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Total Value</p>
                                      <p className="text-xl font-bold text-white">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Coin Amount</p>
                                      <p className="text-xl font-bold text-white">{coinAmount.toFixed(8)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Current Price</p>
                                      <p className="text-xl font-bold text-yellow-400">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Distribution by User and Position Changes */}
                                {distribution.length > 0 && (
                                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                                    <div className="flex flex-col">
                                      <h5 className="text-lg font-semibold text-white mb-1">
                                        Distribution by User
                                      </h5>
                                      <div className="flex-shrink-0" style={{ height: '256px' }}>
                                        <ResponsiveContainer width="100%" height="100%" key={`crypto-pie-${distributionKey}`}>
                                          <RechartsPieChart margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                                            <Pie
                                              data={distribution}
                                              cx="50%"
                                              cy="50%"
                                              labelLine={false}
                                              label={renderLabel}
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
                                        ticker={crypto.ticker} 
                                        gains={getStockGains(crypto.ticker)} 
                                        getChatsForUserAndTicker={getChatsForTicker}
                                        allUsers={allUsers}
                                        postingUser={postingUser}
                                        setPostingUser={setPostingUser}
                                        onChatSubmit={async (ticker, message, postingUser, positionUsername) => {
                                          try {
                                            await updateHoldingsHistoryChat(ticker, message, postingUser, positionUsername);
                                            loadHoldingsHistory(true);
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
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            return null;
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
// Helper function to parse timestamp from Sheet1 format (YYYY-MM-DDTHH:mm:ss-HH:MM)
const parseSheet1Timestamp = (timestampStr) => {
  if (!timestampStr || !timestampStr.trim()) {
    return null;
  }
  
  try {
    // Format: YYYY-MM-DDTHH:mm:ss-HH:MM (e.g., 2025-11-05T13:44:16-05:00)
    // Parse using the Date constructor which handles ISO-like strings with timezone offset
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error('Error parsing timestamp:', timestampStr, error);
    return null;
  }
};

// Helper function to calculate filtered total value based on selected asset types
const calculateFilteredValue = (item, selectedAssetTypes) => {
  let value = 0;
  if (selectedAssetTypes.has('stocks')) value += (item.stockValue || 0);
  if (selectedAssetTypes.has('cash')) value += (item.cashValue || 0);
  if (selectedAssetTypes.has('realestate')) value += (item.realEstateValue || 0);
  if (selectedAssetTypes.has('crypto')) value += (item.cryptoValue || 0);
  return value;
};

const PortfolioValueChart = ({ historyData, selectedUsers, timePeriod, currentTotalValue, portfolio = [], selectedAssetTypes = new Set(['stocks', 'cash', 'realestate', 'crypto']) }) => {
  // Detect if screen is below 600px
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
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
            // For 1D, start at 12:00 AM (midnight) of today, not yesterday
            startDate = new Date(todayDateObj);
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
        // For 1D, include only today's data (starting at 12:00 AM); for other views, exclude today (we add current value separately)
        const dateFiltered = filtered.filter(item => {
          if (timePeriod === '1D') {
            // For 1D, include only data from today (starting at 12:00 AM midnight)
            // Strictly check that the date string matches today's date string
            // Also check that the actual date object is >= today's midnight
            const itemDate = item.date || item.dateNormalized;
            const itemDateStr = item.dateStr || `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
            
            // Only include items from today - both date string and timestamp must match
            return itemDateStr === todayDateStr && itemDate >= startDate;
          } else {
            // For other views, exclude today's historical data since we'll use currentTotalValue
            const itemDate = item.dateNormalized || item.date;
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
              const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
              userMap.set(item.username, {
                date: date,
                totalValue: filteredValue,
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
              const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
              periodEntry.userMap.set(item.username, {
                date: date,
                totalValue: filteredValue,
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
            const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
            dateEntry.totalValue += filteredValue;
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
    
    // For 1D period, if no historical data exists, add current portfolio value as a single point
    if (timePeriod === '1D' && result.length === 0 && currentTotalValue > 0) {
      const todayDateObj = new Date();
      const todayDateStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;
      result.push({
        date: formatDateForChart(todayDateObj, timePeriod),
        value: currentTotalValue,
        fullDate: todayDateStr,
        dateObj: todayDateObj,
        timestamp: todayDateObj.getTime(),
      });
    }
    
    return result;
  }, [historyData, selectedUsers, timePeriod, currentTotalValue, selectedAssetTypes]);
  
  // Calculate position change markers for 1D, 1W, and 1M views
  const positionChanges = useMemo(() => {
    if ((timePeriod !== '1D' && timePeriod !== '1W' && timePeriod !== '1M') || !portfolio || portfolio.length === 0 || chartData.length === 0) {
      return [];
    }
    
    const now = new Date();
    let startDate;
    
    if (timePeriod === '1D') {
      // For 1D view, start from 12:00 AM (midnight) of today, not 24 hours ago
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timePeriod === '1W') {
      // For 1W view, start from 7 days ago
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (timePeriod === '1M') {
      // For 1M view, start from 30 days ago
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Filter portfolio records from the selected time period, selected users, and selected asset types
    const recentChanges = portfolio.filter(item => {
      if (!selectedUsers.has(item.username)) {
        return false;
      }
      
      if (!item.lastUpdated) {
        return false;
      }
      
      const updateDate = parseSheet1Timestamp(item.lastUpdated);
      if (!updateDate) {
        return false;
      }
      
      // Only include changes from the selected time period
      if (!(updateDate >= startDate && updateDate <= now)) {
        return false;
      }
      
      // Filter by selected asset types
      if (item.isCash && !selectedAssetTypes.has('cash')) return false;
      if (item.isRealEstate && !selectedAssetTypes.has('realestate')) return false;
      if (item.isCrypto && !selectedAssetTypes.has('crypto')) return false;
      if (!item.isCash && !item.isRealEstate && !item.isCrypto && !selectedAssetTypes.has('stocks')) return false;
      
      return true;
    });
    
    // Group by timestamp and username to get unique position changes
    // Map: timestamp -> username -> { username, timestamp, portfolioValue }
    const changeMap = new Map();
    
    recentChanges.forEach(item => {
      const updateDate = parseSheet1Timestamp(item.lastUpdated);
      if (!updateDate) {
        return;
      }
      
      const timestamp = updateDate.getTime();
      
      // For each timestamp, calculate the portfolio value at that time
      // Find the closest chart data point or interpolate
      let portfolioValue = currentTotalValue;
      
      // Find the closest chart data point by time difference
      let closestPoint = null;
      let minDiff = Infinity;
      
      chartData.forEach(point => {
        const diff = Math.abs(point.timestamp - timestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      });
      
      if (closestPoint) {
        // If we have a point before and after, interpolate
        const pointIndex = chartData.findIndex(p => p.timestamp === closestPoint.timestamp);
        if (pointIndex > 0 && timestamp < closestPoint.timestamp) {
          // Interpolate between the point before and this point
          const beforePoint = chartData[pointIndex - 1];
          const ratio = (timestamp - beforePoint.timestamp) / (closestPoint.timestamp - beforePoint.timestamp);
          portfolioValue = beforePoint.value + (closestPoint.value - beforePoint.value) * ratio;
        } else if (pointIndex < chartData.length - 1 && timestamp > closestPoint.timestamp) {
          // Interpolate between this point and the point after
          const afterPoint = chartData[pointIndex + 1];
          const ratio = (timestamp - closestPoint.timestamp) / (afterPoint.timestamp - closestPoint.timestamp);
          portfolioValue = closestPoint.value + (afterPoint.value - closestPoint.value) * ratio;
        } else {
          // Use the closest point's value
          portfolioValue = closestPoint.value;
        }
      }
      
      if (!changeMap.has(timestamp)) {
        changeMap.set(timestamp, new Map());
      }
      
      const userMap = changeMap.get(timestamp);
      // Allow multiple changes per user per timestamp (different tickers)
      // Use username+ticker as key to allow same user to have multiple position changes
      const userTickerKey = `${item.username}_${item.ticker}`;
      if (!userMap.has(userTickerKey)) {
        userMap.set(userTickerKey, {
          username: item.username,
          ticker: item.ticker,
          shares: item.shares,
          changeAmount: item.lastPositionChange, // Use change amount instead of shares
          timestamp: timestamp,
          portfolioValue: portfolioValue,
        });
      }
    });
    
    // Convert to array format for chart markers
    const result = [];
    changeMap.forEach((userMap, timestamp) => {
      userMap.forEach((change) => {
        // Only include changes where changeAmount is defined and not null
        if (change.changeAmount !== null && change.changeAmount !== undefined && !isNaN(change.changeAmount)) {
          result.push({
            x: timestamp,
            y: change.portfolioValue,
            username: change.username,
            ticker: change.ticker,
            shares: change.shares,
            changeAmount: change.changeAmount,
            timestamp: change.timestamp,
          });
        }
      });
    });
    
    // Sort by timestamp
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [portfolio, selectedUsers, timePeriod, chartData, currentTotalValue, selectedAssetTypes]);
  
  // Merge position changes into chart data for better tooltip integration
  const chartDataWithPositionChanges = useMemo(() => {
    if ((timePeriod !== '1D' && timePeriod !== '1W' && timePeriod !== '1M') || positionChanges.length === 0) {
      return chartData;
    }
    
    // Add position change markers to chart data
    // Create a new array with new objects to avoid mutating read-only data
    const merged = chartData.map(point => ({ ...point }));
    positionChanges.forEach(change => {
      // Find if there's already a data point at this timestamp (within 1 minute)
      const existingIndex = merged.findIndex(point => 
        Math.abs(point.timestamp - change.timestamp) < 60000
      );
      
      if (existingIndex >= 0) {
        // Create a new object with the position changes array
        const existingPoint = merged[existingIndex];
        const existingChanges = existingPoint.positionChanges || (existingPoint.positionChange ? [existingPoint.positionChange] : []);
        
        // Add the new change to the array if it's not already there
        const changeExists = existingChanges.some(existing => 
          existing.username === change.username && 
          existing.ticker === change.ticker && 
          existing.timestamp === change.timestamp
        );
        
        if (!changeExists) {
          merged[existingIndex] = {
            ...existingPoint,
            positionChanges: [...existingChanges, change],
            positionChange: undefined // Remove single positionChange for consistency
          };
        }
      } else {
        // Add a new data point for the position change
        merged.push({
          timestamp: change.timestamp,
          value: change.y,
          date: formatDateForChart(new Date(change.timestamp), timePeriod),
          fullDate: `${new Date(change.timestamp).getFullYear()}-${String(new Date(change.timestamp).getMonth() + 1).padStart(2, '0')}-${String(new Date(change.timestamp).getDate()).padStart(2, '0')}`,
          dateObj: new Date(change.timestamp),
          positionChanges: [change],
          isPositionChange: true,
        });
      }
    });
    
    // Sort by timestamp
    return merged.sort((a, b) => a.timestamp - b.timestamp);
  }, [chartData, positionChanges, timePeriod]);
  
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
  
  // For small ranges (like daily fluctuations), use tighter padding to show variation better
  // For larger ranges, use standard padding
  let padding;
  if (range < maxValue * 0.05) {
    // If range is less than 5% of max value, use tighter padding (2% of range or $500, whichever is larger)
    padding = Math.max(range * 0.02, 500);
  } else {
    // Standard 10% padding for larger ranges
    padding = range * 0.1 || (maxValue * 0.05) || 1000;
  }
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
    <div className="space-y-4 max-[600px]:px-4">
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
            data={chartDataWithPositionChanges} 
            margin={{ top: 5, right: 20, bottom: 5, left: isSmallScreen ? 5 : 20 }}
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
              stroke={isSmallScreen ? 'transparent' : '#94a3b8'}
              tick={{ fill: isSmallScreen ? 'transparent' : '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: isSmallScreen ? 'transparent' : '#475569' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={[yAxisMin, yAxisMax]}
              width={isSmallScreen ? 0 : undefined}
            />
            <Tooltip
              content={(props) => {
                if (!props.active || !props.payload || !props.payload.length) {
                  return null;
                }
                
                const payload = props.payload[0];
                const dataPoint = payload.payload;
                
                // Debug: log payload structure to understand what we're working with
                if (dataPoint?.positionChange || dataPoint?.positionChanges || dataPoint?.isPositionChange) {
                  console.log('Tooltip payload with position change:', { payload, dataPoint, label: props.label });
                }
                
                // Check if this is a position change marker (support both single and array formats)
                const positionChanges = dataPoint?.positionChanges || (dataPoint?.positionChange ? [dataPoint.positionChange] : []);
                const hasPositionChanges = positionChanges.length > 0;
                
                // Check if this is a standalone position change (colored dot) vs merged with regular data point (blue dot)
                const isStandalonePositionChange = dataPoint?.isPositionChange === true;
                
                if (hasPositionChanges) {
                  const firstChange = positionChanges[0];
                  const formattedDate = formatDateForChart(
                    new Date(firstChange.timestamp), 
                    timePeriod
                  ) || dataPoint?.date || (props.label ? formatDateForChart(new Date(props.label), timePeriod) : '');
                  
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
                      
                      {/* Show portfolio value at the top only if this is a blue dot (merged with regular data point) */}
                      {!isStandalonePositionChange && (
                        <p style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '12px' }}>
                          ${payload.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                      
                      {/* Position changes - always show for colored dots, also show for blue dots with changes */}
                      {positionChanges.map((positionChange, index) => {
                        // Format ticker for display (remove exchange prefix if present for cleaner display)
                        const displayTicker = positionChange.ticker?.replace(/^BATS:/, '') || positionChange.ticker || 'Unknown';
                        const tickerUpper = positionChange.ticker?.toUpperCase() || '';
                        const changeAmount = positionChange.changeAmount || 0;
                        const changeText = changeAmount >= 0 
                          ? `+${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${changeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        const changeColor = changeAmount >= 0 ? '#22c55e' : '#ef4444';
                        
                        // Determine the unit label based on asset type
                        let unitLabel = 'shares';
                        if (tickerUpper === 'CASH' || tickerUpper === 'USD') {
                          unitLabel = 'cash';
                        } else if (tickerUpper === 'REAL ESTATE') {
                          unitLabel = 'equity';
                        }
                        
                        return (
                          <div key={index} style={{ marginBottom: index < positionChanges.length - 1 ? '8px' : '0' }}>
                            <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>
                              {positionChange.username} changed their position
                            </p>
                            <p style={{ color: '#ffffff', fontSize: '14px', marginBottom: '2px' }}>
                              {displayTicker}
                            </p>
                            <p style={{ color: changeColor, fontSize: '16px', fontWeight: 'bold' }}>
                              {changeText} {unitLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                // Regular line chart tooltip
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
              position={{ x: 'auto', y: 'auto' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                // Check if this point has position change markers (support both single and array formats)
                const positionChanges = payload?.positionChanges || (payload?.positionChange ? [payload.positionChange] : []);
                
                // Check if this is a standalone position change point (not merged with a regular data point)
                // Standalone position changes have isPositionChange flag set to true
                const isStandalonePositionChange = payload?.isPositionChange === true;
                
                // If it's a standalone position change (not overlapping with a blue dot), show colored dot
                if (positionChanges.length > 0 && isStandalonePositionChange) {
                  // Check if there's a mix of positive and negative changes
                  const hasPositive = positionChanges.some(change => (change.changeAmount || 0) >= 0);
                  const hasNegative = positionChanges.some(change => (change.changeAmount || 0) < 0);
                  const dotColor = (hasPositive && hasNegative) ? '#eab308' : // Yellow for mixed
                                   (hasPositive) ? '#22c55e' : '#ef4444'; // Green for all positive, red for all negative
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={dotColor}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }
                // Regular blue dot (either regular data point OR position change overlapping with blue dot)
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={timePeriod === '1W' ? 4 : 5}
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={(props) => {
                const { cx, cy, payload } = props;
                // Check if this point has position change markers (support both single and array formats)
                const positionChanges = payload?.positionChanges || (payload?.positionChange ? [payload.positionChange] : []);
                
                // Check if this is a standalone position change point (not merged with a regular data point)
                // Standalone position changes have isPositionChange flag set to true
                const isStandalonePositionChange = payload?.isPositionChange === true;
                
                // If it's a standalone position change (not overlapping with a blue dot), show colored dot
                if (positionChanges.length > 0 && isStandalonePositionChange) {
                  // Check if there's a mix of positive and negative changes
                  const hasPositive = positionChanges.some(change => (change.changeAmount || 0) >= 0);
                  const hasNegative = positionChanges.some(change => (change.changeAmount || 0) < 0);
                  const dotColor = (hasPositive && hasNegative) ? '#eab308' : // Yellow for mixed
                                   (hasPositive) ? '#22c55e' : '#ef4444'; // Green for all positive, red for all negative
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill={dotColor}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }
                // Regular blue active dot (either regular data point OR position change overlapping with blue dot)
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={timePeriod === '1W' ? 8 : 9}
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                  />
                );
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

// Stacked Area Chart Component - Shows each user's value separately
const StackedAreaChart = ({ historyData, dailyTotalsData, selectedUsers, timePeriod, currentTotalValue, selectedAssetTypes = new Set(['stocks', 'cash', 'realestate', 'crypto']) }) => {
  // Detect if screen is below 600px
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Process history data to create stacked area chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!historyData || historyData.length === 0) {
      return [];
    }
    
    // Filter by selected users
    let filtered = historyData.filter(item => selectedUsers.has(item.username));
    
    if (filtered.length === 0) {
      return [];
    }
    
    // Determine allowed CaptureTypes based on time period (same logic as PortfolioValueChart)
    let allowedCaptureTypes = [];
    switch (timePeriod) {
      case '1D':
        allowedCaptureTypes = ['HOURLY', 'DAILY', 'WEEKLY'];
        break;
      case '1W':
        allowedCaptureTypes = ['DAILY', 'WEEKLY'];
        break;
      case '1M':
      case '3M':
        allowedCaptureTypes = ['DAILY', 'WEEKLY'];
        break;
      case 'YTD':
      case '1Y':
      case 'ALL':
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
        startDate = new Date(todayDateObj);
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
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }
    
    // Filter by date range
    const dateFiltered = filtered.filter(item => {
      if (timePeriod === '1D') {
        const itemDate = item.date || item.dateNormalized;
        const itemDateStr = item.dateStr || `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
        return itemDateStr === todayDateStr && itemDate >= startDate;
      } else {
        const itemDate = item.dateNormalized || item.date;
        return itemDate >= startDate && item.dateStr !== todayDateStr;
      }
    });
    
    // Group data by timestamp and aggregate by user
    const timeMap = new Map();
    
    if (timePeriod === '1D') {
      // For 1D: Group by hour, use last value per user per hour
      const hourUserMap = new Map();
      
      dateFiltered.forEach(item => {
        const date = item.date;
        const hourTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0).getTime();
        
        if (!hourUserMap.has(hourTimestamp)) {
          hourUserMap.set(hourTimestamp, new Map());
        }
        
        const userMap = hourUserMap.get(hourTimestamp);
        const existingEntry = userMap.get(item.username);
        
        if (!existingEntry || date > existingEntry.date) {
          const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
          userMap.set(item.username, {
            date: date,
            totalValue: filteredValue,
            username: item.username,
          });
        }
      });
      
      // Convert to array format
      hourUserMap.forEach((userMap, hourTimestamp) => {
        const dateObj = new Date(hourTimestamp);
        const dateKey = formatDateForChart(dateObj, timePeriod);
        
        const dataPoint = {
          timestamp: hourTimestamp,
          date: dateKey,
          dateObj: dateObj,
        };
        
        // Add each user's value
        userMap.forEach((entry, username) => {
          dataPoint[username] = entry.totalValue;
        });
        
        timeMap.set(hourTimestamp, dataPoint);
      });
    } else {
      // For other periods: Group by date, use last value per user per day
      const periodUserMap = new Map();
      
      dateFiltered.forEach(item => {
        const date = item.date;
        const captureType = item.captureType?.toUpperCase() || '';
        
        let periodKey;
        let dateObj;
        
        if (captureType === 'HOURLY') {
          const hourTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
          periodKey = hourTimestamp.getTime();
          dateObj = hourTimestamp;
        } else {
          const dayTimestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          periodKey = dayTimestamp.getTime();
          dateObj = dayTimestamp;
        }
        
        if (!periodUserMap.has(periodKey)) {
          periodUserMap.set(periodKey, new Map());
        }
        
        const userMap = periodUserMap.get(periodKey);
        const existingEntry = userMap.get(item.username);
        
        if (!existingEntry || date > existingEntry.date) {
          const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
          userMap.set(item.username, {
            date: date,
            totalValue: filteredValue,
            username: item.username,
          });
        }
      });
      
      // Convert to array format
      periodUserMap.forEach((userMap, periodKey) => {
        const dateObj = new Date(periodKey);
        const dateKey = formatDateForChart(dateObj, timePeriod);
        
        const dataPoint = {
          timestamp: periodKey,
          date: dateKey,
          dateObj: dateObj,
        };
        
        // Add each user's value
        userMap.forEach((entry, username) => {
          dataPoint[username] = entry.totalValue;
        });
        
        timeMap.set(periodKey, dataPoint);
      });
    }
    
    // Convert map to array and sort by timestamp
    let result = Array.from(timeMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    // Ensure all selected users have a value at every data point (0 if they don't have data yet)
    // This ensures proper stacking - users appear at their first data point without empty pockets
    result = result.map(point => {
      const newPoint = { ...point };
      Array.from(selectedUsers).forEach(username => {
        // If user doesn't have a value at this point, set to 0
        // This ensures they take no space until their first actual data point
        if (newPoint[username] === undefined) {
          newPoint[username] = 0;
        }
      });
      return newPoint;
    });
    
    // Add final point using DailyTotals data
    if (dailyTotalsData && dailyTotalsData.length > 0) {
      // For 1D view, use current time; for other views, use the most recent date from DailyTotals
      let finalDate;
      if (timePeriod === '1D') {
        // Use current time for 1D view to show present time
        finalDate = now;
      } else {
        // Find the most recent snapshot date from DailyTotals for other views
        const mostRecentDate = dailyTotalsData.reduce((latest, current) => {
          if (!latest) return current.snapshotDate;
          return current.snapshotDate > latest ? current.snapshotDate : latest;
        }, null);
        finalDate = mostRecentDate || now;
      }
      
      if (finalDate) {
        const finalPoint = {
          timestamp: finalDate.getTime(),
          date: formatDateForChart(finalDate, timePeriod),
          dateObj: finalDate,
        };
        
        // Add each selected user's value from DailyTotals
        // Include ALL users from DailyTotals, not just those matching the most recent date
        const dailyTotalsByUser = new Map();
        dailyTotalsData.forEach(item => {
          const filteredValue = calculateFilteredValue(item, selectedAssetTypes);
          dailyTotalsByUser.set(item.username, filteredValue);
        });
        
        // Add values for selected users from DailyTotals
        Array.from(selectedUsers).forEach(username => {
          finalPoint[username] = dailyTotalsByUser.get(username) || 0;
        });
        
        // Only add if we have at least one user with data
        const hasData = Array.from(selectedUsers).some(username => finalPoint[username] > 0);
        if (hasData) {
          // Remove any existing point at the same timestamp to avoid duplicates
          result = result.filter(point => point.timestamp !== finalPoint.timestamp);
          result.push(finalPoint);
        }
      }
    } else if (result.length > 0) {
      // Fallback: Use last known values if DailyTotals is not available
      const lastPoint = result[result.length - 1];
      const todayPoint = {
        timestamp: now.getTime(),
        date: formatDateForChart(now, timePeriod),
        dateObj: now,
      };
      
      // Use last known values per user
      Array.from(selectedUsers).forEach(username => {
        todayPoint[username] = lastPoint[username] || 0;
      });
      
      result.push(todayPoint);
    } else if (currentTotalValue > 0) {
      // Last fallback: Distribute currentTotalValue evenly if no data exists
      const userCount = selectedUsers.size;
      const valuePerUser = currentTotalValue / userCount;
      
      const todayPoint = {
        timestamp: now.getTime(),
        date: formatDateForChart(now, timePeriod),
        dateObj: now,
      };
      
      Array.from(selectedUsers).forEach(username => {
        todayPoint[username] = valuePerUser;
      });
      
      result.push(todayPoint);
    }
    
    // Final pass: ensure all selected users have values at all points (should already be done, but double-check)
    result = result.map(point => {
      const newPoint = { ...point };
      Array.from(selectedUsers).forEach(username => {
        if (newPoint[username] === undefined) {
          newPoint[username] = 0;
        }
      });
      return newPoint;
    });
    
    return result;
  }, [historyData, dailyTotalsData, selectedUsers, timePeriod, currentTotalValue, selectedAssetTypes]);
  
  // Calculate Y-axis domain
  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [0, 1000];
    }
    
    let maxValue = 0;
    let minValue = Infinity;
    chartData.forEach(point => {
      let pointTotal = 0;
      Array.from(selectedUsers).forEach(username => {
        pointTotal += point[username] || 0;
      });
      maxValue = Math.max(maxValue, pointTotal);
      minValue = Math.min(minValue, pointTotal);
    });
    
    const range = maxValue - minValue;
    // For small ranges (like daily fluctuations), use tighter padding to show variation better
    let padding;
    if (range < maxValue * 0.05) {
      // If range is less than 5% of max value, use tighter padding (2% of range or $500, whichever is larger)
      padding = Math.max(range * 0.02, 500);
    } else {
      // Standard 10% padding for larger ranges
      padding = maxValue * 0.1 || 1000;
    }
    return [0, maxValue + padding];
  }, [chartData, selectedUsers]);
  
  // Calculate change stats
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { currentValue: 0, change: 0, changePercent: 0 };
    }
    
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];
    
    let firstTotal = 0;
    let lastTotal = 0;
    
    Array.from(selectedUsers).forEach(username => {
      firstTotal += firstPoint[username] || 0;
      lastTotal += lastPoint[username] || 0;
    });
    
    const change = lastTotal - firstTotal;
    const changePercent = firstTotal > 0 ? (change / firstTotal) * 100 : 0;
    
    return {
      currentValue: lastTotal,
      change,
      changePercent,
    };
  }, [chartData, selectedUsers]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    
    // Get the formatted date from the payload's data point
    const dataPoint = payload[0]?.payload;
    const formattedDate = dataPoint?.date || (label ? formatDateForChart(new Date(label), timePeriod) : String(label));
    
    // Filter out users with $0 values
    const nonZeroPayload = payload.filter(item => (item.value || 0) > 0);
    
    let total = 0;
    payload.forEach(item => {
      total += item.value || 0;
    });
    
    return (
      <div 
        className="bg-slate-800/95 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl"
        style={{ zIndex: 999999 }}
      >
        <p className="text-slate-400 mb-2">{formattedDate}</p>
        {nonZeroPayload.map((item, index) => {
          const value = item.value || 0;
          const percentage = total > 0 ? (value / total) * 100 : 0;
          return (
            <p key={index} className="text-white" style={{ color: item.color }}>
              {item.name}: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage.toFixed(2)}%)
            </p>
          );
        })}
        <p className="text-white font-bold mt-2 border-t border-slate-700 pt-2">
          Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  };
  
  // Calculate X-axis domain - extend to current time for 1D view
  const xAxisDomain = useMemo(() => {
    if (timePeriod === '1D' && chartData.length > 0) {
      const now = new Date().getTime();
      const dataMin = Math.min(...chartData.map(d => d.timestamp));
      return [dataMin, now];
    }
    return ['dataMin', 'dataMax'];
  }, [chartData, timePeriod]);
  
  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-slate-400">No data available for selected time period</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 max-[600px]:px-4">
      {/* Summary Stats */}
      <div className="flex items-end gap-6">
        <div>
          <p className="text-sm text-slate-400 mb-1">Current Value</p>
          <p className="text-3xl font-bold text-white">
            ${stats.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">
            {timePeriod === 'ALL' ? 'Total Change' : 'Period Change'}
          </p>
          <p className={`text-2xl font-bold ${stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.change >= 0 ? '+' : ''}${stats.change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm ${stats.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Stacked Area Chart */}
      <div className="h-80" style={{ position: 'relative', zIndex: 10000 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={chartData} 
            margin={{ top: 5, right: 50, bottom: 5, left: isSmallScreen ? 5 : 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              scale="linear"
              domain={xAxisDomain}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return formatDateForChart(date, timePeriod);
              }}
            />
            <YAxis 
              stroke={isSmallScreen ? 'transparent' : '#94a3b8'}
              tick={{ fill: isSmallScreen ? 'transparent' : '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: isSmallScreen ? 'transparent' : '#475569' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={yAxisDomain}
              width={isSmallScreen ? 0 : undefined}
            />
            <Tooltip 
              content={<CustomTooltip />}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 999999, pointerEvents: 'none' }}
            />
            <Legend />
            {Array.from(selectedUsers).map((username, index) => (
              <Area
                key={username}
                type="monotone"
                dataKey={username}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.8}
                strokeWidth={0}
              />
            ))}
          </AreaChart>
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
  const chatContainerRef = useRef(null);

  // Get chats for the selected entry
  const chats = useMemo(() => {
    if (!selectedEntry || !getChatsForUserAndTicker) return '';
    return getChatsForUserAndTicker(ticker, selectedEntry.username);
  }, [selectedEntry, ticker, getChatsForUserAndTicker]);

  // Parse chat messages from the string (newline-separated) and reverse order (newest first)
  const parsedChats = useMemo(() => {
    if (!chats || !chats.trim()) return [];
    
    const parsed = chats.split('\n').filter(line => line.trim()).map(line => {
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
    
    // Reverse to show newest first (oldest at bottom)
    return parsed.reverse();
  }, [chats]);

  // Scroll to top of chat container when chats update
  useEffect(() => {
    if (chatContainerRef.current && parsedChats.length > 0) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [parsedChats.length, chats]); // Scroll when chats change

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !postingUser.trim() || !selectedEntry || !onChatSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onChatSubmit(ticker, chatMessage.trim(), postingUser.trim(), selectedEntry.username);
      setChatMessage('');
      // Keep the chat window open - the parent component will refresh holdings,
      // which will cause `chats` to re-evaluate and show the new message
      // Scroll to top after a brief delay to ensure DOM has updated
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 0;
        }
      }, 100);
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

  // Helper function to get chat counts for an entry
  const getChatCounts = (username) => {
    if (!getChatsForUserAndTicker) return { total: 0, today: 0, last24Hours: 0 };
    
    const chatsString = getChatsForUserAndTicker(ticker, username);
    if (!chatsString || !chatsString.trim()) return { total: 0, today: 0, last24Hours: 0 };
    
    const chatLines = chatsString.split('\n').filter(line => line.trim());
    const total = chatLines.length;
    
    // Count today's chats - normalize dates to compare just year/month/day
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    const todayCount = chatLines.filter(line => {
      const match = line.match(/\((.+?)\)$/);
      if (match) {
        const timestamp = match[1].trim();
        try {
          const chatDate = new Date(timestamp);
          if (isNaN(chatDate.getTime())) return false;
          
          // Compare year, month, and day
          return chatDate.getFullYear() === todayYear &&
                 chatDate.getMonth() === todayMonth &&
                 chatDate.getDate() === todayDay;
        } catch (e) {
          return false;
        }
      }
      return false;
    }).length;
    
    // Count chats from past 24 hours
    const now = new Date();
    const last24Hours = now.getTime() - (24 * 60 * 60 * 1000); // 24 hours ago in milliseconds
    
    const last24HoursCount = chatLines.filter(line => {
      const match = line.match(/\((.+?)\)$/);
      if (match) {
        const timestamp = match[1].trim();
        try {
          let chatDate = null;
          
          // Parse format: "Nov 4, 12:23 AM" or "Nov 3, 8:35 PM"
          const parts = timestamp.split(',');
          if (parts.length >= 2) {
            const datePart = parts[0].trim(); // "Nov 4" or "Nov 3"
            const timePart = parts[1].trim(); // "12:23 AM" or "8:35 PM"
            const currentYear = new Date().getFullYear();
            
            // Parse month name format: "Nov 4" -> month=10, day=4
            const monthMatch = datePart.match(/(\w+)\s+(\d+)/);
            if (monthMatch) {
              const monthName = monthMatch[1];
              const day = parseInt(monthMatch[2]);
              const monthMap = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
              };
              const month = monthMap[monthName];
              
              if (month !== undefined) {
                // Parse time part: "12:23 AM" or "8:35 PM"
                const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (timeMatch) {
                  let hours = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);
                  const ampm = timeMatch[3].toUpperCase();
                  
                  // Convert to 24-hour format
                  if (ampm === 'PM' && hours !== 12) {
                    hours += 12;
                  } else if (ampm === 'AM' && hours === 12) {
                    hours = 0;
                  }
                  
                  chatDate = new Date(currentYear, month, day, hours, minutes, 0);
                }
              }
            }
          }
          
          // Fallback: try standard Date parsing
          if (!chatDate || isNaN(chatDate.getTime())) {
            chatDate = new Date(timestamp);
          }
          
          // Check if we have a valid date and if it's within past 24 hours
          if (chatDate && !isNaN(chatDate.getTime())) {
            return chatDate.getTime() >= last24Hours;
          }
          
          return false;
        } catch (e) {
          console.error('Error parsing chat timestamp:', timestamp, e);
          return false;
        }
      }
      return false;
    }).length;
    
    return { total, today: todayCount, last24Hours: last24HoursCount };
  };

  // Determine if this is cash or real estate
  const isCash = ticker === 'CASH' || ticker === 'USD';
  const isRealEstate = ticker === 'REAL ESTATE';

  return (
    <div className="space-y-4">
      {/* Leaderboard */}
      <div 
        className={`space-y-2 ${topGainers.length > visibleItems ? 'overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800' : ''}`}
        style={topGainers.length > visibleItems ? { maxHeight: `${maxHeight}px` } : {}}
      >
        {topGainers.map((entry, index) => {
          const isPositive = entry.gain > 0;
          const isNegative = entry.gain < 0;
          const isSelected = selectedEntry?.username === entry.username;
          const chatCounts = getChatCounts(entry.username);
          const hasChats = chatCounts.total > 0;
          
          return (
            <motion.div
              key={`${entry.username}-${ticker}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: chatCounts.today > 0 && !isSelected ? [1, 1.01, 1] : 1
              }}
              transition={{ 
                delay: index * 0.05,
                scale: chatCounts.today > 0 && !isSelected ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all relative group ${
                isSelected
                  ? 'bg-primary-500/20 border-primary-500/50 shadow-lg shadow-primary-500/20'
                  : index === 0 && isPositive
                  ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border-yellow-500/50'
                  : isPositive
                  ? 'bg-slate-800/50 border-green-500/30'
                  : isNegative
                  ? 'bg-slate-800/50 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              } hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 hover:scale-[1.02] ${chatCounts.today > 0 ? 'ring-2 ring-primary-500/30' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Toggle chat window: close if already selected, open otherwise
                if (isSelected) {
                  setSelectedEntry(null);
                  setChatMessage(''); // Clear message when closing
                  setPostingUser(''); // Clear posting user when closing
                } else {
                  setSelectedEntry(entry);
                  // Don't auto-fill postingUser - let user type their own name
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{entry.username}</p>
                      {hasChats && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                          <span className="text-xs font-semibold text-primary-400">{chatCounts.total}</span>
                          {chatCounts.today > 0 && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full border border-green-500/30"
                            >
                              +{chatCounts.today} today
                            </motion.span>
                          )}
                        </motion.div>
                      )}
                      {/* 24-hour notification badge - Always show if there are chats, even if count is 0 */}
                      {hasChats && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="relative"
                          title={`${chatCounts.last24Hours} new message${chatCounts.last24Hours !== 1 ? 's' : ''} in the last 24 hours`}
                        >
                          {chatCounts.last24Hours > 0 ? (
                            <div className="relative">
                              <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">
                                  {chatCounts.last24Hours > 9 ? '9+' : chatCounts.last24Hours}
                                </span>
                              </div>
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-primary-400 rounded-full opacity-50"
                              />
                            </div>
                          ) : (
                            <div className="w-4 h-4 bg-slate-600 rounded-full opacity-50" />
                          )}
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {isCash || isRealEstate
                        ? `$${entry.oldShares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → $${entry.currentShares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${entry.oldShares.toFixed(2)} → ${entry.currentShares.toFixed(2)} shares`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  {/* Chat indicator badge */}
                  {!hasChats && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="hidden group-hover:flex items-center gap-1 px-2 py-1 bg-primary-500/20 border border-primary-500/50 rounded-lg"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                      <span className="text-xs text-primary-400 font-medium">Click to chat</span>
                    </motion.div>
                  )}
                  <div>
                    <div className={`flex items-center gap-1 font-bold ${
                      isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isNegative ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      <span>
                        {isCash || isRealEstate
                          ? `${entry.gain >= 0 ? '+' : ''}$${Math.abs(entry.gain).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${entry.gain > 0 ? '+' : ''}${entry.gain.toFixed(2)}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{isCash || isRealEstate ? 'USD' : 'shares'}</p>
                  </div>
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
              <div ref={chatContainerRef} className="mb-3 max-h-32 overflow-y-auto overflow-x-hidden space-y-2">
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
              <input
                type="text"
                value={postingUser}
                onChange={(e) => setPostingUser(e.target.value)}
                placeholder="Enter your name..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500"
                required
                disabled={isSubmitting}
              />
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
                disabled={isSubmitting || !chatMessage.trim() || !postingUser.trim()}
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
                setPostingUser('');
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

