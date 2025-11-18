import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { TikTokEvent, StreamStats } from '../types';
import logger from '../utils/logger';

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: number = 0;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      this.connectedClients++;
      logger.info(
        `WebSocket client connected. Total clients: ${this.connectedClients}`
      );

      socket.on('disconnect', () => {
        this.connectedClients--;
        logger.info(
          `WebSocket client disconnected. Total clients: ${this.connectedClients}`
        );
      });

      socket.on('subscribe', (eventType: string) => {
        socket.join(`event:${eventType}`);
        logger.debug(`Client subscribed to ${eventType}`);
      });

      socket.on('unsubscribe', (eventType: string) => {
        socket.leave(`event:${eventType}`);
        logger.debug(`Client unsubscribed from ${eventType}`);
      });
    });
  }

  broadcastEvent(event: TikTokEvent): void {
    // Broadcast to all clients
    this.io.emit('event', event);

    // Broadcast to specific event type subscribers
    this.io.to(`event:${event.type}`).emit(event.type, event);
  }

  broadcastStats(stats: StreamStats): void {
    this.io.emit('stats', stats);
  }

  broadcastConnectionStatus(connected: boolean): void {
    this.io.emit('connection_status', { connected });
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }
}
