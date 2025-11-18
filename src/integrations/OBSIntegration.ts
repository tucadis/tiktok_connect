import OBSWebSocket from 'obs-websocket-js';
import { TikTokEvent, Plugin, OBSConfig } from '../types';
import logger from '../utils/logger';

export class OBSIntegration implements Plugin {
  name = 'obs';
  private obs: OBSWebSocket;
  private config: OBSConfig;
  private connected: boolean = false;

  constructor(config: OBSConfig) {
    this.obs = new OBSWebSocket();
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('OBS integration disabled');
      return;
    }

    try {
      const address = `ws://${this.config.host}:${this.config.port}`;
      logger.info(`Connecting to OBS WebSocket: ${address}`);

      await this.obs.connect(address, this.config.password);
      this.connected = true;
      logger.info('OBS WebSocket connected');

      this.obs.on('ConnectionClosed', () => {
        this.connected = false;
        logger.warn('OBS WebSocket connection closed');
      });

      this.obs.on('ConnectionError', (error) => {
        logger.error('OBS WebSocket error:', error);
      });
    } catch (error) {
      logger.error('Failed to connect to OBS:', error);
      throw error;
    }
  }

  async onEvent(event: TikTokEvent): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Example: Change scene on large gift
    if (event.type === 'gift' && event.gift.diamondCount >= 1000) {
      try {
        await this.changeScene('Special');
        logger.info('Changed OBS scene due to large gift');
      } catch (error) {
        logger.error('Error changing OBS scene:', error);
      }
    }
  }

  async changeScene(sceneName: string): Promise<void> {
    if (!this.connected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName });
      logger.info(`OBS scene changed to: ${sceneName}`);
    } catch (error) {
      logger.error(`Error changing scene to ${sceneName}:`, error);
      throw error;
    }
  }

  async setSourceVisibility(
    sceneName: string,
    sourceName: string,
    visible: boolean
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('OBS not connected');
    }

    try {
      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId: sourceName,
        sceneItemEnabled: visible,
      });
      logger.info(
        `Set source ${sourceName} visibility to ${visible} in scene ${sceneName}`
      );
    } catch (error) {
      logger.error('Error setting source visibility:', error);
      throw error;
    }
  }

  async getScenes(): Promise<string[]> {
    if (!this.connected) {
      throw new Error('OBS not connected');
    }

    try {
      const response = await this.obs.call('GetSceneList');
      return response.scenes.map((scene: any) => scene.sceneName);
    } catch (error) {
      logger.error('Error getting scenes:', error);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    if (this.connected) {
      await this.obs.disconnect();
      logger.info('OBS WebSocket disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
