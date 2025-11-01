import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader, CheckCircle2 } from 'lucide-react';
import { appendRow } from '../utils/googleSheets';

const AddStockForm = ({ stockData, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!username.trim()) {
      setError('Please enter a username');
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
        username.trim(),
        stockData.symbol,
        sharesNum.toString(),
        new Date().toISOString(),
      ];

      await appendRow(rowData);
      
      setSuccess(true);
      setUsername('');
      setShares('');
    } catch (error) {
      console.error('Error adding stock:', error);
      setError(error.message || 'Failed to add stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="Enter your username"
            className="input-field"
            required
            disabled={isSubmitting}
          />
        </motion.div>

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
            Selected stock: <span className="font-semibold text-primary-400">{stockData.symbol}</span> at ${stockData.price.toFixed(2)} per share
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
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        >
          {isSubmitting ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </motion.span>
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Portfolio
            </motion.span>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default AddStockForm;
