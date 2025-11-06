// Rate limiter for Google Sheets API requests
// Tracks requests in a 60-second sliding window
// Maximum 50 requests per 60 seconds

const MAX_REQUESTS = 50;
const WINDOW_MS = 60 * 1000; // 60 seconds
const STORAGE_KEY = 'gs_rate_limit_timestamps'; // localStorage key

// Store timestamps of API requests
let requestTimestamps = [];

// Load persisted timestamps from localStorage
const loadPersistedTimestamps = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const timestamps = JSON.parse(stored);
      // Filter out timestamps that are older than 60 seconds
      const now = Date.now();
      return timestamps.filter(timestamp => (now - timestamp) < WINDOW_MS);
    }
  } catch (error) {
    console.error('Error loading persisted rate limit timestamps:', error);
  }
  return [];
};

// Save timestamps to localStorage
const savePersistedTimestamps = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requestTimestamps));
  } catch (error) {
    console.error('Error saving persisted rate limit timestamps:', error);
  }
};

// Initialize with persisted timestamps
requestTimestamps = loadPersistedTimestamps();

// Listener for rate limit updates
let rateLimitListeners = new Set();

// Subscribe to rate limit updates
export const subscribeToRateLimit = (callback) => {
  rateLimitListeners.add(callback);
  // Return current state immediately
  const currentCount = getCurrentRequestCount();
  const currentPercentage = (currentCount / MAX_REQUESTS) * 100;
  callback({ count: currentCount, percentage: currentPercentage, isLimited: currentCount >= MAX_REQUESTS });
  
  // Return unsubscribe function
  return () => {
    rateLimitListeners.delete(callback);
  };
};

// Notify all listeners of rate limit state
const notifyListeners = () => {
  const count = getCurrentRequestCount();
  const percentage = (count / MAX_REQUESTS) * 100;
  const isLimited = count >= MAX_REQUESTS;
  
  rateLimitListeners.forEach(callback => {
    callback({ count, percentage, isLimited });
  });
};

// Clean up old requests outside the 60-second window
const cleanupOldRequests = () => {
  const now = Date.now();
  const beforeLength = requestTimestamps.length;
  requestTimestamps = requestTimestamps.filter(timestamp => {
    return (now - timestamp) < WINDOW_MS;
  });
  
  // Save to localStorage if we removed any requests
  if (requestTimestamps.length !== beforeLength) {
    savePersistedTimestamps();
  }
};

// Record an API request
export const recordApiRequest = () => {
  const now = Date.now();
  
  // Clean up old requests first
  cleanupOldRequests();
  
  // Check if we're at the limit
  if (requestTimestamps.length >= MAX_REQUESTS) {
    const oldestRequest = requestTimestamps[0];
    const timeUntilOldestExpires = WINDOW_MS - (now - oldestRequest);
    
    if (timeUntilOldestExpires > 0) {
      // We're at the limit and the oldest request hasn't expired yet
      throw new Error(`API rate limit exceeded. Maximum ${MAX_REQUESTS} requests per minute. Please wait ${Math.ceil(timeUntilOldestExpires / 1000)} seconds before making another request.`);
    }
  }
  
  // Add the current request timestamp
  requestTimestamps.push(now);
  
  // Save to localStorage
  savePersistedTimestamps();
  
  // Notify listeners
  notifyListeners();
  
  return true;
};

// Get current request count in the window
export const getCurrentRequestCount = () => {
  cleanupOldRequests();
  return requestTimestamps.length;
};

// Get the percentage of limit used
export const getLimitPercentage = () => {
  const count = getCurrentRequestCount();
  return (count / MAX_REQUESTS) * 100;
};

// Check if we're currently rate limited
export const isRateLimited = () => {
  cleanupOldRequests();
  return requestTimestamps.length >= MAX_REQUESTS;
};

// Get time until the oldest request expires (in milliseconds)
export const getTimeUntilLimitReset = () => {
  if (requestTimestamps.length === 0) {
    return 0;
  }
  
  cleanupOldRequests();
  
  if (requestTimestamps.length === 0) {
    return 0;
  }
  
  const now = Date.now();
  const oldestRequest = requestTimestamps[0];
  const timeUntilExpires = WINDOW_MS - (now - oldestRequest);
  
  return Math.max(0, timeUntilExpires);
};

// Start periodic cleanup to keep listeners updated
// This ensures the progress bar updates smoothly as requests expire
let cleanupInterval = null;

export const startPeriodicCleanup = () => {
  if (cleanupInterval) return; // Already started
  
  cleanupInterval = setInterval(() => {
    const hadRequests = requestTimestamps.length > 0;
    cleanupOldRequests();
    // Only notify if there were requests before cleanup (to update UI)
    if (hadRequests) {
      notifyListeners();
    }
  }, 1000); // Check every second
};

// Stop periodic cleanup (useful for cleanup in tests)
export const stopPeriodicCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Start cleanup automatically when module loads
if (typeof window !== 'undefined') {
  startPeriodicCleanup();
}

