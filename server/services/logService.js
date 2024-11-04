class LogService {
  constructor() {
    this.levels = {
      ERROR: 'ERROR',
      WARN: 'WARN',
      INFO: 'INFO',
      DEBUG: 'DEBUG'
    };
  }

  formatMessage(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
  }

  error(message, error = null) {
    const logData = this.formatMessage(this.levels.ERROR, message, {
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null
    });
    console.error(JSON.stringify(logData));
  }

  warn(message, data = {}) {
    const logData = this.formatMessage(this.levels.WARN, message, data);
    console.warn(JSON.stringify(logData));
  }

  info(message, data = {}) {
    const logData = this.formatMessage(this.levels.INFO, message, data);
    console.log(JSON.stringify(logData));
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      const logData = this.formatMessage(this.levels.DEBUG, message, data);
      console.log(JSON.stringify(logData));
    }
  }
}

export default new LogService();