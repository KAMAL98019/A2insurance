import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { hasUnrestrictedLocationAccess } from '../../common/access-control/access-control.service';

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
export class AppNotificationGateway
  implements OnGatewayInit, OnGatewayConnection
{
  private readonly logger = new Logger(AppNotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('WebSocket gateway ready');
  }

  // Authenticates the socket and joins it to room(s) so notifications only
  // reach users who can actually see the location that notification is about.
  // Master/Super Admin join 'unrestricted' and receive every location's
  // notifications; an Admin User joins one room per location they're
  // assigned to and only receives those.
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ email: string }>(
        token,
      );
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!user || user.status !== 'ACTIVE') {
        client.disconnect(true);
        return;
      }

      if (hasUnrestrictedLocationAccess(user.role)) {
        void client.join('unrestricted');
      } else {
        const rows = await this.prisma.userLocation.findMany({
          where: { userId: user.id },
          select: { locationId: true },
        });
        rows.forEach((r) => void client.join(`location:${r.locationId}`));
      }
    } catch {
      client.disconnect(true);
    }
  }

  /**
   * locationId omitted  -> global/system notification, broadcast to everyone.
   * locationId === null -> record has no location assigned; unrestricted roles only.
   * locationId a number  -> that location's room plus unrestricted roles.
   */
  push(notif: Omit<AppNotif, 'id' | 'timestamp'>, locationId?: number | null) {
    if (!this.server) return;
    const full: AppNotif = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    if (locationId === undefined) {
      this.server.emit('app:notification', full);
    } else if (locationId === null) {
      this.server.to('unrestricted').emit('app:notification', full);
    } else {
      this.server
        .to(['unrestricted', `location:${locationId}`])
        .emit('app:notification', full);
    }

    this.logger.log(`[WS] ${notif.title}`);
  }
}
