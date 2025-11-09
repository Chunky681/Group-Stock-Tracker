import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { appendRow, readSheetData, initializeSheet, formatHoldingsHistoryDate } from '../utils/googleSheets';

const AddCryptoForm = ({ cryptoData, selectedUser, onSuccess, refreshKey }) => {
  const [coinAmount, setCoinAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingCrypto, setHasExistingCrypto] = useState(false);
  const [existingValue, setExistingValue] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedUser || !selectedUser.trim()) {
      setError('Please select a user first');
      return;
    }

    if (!cryptoData) {
      setError('Please search and select a crypto first');
      return;
    }

    const coinAmountNum = parseFloat(coinAmount);
    if (isNaN(coinAmountNum) || coinAmountNum <= 0) {
      setError('Please enter a valid coin amount (greater than 0)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store coin amount directly as shares (no conversion needed)
      // For new records (no existing record), set LastPositionChange to positive value
      // The form prevents submission if hasExistingCrypto is true, so this is always a new record
      const changeAmount = coinAmountNum; // Positive for new records
      
      const rowData = [
        selectedUser.trim(),
        cryptoData.symbol, // Store the Symbol as Ticker
        coinAmountNum.toFixed(8).replace(/\.?0+$/, ''), // Store coin amount with up to 8 decimal places, remove trailing zeros
        formatHoldingsHistoryDate(),
        changeAmount.toFixed(8).replace(/\.?0+$/, ''), // LastPositionChange column - positive for new records
      ];

      console.log('Attempting to add crypto to Google Sheets...');
      await appendRow(rowData);
      console.log('Crypto added successfully');
      
      setSuccess(true);
      setCoinAmount('');
    } catch (error) {
      console.error('Error adding crypto:', error);
      setError(error.message || 'Failed to add crypto. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for existing crypto holdings when cryptoData or selectedUser changes
  useEffect(() => {
    const checkExistingCrypto = async () => {
      if (!selectedUser || !cryptoData || !cryptoData.symbol) {
        setHasExistingCrypto(false);
        setExistingValue(0);
        return;
      }
      
      try {
        await initializeSheet();
        const data = await readSheetData();
        const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
        
        // Find crypto holdings for this user matching the selected crypto
        const cryptoSymbol = cryptoData.symbol.toUpperCase();
        const cryptoRows = rows.filter(row => {
          const ticker = row[1]?.trim().toUpperCase();
          const username = row[0]?.trim();
          return ticker === cryptoSymbol && 
                 username.toLowerCase() === selectedUser.trim().toLowerCase();
        });
        
        if (cryptoRows.length > 0) {
          // Calculate total value from shares
          const totalShares = cryptoRows.reduce((sum, row) => {
            const shares = parseFloat(row[2]) || 0;
            return sum + shares;
          }, 0);
          
          const totalValue = totalShares * cryptoData.price;
          
          if (totalValue > 0) {
            setHasExistingCrypto(true);
            setExistingValue(totalValue);
          } else {
            setHasExistingCrypto(false);
            setExistingValue(0);
          }
        } else {
          setHasExistingCrypto(false);
          setExistingValue(0);
        }
      } catch (error) {
        console.error('Error checking existing crypto:', error);
        setHasExistingCrypto(false);
        setExistingValue(0);
      }
    };
    
    checkExistingCrypto();
  }, [selectedUser, cryptoData, refreshKey]);

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

  if (!cryptoData) {
    return null;
  }

  return (
    <motion.div
      key={`form-${cryptoData.symbol}`}
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
          <Coins className="w-5 h-5 text-yellow-500" />
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

      {hasExistingCrypto && cryptoData && selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm mb-4 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Crypto holdings already exist</p>
            <p className="text-xs">
              This account already has ${existingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} worth of {cryptoData.symbol}.
              Please edit the existing crypto record in the holdings section above, or delete it first to add a new amount.
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
            <p className="text-xs text-slate-400 mb-1">Adding crypto for</p>
            <p className="text-lg font-semibold text-white">{selectedUser}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Coin Amount ({cryptoData.symbol}) *
          </label>
          <input
            type="number"
            value={coinAmount}
            onChange={(e) => {
              setCoinAmount(e.target.value);
              setError(null);
            }}
            placeholder="0.00000000"
            className="input-field"
            min="0"
            step="0.00000001"
            required
            disabled={isSubmitting}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-slate-400 mt-1"
          >
            Selected crypto: <span className="font-semibold text-yellow-400">{cryptoData.symbol}</span> ({cryptoData.name}) at ${cryptoData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit
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
              Crypto added successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting || !selectedUser || !cryptoData || hasExistingCrypto}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isSubmitting || hasExistingCrypto ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting || hasExistingCrypto ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              {hasExistingCrypto ? 'Crypto Already Exists' : 'Add Crypto'}
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddCryptoForm;

