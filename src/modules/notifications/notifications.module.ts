import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsAppWebService } from './whatsapp-web.service';
import { AppNotificationGateway } from './app-notification.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    PrismaModule,
    // Only used to verify incoming tokens on WebSocket connect — no signing
    // happens here, so signOptions aren't needed.
    JwtModule.registerAsync({
      useFactory: () => ({ secret: jwtConfig.secret }),
    }),
  ],
  providers: [NotificationsService, WhatsAppWebService, AppNotificationGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
