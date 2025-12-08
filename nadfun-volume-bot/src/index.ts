import { CLI } from './utils/cli';
import { logger } from './utils/logger';
import { config } from './config';

async function main() {
  try {
    // Validate configuration
    logger.info('Initializing nadfun Volume Bot...');
    logger.info(`Network: Monad Mainnet (Chain ID: ${config.chainId})`);
    logger.info(`Token: ${config.tokenAddress}`);
    
    // Start CLI
    const cli = new CLI();
    await cli.showMainMenu();
    
  } catch (error: any) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Start the application
main();
