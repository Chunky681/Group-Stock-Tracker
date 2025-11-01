import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Loader } from 'lucide-react';
import { appendRow } from '../utils/googleSheets';

const AddStockForm = ({ stockData, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [shares, setShares] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      
      setUsername('');
      setShares('');
      
      if (onSuccess) {
        onSuccess();
      }
      
      alert('Stock added successfully!');
    } catch (error) {
      console.error('Error adding stock:', error);
      setError(error.message || 'Failed to add stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!stockData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 mt-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-primary-500" />
        <h3 className="text-xl font-bold text-white">Add to Portfolio</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Shares *
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="0.00"
            className="input-field"
            min="0"
            step="0.01"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Selected stock: <span className="font-semibold">{stockData.symbol}</span> at ${stockData.price.toFixed(2)} per share
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Portfolio
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default AddStockForm;