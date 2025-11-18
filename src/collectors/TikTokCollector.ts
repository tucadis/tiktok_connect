import { WebcastPushConnection } from 'tiktok-live-connector';
import { EventEmitter } from 'events';
import logger from '../utils/logger';
import { TikTokEvent, TikTokUser } from '../types';

export class TikTokCollector extends EventEmitter {
  private connection: WebcastPushConnection | null = null;
  private username: string;
  private isConnected: boolean = false;
  private autoReconnect: boolean;

  constructor(username: string, autoReconnect: boolean = true) {
    super();
    this.username = username;
    this.autoReconnect = autoReconnect;
  }

  async connect(): Promise<void> {
    try {
      logger.info(`Connecting to TikTok Live: ${this.username}`);

      this.connection = new WebcastPushConnection(this.username, {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 1000,
      });

      this.setupEventListeners();

      await this.connection.connect();
      this.isConnected = true;
      logger.info(`Successfully connected to ${this.username}'s live stream`);
    } catch (error) {
      logger.error('Failed to connect to TikTok Live:', error);

      if (this.autoReconnect) {
        logger.info('Attempting to reconnect in 5 seconds...');
        setTimeout(() => this.connect(), 5000);
      }

      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.connection) return;

    // Connected event
    this.connection.on('connected', () => {
      logger.info('TikTok Live connection established');
      this.emit('connected');
    });

    // Disconnected event
    this.connection.on('disconnected', () => {
      logger.warn('TikTok Live connection closed');
      this.isConnected = false;
      this.emit('disconnected');

      if (this.autoReconnect) {
        logger.info('Attempting to reconnect in 5 seconds...');
        setTimeout(() => this.connect(), 5000);
      }
    });

    // Error event
    this.connection.on('error', (error) => {
      logger.error('TikTok Live connection error:', error);
      this.emit('error', error);
    });

    // Comment event
    this.connection.on('chat', (data) => {
      const event: TikTokEvent = {
        type: 'comment',
        user: this.mapUser(data),
        message: data.comment,
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });

    // Gift event
    this.connection.on('gift', (data) => {
      const event: TikTokEvent = {
        type: 'gift',
        user: this.mapUser(data),
        gift: {
          id: data.giftId,
          name: data.giftName,
          count: data.repeatCount,
          diamondCount: data.diamondCount,
          repeatEnd: data.repeatEnd,
        },
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });

    // Like event
    this.connection.on('like', (data) => {
      const event: TikTokEvent = {
        type: 'like',
        user: this.mapUser(data),
        likeCount: data.likeCount,
        totalLikeCount: data.totalLikeCount,
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });

    // Follow event
    this.connection.on('social', (data) => {
      if (data.displayType === 'pm_main_follow_message_viewer_2') {
        const event: TikTokEvent = {
          type: 'follow',
          user: this.mapUser(data),
          timestamp: Date.now(),
        };
        this.emit('event', event);
      }
    });

    // Share event
    this.connection.on('share', (data) => {
      const event: TikTokEvent = {
        type: 'share',
        user: this.mapUser(data),
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });

    // Viewer count update
    this.connection.on('roomUser', (data) => {
      const event: TikTokEvent = {
        type: 'viewers',
        viewerCount: data.viewerCount,
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });

    // Join event
    this.connection.on('member', (data) => {
      const event: TikTokEvent = {
        type: 'join',
        user: this.mapUser(data),
        timestamp: Date.now(),
      };
      this.emit('event', event);
    });
  }

  private mapUser(data: any): TikTokUser {
    return {
      userId: data.userId?.toString() || '',
      uniqueId: data.uniqueId || '',
      nickname: data.nickname || '',
      profilePictureUrl: data.profilePictureUrl,
      isFollowing: data.isFollowing,
      isModerator: data.isModerator,
    };
  }

  async disconnect(): Promise<void> {
    if (this.connection && this.isConnected) {
      logger.info('Disconnecting from TikTok Live');
      this.autoReconnect = false;
      this.connection.disconnect();
      this.isConnected = false;
    }
  }

  getConnectionState(): boolean {
    return this.isConnected;
  }
}
