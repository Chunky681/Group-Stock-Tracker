import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { getReadRequestCount, getWriteRequestCount } from '../utils/googleSheets';

const ReadCounter = () => {
  const [readCount, setReadCount] = useState(0);
  const [writeCount, setWriteCount] = useState(0);

  useEffect(() => {
    // Update counts every second
    const interval = setInterval(() => {
      setReadCount(getReadRequestCount());
      setWriteCount(getWriteRequestCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="card p-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary-400" />
          <div className="text-xs">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-slate-400">Sheet Reads</div>
                <motion.div
                  key={readCount}
                  initial={{ scale: 1.2, color: '#0ea5e9' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-white font-bold text-lg"
                >
                  {readCount}
                </motion.div>
              </div>
              <div>
                <div className="text-slate-400">Sheet Writes</div>
                <motion.div
                  key={writeCount}
                  initial={{ scale: 1.2, color: '#10b981' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-white font-bold text-lg"
                >
                  {writeCount}
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReadCounter;

