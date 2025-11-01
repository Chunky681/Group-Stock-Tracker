import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { appendRow, readSheetData, initializeSheet } from '../utils/googleSheets';

const AddCashForm = ({ selectedUser, onSuccess, refreshKey }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingCash, setHasExistingCash] = useState(false);
  const [existingCashAmount, setExistingCashAmount] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedUser || !selectedUser.trim()) {
      setError('Please select a user first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid cash amount (greater than 0)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save cash as ticker "CASH" with the dollar amount as shares
      // Price will be treated as $1.00 per "share" (dollar)
      const rowData = [
        selectedUser.trim(),
        'CASH',
        amountNum.toString(),
        new Date().toISOString(),
      ];

      console.log('Attempting to add cash to Google Sheets...');
      await appendRow(rowData);
      console.log('Cash added successfully');
      
      setSuccess(true);
      setAmount('');
    } catch (error) {
      console.error('Error adding cash:', error);
      setError(error.message || 'Failed to add cash. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for existing cash holdings
  useEffect(() => {
    const checkExistingCash = async () => {
      if (!selectedUser) {
        setHasExistingCash(false);
        setExistingCashAmount(0);
        return;
      }
      
      try {
        await initializeSheet();
        const data = await readSheetData();
        const rows = data.slice(1).filter(row => row && row.length >= 3 && row[0] && row[1]);
        
        // Find cash holdings for this user
        const cashRows = rows.filter(row => {
          const ticker = row[1]?.trim().toUpperCase();
          const username = row[0]?.trim();
          return (ticker === 'CASH' || ticker === 'USD') && 
                 username.toLowerCase() === selectedUser.trim().toLowerCase();
        });
        
        if (cashRows.length > 0) {
          const totalCash = cashRows.reduce((sum, row) => {
            const shares = parseFloat(row[2]) || 0;
            return sum + shares;
          }, 0);
          
          if (totalCash > 0) {
            setHasExistingCash(true);
            setExistingCashAmount(totalCash);
          } else {
            setHasExistingCash(false);
            setExistingCashAmount(0);
          }
        } else {
          setHasExistingCash(false);
          setExistingCashAmount(0);
        }
      } catch (error) {
        console.error('Error checking existing cash:', error);
        setHasExistingCash(false);
        setExistingCashAmount(0);
      }
    };
    
    checkExistingCash();
  }, [selectedUser, refreshKey]);

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

  return (
    <motion.div
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
          <DollarSign className="w-5 h-5 text-green-500" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">Add Cash Holdings</h3>
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

      {hasExistingCash && selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm mb-4 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Cash holdings already exist</p>
            <p className="text-xs">
              This account already has ${existingCashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in cash holdings.
              Please edit the existing cash record in the holdings section above, or delete it first to add a new amount.
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
            <p className="text-xs text-slate-400 mb-1">Adding cash for</p>
            <p className="text-lg font-semibold text-white">{selectedUser}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Cash Amount ($) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
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
            Enter the total cash amount you want to add to this account
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
              Cash added successfully!
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={isSubmitting || !selectedUser || hasExistingCash}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isSubmitting || hasExistingCash ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting || hasExistingCash ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              {hasExistingCash ? 'Cash Already Exists' : 'Add Cash'}
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddCashForm;

