// index.js - Solana Token Launcher with Money Mover Integration
const { MoneyMover } = require('./dist/index');

class TokenLauncher {
    constructor() {
        this.moneyMover = null;
        this.walletConnected = false;
        this.currentWallet = null;
        this.init();
    }

    init() {
        console.log('🚀 Luna Launch Token Launcher Initialized');
        this.bindEvents();
        this.checkWalletConnection();
    }

    bindEvents() {
        // Wallet connection events
        document.addEventListener('DOMContentLoaded', () => {
            const connectButtons = document.querySelectorAll('#connect-wallet, #connect-wallet-footer');
            connectButtons.forEach(btn => {
                btn.addEventListener('click', () => this.connectWallet());
            });

            // Launch token button
            const launchBtn = document.getElementById('launch-token');
            if (launchBtn) {
                launchBtn.addEventListener('click', () => this.launchToken());
            }

            // Modal interactions
            this.bindModalEvents();
        });
    }

    async connectWallet() {
        try {
            console.log('🔗 Connecting wallet...');
            
            // For demo purposes - in production, use wallet adapter from HTML
            // This simulates wallet connection and MoneyMover initialization
            const privateKey = process.env.PRIVATE_KEY; // Should come from secure source
            
            if (!privateKey) {
                this.showError('Wallet private key not configured');
                return;
            }

            // Initialize MoneyMover
            this.moneyMover = new MoneyMover(privateKey);
            const walletInfo = await this.moneyMover.getWalletInfo();
            
            this.walletConnected = true;
            this.currentWallet = walletInfo.publicKey;
            
            // Update UI
            this.updateWalletUI(walletInfo);
            this.showSuccess('Wallet connected successfully!');
            
            console.log(`✅ Connected: ${walletInfo.publicKey}`);
            console.log(`💰 Balance: ${walletInfo.solBalance} SOL`);
            
        } catch (error) {
            console.error('Wallet connection error:', error);
            this.showError('Failed to connect wallet: ' + error.message);
        }
    }

    updateWalletUI(walletInfo) {
        const walletDisplays = document.querySelectorAll('.wallet-display');
        const shortAddress = `${walletInfo.publicKey.slice(0, 4)}...${walletInfo.publicKey.slice(-4)}`;
        
        walletDisplays.forEach(display => {
            display.textContent = `Connected: ${shortAddress}`;
            display.style.background = 'linear-gradient(135deg, #00ffa3, #00d4ff)';
            display.style.color = '#000';
        });

        // Update balance display if element exists
        const balanceDisplay = document.getElementById('wallet-balance');
        if (balanceDisplay) {
            balanceDisplay.textContent = `Balance: ${walletInfo.solBalance} SOL`;
        }
    }

