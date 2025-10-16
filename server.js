const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/asset1', express.static(path.join(__dirname, 'asset1')));
app.use('/asset2', express.static(path.join(__dirname, 'asset2')));
app.use('/_nuxt/assets', express.static(path.join(__dirname, '_nuxt/assets')));
app.use('/my-portfolio', express.static(path.join(__dirname, 'my-portfolio')));

// Serve HTML files
app.get(['/', '/*.html'], (req, res) => {
    const filePath = req.path === '/' ? 'index.html' : req.path.slice(1);
    res.sendFile(path.join(__dirname, filePath));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});