import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { subscribeToRateLimit } from '../utils/rateLimiter';

const RefreshTimer = ({ onRefresh, intervalSeconds = 60 }) => {
  const [timeRemaining, setTimeRemaining] = useState(intervalSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [rateLimitState, setRateLimitState] = useState({ count: 0, percentage: 0, isLimited: false });
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

  // Subscribe to rate limit updates
  useEffect(() => {
    const unsubscribe = subscribeToRateLimit((state) => {
      setRateLimitState(state);
    });
    
    return unsubscribe;
  }, []);

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
          {/* Rate Limit Progress Bar */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-2 h-16 bg-slate-700 rounded-full overflow-hidden relative">
              <motion.div
                className={`absolute bottom-0 left-0 right-0 rounded-full transition-colors ${
                  rateLimitState.isLimited 
                    ? 'bg-red-500' 
                    : rateLimitState.percentage > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-primary-500'
                }`}
                initial={{ height: 0 }}
                animate={{ height: `${rateLimitState.percentage}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: `${rateLimitState.percentage}%` }}
              />
            </div>
          </div>

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

        {/* Rate Limit Error Message */}
        <AnimatePresence>
          {rateLimitState.isLimited && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>API rate limit reached. Please wait for the bar to cool down.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RefreshTimer;

