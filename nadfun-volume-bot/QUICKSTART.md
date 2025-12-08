# 🚀 Quick Start Guide - nadfun Volume Bot

Get up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] A Monad Mainnet wallet with MONAD tokens
- [ ] Your master wallet private key
- [ ] The token address you want to create volume for
- [ ] nadfun router contract address

## Step 1: Installation (2 minutes)

```bash
# Navigate to the project directory
cd nadfun-volume-bot

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 2: Configuration (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit the configuration
nano .env  # or use your preferred editor
```

**Minimal required configuration:**

```env
# REQUIRED - Update these!
RPC_URL=https://rpc3.monad.xyz
MASTER_PRIVATE_KEY=your_private_key_here
TOKEN_ADDRESS=0x...your_token_address...
NADFUN_ROUTER_ADDRESS=0x...nadfun_router_address...

# OPTIONAL - Can keep defaults
CHAIN_ID=143
NUMBER_OF_WALLETS=10
DISTRIBUTION_AMOUNT_PER_WALLET=0.5
MIN_BUY_AMOUNT_MONAD=0.001
MAX_BUY_AMOUNT_MONAD=0.1
```

## Step 3: Setup Wallets (1 minute)

```bash
# Start the bot
npm start
```

In the CLI menu:
1. Select **"🔑 Generate Wallets"**
2. Enter number of wallets (default: 10)
3. Wait for generation to complete

## Step 4: Fund Wallets (1 minute)

In the CLI menu:
1. Select **"💸 Distribute Funds to Wallets"**
2. Enter amount per wallet (e.g., 0.5 MONAD)
3. Confirm distribution
4. Wait for transactions to complete

## Step 5: Start Trading! (Immediate)

In the CLI menu:
1. Select **"🤖 Start Volume Bot"**
2. Confirm to start
3. Watch the volume being generated! 🎉

**To stop**: Press `Ctrl+C`

---

## 🎯 Common First-Time Tasks

### Quick Test (Recommended for first run)

1. Generate 3-5 wallets
2. Distribute 0.1 MONAD per wallet
3. Execute 5 buy orders: Select **"📈 Execute Buy Orders"**
4. Check balances: Select **"📊 View All Wallet Balances"**
5. Execute 3 sell orders: Select **"📉 Execute Sell Orders"**

### Full Volume Generation

1. Generate 10-20 wallets
2. Distribute 0.5-1 MONAD per wallet
3. Start volume bot (runs continuously)
4. Monitor logs in `logs/` folder

### After Trading Session

1. Stop the bot (Ctrl+C)
2. Select **"🔄 Collect Funds from Wallets"**
3. This returns all MONAD to your master wallet

---

## 💡 Pro Tips

1. **Start Small**: Test with 0.01-0.1 MONAD amounts first
2. **Monitor Logs**: Watch `logs/combined.log` for details
3. **Check Gas**: Adjust `MAX_GAS_PRICE_GWEI` if transactions fail
4. **Backup**: Save your `wallets/wallets.json` file securely
5. **Natural Patterns**: Default settings create realistic trading patterns

---

## ⚠️ Common Issues & Solutions

### Issue: "Insufficient balance"
**Solution**: Ensure master wallet has MONAD and funds were distributed

### Issue: "Transaction failed"
**Solution**: 
- Increase `MAX_SLIPPAGE_PERCENT` in .env
- Increase `MAX_GAS_PRICE_GWEI`
- Check token address is correct

### Issue: "No wallets found"
**Solution**: Run "Generate Wallets" first from the menu

### Issue: RPC errors
**Solution**:
- Verify RPC_URL in .env
- Try: `https://rpc3.monad.xyz`
- Check network is Monad Mainnet (Chain ID: 143)

---

## 📊 Understanding the Output

When the bot is running, you'll see:

```
[BUY] Wallet: 0x1234... | Amount: 0.0523 MONAD
[BUY] Transaction sent: 0xabc...
[BUY] Success! TxHash: 0xabc... | Time: 1250ms

Waiting 8.5s before next transaction...

[SELL] Wallet: 0x5678... | Selling 75% | Amount: 1234.56 tokens
[SELL] Transaction sent: 0xdef...
[SELL] Success! TxHash: 0xdef... | Time: 1100ms
```

Statistics are shown after each cycle:
```
📊 VOLUME BOT STATISTICS
Runtime: 15 minutes
Total Buys: 45
Total Sells: 38
Total Volume: 12.3456 MONAD
Active Wallets: 10
Success Rate: 98%
```

---

## 🎮 Menu Navigation

```
🔑 Generate Wallets         → First time setup
💰 View Master Balance      → Check master wallet
💸 Distribute Funds         → Send MONAD to wallets
📊 View All Balances        → Check wallet balances
🤖 Start Volume Bot         → Automated trading
📈 Execute Buy Orders       → Manual buy transactions
📉 Execute Sell Orders      → Manual sell transactions
🔄 Collect Funds            → Return funds to master
❌ Exit                     → Close application
```

---

## 📁 Important Files

- `.env` - Your configuration (NEVER share!)
- `wallets/wallets.json` - Generated wallets (KEEP SECURE!)
- `logs/combined.log` - All activity logs
- `logs/transactions.log` - Transaction details
- `logs/error.log` - Error messages

---

## 🔐 Security Reminders

1. **Never share your `.env` file**
2. **Never commit `wallets/` directory to git**
3. **Keep backups of your master wallet**
4. **Test with small amounts first**
5. **Monitor your transactions regularly**

---

## 🚀 You're Ready!

That's it! You're now ready to generate volume on nadfun.

**Need help?** Check the full README.md for detailed information.

**Happy Trading! 📈**
