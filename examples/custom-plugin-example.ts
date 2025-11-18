/**
 * Custom Plugin Example for TikTok Live Event Router
 *
 * This example shows how to create a custom plugin that:
 * - Tracks specific keywords in comments
 * - Sends notifications for high-value gifts
 * - Implements custom business logic
 *
 * Usage:
 * 1. Copy this file to src/integrations/
 * 2. Customize the logic
 * 3. Register in src/index.ts
 */

import { Plugin, TikTokEvent } from '../types';
import logger from '../utils/logger';
import axios from 'axios';

interface CustomPluginConfig {
  webhookUrl: string;
  keywords: string[];
  minGiftValue: number;
  enableNotifications: boolean;
}

export class CustomPlugin implements Plugin {
  name = 'custom-plugin';
  private config: CustomPluginConfig;
  private keywordCount: Map<string, number> = new Map();

  constructor(config: CustomPluginConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    logger.info('Custom plugin initialized');
    logger.info(`Tracking keywords: ${this.config.keywords.join(', ')}`);
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    switch (event.type) {
      case 'comment':
        await this.handleComment(event);
        break;
      case 'gift':
        await this.handleGift(event);
        break;
      case 'follow':
        await this.handleFollow(event);
        break;
    }
  }

  private async handleComment(event: any): Promise<void> {
    const message = event.message.toLowerCase();

    // Check for tracked keywords
    for (const keyword of this.config.keywords) {
      if (message.includes(keyword.toLowerCase())) {
        const count = (this.keywordCount.get(keyword) || 0) + 1;
        this.keywordCount.set(keyword, count);

        logger.info(`Keyword "${keyword}" mentioned ${count} times`);

        // Send notification if enabled
        if (this.config.enableNotifications) {
          await this.sendNotification({
            type: 'keyword_detected',
            keyword,
            count,
            user: event.user.nickname,
            message: event.message,
          });
        }
      }
    }

    // Example: Respond to specific commands
    if (event.isCommand && event.command === 'stats') {
      const stats = Array.from(this.keywordCount.entries())
        .map(([keyword, count]) => `${keyword}: ${count}`)
        .join(', ');

      logger.info(`Keyword stats: ${stats}`);
    }
  }

  private async handleGift(event: any): Promise<void> {
    const { user, gift } = event;

    // Notify for high-value gifts
    if (gift.diamondCount >= this.config.minGiftValue) {
      logger.info(
        `High-value gift: ${user.nickname} sent ${gift.name} (${gift.diamondCount} diamonds)`
      );

      if (this.config.enableNotifications) {
        await this.sendNotification({
          type: 'high_value_gift',
          user: user.nickname,
          gift: gift.name,
          value: gift.diamondCount,
        });
      }
    }
  }

  private async handleFollow(event: any): Promise<void> {
    logger.info(`New follower: ${event.user.nickname}`);

    // Example: Welcome new followers
    if (this.config.enableNotifications) {
      await this.sendNotification({
        type: 'new_follower',
        user: event.user.nickname,
      });
    }
  }

  private async sendNotification(data: any): Promise<void> {
    if (!this.config.webhookUrl) {
      return;
    }

    try {
      await axios.post(this.config.webhookUrl, {
        plugin: this.name,
        timestamp: new Date().toISOString(),
        data,
      });
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }
  }

  async destroy(): Promise<void> {
    logger.info('Custom plugin destroyed');

    // Log final statistics
    logger.info('Final keyword counts:');
    this.keywordCount.forEach((count, keyword) => {
      logger.info(`  ${keyword}: ${count}`);
    });
  }

  // Public methods for external access
  getKeywordStats(): Map<string, number> {
    return new Map(this.keywordCount);
  }

  resetStats(): void {
    this.keywordCount.clear();
    logger.info('Keyword statistics reset');
  }
}

// Example usage:
/*
import { CustomPlugin } from './integrations/CustomPlugin';

const customPlugin = new CustomPlugin({
  webhookUrl: 'https://your-webhook-url.com',
  keywords: ['giveaway', 'subscribe', 'follow'],
  minGiftValue: 1000,
  enableNotifications: true
});

await customPlugin.initialize();
router.on('event', (event) => customPlugin.onEvent(event));
*/
