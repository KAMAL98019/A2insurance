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
import { HealthInsuranceModule } from './modules/health-insurance/health-insurance.module';
import { HealthRenewalsModule } from './modules/health-renewals/health-renewals.module';
import { FireInsuranceModule } from './modules/fire-insurance/fire-insurance.module';
import { FireRenewalsModule } from './modules/fire-renewals/fire-renewals.module';
import { LabourInsuranceModule } from './modules/labour-insurance/labour-insurance.module';
import { LabourRenewalsModule } from './modules/labour-renewals/labour-renewals.module';
import { LeadSourcesModule }   from './modules/lead-sources/lead-sources.module';
import { InsuranceCompaniesModule } from './modules/insurance-companies/insurance-companies.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AccessControlModule } from './common/access-control/access-control.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CloudinaryModule,
    AccessControlModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    PermissionsModule,
    VehicleRecordsModule,
    DashboardModule,
    UploadModule,
    CategoriesModule,
    RenewalsModule,
    WhatsAppModule,
    NotificationsModule,
    SchedulerModule,
    HealthInsuranceModule,
    HealthRenewalsModule,
    FireInsuranceModule,
    FireRenewalsModule,
    LabourInsuranceModule,
    LabourRenewalsModule,
    LeadSourcesModule,
    InsuranceCompaniesModule,
  ],
})
export class AppModule {}
