// Logger utility for production
const logger = {
  info: (message, data = {}) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(JSON.stringify({ level: "INFO", message, data, timestamp: new Date().toISOString() }));
    }
  },
  
  error: (message, error = null, data = {}) => {
    console.error(JSON.stringify({
      level: "ERROR",
      message,
      error: error ? { message: error.message, stack: error.stack } : null,
      data,
      timestamp: new Date().toISOString(),
    }));
  },
  
  warn: (message, data = {}) => {
    console.warn(JSON.stringify({ level: "WARN", message, data, timestamp: new Date().toISOString() }));
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify({ level: "DEBUG", message, data, timestamp: new Date().toISOString() }));
    }
  },
};

export default logger;
