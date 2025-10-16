const express = require('express');
const router = express.Router();
const LunaLaunch = require('../index');

const lunaLaunch = new LunaLaunch();

// Create token endpoint
router.post('/create', async (req, res) => {
  try {
    const { tokenParams, options, wallet } = req.body;
    
    // In a real application, you would validate the wallet signature here
    // and use the actual wallet keypair
    
    const result = await lunaLaunch.createToken(wallet, tokenParams, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Token creation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate fees endpoint
router.post('/calculate-fees', (req, res) => {
  try {
    const { options } = req.body;
    const fees = lunaLaunch.calculateFees(options);
    
    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify token endpoint
router.get('/verify/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    
    // Verify token exists on chain
    const connection = lunaLaunch.connection;
    const publicKey = new PublicKey(mintAddress);
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return res.json({
        success: false,
        error: 'Token not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        mint: mintAddress,
        exists: true,
        owner: accountInfo.owner.toString()
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