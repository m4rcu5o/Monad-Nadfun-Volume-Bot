import { Wallet, Contract, parseEther, formatEther, parseUnits } from 'ethers';
import { config } from '../config';
import { logger } from '../utils/logger';
import { TradeResult } from '../types';
import {
  getRandomAmount,
  getRandomPercentage,
  calculatePercentage,
  calculateSlippage,
  retryWithBackoff,
} from '../utils/helpers';

// Basic ERC20 ABI for token operations
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// nadfun Router ABI (simplified - adjust based on actual contract)
const NADFUN_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)',
];

export class TradingService {
  private routerContract: Contract;
  private tokenContract: Contract;

  constructor(wallet: Wallet) {
    this.routerContract = new Contract(
      config.nadfunRouterAddress,
      NADFUN_ROUTER_ABI,
      wallet
    );

    this.tokenContract = new Contract(
      config.tokenAddress,
      ERC20_ABI,
      wallet
    );
  }

  /**
   * Execute a buy transaction
   */
  async executeBuy(wallet: Wallet): Promise<TradeResult> {
    const startTime = Date.now();
    
    try {
      // Generate random buy amount
      const buyAmount = getRandomAmount(config.minBuyAmount, config.maxBuyAmount);
      
      logger.info(`[BUY] Wallet: ${wallet.address.slice(0, 10)}... | Amount: ${formatEther(buyAmount)} MONAD`);

      // Get WETH address from router
      const wethAddress = await this.routerContract.WETH();
      
      // Path: MONAD (WETH) -> Token
      const path = [wethAddress, config.tokenAddress];
      
      // Get expected output amount
      const amounts = await this.routerContract.getAmountsOut(buyAmount, path);
      const expectedOut = amounts[1];
      
      // Calculate minimum output with slippage protection
      const minAmountOut = config.enableSlippageProtection
        ? calculateSlippage(expectedOut, config.maxSlippagePercent)
        : BigInt(0);

      // Set deadline (10 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 600;

      // Execute swap
      const tx = await this.routerContract.swapExactETHForTokens(
        minAmountOut,
        path,
        wallet.address,
        deadline,
        {
          value: buyAmount,
          gasLimit: config.gasLimit,
        }
      );

      logger.info(`[BUY] Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const executionTime = Date.now() - startTime;

      if (receipt.status === 1) {
        logger.success(`[BUY] Success! TxHash: ${tx.hash} | Time: ${executionTime}ms`);
        return {
          success: true,
          txHash: tx.hash,
          amountIn: formatEther(buyAmount),
          amountOut: formatEther(expectedOut),
          wallet: wallet.address,
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      logger.error(`[BUY] Failed for ${wallet.address}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        wallet: wallet.address,
      };
    }
  }

  /**
   * Execute a sell transaction
   */
  async executeSell(wallet: Wallet): Promise<TradeResult> {
    const startTime = Date.now();
    
    try {
      // Update contract instances with current wallet
      const tokenContract = new Contract(config.tokenAddress, ERC20_ABI, wallet);
      const routerContract = new Contract(config.nadfunRouterAddress, NADFUN_ROUTER_ABI, wallet);

      // Get token balance
      const tokenBalance = await tokenContract.balanceOf(wallet.address);
      
      if (tokenBalance === BigInt(0)) {
        return {
          success: false,
          error: 'No tokens to sell',
          wallet: wallet.address,
        };
      }

      // Calculate random percentage to sell
      const sellPercentage = getRandomPercentage(
        config.minSellPercentage,
        config.maxSellPercentage
      );
      
      const sellAmount = calculatePercentage(tokenBalance, sellPercentage);
      
      logger.info(`[SELL] Wallet: ${wallet.address.slice(0, 10)}... | Selling ${sellPercentage}% | Amount: ${formatEther(sellAmount)} tokens`);

      // Check and approve if needed
      const allowance = await tokenContract.allowance(wallet.address, config.nadfunRouterAddress);
      
      if (allowance < sellAmount) {
        logger.info('[SELL] Approving tokens...');
        const approveTx = await tokenContract.approve(
          config.nadfunRouterAddress,
          sellAmount
        );
        await approveTx.wait();
        logger.info('[SELL] Approval confirmed');
      }

      // Get WETH address
      const wethAddress = await routerContract.WETH();
      
      // Path: Token -> MONAD (WETH)
      const path = [config.tokenAddress, wethAddress];
      
      // Get expected output amount
      const amounts = await routerContract.getAmountsOut(sellAmount, path);
      const expectedOut = amounts[1];
      
      // Calculate minimum output with slippage protection
      const minAmountOut = config.enableSlippageProtection
        ? calculateSlippage(expectedOut, config.maxSlippagePercent)
        : BigInt(0);

      // Set deadline
      const deadline = Math.floor(Date.now() / 1000) + 600;

      // Execute swap
      const tx = await routerContract.swapExactTokensForETH(
        sellAmount,
        minAmountOut,
        path,
        wallet.address,
        deadline,
        {
          gasLimit: config.gasLimit,
        }
      );

      logger.info(`[SELL] Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      const executionTime = Date.now() - startTime;

      if (receipt.status === 1) {
        logger.success(`[SELL] Success! TxHash: ${tx.hash} | Time: ${executionTime}ms`);
        return {
          success: true,
          txHash: tx.hash,
          amountIn: formatEther(sellAmount),
          amountOut: formatEther(expectedOut),
          wallet: wallet.address,
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      logger.error(`[SELL] Failed for ${wallet.address}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        wallet: wallet.address,
      };
    }
  }

  /**
   * Get token balance for a wallet
   */
  async getTokenBalance(wallet: Wallet): Promise<bigint> {
    const tokenContract = new Contract(config.tokenAddress, ERC20_ABI, wallet);
    return await tokenContract.balanceOf(wallet.address);
  }

  /**
   * Check if wallet has tokens
   */
  async hasTokens(wallet: Wallet): Promise<boolean> {
    const balance = await this.getTokenBalance(wallet);
    return balance > BigInt(0);
  }
}
