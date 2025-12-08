import winston from 'winston';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console logging with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    const colorize = (lvl: string, msg: string) => {
      switch (lvl) {
        case 'error':
          return chalk.red(msg);
        case 'warn':
          return chalk.yellow(msg);
        case 'info':
          return chalk.blue(msg);
        case 'success':
          return chalk.green(msg);
        default:
          return msg;
      }
    };
    
    return `${chalk.gray(timestamp)} [${colorize(level, level.toUpperCase())}] ${message}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    // File transport for transactions
    new winston.transports.File({
      filename: path.join(logsDir, 'transactions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Helper functions for colored logging
export const log = {
  info: (message: string) => logger.info(message),
  error: (message: string) => logger.error(message),
  warn: (message: string) => logger.warn(message),
  success: (message: string) => logger.log('success', message),
  
  // Specific formatted logs
  transaction: (type: string, wallet: string, amount: string, txHash?: string) => {
    const msg = txHash 
      ? `${type.toUpperCase()} | Wallet: ${wallet.slice(0, 10)}... | Amount: ${amount} | TxHash: ${txHash}`
      : `${type.toUpperCase()} | Wallet: ${wallet.slice(0, 10)}... | Amount: ${amount}`;
    logger.info(msg);
  },
  
  stats: (stats: any) => {
    logger.info(`STATS | Buys: ${stats.totalBuys} | Sells: ${stats.totalSells} | Volume: ${stats.totalVolume} | Success Rate: ${stats.successRate}%`);
  },
};
