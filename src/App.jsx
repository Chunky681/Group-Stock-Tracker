import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, User, Search, BarChart3, DollarSign } from 'lucide-react';
import StockSearch from './components/StockSearch';
import AddStockForm from './components/AddStockForm';
import AddCashForm from './components/AddCashForm';
import UserSelector from './components/UserSelector';
import UserHoldings from './components/UserHoldings';
import Analytics from './components/Analytics';
import ReadCounter from './components/ReadCounter';

function App() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'stocks'
  const [portfolioKey, setPortfolioKey] = useState(0);
  const [addType, setAddType] = useState('stock'); // 'stock' or 'cash'

  const handleStockSelected = (stockData) => {
    setSelectedStock(stockData);
  };

  const handleStockAdded = () => {
    // Force portfolio to refresh
    setPortfolioKey(prev => prev + 1);
    setSelectedStock(null);
  };

  const handleUserSelect = (username) => {
    setSelectedUser(username);
  };

  return (
    <div className="min-h-screen">
      <ReadCounter />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <TrendingUp className="w-10 h-10 text-primary-500" />
            <h1 className="text-5xl font-bold text-white">Group Stock Tracker</h1>
          </div>
          <p className="text-slate-400 text-lg">
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
          <div className="card p-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-700">
              <motion.button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all relative ${
                  activeTab === 'analytics'
                    ? 'text-primary-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
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
                className={`px-6 py-3 font-semibold rounded-t-lg transition-all relative ${
                  activeTab === 'stocks'
                    ? 'text-primary-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  <span>Add Stocks</span>
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
                        <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-400">Viewing portfolio for:</p>
                              <p className="text-xl font-bold text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-primary-400" />
                                {selectedUser}
                              </p>
                            </div>
                            <motion.button
                              onClick={() => setSelectedUser(null)}
                              className="text-sm text-slate-400 hover:text-slate-300 underline"
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

                        <div className="border-t border-slate-700 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              {addType === 'stock' ? (
                                <>
                                  <Search className="w-5 h-5 text-primary-400" />
                                  Add New Stock
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-5 h-5 text-green-500" />
                                  Add Cash Holdings
                                </>
                              )}
                            </h4>
                            <div className="flex gap-2 bg-slate-800 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddType('stock');
                                  setSelectedStock(null);
                                }}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
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
                                }}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                  addType === 'cash'
                                    ? 'bg-green-500 text-white'
                                    : 'text-slate-400 hover:text-slate-300'
                                }`}
                              >
                                Cash
                              </button>
                            </div>
                          </div>
                          
                          {addType === 'stock' ? (
                            <>
                              <StockSearch onStockSelected={handleStockSelected} />
                              <AddStockForm 
                                stockData={selectedStock} 
                                selectedUser={selectedUser}
                                onSuccess={handleStockAdded}
                                refreshKey={portfolioKey}
                              />
                            </>
                          ) : (
                            <AddCashForm
                              selectedUser={selectedUser}
                              onSuccess={handleStockAdded}
                              refreshKey={portfolioKey}
                            />
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
