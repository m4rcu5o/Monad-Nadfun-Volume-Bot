import dotenv from 'dotenv';
import { Config } from '../types';
import { parseEther } from 'ethers';

dotenv.config();

export function loadConfig(): Config {
  const requiredEnvVars = [
    'RPC_URL',
    'CHAIN_ID',
    'MASTER_PRIVATE_KEY',
    'TOKEN_ADDRESS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    rpcUrl: process.env.RPC_URL!,
    chainId: parseInt(process.env.CHAIN_ID!),
    masterPrivateKey: process.env.MASTER_PRIVATE_KEY!,
    nadfunRouterAddress: process.env.NADFUN_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
    nadfunFactoryAddress: process.env.NADFUN_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    tokenAddress: process.env.TOKEN_ADDRESS!,
    minBuyAmount: process.env.MIN_BUY_AMOUNT_MONAD || '0.001',
    maxBuyAmount: process.env.MAX_BUY_AMOUNT_MONAD || '0.1',
    minSellPercentage: parseInt(process.env.MIN_SELL_PERCENTAGE || '50'),
    maxSellPercentage: parseInt(process.env.MAX_SELL_PERCENTAGE || '100'),
    numberOfWallets: parseInt(process.env.NUMBER_OF_WALLETS || '10'),
    distributionAmountPerWallet: process.env.DISTRIBUTION_AMOUNT_PER_WALLET || '0.5',
    delayBetweenTxs: parseInt(process.env.DELAY_BETWEEN_TXS_MS || '5000'),
    randomDelay: parseInt(process.env.RANDOM_DELAY_MS || '3000'),
    maxGasPrice: process.env.MAX_GAS_PRICE_GWEI || '50',
    gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
    enableSlippageProtection: process.env.ENABLE_SLIPPAGE_PROTECTION === 'true',
    maxSlippagePercent: parseInt(process.env.MAX_SLIPPAGE_PERCENT || '5'),
    stopLossPercent: parseInt(process.env.STOP_LOSS_PERCENT || '20'),
  };
}

export const config = loadConfig();
