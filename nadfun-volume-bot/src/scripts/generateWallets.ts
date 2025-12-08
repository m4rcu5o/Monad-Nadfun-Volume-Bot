import { WalletService } from '../services/wallet.service';
import { logger } from '../utils/logger';
import { config } from '../config';

async function generateWallets() {
  try {
    logger.info('Starting wallet generation...');
    
    const walletService = new WalletService();
    const wallets = await walletService.generateWallets(config.numberOfWallets);
    
    logger.success(`Successfully generated ${wallets.length} wallets!`);
    logger.info('\nWallet addresses:');
    
    wallets.forEach((wallet, index) => {
      logger.info(`${index + 1}. ${wallet.address}`);
    });
    
    logger.warn('\n⚠️  IMPORTANT: Keep your wallets.json file secure!');
    logger.warn('Never share your private keys with anyone!');
    
  } catch (error: any) {
    logger.error(`Failed to generate wallets: ${error.message}`);
    process.exit(1);
  }
}

generateWallets();
