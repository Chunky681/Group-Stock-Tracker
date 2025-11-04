import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Check, Search, TrendingUp, DollarSign } from 'lucide-react';
import { readSheetData } from '../utils/googleSheets';
import { getStockQuote } from '../utils/stockApi';

const UserSelector = ({ selectedUser, onUserSelect, refreshKey, compact = false }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await readSheetData();
      const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
      
      // Get unique tickers to fetch prices
      const uniqueTickers = [...new Set(rows.map(row => row[1]?.trim().toUpperCase()))];
      const priceMap = {};
      
      // Fetch prices for all tickers (handle cash and real estate separately)
      for (const ticker of uniqueTickers) {
        // Cash is always $1.00 per "share" (dollar)
        if (ticker === 'CASH' || ticker === 'USD') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        // Real estate is always $1.00 per "share" (dollar)
        if (ticker === 'REAL ESTATE') {
          priceMap[ticker] = 1.0;
          continue;
        }
        
        try {
          const quote = await getStockQuote(ticker);
          priceMap[ticker] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          priceMap[ticker] = 0;
        }
      }
      
      // Get unique usernames and calculate their total portfolio values
      const userMap = new Map();
      rows.forEach(row => {
        const username = row[0]?.trim();
        const ticker = row[1]?.trim().toUpperCase() || '';
        const shares = parseFloat(row[2]) || 0;
        const price = priceMap[ticker] || 0;
        const value = shares * price;
        
        if (username) {
          if (!userMap.has(username)) {
            userMap.set(username, {
              username,
              totalValue: 0,
            });
          }
          const userData = userMap.get(username);
          userData.totalValue += value;
        }
      });

      const userList = Array.from(userMap.values())
        .map(user => ({
          ...user,
          id: user.username.toLowerCase().replace(/\s+/g, '-'),
        }))
        .sort((a, b) => a.username.localeCompare(b.username));

      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleAddUser = () => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
      return;
    }

    // Check if user already exists
    if (users.some(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
      setError('This user already exists');
      return;
    }

    // Add user locally (will be created when they add their first stock)
    const newUser = {
      id: trimmed.toLowerCase().replace(/\s+/g, '-'),
      username: trimmed,
      totalValue: 0,
    };

    setUsers(prev => [...prev, newUser].sort((a, b) => a.username.localeCompare(b.username)));
    setNewUsername('');
    setError(null);
    setIsAddingUser(false);
    
    // Auto-select the newly added user
    onUserSelect(newUser.username);
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
          <User className="w-8 h-8 mx-auto mb-4 text-primary-500" />
        </motion.div>
        <p className="text-slate-400">Loading users...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <User className="w-8 h-8 text-primary-500" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-white">Select User</h2>
            <p className="text-slate-400">Choose who you're adding stocks for</p>
          </div>
        </motion.div>
      )}
      
      {compact && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Select User
          </h3>
        </motion.div>
      )}

      {/* Currently Selected User Badge */}
      {selectedUser && !compact && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-4 bg-gradient-to-r from-primary-600/20 to-primary-700/20 border-primary-500/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Currently Selected</p>
                <p className="text-lg font-bold text-white">{selectedUser}</p>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-green-400"
            />
          </div>
        </motion.div>
      )}

      {/* Add New User */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={compact ? "card p-4" : "card p-6"}
      >
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className={compact ? "w-4 h-4 text-primary-500" : "w-5 h-5 text-primary-500"} />
          <h3 className={compact ? "text-lg font-bold text-white" : "text-xl font-bold text-white"}>Add New User</h3>
        </div>
        
        {!isAddingUser ? (
          <motion.button
            onClick={() => setIsAddingUser(true)}
            className="btn-secondary w-full flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className="w-4 h-4" />
            Create New User
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <input
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddUser();
                } else if (e.key === 'Escape') {
                  setIsAddingUser(false);
                  setNewUsername('');
                }
              }}
              placeholder="Enter username..."
              className="input-field"
              autoFocus
            />
            <div className="flex gap-2">
              <motion.button
                onClick={handleAddUser}
                className="btn-primary flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add User
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsAddingUser(false);
                  setNewUsername('');
                  setError(null);
                }}
                className="btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Search Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={compact ? "card p-4" : "card p-6"}
      >
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="input-field pl-12"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Users List */}
        <div className={`space-y-3 ${compact ? 'max-h-[600px]' : 'max-h-96'} overflow-y-auto`}>
          <AnimatePresence mode="wait">
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <User className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">
                  {searchQuery ? 'No users found matching your search' : 'No users yet. Add a new user above!'}
                </p>
              </motion.div>
            ) : (
              filteredUsers.map((user, index) => {
                const isSelected = selectedUser === user.username;
                return (
                  <motion.button
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onUserSelect(user.username);
                      setError(null);
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-primary-500/20 border-primary-500/50 shadow-lg' : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary-500/30' : 'bg-slate-600/50'}`}
                        >
                          <User className={`w-6 h-6 ${isSelected ? 'text-primary-400' : 'text-slate-400'}`} />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{user.username}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-base font-semibold text-primary-400 flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {user.totalValue.toLocaleString('en-US', { 
                                style: 'currency', 
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default UserSelector;
