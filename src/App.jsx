import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, User, Search, BarChart3, DollarSign, Home, Coins } from 'lucide-react';
import StockSearch from './components/StockSearch';
import AddStockForm from './components/AddStockForm';
import AddCashForm from './components/AddCashForm';
import AddRealEstateForm from './components/AddRealEstateForm';
import CryptoSearch from './components/CryptoSearch';
import AddCryptoForm from './components/AddCryptoForm';
import UserSelector from './components/UserSelector';
import UserHoldings from './components/UserHoldings';
import Analytics from './components/Analytics';
import RefreshTimer from './components/RefreshTimer';

function App() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'stocks'
  const [portfolioKey, setPortfolioKey] = useState(0);
  const [addType, setAddType] = useState('stock'); // 'stock', 'cash', 'realestate', or 'crypto'
  
  // Refs for scrolling to form components
  const stockFormRef = useRef(null);
  const cashFormRef = useRef(null);
  const realEstateFormRef = useRef(null);
  const cryptoFormRef = useRef(null);

  const handleStockSelected = (stockData) => {
    setSelectedStock(stockData);
    // Scroll to the stock form after a short delay to ensure DOM is updated
    // Use 'end' to show the bottom of the component (where the form is)
    setTimeout(() => {
      stockFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 200);
  };

  const handleStockAdded = () => {
    // Force portfolio to refresh
    setPortfolioKey(prev => prev + 1);
    setSelectedStock(null);
    setSelectedCrypto(null);
  };

  const handleCryptoSelected = (cryptoData) => {
    setSelectedCrypto(cryptoData);
    // Scroll to the crypto form after a short delay to ensure DOM is updated
    setTimeout(() => {
      cryptoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 200);
  };

  const handleUserSelect = (username) => {
    setSelectedUser(username);
  };

  // Scroll to form when tab changes
  useEffect(() => {
    if (addType === 'stock' && stockFormRef.current) {
      setTimeout(() => {
        stockFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (addType === 'cash' && cashFormRef.current) {
      setTimeout(() => {
        cashFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (addType === 'realestate' && realEstateFormRef.current) {
      setTimeout(() => {
        realEstateFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (addType === 'crypto' && cryptoFormRef.current) {
      setTimeout(() => {
        cryptoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [addType]);

  const handleRefresh = async () => {
    // Increment portfolioKey to trigger refresh in Analytics
    setPortfolioKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      <RefreshTimer onRefresh={handleRefresh} intervalSeconds={60} />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-12"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <TrendingUp className="w-6 h-6 sm:w-10 sm:h-10 text-primary-500" />
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white">Group Stock Tracker</h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg px-2">
            Track your family's stock portfolio in real-time
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="card p-3 sm:p-4 lg:p-6">
            {/* Tab Navigation */}
            <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-700">
              <motion.button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-all relative text-xs sm:text-base ${
                  activeTab === 'analytics'
                    ? 'text-primary-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Analytics</span>
                </div>
                {activeTab === 'analytics' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>

              <motion.button
                onClick={() => setActiveTab('stocks')}
                className={`px-3 py-2 sm:px-6 sm:py-3 font-semibold rounded-t-lg transition-all relative text-xs sm:text-base ${
                  activeTab === 'stocks'
                    ? 'text-primary-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Assets</span>
                </div>
                {activeTab === 'stocks' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Analytics refreshKey={portfolioKey} />
                </motion.div>
              )}

              {activeTab === 'stocks' && (
                <motion.div
                  key="stocks-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedUser ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column: User Selection */}
                      <div className="space-y-6">
                        <UserSelector
                          selectedUser={selectedUser}
                          onUserSelect={handleUserSelect}
                          refreshKey={portfolioKey}
                          compact={true}
                        />
                      </div>

                      {/* Right Column: Holdings and Add Stock */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                      >
                        <div className="p-3 sm:p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-xs sm:text-sm text-slate-400">Viewing portfolio for:</p>
                              <p className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                                {selectedUser}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => setSelectedUser(null)}
                              className="text-xs sm:text-sm text-slate-400 hover:text-slate-300 underline self-start sm:self-auto"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Change User
                            </motion.button>
                          </div>
                        </div>

                        <UserHoldings 
                          selectedUser={selectedUser}
                          onUpdate={handleStockAdded}
                          refreshKey={portfolioKey}
                        />

                        <div className="border-t border-slate-700 pt-4 sm:pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                              {addType === 'stock' ? (
                                <>
                                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                                  Add New Stock
                                </>
                              ) : addType === 'cash' ? (
                                <>
                                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                  Add Cash Holdings
                                </>
                              ) : addType === 'realestate' ? (
                                <>
                                  <Home className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#CC7722' }} />
                                  Add Real Estate Holdings
                                </>
                              ) : (
                                <>
                                  <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                                  Add Crypto Holdings
                                </>
                              )}
                            </h4>
                            <div className="flex gap-1 sm:gap-2 bg-slate-800 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddType('stock');
                                  setSelectedStock(null);
                                  setSelectedCrypto(null);
                                }}
                                className={`px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors ${
                                  addType === 'stock'
                                    ? 'bg-primary-500 text-white'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                Stock
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddType('cash');
                                  setSelectedStock(null);
                                  setSelectedCrypto(null);
                                }}
                                className={`px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors ${
                                  addType === 'cash'
                                    ? 'bg-green-500 text-white'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                Cash
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddType('realestate');
                                  setSelectedStock(null);
                                  setSelectedCrypto(null);
                                }}
                                className={`px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors ${
                                  addType === 'realestate'
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                                style={addType === 'realestate' ? { backgroundColor: '#CC7722' } : {}}
                              >
                                Real Estate
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddType('crypto');
                                  setSelectedStock(null);
                                  setSelectedCrypto(null);
                                }}
                                className={`px-2 py-1 sm:px-3 rounded text-xs sm:text-sm font-medium transition-colors ${
                                  addType === 'crypto'
                                    ? 'bg-yellow-500 text-white'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                Crypto
                              </button>
                            </div>
                          </div>
                          
                          {addType === 'stock' ? (
                            <div ref={stockFormRef}>
                              <StockSearch onStockSelected={handleStockSelected} />
                              <AddStockForm 
                                stockData={selectedStock} 
                                selectedUser={selectedUser}
                                onSuccess={handleStockAdded}
                                refreshKey={portfolioKey}
                              />
                            </div>
                          ) : addType === 'cash' ? (
                            <div ref={cashFormRef}>
                              <AddCashForm
                                selectedUser={selectedUser}
                                onSuccess={handleStockAdded}
                                refreshKey={portfolioKey}
                              />
                            </div>
                          ) : addType === 'realestate' ? (
                            <div ref={realEstateFormRef}>
                              <AddRealEstateForm
                                selectedUser={selectedUser}
                                onSuccess={handleStockAdded}
                                refreshKey={portfolioKey}
                              />
                            </div>
                          ) : (
                            <div ref={cryptoFormRef}>
                              <CryptoSearch onCryptoSelected={handleCryptoSelected} />
                              <AddCryptoForm
                                cryptoData={selectedCrypto}
                                selectedUser={selectedUser}
                                onSuccess={handleStockAdded}
                                refreshKey={portfolioKey}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <UserSelector
                        selectedUser={selectedUser}
                        onUserSelect={handleUserSelect}
                        refreshKey={portfolioKey}
                        compact={true}
                      />
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                      >
                        <p className="text-slate-400">Select a user above to add stocks</p>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default App;
