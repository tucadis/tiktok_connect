import fs from 'fs';
import path from 'path';
import { AppConfig } from '../types';
import logger from './logger';

let config: AppConfig;

export function loadConfig(): AppConfig {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  const exampleConfigPath = path.join(process.cwd(), 'config', 'config.example.json');

  try {
    if (!fs.existsSync(configPath)) {
      logger.warn('config.json not found, loading from config.example.json');

      if (!fs.existsSync(exampleConfigPath)) {
        throw new Error('Neither config.json nor config.example.json found');
      }

      const exampleConfig = fs.readFileSync(exampleConfigPath, 'utf-8');
      config = JSON.parse(exampleConfig);

      logger.info('Please copy config.example.json to config.json and configure it');
    } else {
      const configData = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(configData);
    }

    // Override with environment variables
    if (process.env.TIKTOK_USERNAME) {
      config.tiktok_username = process.env.TIKTOK_USERNAME;
    }
    if (process.env.PORT) {
      config.server.port = parseInt(process.env.PORT, 10);
    }
    if (process.env.DISCORD_WEBHOOK_URL) {
      config.webhooks.discord = process.env.DISCORD_WEBHOOK_URL;
    }
    if (process.env.MQTT_BROKER) {
      config.mqtt.broker = process.env.MQTT_BROKER;
    }
    if (process.env.MQTT_PORT) {
      config.mqtt.port = parseInt(process.env.MQTT_PORT, 10);
    }
    if (process.env.OBS_HOST) {
      config.obs.host = process.env.OBS_HOST;
    }
    if (process.env.OBS_PORT) {
      config.obs.port = parseInt(process.env.OBS_PORT, 10);
    }
    if (process.env.OBS_PASSWORD) {
      config.obs.password = process.env.OBS_PASSWORD;
    }

    logger.info('Configuration loaded successfully');
    return config;
  } catch (error) {
    logger.error('Error loading configuration:', error);
    throw error;
  }
}

export function getConfig(): AppConfig {
  if (!config) {
    return loadConfig();
  }
  return config;
}

export function saveConfig(newConfig: AppConfig): void {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    config = newConfig;
    logger.info('Configuration saved successfully');
  } catch (error) {
    logger.error('Error saving configuration:', error);
    throw error;
  }
}
