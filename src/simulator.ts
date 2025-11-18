import { EventEmitter } from 'events';
import { TikTokEvent, TikTokUser } from './types';
import logger from './utils/logger';

/**
 * Event Simulator for testing purposes
 * Generates fake TikTok events without connecting to a real stream
 */
export class EventSimulator extends EventEmitter {
  private isRunning: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private mockUsers: TikTokUser[] = [
    {
      userId: '1',
      uniqueId: 'user1',
      nickname: 'Alice',
      isFollowing: false,
      isModerator: false,
    },
    {
      userId: '2',
      uniqueId: 'user2',
      nickname: 'Bob',
      isFollowing: true,
      isModerator: false,
    },
    {
      userId: '3',
      uniqueId: 'user3',
      nickname: 'Charlie',
      isFollowing: true,
      isModerator: true,
    },
  ];

  private mockGifts = [
    { id: 1, name: 'Rose', diamondCount: 1 },
    { id: 2, name: 'TikTok', diamondCount: 5 },
    { id: 3, name: 'Heart', diamondCount: 10 },
    { id: 4, name: 'Galaxy', diamondCount: 1000 },
    { id: 5, name: 'Universe', diamondCount: 5000 },
  ];

  private mockComments = [
    'Hello everyone!',
    'Great stream!',
    'Love this content',
    '!help',
    '!dance',
    'Amazing!',
    'This is awesome',
  ];

  start(intervalMs: number = 3000): void {
    if (this.isRunning) {
      logger.warn('Simulator is already running');
      return;
    }

    logger.info('🎭 Starting event simulator...');
    this.isRunning = true;
    this.emit('connected');

    this.interval = setInterval(() => {
      this.generateRandomEvent();
    }, intervalMs);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping event simulator');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.emit('disconnected');
  }

  private generateRandomEvent(): void {
    const eventTypes = ['comment', 'gift', 'like', 'follow', 'share', 'join', 'viewers'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let event: TikTokEvent;

    switch (randomType) {
      case 'comment':
        event = this.generateCommentEvent();
        break;
      case 'gift':
        event = this.generateGiftEvent();
        break;
      case 'like':
        event = this.generateLikeEvent();
        break;
      case 'follow':
        event = this.generateFollowEvent();
        break;
      case 'share':
        event = this.generateShareEvent();
        break;
      case 'join':
        event = this.generateJoinEvent();
        break;
      case 'viewers':
        event = this.generateViewersEvent();
        break;
      default:
        return;
    }

    this.emit('event', event);
  }

  private getRandomUser(): TikTokUser {
    return this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
  }

  private generateCommentEvent(): TikTokEvent {
    return {
      type: 'comment',
      user: this.getRandomUser(),
      message: this.mockComments[Math.floor(Math.random() * this.mockComments.length)],
      timestamp: Date.now(),
    };
  }

  private generateGiftEvent(): TikTokEvent {
    const gift = this.mockGifts[Math.floor(Math.random() * this.mockGifts.length)];
    const count = Math.floor(Math.random() * 5) + 1;

    return {
      type: 'gift',
      user: this.getRandomUser(),
      gift: {
        id: gift.id,
        name: gift.name,
        count,
        diamondCount: gift.diamondCount * count,
        repeatEnd: true,
      },
      timestamp: Date.now(),
    };
  }

  private generateLikeEvent(): TikTokEvent {
    const likeCount = Math.floor(Math.random() * 20) + 1;
    return {
      type: 'like',
      user: this.getRandomUser(),
      likeCount,
      totalLikeCount: Math.floor(Math.random() * 10000),
      timestamp: Date.now(),
    };
  }

  private generateFollowEvent(): TikTokEvent {
    return {
      type: 'follow',
      user: this.getRandomUser(),
      timestamp: Date.now(),
    };
  }

  private generateShareEvent(): TikTokEvent {
    return {
      type: 'share',
      user: this.getRandomUser(),
      timestamp: Date.now(),
    };
  }

  private generateJoinEvent(): TikTokEvent {
    return {
      type: 'join',
      user: this.getRandomUser(),
      timestamp: Date.now(),
    };
  }

  private generateViewersEvent(): TikTokEvent {
    return {
      type: 'viewers',
      viewerCount: Math.floor(Math.random() * 1000) + 100,
      timestamp: Date.now(),
    };
  }

  getConnectionState(): boolean {
    return this.isRunning;
  }
}

// If run directly, start the simulator
if (require.main === module) {
  logger.info('Running in simulation mode');

  const simulator = new EventSimulator();

  simulator.on('event', (event: TikTokEvent) => {
    logger.info(`[SIMULATED] ${event.type}:`, JSON.stringify(event, null, 2));
  });

  simulator.start(2000);

  process.on('SIGINT', () => {
    simulator.stop();
    process.exit(0);
  });
}

export default EventSimulator;
