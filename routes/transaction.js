const express = require('express');
const router = express.Router();
const LunaLaunch = require('../index');

const lunaLaunch = new LunaLaunch();

// Verify transaction
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const result = await lunaLaunch.verifyTransaction(transactionId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get transaction history for address
router.get('/history/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 10 } = req.query;
    
    // This would typically query a database or indexer
    // For now, return placeholder data
    
    res.json({
      success: true,
      data: {
        address,
        transactions: [],
        total: 0
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