import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { WhatsAppWebService } from './whatsapp-web.service';
import { AppNotificationGateway } from './app-notification.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  providers:   [NotificationsService, WhatsAppWebService, AppNotificationGateway],
  controllers: [NotificationsController],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
