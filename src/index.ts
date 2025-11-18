import dotenv from 'dotenv';
import http from 'http';
import { TikTokCollector } from './collectors/TikTokCollector';
import { EventParser } from './parsers/EventParser';
import { EventRouter } from './routers/EventRouter';
import { APIServer } from './api/server';
import { WebSocketServer } from './websocket/server';
import { DiscordIntegration } from './integrations/DiscordIntegration';
import { MQTTIntegration } from './integrations/MQTTIntegration';
import { OBSIntegration } from './integrations/OBSIntegration';
import { WebhookIntegration } from './integrations/WebhookIntegration';
import { loadConfig, getConfig, saveConfig } from './utils/config';
import logger from './utils/logger';
import { Plugin, TikTokEvent, CommentEvent } from './types';

dotenv.config();

class TikTokLiveEventRouter {
  private collector: TikTokCollector | null = null;
  private parser: EventParser | null = null;
  private router: EventRouter | null = null;
  private apiServer: APIServer | null = null;
  private wsServer: WebSocketServer | null = null;
  private plugins: Plugin[] = [];

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting TikTok Live Event Router...');

      // Load configuration
      const config = loadConfig();

      // Initialize Event Parser
      this.parser = new EventParser(
        config.filters,
        config.features.command_prefix
      );

      // Initialize Event Router
      this.router = new EventRouter();

      // Initialize API Server
      this.apiServer = new APIServer(config.server.port);

      // Set up API callbacks
      this.apiServer.setStatsCallback(() => this.router!.getStats());
      this.apiServer.setConfigCallback(() => getConfig());
      this.apiServer.setSaveConfigCallback((newConfig) => {
        saveConfig(newConfig);
        logger.info('Configuration updated via API');
      });

      // Create HTTP server
      const httpServer = http.createServer(this.apiServer['app']);

      // Initialize WebSocket Server
      if (config.server.enable_websocket) {
        this.wsServer = new WebSocketServer(httpServer);
      }

      // Start HTTP server
      await new Promise<void>((resolve) => {
        httpServer.listen(config.server.port, () => {
          logger.info(`🌐 Server running on http://localhost:${config.server.port}`);
          resolve();
        });
      });

      // Initialize integrations
      await this.initializeIntegrations(config);

      // Initialize TikTok Collector
      this.collector = new TikTokCollector(
        config.tiktok_username,
        config.features.auto_reconnect
      );

      this.apiServer.setConnectionStateCallback(() =>
        this.collector ? this.collector.getConnectionState() : false
      );

      // Set up event handlers
      this.setupEventHandlers();

      // Connect to TikTok Live
      await this.collector.connect();

      logger.info('✅ TikTok Live Event Router is running!');
      logger.info(`📺 Monitoring: ${config.tiktok_username}`);
      logger.info(`🔌 WebSocket clients: 0`);
      logger.info(`📊 Dashboard: http://localhost:${config.server.port}/dashboard`);
    } catch (error) {
      logger.error('Failed to start TikTok Live Event Router:', error);
      process.exit(1);
    }
  }

  private async initializeIntegrations(config: any): Promise<void> {
    logger.info('Initializing integrations...');

    // Discord
    if (config.webhooks.discord) {
      const discord = new DiscordIntegration(config.webhooks.discord);
      await discord.initialize();
      this.plugins.push(discord);
      logger.info('✓ Discord integration enabled');
    }

    // Custom Webhooks
    if (config.webhooks.custom && config.webhooks.custom.length > 0) {
      const webhooks = new WebhookIntegration(config.webhooks.custom);
      await webhooks.initialize();
      this.plugins.push(webhooks);
      logger.info(`✓ ${config.webhooks.custom.length} custom webhooks enabled`);
    }

    // MQTT
    try {
      const mqtt = new MQTTIntegration(config.mqtt);
      await mqtt.initialize();
      this.plugins.push(mqtt);
      logger.info('✓ MQTT integration enabled');
    } catch (error) {
      logger.warn('MQTT integration failed, continuing without it');
    }

    // OBS
    if (config.obs.enabled) {
      try {
        const obs = new OBSIntegration(config.obs);
        await obs.initialize();
        this.plugins.push(obs);
        logger.info('✓ OBS integration enabled');
      } catch (error) {
        logger.warn('OBS integration failed, continuing without it');
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.collector || !this.parser || !this.router) {
      throw new Error('Components not initialized');
    }

    // Handle TikTok events
    this.collector.on('event', async (event: TikTokEvent) => {
      try {
        // Parse commands
        if (event.type === 'comment') {
          event = this.parser!.parseCommand(event as CommentEvent);
        }

        // Filter events
        if (!this.parser!.shouldProcessEvent(event)) {
          logger.debug(`Event filtered: ${event.type}`);
          return;
        }

        // Route event
        await this.router!.routeEvent(event);

        // Broadcast via WebSocket
        if (this.wsServer) {
          this.wsServer.broadcastEvent(event);
        }

        // Send to integrations
        for (const plugin of this.plugins) {
          try {
            await plugin.onEvent(event);
          } catch (error) {
            logger.error(`Error in plugin ${plugin.name}:`, error);
          }
        }
      } catch (error) {
        logger.error('Error handling event:', error);
      }
    });

    // Handle connection events
    this.collector.on('connected', () => {
      logger.info('📡 Connected to TikTok Live');
      if (this.wsServer) {
        this.wsServer.broadcastConnectionStatus(true);
      }
    });

    this.collector.on('disconnected', () => {
      logger.warn('📡 Disconnected from TikTok Live');
      if (this.wsServer) {
        this.wsServer.broadcastConnectionStatus(false);
      }
    });

    // Periodic stats broadcast
    setInterval(() => {
      if (this.router && this.wsServer) {
        this.wsServer.broadcastStats(this.router.getStats());
      }
    }, 5000);
  }

  async stop(): Promise<void> {
    logger.info('Shutting down TikTok Live Event Router...');

    // Disconnect from TikTok
    if (this.collector) {
      await this.collector.disconnect();
    }

    // Destroy plugins
    for (const plugin of this.plugins) {
      try {
        await plugin.destroy();
      } catch (error) {
        logger.error(`Error destroying plugin ${plugin.name}:`, error);
      }
    }

    logger.info('✅ Shutdown complete');
    process.exit(0);
  }
}

// Create and start the router
const router = new TikTokLiveEventRouter();

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT signal');
  router.stop();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM signal');
  router.stop();
});

// Start the application
router.start().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
