import { Wallet } from 'ethers';
import { WalletService } from './wallet.service';
import { TradingService } from './trading.service';
import { config } from '../config';
import { logger } from '../utils/logger';
import { VolumeStats, TradeResult } from '../types';
import {
  delay,
  getRandomDelay,
  getRandomTransactionDelay,
} from '../utils/helpers';

export class VolumeBotService {
  private walletService: WalletService;
  private stats: VolumeStats;
  private isRunning: boolean = false;

  constructor(walletService: WalletService) {
    this.walletService = walletService;
    this.stats = {
      totalBuys: 0,
      totalSells: 0,
      totalVolume: '0',
      successRate: 0,
      activeWallets: 0,
      startTime: new Date(),
    };
  }

  /**
   * Start the volume bot
   */
  async start(): Promise<void> {
    logger.success('🚀 Starting Volume Bot...');
    this.isRunning = true;
    this.stats.startTime = new Date();

    const wallets = this.walletService.getWallets();
    
    if (wallets.length === 0) {
      throw new Error('No wallets available. Generate wallets first.');
    }

    logger.info(`Active wallets: ${wallets.length}`);
    this.stats.activeWallets = wallets.length;

    // Run the main loop
    await this.runVolumeLoop(wallets);
  }

  /**
   * Stop the volume bot
   */
  stop(): void {
    logger.warn('Stopping Volume Bot...');
    this.isRunning = false;
  }

  /**
   * Main volume generation loop
   */
  private async runVolumeLoop(wallets: Wallet[]): Promise<void> {
    let cycleCount = 0;

    while (this.isRunning) {
      cycleCount++;
      logger.info(`\n${'='.repeat(60)}`);
      logger.info(`Starting Trading Cycle #${cycleCount}`);
      logger.info(`${'='.repeat(60)}\n`);

      // Shuffle wallets for randomness
      const shuffledWallets = this.shuffleArray([...wallets]);

      // Process each wallet
      for (const wallet of shuffledWallets) {
        if (!this.isRunning) break;

        try {
          await this.processWallet(wallet);
          
          // Random delay between transactions for natural pattern
          const delayMs = getRandomTransactionDelay();
          logger.info(`Waiting ${(delayMs / 1000).toFixed(1)}s before next transaction...\n`);
          await delay(delayMs);
          
        } catch (error: any) {
          logger.error(`Error processing wallet: ${error.message}`);
          await delay(5000); // Wait before continuing
        }
      }

      // Display cycle summary
      this.displayStats();

      // Delay between cycles
      const cycleDelay = getRandomDelay(config.delayBetweenTxs, config.randomDelay);
      logger.info(`\nCycle complete. Waiting ${(cycleDelay / 1000).toFixed(1)}s before next cycle...\n`);
      await delay(cycleDelay);
    }

    logger.success('Volume Bot stopped.');
  }

  /**
   * Process a single wallet (buy or sell)
   */
  private async processWallet(wallet: Wallet): Promise<void> {
    const tradingService = new TradingService(wallet);
    
    // Check if wallet has tokens
    const hasTokens = await tradingService.hasTokens(wallet);
    
    // Decide whether to buy or sell
    // If has tokens: 70% chance to sell, 30% to buy more
    // If no tokens: 100% buy
    const shouldSell = hasTokens && Math.random() < 0.7;
    
    let result: TradeResult;
    
    if (shouldSell) {
      result = await tradingService.executeSell(wallet);
      if (result.success) {
        this.stats.totalSells++;
      }
    } else {
      result = await tradingService.executeBuy(wallet);
      if (result.success) {
        this.stats.totalBuys++;
      }
    }

    // Update stats
    this.updateStats(result);
  }

  /**
   * Update statistics
   */
  private updateStats(result: TradeResult): void {
    if (result.success && result.amountIn) {
      const currentVolume = parseFloat(this.stats.totalVolume);
      const newVolume = currentVolume + parseFloat(result.amountIn);
      this.stats.totalVolume = newVolume.toFixed(4);
    }

    const totalTrades = this.stats.totalBuys + this.stats.totalSells;
    this.stats.successRate = totalTrades > 0 
      ? Math.round((this.stats.totalBuys + this.stats.totalSells) / totalTrades * 100) 
      : 0;
  }

  /**
   * Display current statistics
   */
  private displayStats(): void {
    const runtime = Math.floor((Date.now() - this.stats.startTime.getTime()) / 1000 / 60);
    
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 VOLUME BOT STATISTICS');
    logger.info('='.repeat(60));
    logger.info(`Runtime: ${runtime} minutes`);
    logger.info(`Total Buys: ${this.stats.totalBuys}`);
    logger.info(`Total Sells: ${this.stats.totalSells}`);
    logger.info(`Total Volume: ${this.stats.totalVolume} MONAD`);
    logger.info(`Active Wallets: ${this.stats.activeWallets}`);
    logger.info(`Success Rate: ${this.stats.successRate}%`);
    logger.info('='.repeat(60) + '\n');
  }

  /**
   * Get current statistics
   */
  getStats(): VolumeStats {
    return { ...this.stats };
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Execute a specific number of buy transactions
   */
  async executeBuys(count: number): Promise<void> {
    logger.info(`Executing ${count} buy transactions...`);
    const wallets = this.walletService.getWallets();
    
    for (let i = 0; i < count; i++) {
      const wallet = wallets[i % wallets.length];
      const tradingService = new TradingService(wallet);
      
      const result = await tradingService.executeBuy(wallet);
      if (result.success) {
        this.stats.totalBuys++;
        this.updateStats(result);
      }

      if (i < count - 1) {
        const delayMs = getRandomDelay(config.delayBetweenTxs, config.randomDelay);
        await delay(delayMs);
      }
    }
    
    logger.success(`Completed ${count} buy transactions`);
  }

  /**
   * Execute a specific number of sell transactions
   */
  async executeSells(count: number): Promise<void> {
    logger.info(`Executing ${count} sell transactions...`);
    const wallets = this.walletService.getWallets();
    
    let executed = 0;
    for (const wallet of wallets) {
      if (executed >= count) break;
      
      const tradingService = new TradingService(wallet);
      const hasTokens = await tradingService.hasTokens(wallet);
      
      if (!hasTokens) continue;
      
      const result = await tradingService.executeSell(wallet);
      if (result.success) {
        this.stats.totalSells++;
        this.updateStats(result);
        executed++;
      }

      if (executed < count) {
        const delayMs = getRandomDelay(config.delayBetweenTxs, config.randomDelay);
        await delay(delayMs);
      }
    }
    
    logger.success(`Completed ${executed} sell transactions`);
  }
}
