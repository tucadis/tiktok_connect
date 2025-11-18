import axios from 'axios';
import { TikTokEvent, Plugin } from '../types';
import logger from '../utils/logger';

export class WebhookIntegration implements Plugin {
  name = 'webhook';
  private webhooks: string[];
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(webhooks: string[] = []) {
    this.webhooks = webhooks;
  }

  async initialize(): Promise<void> {
    logger.info(`Webhook integration initialized with ${this.webhooks.length} webhooks`);
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    if (this.webhooks.length === 0) {
      return;
    }

    const promises = this.webhooks.map((webhook) =>
      this.sendWebhook(webhook, event)
    );

    await Promise.allSettled(promises);
  }

  private async sendWebhook(
    url: string,
    event: TikTokEvent,
    attempt: number = 1
  ): Promise<void> {
    try {
      await axios.post(
        url,
        {
          event_type: event.type,
          timestamp: event.timestamp,
          data: event,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TikTok-Live-Event-Router/1.0',
          },
          timeout: 5000,
        }
      );
      logger.debug(`Webhook sent successfully to ${url}`);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        logger.warn(
          `Webhook failed (attempt ${attempt}/${this.retryAttempts}), retrying...`
        );
        await this.sleep(this.retryDelay * attempt);
        return this.sendWebhook(url, event, attempt + 1);
      } else {
        logger.error(`Webhook failed after ${this.retryAttempts} attempts:`, error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async destroy(): Promise<void> {
    logger.info('Webhook integration destroyed');
  }

  addWebhook(url: string): void {
    if (!this.webhooks.includes(url)) {
      this.webhooks.push(url);
      logger.info(`Added webhook: ${url}`);
    }
  }

  removeWebhook(url: string): void {
    const index = this.webhooks.indexOf(url);
    if (index > -1) {
      this.webhooks.splice(index, 1);
      logger.info(`Removed webhook: ${url}`);
    }
  }

  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }
}
