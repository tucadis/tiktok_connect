import axios from 'axios';
import { TikTokEvent, Plugin } from '../types';
import logger from '../utils/logger';

export class DiscordIntegration implements Plugin {
  name = 'discord';
  private webhookUrl: string;
  private enabled: boolean = false;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || '';
    this.enabled = !!webhookUrl;
  }

  async initialize(): Promise<void> {
    if (this.enabled) {
      logger.info('Discord integration initialized');
    }
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    if (!this.enabled || !this.webhookUrl) {
      return;
    }

    try {
      const embed = this.createEmbed(event);
      await this.sendWebhook(embed);
    } catch (error) {
      logger.error('Error sending Discord webhook:', error);
    }
  }

  private createEmbed(event: TikTokEvent): any {
    const timestamp = new Date(event.timestamp).toISOString();

    switch (event.type) {
      case 'comment':
        return {
          embeds: [
            {
              title: '💬 New Comment',
              description: event.message,
              color: 0x3b82f6,
              author: {
                name: event.user.nickname,
              },
              timestamp,
            },
          ],
        };

      case 'gift':
        return {
          embeds: [
            {
              title: '🎁 Gift Received!',
              description: `**${event.user.nickname}** sent ${event.gift.count}x ${event.gift.name}`,
              color: 0xf59e0b,
              fields: [
                {
                  name: 'Value',
                  value: `${event.gift.diamondCount} diamonds`,
                  inline: true,
                },
              ],
              timestamp,
            },
          ],
        };

      case 'follow':
        return {
          embeds: [
            {
              title: '👤 New Follower',
              description: `**${event.user.nickname}** is now following!`,
              color: 0x10b981,
              timestamp,
            },
          ],
        };

      case 'share':
        return {
          embeds: [
            {
              title: '🔄 Stream Shared',
              description: `**${event.user.nickname}** shared the stream!`,
              color: 0x8b5cf6,
              timestamp,
            },
          ],
        };

      case 'like':
        return {
          embeds: [
            {
              title: '❤️ Likes',
              description: `**${event.user.nickname}** sent ${event.likeCount} likes`,
              color: 0xef4444,
              timestamp,
            },
          ],
        };

      default:
        return null;
    }
  }

  private async sendWebhook(payload: any): Promise<void> {
    if (!payload) return;

    try {
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      logger.debug('Discord webhook sent successfully');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Discord webhook error: ${error.response?.status} - ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  async destroy(): Promise<void> {
    logger.info('Discord integration destroyed');
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
    this.enabled = !!url;
  }
}
