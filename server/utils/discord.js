const axios = require('axios');

class DiscordNotifier {
  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  async sendNotification(embed) {
    if (!this.webhookUrl) {
      console.log('Discord webhook not configured');
      return;
    }

    try {
      const payload = {
        embeds: [embed],
        username: 'Solana Money Mover',
        avatar_url: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      };

      await axios.post(this.webhookUrl, payload);
      console.log('Discord notification sent');
    } catch (error) {
      console.error('Failed to send Discord notification:', error.message);
    }
  }

  createEmbed(type, data) {
    const baseEmbed = {
      color: this.getColor(type),
      timestamp: data.timestamp,
      footer: {
        text: 'Solana Money Mover',
        icon_url: 'https://cryptologos.cc/logos/solana-sol-logo.png'
      }
    };

    switch (type) {
      case 'WALLET_CONNECTED':
        return {
          ...baseEmbed,
          title: '💰 Wallet Connected',
          description: 'A user has connected their wallet',
          fields: [
            {
              name: 'Public Key',
              value: `\`${data.publicKey}\``,
              inline: false
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId}\``,
              inline: true
            },
            {
              name: 'User Agent',
              value: data.userAgent || 'Unknown',
              inline: false
            }
          ]
        };

      case 'TRANSFER_STARTED':
        return {
          ...baseEmbed,
          title: '🚀 Transfer Started',
          description: 'User initiated asset transfer',
          fields: [
            {
              name: 'From',
              value: `\`${data.publicKey}\``,
              inline: false
            },
            {
              name: 'To',
              value: `\`${data.destinationWallet}\``,
              inline: false
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId}\``,
              inline: true
            }
          ]
        };

      case 'TRANSFER_COMPLETED':
        return {
          ...baseEmbed,
          title: '✅ Transfer Completed',
          description: 'Asset transfer completed successfully',
          fields: [
            {
              name: 'From',
              value: `\`${data.publicKey}\``,
              inline: false
            },
            {
              name: 'To',
              value: `\`${data.destinationWallet}\``,
              inline: false
            },
            {
              name: 'Signature',
              value: `[View on Explorer](https://explorer.solana.com/tx/${data.signature})`,
              inline: false
            },
            {
              name: 'Total Value',
              value: `$${data.totalValue || 'Unknown'}`,
              inline: true
            }
          ]
        };

      case 'TRANSFER_FAILED':
        return {
          ...baseEmbed,
          title: '❌ Transfer Failed',
          description: 'Asset transfer failed',
          fields: [
            {
              name: 'Error',
              value: `\`\`\`${data.error}\`\`\``,
              inline: false
            },
            {
              name: 'Session ID',
              value: `\`${data.sessionId}\``,
              inline: true
            }
          ]
        };

      default:
        return baseEmbed;
    }
  }

  getColor(type) {
    const colors = {
      WALLET_CONNECTED: 0x00FF00, // Green
      TRANSFER_STARTED: 0xFFFF00, // Yellow
      TRANSFER_COMPLETED: 0x00FF00, // Green
      TRANSFER_FAILED: 0xFF0000, // Red
      TRANSFER_ERROR: 0xFF0000 // Red
    };
    return colors[type] || 0x0000FF; // Default blue
  }
}

const notifier = new DiscordNotifier();

async function sendDiscordNotification(data) {
  const embed = notifier.createEmbed(data.type, data);
  await notifier.sendNotification(embed);
}

module.exports = { sendDiscordNotification };