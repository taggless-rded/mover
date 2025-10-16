const express = require('express');
const router = express.Router();
const LunaLaunch = require('../index');

const lunaLaunch = new LunaLaunch();

// Get wallet balance
router.get('/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const balance = await lunaLaunch.getWalletBalance(publicKey);
    
    res.json({
      success: true,
      data: {
        publicKey,
        balance,
        balanceLamports: balance * 1e9
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify wallet connection
router.post('/verify', async (req, res) => {
  try {
    const { publicKey, signature, message } = req.body;
    
    // In a real application, you would verify the wallet signature here
    // This is a placeholder for wallet verification logic
    
    res.json({
      success: true,
      data: {
        verified: true,
        publicKey,
        walletType: 'verified' // Would be determined from verification
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;