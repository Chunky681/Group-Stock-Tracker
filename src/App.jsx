import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import StockSearch from './components/StockSearch';
import AddStockForm from './components/AddStockForm';
import Portfolio from './components/Portfolio';

function App() {
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioKey, setPortfolioKey] = useState(0);

  const handleStockSelected = (stockData) => {
    setSelectedStock(stockData);
  };

  const handleStockAdded = () => {
    setPortfolioKey(prev => prev + 1);
    setSelectedStock(null);
  };

  return (
    <div className="min-h-screen">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Search & Add Stocks</h2>
            <StockSearch onStockSelected={handleStockSelected} />
            <AddStockForm stockData={selectedStock} onSuccess={handleStockAdded} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          key={portfolioKey}
        >
          <Portfolio />
        </motion.div>
      </div>
    </div>
  );
}

export default App;