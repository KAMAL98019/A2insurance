import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

export type NotifSeverity = 'success' | 'error' | 'warning' | 'info';

export interface AppNotif {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: NotifSeverity;
  timestamp: string;
  meta?: Record<string, unknown>;
}

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class AppNotificationGateway implements OnGatewayInit {
  private readonly logger = new Logger(AppNotificationGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('WebSocket gateway ready');
  }

  push(notif: Omit<AppNotif, 'id' | 'timestamp'>) {
    if (!this.server) return;
    const full: AppNotif = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('app:notification', full);
    this.logger.log(`[WS→admin] ${notif.title}`);
  }
}