    async launchToken() {
        if (!this.walletConnected || !this.moneyMover) {
            this.showError('Please connect wallet first');
            return;
        }

        try {
            console.log('🚀 Starting token launch process...');
            
            // Get form data
            const tokenData = this.getTokenFormData();
            if (!this.validateTokenData(tokenData)) {
                return;
            }

            // Show loading state
            this.showLoading(true);
            
            // Calculate total fees
            const fees = this.calculateTotalFees();
            
            // Verify sufficient balance
            const walletInfo = await this.moneyMover.getWalletInfo();
            if (walletInfo.solBalance < fees.discounted) {
                this.showError(`Insufficient SOL balance. Required: ${fees.discounted} SOL, Available: ${walletInfo.solBalance} SOL`);
                this.showLoading(false);
                return;
            }

            // Execute token creation and fee transfer
            const result = await this.executeTokenLaunch(tokenData, fees);
            
            if (result.success) {
                this.showTokenSuccess(result);
            } else {
                this.showError('Token launch failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('Token launch error:', error);
            this.showError('Token launch failed: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    getTokenFormData() {
        return {
            name: document.querySelector('input[name="name"]')?.value || '',
            symbol: document.querySelector('input[name="symbol"]')?.value || '',
            decimals: parseInt(document.querySelector('input[name="decimals"]')?.value) || 9,
            supply: parseInt(document.querySelector('input[name="supply"]')?.value) || 1000000,
            description: document.querySelector('textarea[name="description"]')?.value || '',
            logo: document.querySelector('.form-img')?.files[0] || null,
            // Additional features
            customBanner: document.querySelector('input[name="custom_banner.is_enabled"]')?.checked || false,
            multiChain: document.querySelector('input[name="multi_chain_launch.is_enabled"]')?.checked || false,
            advancedPrivacy: document.querySelector('input[name="advanced_privacy.is_enabled"]')?.checked || false,
            projectTrend: document.querySelector('input[name="project_trend.is_enabled"]')?.checked || false,
            botService: document.querySelector('input[name="bot_service.is_enabled"]')?.checked || false,
            // Authorities
            revokeFreeze: document.querySelector('input[name="authorities.revoke_freeze"]')?.checked || false,
            revokeMint: document.querySelector('input[name="authorities.revoke_mint"]')?.checked || false,
            revokeUpdate: document.querySelector('input[name="authorities.revoke_update"]')?.checked || false
        };
    }

    validateTokenData(tokenData) {
        if (!tokenData.name.trim()) {
            this.showError('Token name is required');
            return false;
        }
        if (!tokenData.symbol.trim()) {
            this.showError('Token symbol is required');
            return false;
        }
        if (tokenData.supply <= 0) {
            this.showError('Token supply must be greater than 0');
            return false;
        }
        return true;
    }

    calculateTotalFees() {
        const PLATFORM_FEE = 0.3;
        const DISCOUNT_FACTOR = 0.5;
        
        let additionalFees = 0;
        
        // Calculate additional fees from toggles
        const toggleSections = document.querySelectorAll('.toggle-section');
        toggleSections.forEach(section => {
            const input = section.querySelector('input[type="checkbox"]');
            const costElement = section.querySelector('.toggle-cost');
            
            if (input?.checked && costElement && !costElement.classList.contains('toggle-cost-free')) {
                const costText = costElement.textContent;
                const costMatch = costText.match(/(\d+\.?\d*)/);
                if (costMatch) {
                    additionalFees += parseFloat(costMatch[1]);
                }
            }
        });
        
        // Calculate authorities fees
        const authorityFields = document.querySelectorAll('.form-radio-field');
        authorityFields.forEach(field => {
            const input = field.querySelector('input[type="checkbox"]');
            const costElement = field.querySelector('.form-radio-cost');
            
            if (input?.checked && costElement) {
                const costText = costElement.textContent;
                const costMatch = costText.match(/(\d+\.?\d*)/);
                if (costMatch) {
                    additionalFees += parseFloat(costMatch[1]);
                }
            }
        });
        
        const original = PLATFORM_FEE + additionalFees;
        const discounted = original * DISCOUNT_FACTOR;
        
        return { original, discounted, additionalFees };
    }

    async executeTokenLaunch(tokenData, fees) {
        try {
            // In a real implementation, this would:
            // 1. Create the token on Solana
            // 2. Set up metadata
            // 3. Transfer fees using MoneyMover
            // 4. Return transaction details
            
            console.log('📝 Creating token with data:', tokenData);
            console.log(`💰 Processing fee payment: ${fees.discounted} SOL`);
            
            // Simulate token creation delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // For demo - return success with mock data
            return {
                success: true,
                tokenAddress: this.generateMockAddress(),
                signature: this.generateMockSignature(),
                fees: fees.discounted,
                features: this.getEnabledFeatures(tokenData)
            };
            
        } catch (error) {
            console.error('Token execution error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getEnabledFeatures(tokenData) {
        const features = [];
        if (tokenData.customBanner) features.push('Custom Banner');
        if (tokenData.multiChain) features.push('Multi-Chain');
        if (tokenData.advancedPrivacy) features.push('Advanced Privacy');
        if (tokenData.projectTrend) features.push('Project Trend');
        if (tokenData.botService) features.push('Bot Service');
        if (tokenData.revokeFreeze) features.push('Freeze Revoked');
        if (tokenData.revokeMint) features.push('Mint Revoked');
        if (tokenData.revokeUpdate) features.push('Update Revoked');
        return features;
    }

    showTokenSuccess(result) {
        // Update success modal with token details
        const mintAddressEl = document.getElementById('ll-mint-address');
        if (mintAddressEl) {
            mintAddressEl.textContent = result.tokenAddress;
        }
        
        // Show success modal
        this.openModal('ll-ok-modal');
        
        console.log('✅ Token launched successfully!');
        console.log(`📍 Token Address: ${result.tokenAddress}`);
        console.log(`📝 Signature: ${result.signature}`);
        console.log(`💰 Fees Paid: ${result.fees} SOL`);
        console.log(`🎯 Features: ${result.features.join(', ')}`);
    }

    showLoading(show) {
        const loaders = document.querySelectorAll('.ll-loader-wrap');
        loaders.forEach(loader => {
            loader.style.display = show ? 'flex' : 'none';
        });
        
        const buttons = document.querySelectorAll('.submit-btn, .ll-btn');
        buttons.forEach(btn => {
            btn.disabled = show;
        });
    }

    showError(message) {
        alert(`❌ Error: ${message}`);
        console.error('Error:', message);
    }

    showSuccess(message) {
        console.log('✅ Success:', message);
        // Could implement toast notifications here
    }

    bindModalEvents() {
        // Close modal buttons
        document.querySelectorAll('.ll-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-close');
                this.closeModal(modalId);
            });
        });

        // Copy address buttons
        document.getElementById('ll-copy-addr')?.addEventListener('click', () => {
            this.copyToClipboard(FEE_ADDRESS);
            this.showSuccess('Address copied to clipboard!');
        });

        document.getElementById('ll-copy-mint')?.addEventListener('click', () => {
            const address = document.getElementById('ll-mint-address')?.textContent;
            if (address) {
                this.copyToClipboard(address);
                this.showSuccess('Token address copied to clipboard!');
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    checkWalletConnection() {
        // Check if wallet is already connected (from previous session)
        const savedWallet = localStorage.getItem('lunaLaunch_connectedWallet');
        if (savedWallet) {
            console.log('Found saved wallet connection:', savedWallet);
            // Auto-reconnect logic could be implemented here
        }
    }

    // Utility functions for demo
    generateMockAddress() {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 44; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateMockSignature() {
        return '5'.repeat(88);
    }
}

// Constants
const FEE_ADDRESS = 'JchoZmAvqcWzJoei8WFfmVGL1c9x2755TJHq2HikkfV';

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.tokenLauncher = new TokenLauncher();
    });
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TokenLauncher, FEE_ADDRESS };
}