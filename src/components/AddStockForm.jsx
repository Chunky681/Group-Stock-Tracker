import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { appendRow, readSheetData, initializeSheet, formatHoldingsHistoryDate } from '../utils/googleSheets';

const AddStockForm = ({ stockData, selectedUser, onSuccess, refreshKey }) => {
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingStock, setHasExistingStock] = useState(false);
  const [existingShares, setExistingShares] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedUser || !selectedUser.trim()) {
      setError('Please select a user first');
      return;
    }

    if (!stockData) {
      setError('Please search and select a stock first');
      return;
    }

    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError('Please enter a valid number of shares (greater than 0)');
      return;
    }

    setIsSubmitting(true);

    try {
      const rowData = [
        selectedUser.trim(),
        stockData.symbol,
        sharesNum.toString(),
        formatHoldingsHistoryDate(),
      ];

      console.log('Attempting to add stock to Google Sheets...');
      await appendRow(rowData);
      console.log('Stock added successfully');
      
      setSuccess(true);
      setShares('');
    } catch (error) {
      console.error('Error adding stock:', error);
      setError(error.message || 'Failed to add stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for existing stock holdings when stockData or selectedUser changes
  useEffect(() => {
    const checkExistingStock = async () => {
      if (!selectedUser || !stockData || !stockData.symbol) {
        setHasExistingStock(false);
        setExistingShares(0);
        return;
      }
      
      try {
        await initializeSheet();
        const data = await readSheetData();
        const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
        
        // Find stock holdings for this user matching the selected stock
        // Use visualSymbol from stockData or symbol
        const stockSymbol = stockData.visualSymbol || stockData.symbol;
        const stockRows = rows.filter(row => {
          const ticker = row[1]?.trim().toUpperCase();
          const username = row[0]?.trim();
          return ticker === stockSymbol.toUpperCase() && 
                 username.toLowerCase() === selectedUser.trim().toLowerCase();
        });
        
        if (stockRows.length > 0) {
          const totalShares = stockRows.reduce((sum, row) => {
            const shares = parseFloat(row[2]) || 0;
            return sum + shares;
          }, 0);
          
          if (totalShares > 0) {
            setHasExistingStock(true);
            setExistingShares(totalShares);
          } else {
            setHasExistingStock(false);
            setExistingShares(0);
          }
        } else {
          setHasExistingStock(false);
          setExistingShares(0);
        }
      } catch (error) {
        console.error('Error checking existing stock:', error);
        setHasExistingStock(false);
        setExistingShares(0);
      }
    };
    
    checkExistingStock();
  }, [selectedUser, stockData, refreshKey]);

  // Clear success message after 2 seconds and call onSuccess
  useEffect(() => {
    if (success) {
      const timeoutId = setTimeout(() => {
        setSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [success, onSuccess]);

  if (!stockData) {
    return null;
  }

  return (
    <motion.div
      key={`form-${stockData.symbol}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="card p-6 mt-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        >
          <Plus className="w-5 h-5 text-primary-500" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">Add to Portfolio</h3>
      </motion.div>

      {!selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm mb-4"
        >
          Please select a user from the "Select User" tab first.
        </motion.div>
      )}

      {hasExistingStock && stockData && selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm mb-4 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Stock holdings already exist</p>
            <p className="text-xs">
              This account already has {existingShares.toFixed(2)} shares of {stockData.symbol || stockData.visualSymbol}.
              Please edit the existing stock record in the holdings section above, or delete it first to add a new amount.
            </p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg"
          >
            <p className="text-xs text-slate-400 mb-1">Adding stocks for</p>
            <p className="text-lg font-semibold text-white">{selectedUser}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Shares *
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => {
              setShares(e.target.value);
              setError(null);
            }}
            placeholder="0.00"
            className="input-field"
            min="0"
            step="0.01"
            required
            disabled={isSubmitting}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-slate-400 mt-1"
          >
            Selected stock: <span className="font-semibold text-primary-400">{stockData.visualSymbol || stockData.symbol}</span> at ${stockData.price.toFixed(2)} per share
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Stock added successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting || !selectedUser || !stockData || hasExistingStock}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isSubmitting || hasExistingStock ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting || hasExistingStock ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {hasExistingStock ? 'Stock Already Exists' : 'Add to Portfolio'}
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddStockForm;
