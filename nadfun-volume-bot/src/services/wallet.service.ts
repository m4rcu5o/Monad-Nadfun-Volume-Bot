import { ethers, Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers';
import fs from 'fs';
import path from 'path';
import { WalletInfo } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';

export class WalletService {
  private provider: JsonRpcProvider;
  private masterWallet: Wallet;
  private wallets: Wallet[] = [];
  private walletsDir: string;

  constructor() {
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.masterWallet = new Wallet(config.masterPrivateKey, this.provider);
    this.walletsDir = path.join(process.cwd(), 'wallets');
    
    // Create wallets directory if it doesn't exist
    if (!fs.existsSync(this.walletsDir)) {
      fs.mkdirSync(this.walletsDir, { recursive: true });
    }
  }

  /**
   * Generate new wallets
   */
  async generateWallets(count: number): Promise<WalletInfo[]> {
    logger.info(`Generating ${count} new wallets...`);
    const walletsInfo: WalletInfo[] = [];

    for (let i = 0; i < count; i++) {
      const wallet = Wallet.createRandom().connect(this.provider);
      this.wallets.push(wallet);
      
      walletsInfo.push({
        address: wallet.address,
        privateKey: wallet.privateKey,
        balance: '0',
        tokenBalance: '0',
      });

      logger.info(`Generated wallet ${i + 1}/${count}: ${wallet.address}`);
    }

    // Save wallets to file
    this.saveWallets(walletsInfo);
    return walletsInfo;
  }

  /**
   * Load wallets from file
   */
  loadWallets(): WalletInfo[] {
    const walletsFile = path.join(this.walletsDir, 'wallets.json');
    
    if (!fs.existsSync(walletsFile)) {
      throw new Error('No wallets file found. Generate wallets first.');
    }

    const data = fs.readFileSync(walletsFile, 'utf-8');
    const walletsInfo: WalletInfo[] = JSON.parse(data);

    this.wallets = walletsInfo.map(info => 
      new Wallet(info.privateKey, this.provider)
    );

    logger.info(`Loaded ${this.wallets.length} wallets from file`);
    return walletsInfo;
  }

  /**
   * Save wallets to encrypted file
   */
  private saveWallets(walletsInfo: WalletInfo[]): void {
    const walletsFile = path.join(this.walletsDir, 'wallets.json');
    fs.writeFileSync(walletsFile, JSON.stringify(walletsInfo, null, 2));
    logger.success(`Wallets saved to ${walletsFile}`);
    logger.warn('IMPORTANT: Keep this file secure and never share it!');
  }

  /**
   * Get master wallet
   */
  getMasterWallet(): Wallet {
    return this.masterWallet;
  }

  /**
   * Get all generated wallets
   */
  getWallets(): Wallet[] {
    return this.wallets;
  }

  /**
   * Get wallet by index
   */
  getWallet(index: number): Wallet | undefined {
    return this.wallets[index];
  }

  /**
   * Check master wallet balance
   */
  async getMasterBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.masterWallet.address);
    return formatEther(balance);
  }

  /**
   * Get balance for a specific wallet
   */
  async getWalletBalance(wallet: Wallet): Promise<string> {
    const balance = await this.provider.getBalance(wallet.address);
    return formatEther(balance);
  }

  /**
   * Get balances for all wallets
   */
  async getAllBalances(): Promise<{ address: string; balance: string }[]> {
    const balances = [];
    
    for (const wallet of this.wallets) {
      const balance = await this.getWalletBalance(wallet);
      balances.push({
        address: wallet.address,
        balance,
      });
    }

    return balances;
  }

  /**
   * Distribute funds from master wallet to generated wallets
   */
  async distributeFunds(amountPerWallet: string): Promise<void> {
    logger.info(`Distributing ${amountPerWallet} MONAD to each wallet...`);
    
    const masterBalance = await this.getMasterBalance();
    const totalRequired = parseFloat(amountPerWallet) * this.wallets.length;
    
    if (parseFloat(masterBalance) < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired} MONAD, Available: ${masterBalance} MONAD`);
    }

    const amount = parseEther(amountPerWallet);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < this.wallets.length; i++) {
      const wallet = this.wallets[i];
      
      try {
        logger.info(`Sending ${amountPerWallet} MONAD to wallet ${i + 1}/${this.wallets.length}`);
        
        const tx = await this.masterWallet.sendTransaction({
          to: wallet.address,
          value: amount,
        });

        logger.info(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        
        logger.success(`Successfully funded wallet: ${wallet.address}`);
        successCount++;
        
        // Small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        logger.error(`Failed to fund wallet ${wallet.address}: ${error.message}`);
        failCount++;
      }
    }

    logger.success(`Distribution complete! Success: ${successCount}, Failed: ${failCount}`);
  }

  /**
   * Collect funds from all wallets back to master
   */
  async collectFunds(): Promise<void> {
    logger.info('Collecting funds from all wallets back to master...');
    
    let totalCollected = BigInt(0);
    let successCount = 0;

    for (const wallet of this.wallets) {
      try {
        const balance = await this.provider.getBalance(wallet.address);
        
        if (balance === BigInt(0)) {
          continue;
        }

        // Estimate gas for the transaction
        const gasPrice = (await this.provider.getFeeData()).gasPrice || BigInt(0);
        const gasLimit = BigInt(21000);
        const gasCost = gasPrice * gasLimit;

        if (balance <= gasCost) {
          logger.warn(`Wallet ${wallet.address} has insufficient balance to cover gas`);
          continue;
        }

        const amountToSend = balance - gasCost;

        const tx = await wallet.sendTransaction({
          to: this.masterWallet.address,
          value: amountToSend,
          gasLimit: gasLimit,
        });

        await tx.wait();
        
        totalCollected += amountToSend;
        successCount++;
        logger.success(`Collected ${formatEther(amountToSend)} MONAD from ${wallet.address}`);
        
      } catch (error: any) {
        logger.error(`Failed to collect from ${wallet.address}: ${error.message}`);
      }
    }

    logger.success(`Collection complete! Collected ${formatEther(totalCollected)} MONAD from ${successCount} wallets`);
  }

  /**
   * Get provider instance
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }
}
