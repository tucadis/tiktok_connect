import mqtt, { MqttClient } from 'mqtt';
import { TikTokEvent, Plugin, MQTTConfig } from '../types';
import logger from '../utils/logger';

export class MQTTIntegration implements Plugin {
  name = 'mqtt';
  private client: MqttClient | null = null;
  private config: MQTTConfig;
  private connected: boolean = false;

  constructor(config: MQTTConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const brokerUrl = `mqtt://${this.config.broker}:${this.config.port}`;
        logger.info(`Connecting to MQTT broker: ${brokerUrl}`);

        const options: any = {
          clientId: `tiktok-live-router-${Math.random().toString(16).slice(2, 8)}`,
        };

        if (this.config.username) {
          options.username = this.config.username;
        }
        if (this.config.password) {
          options.password = this.config.password;
        }

        this.client = mqtt.connect(brokerUrl, options);

        this.client.on('connect', () => {
          this.connected = true;
          logger.info('MQTT client connected');
          resolve();
        });

        this.client.on('error', (error) => {
          logger.error('MQTT connection error:', error);
          if (!this.connected) {
            reject(error);
          }
        });

        this.client.on('close', () => {
          this.connected = false;
          logger.warn('MQTT connection closed');
        });
      } catch (error) {
        logger.error('Error initializing MQTT:', error);
        reject(error);
      }
    });
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      const topic = this.getTopicForEvent(event);
      if (topic) {
        const payload = JSON.stringify(event);
        this.client.publish(topic, payload, { qos: 1 }, (error) => {
          if (error) {
            logger.error('Error publishing to MQTT:', error);
          } else {
            logger.debug(`Published to ${topic}`);
          }
        });
      }
    } catch (error) {
      logger.error('Error in MQTT onEvent:', error);
    }
  }

  private getTopicForEvent(event: TikTokEvent): string | null {
    switch (event.type) {
      case 'comment':
        return this.config.topics.comments;
      case 'gift':
        return this.config.topics.gifts;
      case 'like':
        return this.config.topics.likes;
      case 'follow':
        return this.config.topics.follows;
      case 'share':
        return this.config.topics.shares;
      case 'viewers':
        return this.config.topics.viewers;
      case 'join':
        return this.config.topics.joins;
      default:
        return null;
    }
  }

  async destroy(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, () => {
          logger.info('MQTT client disconnected');
          resolve();
        });
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
