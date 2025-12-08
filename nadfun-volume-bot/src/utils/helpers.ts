import { parseEther, formatEther } from 'ethers';

/**
 * Delay execution for specified milliseconds
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get random delay between min and max
 */
export function getRandomDelay(baseDelay: number, randomRange: number): number {
  return baseDelay + Math.floor(Math.random() * randomRange);
}

/**
 * Generate random amount between min and max
 */
export function getRandomAmount(min: string, max: string): bigint {
  const minWei = parseEther(min);
  const maxWei = parseEther(max);
  const range = maxWei - minWei;
  const randomValue = BigInt(Math.floor(Math.random() * Number(range)));
  return minWei + randomValue;
}

/**
 * Get random percentage between min and max
 */
export function getRandomPercentage(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: bigint, percentage: number): bigint {
  return (amount * BigInt(percentage)) / BigInt(100);
}

/**
 * Retry async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delayMs = baseDelay * Math.pow(2, i);
      await delay(delayMs);
    }
  }
  throw new Error('Max retries reached');
}

/**
 * Check if transaction was successful
 */
export function isTransactionSuccessful(receipt: any): boolean {
  return receipt && receipt.status === 1;
}

/**
 * Format wei to ether with specified decimals
 */
export function formatBalance(balance: bigint, decimals: number = 4): string {
  const formatted = formatEther(balance);
  return parseFloat(formatted).toFixed(decimals);
}

/**
 * Generate random transaction delay for more natural pattern
 */
export function getRandomTransactionDelay(): number {
  // Creates more realistic trading patterns
  const patterns = [
    { min: 3000, max: 8000, weight: 0.4 },   // Fast traders
    { min: 8000, max: 15000, weight: 0.3 },  // Normal traders
    { min: 15000, max: 30000, weight: 0.2 }, // Slow traders
    { min: 30000, max: 60000, weight: 0.1 }, // Very slow traders
  ];

  const rand = Math.random();
  let cumulative = 0;
  
  for (const pattern of patterns) {
    cumulative += pattern.weight;
    if (rand <= cumulative) {
      return Math.floor(Math.random() * (pattern.max - pattern.min + 1)) + pattern.min;
    }
  }
  
  return 10000; // Default
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate slippage amount
 */
export function calculateSlippage(amount: bigint, slippagePercent: number): bigint {
  return (amount * BigInt(100 - slippagePercent)) / BigInt(100);
}
