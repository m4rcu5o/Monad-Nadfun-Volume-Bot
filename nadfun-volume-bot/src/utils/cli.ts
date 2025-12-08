import inquirer from 'inquirer';
import chalk from 'chalk';
import { WalletService } from '../services/wallet.service';
import { VolumeBotService } from '../services/volumeBot.service';
import { logger } from '../utils/logger';
import { config } from '../config';

export class CLI {
  private walletService: WalletService;
  private volumeBot: VolumeBotService | null = null;

  constructor() {
    this.walletService = new WalletService();
  }

  /**
   * Display welcome banner
   */
  private displayBanner(): void {
    console.clear();
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          🚀 nadfun Volume Bot - Monad Mainnet 🚀              ║
║                                                               ║
║              Professional Volume Generation Tool              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `));
    console.log(chalk.gray(`Token Address: ${config.tokenAddress}`));
    console.log(chalk.gray(`Chain ID: ${config.chainId}`));
    console.log(chalk.gray(`RPC: ${config.rpcUrl}\n`));
  }

  /**
   * Main menu
   */
  async showMainMenu(): Promise<void> {
    this.displayBanner();

    const choices = [
      { name: '🔑 Generate Wallets', value: 'generate' },
      { name: '💰 View Master Wallet Balance', value: 'masterBalance' },
      { name: '💸 Distribute Funds to Wallets', value: 'distribute' },
      { name: '📊 View All Wallet Balances', value: 'balances' },
      { name: '🤖 Start Volume Bot', value: 'startBot' },
      { name: '📈 Execute Buy Orders', value: 'executeBuys' },
      { name: '📉 Execute Sell Orders', value: 'executeSells' },
      { name: '🔄 Collect Funds from Wallets', value: 'collect' },
      { name: '❌ Exit', value: 'exit' },
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices,
      },
    ]);

    await this.handleAction(action);
  }

  /**
   * Handle menu action
   */
  private async handleAction(action: string): Promise<void> {
    try {
      switch (action) {
        case 'generate':
          await this.handleGenerateWallets();
          break;
        case 'masterBalance':
          await this.handleMasterBalance();
          break;
        case 'distribute':
          await this.handleDistributeFunds();
          break;
        case 'balances':
          await this.handleViewBalances();
          break;
        case 'startBot':
          await this.handleStartBot();
          break;
        case 'executeBuys':
          await this.handleExecuteBuys();
          break;
        case 'executeSells':
          await this.handleExecuteSells();
          break;
        case 'collect':
          await this.handleCollectFunds();
          break;
        case 'exit':
          console.log(chalk.cyan('\nThank you for using nadfun Volume Bot! 👋\n'));
          process.exit(0);
      }
    } catch (error: any) {
      logger.error(`Error: ${error.message}`);
      await this.waitForKeyPress();
    }

    await this.showMainMenu();
  }

  /**
   * Handle wallet generation
   */
  private async handleGenerateWallets(): Promise<void> {
    const { count } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many wallets do you want to generate?',
        default: config.numberOfWallets,
        validate: (value) => value > 0 || 'Must be greater than 0',
      },
    ]);

    await this.walletService.generateWallets(count);
    logger.success(`Successfully generated ${count} wallets!`);
    await this.waitForKeyPress();
  }

  /**
   * Handle master balance view
   */
  private async handleMasterBalance(): Promise<void> {
    const balance = await this.walletService.getMasterBalance();
    const masterWallet = this.walletService.getMasterWallet();
    
    console.log(chalk.cyan('\n═══════════════════════════════════════'));
    console.log(chalk.white('Master Wallet Information'));
    console.log(chalk.cyan('═══════════════════════════════════════'));
    console.log(chalk.gray(`Address: ${masterWallet.address}`));
    console.log(chalk.green(`Balance: ${balance} MONAD`));
    console.log(chalk.cyan('═══════════════════════════════════════\n'));
    
    await this.waitForKeyPress();
  }

  /**
   * Handle fund distribution
   */
  private async handleDistributeFunds(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    const { amount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'amount',
        message: 'Amount of MONAD to send to each wallet:',
        default: parseFloat(config.distributionAmountPerWallet),
        validate: (value) => value > 0 || 'Must be greater than 0',
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Distribute ${amount} MONAD to each wallet?`,
        default: true,
      },
    ]);

    if (confirm) {
      await this.walletService.distributeFunds(amount.toString());
    } else {
      logger.info('Distribution cancelled');
    }

    await this.waitForKeyPress();
  }

  /**
   * Handle view all balances
   */
  private async handleViewBalances(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    logger.info('Fetching wallet balances...');
    const balances = await this.walletService.getAllBalances();

    console.log(chalk.cyan('\n═══════════════════════════════════════'));
    console.log(chalk.white('Wallet Balances'));
    console.log(chalk.cyan('═══════════════════════════════════════'));

    let totalBalance = 0;
    balances.forEach((wallet, index) => {
      const balance = parseFloat(wallet.balance);
      totalBalance += balance;
      console.log(
        chalk.gray(`${index + 1}. ${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}`),
        chalk.green(`${balance.toFixed(4)} MONAD`)
      );
    });

    console.log(chalk.cyan('───────────────────────────────────────'));
    console.log(chalk.white('Total:'), chalk.green(`${totalBalance.toFixed(4)} MONAD`));
    console.log(chalk.cyan('═══════════════════════════════════════\n'));

    await this.waitForKeyPress();
  }

  /**
   * Handle start volume bot
   */
  private async handleStartBot(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Start volume bot? (Press Ctrl+C to stop)',
        default: true,
      },
    ]);

    if (!confirm) {
      logger.info('Bot start cancelled');
      await this.waitForKeyPress();
      return;
    }

    this.volumeBot = new VolumeBotService(this.walletService);

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      if (this.volumeBot) {
        this.volumeBot.stop();
      }
      console.log(chalk.yellow('\n\nBot stopped by user'));
      process.exit(0);
    });

    await this.volumeBot.start();
  }

  /**
   * Handle execute buy orders
   */
  private async handleExecuteBuys(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    const { count } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many buy transactions to execute?',
        default: 5,
        validate: (value) => value > 0 || 'Must be greater than 0',
      },
    ]);

    this.volumeBot = new VolumeBotService(this.walletService);
    await this.volumeBot.executeBuys(count);
    await this.waitForKeyPress();
  }

  /**
   * Handle execute sell orders
   */
  private async handleExecuteSells(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    const { count } = await inquirer.prompt([
      {
        type: 'number',
        name: 'count',
        message: 'How many sell transactions to execute?',
        default: 5,
        validate: (value) => value > 0 || 'Must be greater than 0',
      },
    ]);

    this.volumeBot = new VolumeBotService(this.walletService);
    await this.volumeBot.executeSells(count);
    await this.waitForKeyPress();
  }

  /**
   * Handle collect funds
   */
  private async handleCollectFunds(): Promise<void> {
    try {
      this.walletService.loadWallets();
    } catch {
      logger.error('No wallets found. Generate wallets first.');
      await this.waitForKeyPress();
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Collect all funds from wallets back to master?',
        default: false,
      },
    ]);

    if (confirm) {
      await this.walletService.collectFunds();
    } else {
      logger.info('Collection cancelled');
    }

    await this.waitForKeyPress();
  }

  /**
   * Wait for user to press a key
   */
  private async waitForKeyPress(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...',
      },
    ]);
  }
}
