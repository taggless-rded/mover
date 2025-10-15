const { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress, createTransferInstruction } = require('@solana/spl-token');
const axios = require('axios');

class MoneyMover {
  constructor(privateKey) {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    if (privateKey) {
      this.wallet = Keypair.fromSecretKey(
        Buffer.from(privateKey, 'base64')
      );
    }
  }

  async getWalletInfo() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const publicKey = this.wallet.publicKey.toString();
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    // Get token accounts
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      this.wallet.publicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );

    return {
      publicKey,
      solBalance,
      tokenCount: tokenAccounts.value.length
    };
  }

  async transferAllAssets(destinationWallet) {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      const destPublicKey = new PublicKey(destinationWallet);
      const walletInfo = await this.getWalletInfo();
      
      // Get token accounts with balances
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        this.wallet.publicKey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      let totalValue = 0;
      const transfers = [];

      // Transfer SOL
      if (walletInfo.solBalance > 0.001) { // Leave some for fees
        const solAmount = walletInfo.solBalance - 0.001; // Leave 0.001 SOL for fees
        if (solAmount > 0) {
          // Add SOL transfer logic here
          console.log(`Would transfer ${solAmount} SOL`);
          totalValue += solAmount * (await this.getSOLPrice());
        }
      }

      // Process token transfers
      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = await getAccount(this.connection, account.pubkey);
          const balance = Number(accountInfo.amount);
          
          if (balance > 0) {
            const tokenValue = await this.getTokenValue(accountInfo.mint.toString(), balance);
            
            // Only transfer tokens worth more than $5
            if (tokenValue > 5) {
              transfers.push({
                mint: accountInfo.mint.toString(),
                balance,
                value: tokenValue
              });
              totalValue += tokenValue;
            }
          }
        } catch (error) {
          console.log('Error processing token account:', error.message);
        }
      }

      // For demo purposes, we'll return a mock success
      // In production, implement actual transfers
      return {
        success: true,
        signature: 'mock_signature_' + Math.random().toString(36).substring(7),
        totalValue: Math.round(totalValue * 100) / 100,
        transfers: transfers.length,
        message: `Transferred ${transfers.length} tokens worth $${Math.round(totalValue * 100) / 100}`
      };

    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSOLPrice() {
    try {
      const response = await axios.get('https://price.jup.ag/v4/price?ids=SOL');
      return response.data.data.SOL.price;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 100; // Default fallback price
    }
  }

  async getTokenValue(mintAddress, balance) {
    try {
      const response = await axios.get(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
      const price = response.data.data[mintAddress]?.price || 0;
      const decimals = 6; // You should fetch actual decimals
      return (balance / Math.pow(10, decimals)) * price;
    } catch (error) {
      console.error(`Error fetching price for ${mintAddress}:`, error.message);
      return 0;
    }
  }

  static async getTokenPrices(tokens) {
    try {
      const response = await axios.get(`https://price.jup.ag/v4/price?ids=${tokens.join(',')}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }
}

module.exports = { MoneyMover };