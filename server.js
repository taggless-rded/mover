const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(__dirname));
app.use('/asset1', express.static(path.join(__dirname, 'asset1')));
app.use('/asset2', express.static(path.join(__dirname, 'asset2')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Luna Launch API is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/token/calculate-fees', (req, res) => {
  try {
    const { options = {} } = req.body;
    
    // Base platform fee
    let totalFee = 0.3;
    
    // Add fees for optional features
    if (options.customBanner) totalFee += 0.1;
    if (options.advancedPrivacy) totalFee += 0.5;
    if (options.projectTrend) totalFee += 0.3;
    if (options.botService) totalFee += 1.0;
    if (options.creatorInfo) totalFee += 0.1;
    if (options.socialLinks) totalFee += 0.1;
    
    // Add fees for authority revocations
    if (options.revokeFreeze) totalFee += 0.1;
    if (options.revokeMint) totalFee += 0.1;
    if (options.revokeUpdate) totalFee += 0.1;
    
    // Apply 50% discount
    const discountFactor = 0.5;
    const discountedFee = totalFee * discountFactor;
    
    res.json({
      success: true,
      data: {
        original: parseFloat(totalFee.toFixed(2)),
        discounted: parseFloat(discountedFee.toFixed(2)),
        final: parseFloat(discountedFee.toFixed(2))
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/token/create', (req, res) => {
  try {
    const { tokenParams, options } = req.body;
    
    // Validate required fields
    if (!tokenParams || !tokenParams.name || !tokenParams.symbol) {
      return res.status(400).json({
        success: false,
        error: 'Token name and symbol are required'
      });
    }
    
    // Simulate token creation (in real app, this would create on blockchain)
    const mockTokenAddress = `Token${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate fees
    let totalFee = 0.3;
    if (options) {
      if (options.customBanner) totalFee += 0.1;
      if (options.advancedPrivacy) totalFee += 0.5;
      // Add other options as needed
    }
    const finalFee = totalFee * 0.5; // 50% discount
    
    res.json({
      success: true,
      data: {
        mint: mockTokenAddress,
        transactionId: `tx${Math.random().toString(36).substr(2, 9)}`,
        fees: {
          original: totalFee,
          discounted: finalFee,
          final: finalFee
        },
        message: 'Token created successfully (simulation)'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/transaction/verify/:txId', (req, res) => {
  const { txId } = req.params;
  
  // Simulate transaction verification
  res.json({
    success: true,
    data: {
      transactionId: txId,
      status: 'confirmed',
      verified: true,
      timestamp: new Date().toISOString()
    }
  });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Luna Launch server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Main app: http://localhost:${PORT}`);
});