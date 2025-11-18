import { EventEmitter } from 'events';
import { TikTokEvent, StreamStats } from '../types';
import logger from '../utils/logger';

export class EventRouter extends EventEmitter {
  private stats: StreamStats;
  private gifters: Map<string, number> = new Map();

  constructor() {
    super();
    this.stats = this.initializeStats();
  }

  private initializeStats(): StreamStats {
    return {
      totalComments: 0,
      totalGifts: 0,
      totalLikes: 0,
      totalFollows: 0,
      totalShares: 0,
      totalJoins: 0,
      currentViewers: 0,
      peakViewers: 0,
      totalRevenue: 0,
      startTime: Date.now(),
      uptime: 0,
    };
  }

  async routeEvent(event: TikTokEvent): Promise<void> {
    try {
      // Update statistics
      this.updateStats(event);

      // Emit event to all registered handlers
      this.emit('event', event);
      this.emit(event.type, event);

      logger.debug(`Event routed: ${event.type}`);
    } catch (error) {
      logger.error('Error routing event:', error);
    }
  }

  private updateStats(event: TikTokEvent): void {
    switch (event.type) {
      case 'comment':
        this.stats.totalComments++;
        break;
      case 'gift':
        this.stats.totalGifts++;
        this.stats.totalRevenue += event.gift.diamondCount;

        // Track top gifter
        const currentTotal = this.gifters.get(event.user.uniqueId) || 0;
        this.gifters.set(event.user.uniqueId, currentTotal + event.gift.diamondCount);

        let topGifterId = '';
        let topGifterAmount = 0;
        this.gifters.forEach((amount, userId) => {
          if (amount > topGifterAmount) {
            topGifterAmount = amount;
            topGifterId = userId;
          }
        });

        if (topGifterId === event.user.uniqueId) {
          this.stats.topGifter = event.user;
        }
        break;
      case 'like':
        this.stats.totalLikes += event.likeCount;
        break;
      case 'follow':
        this.stats.totalFollows++;
        break;
      case 'share':
        this.stats.totalShares++;
        break;
      case 'join':
        this.stats.totalJoins++;
        break;
      case 'viewers':
        this.stats.currentViewers = event.viewerCount;
        if (event.viewerCount > this.stats.peakViewers) {
          this.stats.peakViewers = event.viewerCount;
        }
        break;
    }

    this.stats.uptime = Date.now() - this.stats.startTime;
  }

  getStats(): StreamStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = this.initializeStats();
    this.gifters.clear();
    logger.info('Statistics reset');
  }
}
