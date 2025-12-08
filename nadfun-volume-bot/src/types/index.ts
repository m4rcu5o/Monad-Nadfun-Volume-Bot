import { Wallet } from 'ethers';

export interface Config {
  rpcUrl: string;
  chainId: number;
  masterPrivateKey: string;
  nadfunRouterAddress: string;
  nadfunFactoryAddress: string;
  tokenAddress: string;
  minBuyAmount: string;
  maxBuyAmount: string;
  minSellPercentage: number;
  maxSellPercentage: number;
  numberOfWallets: number;
  distributionAmountPerWallet: string;
  delayBetweenTxs: number;
  randomDelay: number;
  maxGasPrice: string;
  gasLimit: number;
  enableSlippageProtection: boolean;
  maxSlippagePercent: number;
  stopLossPercent: number;
}

export interface WalletInfo {
  address: string;
  privateKey: string;
  balance: string;
  tokenBalance: string;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amountIn?: string;
  amountOut?: string;
  wallet: string;
}

export interface VolumeStats {
  totalBuys: number;
  totalSells: number;
  totalVolume: string;
  successRate: number;
  activeWallets: number;
  startTime: Date;
}

export interface TransactionLog {
  timestamp: Date;
  type: 'buy' | 'sell' | 'transfer';
  wallet: string;
  amount: string;
  txHash?: string;
  success: boolean;
  error?: string;
}
