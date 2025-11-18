import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { AppConfig, StreamStats } from '../types';
import logger from '../utils/logger';

export class APIServer {
  private app: express.Application;
  private port: number;
  private getStatsCallback?: () => StreamStats;
  private getConfigCallback?: () => AppConfig;
  private saveConfigCallback?: (config: AppConfig) => void;
  private getConnectionStateCallback?: () => boolean;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use(express.static(path.join(process.cwd(), 'public')));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connected: this.getConnectionStateCallback
          ? this.getConnectionStateCallback()
          : false,
      });
    });

    // Get statistics
    this.app.get('/api/stats', (req: Request, res: Response) => {
      try {
        const stats = this.getStatsCallback ? this.getStatsCallback() : null;
        res.json(stats);
      } catch (error) {
        logger.error('Error getting stats:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get configuration (sanitized)
    this.app.get('/api/config', (req: Request, res: Response) => {
      try {
        const config = this.getConfigCallback ? this.getConfigCallback() : null;
        if (config) {
          // Remove sensitive data
          const sanitized = { ...config };
          if (sanitized.webhooks.discord) {
            sanitized.webhooks.discord = '***';
          }
          if (sanitized.obs.password) {
            sanitized.obs.password = '***';
          }
          if (sanitized.mqtt.password) {
            sanitized.mqtt.password = '***';
          }
          res.json(sanitized);
        } else {
          res.status(404).json({ error: 'Configuration not found' });
        }
      } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Update configuration
    this.app.post('/api/config', (req: Request, res: Response) => {
      try {
        const newConfig = req.body as AppConfig;
        if (this.saveConfigCallback) {
          this.saveConfigCallback(newConfig);
          res.json({ success: true });
        } else {
          res.status(501).json({ error: 'Config save not implemented' });
        }
      } catch (error) {
        logger.error('Error saving config:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Connection status
    this.app.get('/api/status', (req: Request, res: Response) => {
      const connected = this.getConnectionStateCallback
        ? this.getConnectionStateCallback()
        : false;
      res.json({ connected });
    });

    // Dashboard
    this.app.get('/dashboard', (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
    });

    // Config page
    this.app.get('/config', (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'public', 'config.html'));
    });

    // Stats page
    this.app.get('/stats', (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'public', 'stats.html'));
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  setStatsCallback(callback: () => StreamStats): void {
    this.getStatsCallback = callback;
  }

  setConfigCallback(callback: () => AppConfig): void {
    this.getConfigCallback = callback;
  }

  setSaveConfigCallback(callback: (config: AppConfig) => void): void {
    this.saveConfigCallback = callback;
  }

  setConnectionStateCallback(callback: () => boolean): void {
    this.getConnectionStateCallback = callback;
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        logger.info(`API Server running on port ${this.port}`);
        logger.info(`Dashboard: http://localhost:${this.port}/dashboard`);
        logger.info(`Config: http://localhost:${this.port}/config`);
        logger.info(`Stats: http://localhost:${this.port}/stats`);
        resolve();
      });
    });
  }
}
