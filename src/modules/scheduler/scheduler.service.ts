import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly notifications: NotificationsService) {}

  // Runs every hour — fires main alerts only at the admin-configured hour
  @Cron('0 * * * *')
  async handleHourlyCheck() {
    const settings = await this.notifications.getSettings();
    const currentHour = new Date().getHours();
    if (currentHour === settings.schedulerHour) {
      this.logger.log(`Scheduled alerts triggered at ${currentHour}:00`);
      await this.notifications.processScheduledAlerts();
    }
  }

  // Runs every 3 hours — sends "expires today" reminders throughout the day
  @Cron('0 */3 * * *')
  async handleTodayAlerts() {
    this.logger.log('3-hour today-expiry check triggered');
    await this.notifications.processTodayAlerts();
  }

  // Runs daily at midnight — purges notification logs older than 10 days
  @Cron('0 0 * * *')
  async handleLogCleanup() {
    this.logger.log('Daily log cleanup triggered');
    await this.notifications.cleanupOldLogs(2);
  }
}
