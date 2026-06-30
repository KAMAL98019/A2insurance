import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './modules/upload/cloudinary.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehicleRecordsModule } from './modules/vehicle-records/vehicle-records.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RenewalsModule } from './modules/renewals/renewals.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    VehicleRecordsModule,
    DashboardModule,
    UploadModule,
    CategoriesModule,
    RenewalsModule,
    WhatsAppModule,
    NotificationsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
