import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock } from 'lucide-react';

const RefreshTimer = ({ onRefresh, intervalSeconds = 60 }) => {
  const [timeRemaining, setTimeRemaining] = useState(intervalSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const intervalRef = useRef(null);
  const lastRefreshTimeRef = useRef(Date.now());
  const lastManualRefreshTimeRef = useRef(0); // Track last manual refresh for cooldown
  const onRefreshRef = useRef(onRefresh);
  const isRefreshingRef = useRef(false);
  const cooldownSeconds = 5; // 5 second cooldown for manual refresh

  // Keep refs up to date
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  // Check cooldown status
  useEffect(() => {
    const checkCooldown = () => {
      const now = Date.now();
      const timeSinceLastManualRefresh = (now - lastManualRefreshTimeRef.current) / 1000;
      const onCooldown = timeSinceLastManualRefresh < cooldownSeconds;
      setIsOnCooldown(onCooldown);
    };

    // Check immediately
    checkCooldown();

    // Check every second during cooldown
    const cooldownInterval = setInterval(() => {
      checkCooldown();
    }, 1000);

    return () => clearInterval(cooldownInterval);
  }, [cooldownSeconds]);

  const handleRefresh = async (isAutoRefresh = false) => {
    // For manual refreshes, check cooldown
    if (!isAutoRefresh) {
      const now = Date.now();
      const timeSinceLastManualRefresh = (now - lastManualRefreshTimeRef.current) / 1000;
      if (timeSinceLastManualRefresh < cooldownSeconds) {
        return; // Still on cooldown, ignore click
      }
      // Update last manual refresh time
      lastManualRefreshTimeRef.current = now;
      setIsOnCooldown(true);
    }

    if (isRefreshingRef.current) return;
    
    setIsRefreshing(true);
    isRefreshingRef.current = true;
    
    try {
      // Call the refresh callback
      if (onRefreshRef.current) {
        await onRefreshRef.current();
      }
      
      // Reset timer
      lastRefreshTimeRef.current = Date.now();
      setTimeRemaining(intervalSeconds);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  };

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastRefreshTimeRef.current) / 1000);
      const remaining = Math.max(0, intervalSeconds - elapsed);
      
      setTimeRemaining(remaining);
      
      // Auto-refresh when timer reaches 0
      if (remaining === 0 && !isRefreshingRef.current) {
        handleRefresh(true);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalSeconds]); // Only depend on intervalSeconds

  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="card p-3 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" />
            <div className="text-xs">
              <div className="text-slate-400 mb-1">Next refresh</div>
              <motion.div
                key={timeRemaining}
                initial={{ scale: timeRemaining <= 5 ? 1.2 : 1 }}
                animate={{ scale: 1 }}
                className={`text-white font-bold text-lg ${
                  timeRemaining <= 5 ? 'text-primary-400' : ''
                }`}
              >
                {formatTime(timeRemaining)}
              </motion.div>
            </div>
          </div>

          {/* Refresh Button */}
          <motion.button
            onClick={() => handleRefresh(false)}
            disabled={isRefreshing || isOnCooldown}
            className="p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: (isRefreshing || isOnCooldown) ? 1 : 1.05 }}
            whileTap={{ scale: (isRefreshing || isOnCooldown) ? 1 : 0.95 }}
            title={isOnCooldown ? "Please wait before refreshing again" : "Refresh data now"}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
            >
              <RefreshCw className={`w-4 h-4 text-primary-400 ${isRefreshing ? 'opacity-100' : ''}`} />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default RefreshTimer;

