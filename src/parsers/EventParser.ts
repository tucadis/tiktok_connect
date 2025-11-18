import { TikTokEvent, CommentEvent, FilterConfig } from '../types';
import logger from '../utils/logger';

export class EventParser {
  private filters: FilterConfig;
  private commandPrefix: string;

  constructor(filters: FilterConfig, commandPrefix: string = '!') {
    this.filters = filters;
    this.commandPrefix = commandPrefix;
  }

  shouldProcessEvent(event: TikTokEvent): boolean {
    try {
      switch (event.type) {
        case 'comment':
          return this.shouldProcessComment(event);
        case 'gift':
          return this.shouldProcessGift(event);
        default:
          return true;
      }
    } catch (error) {
      logger.error('Error processing event filter:', error);
      return true;
    }
  }

  private shouldProcessComment(event: CommentEvent): boolean {
    // Check minimum comment length
    if (
      this.filters.min_comment_length &&
      event.message.length < this.filters.min_comment_length
    ) {
      return false;
    }

    // Check for banned words
    if (this.filters.banned_words && this.filters.banned_words.length > 0) {
      const lowerMessage = event.message.toLowerCase();
      for (const word of this.filters.banned_words) {
        if (lowerMessage.includes(word.toLowerCase())) {
          logger.debug(`Comment filtered due to banned word: ${word}`);
          return false;
        }
      }
    }

    return true;
  }

  private shouldProcessGift(event: any): boolean {
    // Check minimum gift value
    if (
      this.filters.min_gift_value &&
      event.gift.diamondCount < this.filters.min_gift_value
    ) {
      logger.debug(
        `Gift filtered due to low value: ${event.gift.diamondCount} < ${this.filters.min_gift_value}`
      );
      return false;
    }

    return true;
  }

  parseCommand(event: CommentEvent): CommentEvent {
    if (event.message.startsWith(this.commandPrefix)) {
      const parts = event.message.slice(this.commandPrefix.length).split(' ');
      event.isCommand = true;
      event.command = parts[0].toLowerCase();
      event.args = parts.slice(1);
      logger.debug(`Command detected: ${event.command} with args: ${event.args}`);
    }
    return event;
  }

  isVIP(userId: string): boolean {
    if (!this.filters.vip_users || this.filters.vip_users.length === 0) {
      return false;
    }
    return this.filters.vip_users.includes(userId);
  }

  updateFilters(filters: FilterConfig): void {
    this.filters = filters;
    logger.info('Event filters updated');
  }
}
