import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppWebService } from './whatsapp-web.service';
import { AppNotificationGateway } from './app-notification.gateway';
import { SendManualDto } from './dto/send-manual.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { NotificationType, NotifStatus } from '@prisma/client';

const DEDUP_WINDOW_MS: Record<NotificationType, number> = {
  EXPIRY_30:    7  * 24 * 3600 * 1000,
  EXPIRY_15:    5  * 24 * 3600 * 1000,
  EXPIRY_7:     3  * 24 * 3600 * 1000,
  EXPIRY_TODAY: 3  * 3600 * 1000,        // re-alert every 3 hours on expiry day
  EXPIRED:      30 * 24 * 3600 * 1000,
  RENEWED:      0,
  MANUAL:       0,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppWebService,
    private readonly gateway: AppNotificationGateway,
  ) {}

  // ── Settings (singleton row) ──────────────────────────────────────────────

  async getSettings() {
    let s = await this.prisma.notificationSettings.findFirst();
    if (!s) {
      s = await this.prisma.notificationSettings.create({ data: {} });
    }
    return s;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const s = await this.getSettings();
    return this.prisma.notificationSettings.update({ where: { id: s.id }, data: dto });
  }

  // ── Logs ──────────────────────────────────────────────────────────────────

  async getLogs(limit = 100) {
    return this.prisma.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        vehicleRecord:   { select: { vehicleNumber: true, ownerName: true } },
        healthInsurance: { select: { policyNumber: true, policyHolderName: true } },
      },
    });
  }

  async getLogStats() {
    const [sent, failed, pending] = await Promise.all([
      this.prisma.notificationLog.count({ where: { status: NotifStatus.SENT } }),
      this.prisma.notificationLog.count({ where: { status: NotifStatus.FAILED } }),
      this.prisma.notificationLog.count({ where: { status: NotifStatus.PENDING } }),
    ]);
    return { sent, failed, pending, total: sent + failed + pending };
  }

  // ── Core send ─────────────────────────────────────────────────────────────

  private async hasSentRecently(vehicleRecordId: number, type: NotificationType): Promise<boolean> {
    const windowMs = DEDUP_WINDOW_MS[type];
    if (windowMs === 0) return false;
    const since = new Date(Date.now() - windowMs);
    const count = await this.prisma.notificationLog.count({
      where: { vehicleRecordId, notificationType: type, status: NotifStatus.SENT, sentAt: { gte: since } },
    });
    return count > 0;
  }

  private buildFooter(language: string, settings: { contactName?: string | null; contactPhone?: string | null; contactAddress?: string | null }): string {
    const name    = settings.contactName    ?? 'A2 Insurance';
    const phone   = settings.contactPhone   ?? '';
    const address = settings.contactAddress ?? '';

    const lines = [
      phone   ? `📞 ${phone}`   : '',
      address ? `📍 ${address}` : '',
    ].filter(Boolean);

    if (language === 'tamil') {
      return `\n\n${lines.length ? lines.join('\n') + '\n' : ''}${name}`;
    }
    return `\n\n${lines.length ? lines.join('\n') + '\n' : ''}${name}`;
  }

  private buildExpiryMessage(
    vehicleNumber: string,
    ownerName: string,
    expiryDate: Date,
    daysLeft: number,
    language = 'english',
    type?: NotificationType,
    settings?: { contactName?: string | null; contactPhone?: string | null; contactAddress?: string | null },
  ): string {
    const dateStr = expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const isTamil = language === 'tamil';
    const footer  = this.buildFooter(language, settings ?? {});

    // EXPIRES TODAY
    if (type === NotificationType.EXPIRY_TODAY) {
      return isTamil
        ? `அன்புள்ள ${ownerName},\n\n🔴 *இன்று காலாவதி!* உங்கள் வாகனம் *${vehicleNumber}* க்கான காப்பீடு *இன்று* (${dateStr}) காலாவதியாகும்.\n\nதயவுசெய்து இப்போதே புதுப்பிக்கவும்!${footer}`
        : `Dear ${ownerName},\n\n🔴 *EXPIRES TODAY!* Your vehicle insurance for *${vehicleNumber}* expires *today* (${dateStr}).\n\nPlease renew immediately!${footer}`;
    }

    // EXPIRED
    if (daysLeft <= 0) {
      return isTamil
        ? `அன்புள்ள ${ownerName},\n\n⚠️ உங்கள் வாகனம் *${vehicleNumber}* க்கான காப்பீடு ${dateStr} அன்று *காலாவதியாகிவிட்டது*.\n\nசட்ட சிக்கல்களை தவிர்க்க உடனடியாக புதுப்பிக்கவும்.${footer}`
        : `Dear ${ownerName},\n\n⚠️ Your vehicle insurance for *${vehicleNumber}* has *EXPIRED* on ${dateStr}.\n\nPlease renew immediately to avoid legal issues.${footer}`;
    }

    // 7-day alert — urgent
    if (type === NotificationType.EXPIRY_7) {
      return isTamil
        ? `அன்புள்ள ${ownerName},\n\n🚨 *அவசரம்!* உங்கள் வாகனம் *${vehicleNumber}* க்கான காப்பீடு வெறும் *${daysLeft} நாட்களில்* (${dateStr}) காலாவதியாகும்.\n\nதாமதிக்காமல் இப்போதே புதுப்பிக்கவும்.${footer}`
        : `Dear ${ownerName},\n\n🚨 *URGENT!* Your vehicle insurance for *${vehicleNumber}* expires in just *${daysLeft} days* (${dateStr}).\n\nPlease renew immediately to avoid a coverage lapse.${footer}`;
    }

    // 15-day alert — reminder
    if (type === NotificationType.EXPIRY_15) {
      return isTamil
        ? `அன்புள்ள ${ownerName},\n\n🔔 நினைவூட்டல்: உங்கள் வாகனம் *${vehicleNumber}* க்கான காப்பீடு *${daysLeft} நாட்களில்* (${dateStr}) காலாவதியாகும்.\n\nசீக்கிரமே புதுப்பிக்கவும்.${footer}`
        : `Dear ${ownerName},\n\n🔔 Reminder: Your vehicle insurance for *${vehicleNumber}* expires in *${daysLeft} days* (${dateStr}).\n\nPlease renew soon to ensure continuous coverage.${footer}`;
    }

    // 30-day alert — advance notice
    return isTamil
      ? `அன்புள்ள ${ownerName},\n\n📋 முன்னறிவிப்பு: உங்கள் வாகனம் *${vehicleNumber}* க்கான காப்பீடு *${daysLeft} நாட்களில்* (${dateStr}) காலாவதியாகும்.\n\nசமயத்தில் புதுப்பிக்க திட்டமிடவும்.${footer}`
      : `Dear ${ownerName},\n\n📋 Advance Notice: Your vehicle insurance for *${vehicleNumber}* will expire in *${daysLeft} days* (${dateStr}).\n\nPlease plan for renewal in advance.${footer}`;
  }

  async sendExpiryAlert(
    vehicle: { id: number; vehicleNumber: string; ownerName: string; cellNumber: string; policyExpiryDate: Date },
    type: NotificationType,
    daysLeft: number,
  ) {
    const settings = await this.getSettings();
    if (!settings.enableWhatsApp) {
      this.logger.warn('WhatsApp disabled in settings — skipping alert');
      return;
    }
    if (!this.whatsapp.isReady()) {
      this.logger.warn('WhatsApp not connected — skipping alert');
      return;
    }
    if (await this.hasSentRecently(vehicle.id, type)) {
      this.logger.log(`Skipping ${type} for ${vehicle.vehicleNumber} — already sent recently`);
      return;
    }

    const message = this.buildExpiryMessage(
      vehicle.vehicleNumber, vehicle.ownerName, vehicle.policyExpiryDate, daysLeft, settings.language, type, settings,
    );

    const log = await this.prisma.notificationLog.create({
      data: {
        vehicleRecordId:  vehicle.id,
        mobileNumber:     vehicle.cellNumber,
        notificationType: type,
        message,
        status: NotifStatus.PENDING,
      },
    });

    const result = await this.whatsapp.send(vehicle.cellNumber, message);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: result.success ? NotifStatus.SENT : NotifStatus.FAILED, response: result.response },
    });

    this.logger.log(`${type} → ${vehicle.vehicleNumber} (${vehicle.cellNumber}): ${result.success ? 'SENT' : 'FAILED'}`);

    const expStr   = vehicle.policyExpiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const typeLabel = {
      EXPIRY_30:    '30-Day Alert', EXPIRY_15: '15-Day Alert', EXPIRY_7: '7-Day Alert',
      EXPIRY_TODAY: 'Expires Today', EXPIRED: 'Expired', RENEWED: 'Renewed', MANUAL: 'Manual',
    }[type] ?? type;

    this.gateway.push(result.success ? {
      type: 'alert_sent',
      title: `${typeLabel} — Sent`,
      message: `${vehicle.vehicleNumber} · ${vehicle.ownerName} · Expiry: ${expStr}`,
      severity: 'success',
    } : {
      type: 'alert_failed',
      title: `${typeLabel} — Failed`,
      message: `${vehicle.vehicleNumber} · ${vehicle.ownerName} · Expiry: ${expStr} · ${result.response}`,
      severity: 'warning',
    });
  }

  async sendRenewalAlert(vehicle: {
    id: number; vehicleNumber: string; ownerName: string;
    cellNumber: string; policyExpiryDate: Date;
  }) {
    const settings = await this.getSettings();
    if (!settings.enableWhatsApp || !this.whatsapp.isReady()) return;

    const dateStr = vehicle.policyExpiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const footer  = this.buildFooter(settings.language, settings);
    const message = settings.language === 'tamil'
      ? `அன்புள்ள ${vehicle.ownerName},\n\n✅ நற்செய்தி! உங்கள் வாகனம் *${vehicle.vehicleNumber}* க்கான காப்பீடு வெற்றிகரமாக புதுப்பிக்கப்பட்டது.\n\nபுதிய காலாவதி தேதி: ${dateStr}${footer}`
      : `Dear ${vehicle.ownerName},\n\n✅ Great news! Your vehicle insurance for *${vehicle.vehicleNumber}* has been successfully renewed.\n\nNew expiry date: ${dateStr}${footer}`;

    const log = await this.prisma.notificationLog.create({
      data: {
        vehicleRecordId:  vehicle.id,
        mobileNumber:     vehicle.cellNumber,
        notificationType: NotificationType.RENEWED,
        message,
        status: NotifStatus.PENDING,
      },
    });

    const result = await this.whatsapp.send(vehicle.cellNumber, message);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: result.success ? NotifStatus.SENT : NotifStatus.FAILED, response: result.response },
    });
  }

  // ── Health Insurance alerts ───────────────────────────────────────────────

  private buildHealthRenewalMessage(
    holderName: string,
    policyNumber: string,
    renewalDate: Date,
    daysLeft: number,
    language = 'english',
    settings?: { contactName?: string | null; contactPhone?: string | null; contactAddress?: string | null },
  ): string {
    const dateStr = renewalDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const isTamil = language === 'tamil';
    const footer  = this.buildFooter(language, settings ?? {});

    if (daysLeft <= 0) {
      return isTamil
        ? `அன்புள்ள ${holderName},\n\n⚠️ உங்கள் ஆரோக்கிய காப்பீடு (*${policyNumber}*) ${dateStr} அன்று *புதுப்பிக்க வேண்டிய தேதி*.\n\nதாமதிக்காமல் புதுப்பிக்கவும்.${footer}`
        : `Dear ${holderName},\n\n⚠️ Your health insurance policy (*${policyNumber}*) renewal was due on ${dateStr}.\n\nPlease renew immediately to avoid a coverage gap.${footer}`;
    }

    if (daysLeft <= 7) {
      return isTamil
        ? `அன்புள்ள ${holderName},\n\n🚨 *அவசரம்!* உங்கள் ஆரோக்கிய காப்பீடு (*${policyNumber}*) வெறும் *${daysLeft} நாட்களில்* (${dateStr}) புதுப்பிக்க வேண்டும்.\n\nதாமதிக்காமல் இப்போதே தொடர்பு கொள்ளவும்.${footer}`
        : `Dear ${holderName},\n\n🚨 *URGENT!* Your health insurance policy (*${policyNumber}*) renewal is due in just *${daysLeft} days* (${dateStr}).\n\nPlease contact us immediately to renew your coverage.${footer}`;
    }

    if (daysLeft <= 15) {
      return isTamil
        ? `அன்புள்ள ${holderName},\n\n🔔 நினைவூட்டல்: உங்கள் ஆரோக்கிய காப்பீடு (*${policyNumber}*) *${daysLeft} நாட்களில்* (${dateStr}) புதுப்பிக்க வேண்டும்.\n\nசீக்கிரமே புதுப்பிக்கவும்.${footer}`
        : `Dear ${holderName},\n\n🔔 Reminder: Your health insurance policy (*${policyNumber}*) renewal is due in *${daysLeft} days* (${dateStr}).\n\nPlease renew soon to ensure continuous coverage.${footer}`;
    }

    return isTamil
      ? `அன்புள்ள ${holderName},\n\n📋 முன்னறிவிப்பு: உங்கள் ஆரோக்கிய காப்பீடு (*${policyNumber}*) *${daysLeft} நாட்களில்* (${dateStr}) புதுப்பிக்க வேண்டும்.\n\nசமயத்தில் புதுப்பிக்க திட்டமிடவும்.${footer}`
      : `Dear ${holderName},\n\n📋 Advance Notice: Your health insurance policy (*${policyNumber}*) renewal is due in *${daysLeft} days* (${dateStr}).\n\nPlease plan for renewal in advance.${footer}`;
  }

  async sendHealthRenewalAlert(
    health: { id: number; policyNumber: string; policyHolderName: string; mobileNumber: string; renewalDate: Date },
    type: NotificationType,
    daysLeft: number,
  ) {
    const settings = await this.getSettings();
    if (!settings.enableWhatsApp) {
      this.logger.warn('WhatsApp disabled — skipping health alert');
      return;
    }
    if (!this.whatsapp.isReady()) {
      this.logger.warn('WhatsApp not connected — skipping health alert');
      return;
    }

    const message = this.buildHealthRenewalMessage(
      health.policyHolderName, health.policyNumber, health.renewalDate, daysLeft, settings.language, settings,
    );

    const log = await this.prisma.notificationLog.create({
      data: {
        healthInsuranceId: health.id,
        mobileNumber:      health.mobileNumber,
        notificationType:  type,
        message,
        status: NotifStatus.PENDING,
      },
    });

    const result = await this.whatsapp.send(health.mobileNumber, message);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: result.success ? NotifStatus.SENT : NotifStatus.FAILED, response: result.response },
    });

    this.logger.log(`Health ${type} → ${health.policyNumber} (${health.mobileNumber}): ${result.success ? 'SENT' : 'FAILED'}`);
  }

  async processScheduledHealthAlerts() {
    const settings = await this.getSettings();
    if (!settings.enableWhatsApp) return;

    const now      = new Date();
    const MSperDay = 86_400_000;

    const buildRange = (daysAhead: number) => ({
      gte: new Date(now.getTime() + (daysAhead - 1) * MSperDay),
      lte: new Date(now.getTime() +  daysAhead      * MSperDay),
    });

    const [renewal30, renewal15, renewal7, overdue] = await Promise.all([
      this.prisma.healthInsurance.findMany({
        where: { renewalDate: buildRange(settings.firstAlertDays),  policyStatus: { not: 'CANCELLED' } },
      }),
      this.prisma.healthInsurance.findMany({
        where: { renewalDate: buildRange(settings.secondAlertDays), policyStatus: { not: 'CANCELLED' } },
      }),
      this.prisma.healthInsurance.findMany({
        where: { renewalDate: buildRange(settings.finalAlertDays),  policyStatus: { not: 'CANCELLED' } },
      }),
      this.prisma.healthInsurance.findMany({
        where: { renewalDate: { gte: new Date(now.getTime() - 7 * MSperDay), lt: now }, policyStatus: { not: 'CANCELLED' } },
      }),
    ]);

    type HealthJob = { record: { id: number; policyNumber: string; policyHolderName: string; mobileNumber: string; renewalDate: Date }; type: NotificationType; days: number };

    const jobs: HealthJob[] = [
      ...renewal30.map((r) => ({ record: r, type: NotificationType.EXPIRY_30, days: settings.firstAlertDays })),
      ...renewal15.map((r) => ({ record: r, type: NotificationType.EXPIRY_15, days: settings.secondAlertDays })),
      ...renewal7.map( (r) => ({ record: r, type: NotificationType.EXPIRY_7,  days: settings.finalAlertDays })),
      ...overdue.map(  (r) => ({ record: r, type: NotificationType.EXPIRED,   days: 0 })),
    ];

    this.logger.log(`Found ${jobs.length} health insurance alerts to process`);

    for (const job of jobs) {
      try {
        await this.sendHealthRenewalAlert(job.record, job.type, job.days);
      } catch (err: any) {
        this.logger.error(`Health alert failed for ${job.record.policyNumber}: ${err.message}`);
      }
    }
  }

  async sendManual(dto: SendManualDto) {
    if (!this.whatsapp.isReady()) {
      return { success: false, message: 'WhatsApp not connected. Go to Settings to scan the QR code.' };
    }

    const log = await this.prisma.notificationLog.create({
      data: {
        vehicleRecordId:  dto.vehicleRecordId ?? null,
        mobileNumber:     dto.mobileNumber,
        notificationType: NotificationType.MANUAL,
        message:          dto.message,
        status:           NotifStatus.PENDING,
      },
    });

    const result = await this.whatsapp.send(dto.mobileNumber, dto.message);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: result.success ? NotifStatus.SENT : NotifStatus.FAILED, response: result.response },
    });

    return { success: result.success, message: result.success ? 'Message sent' : result.response };
  }

  getWhatsAppStatus() {
    return { connected: this.whatsapp.isReady() };
  }

  async getWhatsAppQR() {
    const qrDataUrl = await this.whatsapp.getQRCode();
    return { qrDataUrl };
  }

  async refreshWhatsAppQR() {
    await this.whatsapp.refreshQR();
    return { message: 'QR refresh initiated' };
  }

  async testConnection(mobileNumber: string) {
    if (!this.whatsapp.isReady()) {
      return { success: false, message: 'WhatsApp not connected. Go to Settings to scan the QR code.' };
    }
    const settings = await this.getSettings();
    const testMsg = settings.language === 'tamil'
      ? 'A2 Insurance மேலாண்மை அமைப்பிலிருந்து சோதனை செய்தி. WhatsApp அறிவிப்புகள் சரியாக வேலை செய்கின்றன! ✓'
      : 'Test message from A2 Insurance Management System. WhatsApp notifications are working! ✓';
    const result = await this.whatsapp.send(mobileNumber, testMsg);
    return { success: result.success, message: result.response };
  }

  // ── Policy summary for admin bell ────────────────────────────────────────

  async pushPolicySummary() {
    const now        = new Date();
    const MSperDay   = 86_400_000;
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end7       = new Date(now.getTime() + 7  * MSperDay);
    const end15      = new Date(now.getTime() + 15 * MSperDay);
    const end30      = new Date(now.getTime() + 30 * MSperDay);

    const [expiredList, todayList, week7, week15, week30] = await Promise.all([
      this.prisma.vehicleRecord.findMany({
        where: { policyExpiryDate: { lt: startToday } },
        select: { vehicleNumber: true, ownerName: true, policyExpiryDate: true },
        orderBy: { policyExpiryDate: 'desc' },
        take: 10,
      }),
      this.prisma.vehicleRecord.findMany({
        where: { policyExpiryDate: { gte: startToday, lt: new Date(startToday.getTime() + MSperDay) } },
        select: { vehicleNumber: true, ownerName: true, policyExpiryDate: true },
      }),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { gte: startToday, lte: end7 } } }),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { gt: end7, lte: end15 } } }),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { gt: end15, lte: end30 } } }),
    ]);

    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Expires today
    if (todayList.length) {
      this.gateway.push({
        type: 'policy_summary_today',
        title: `🔴 ${todayList.length} Policy${todayList.length > 1 ? 'ies' : 'y'} Expire Today`,
        message: todayList.map((v) => `${v.vehicleNumber} · ${v.ownerName}`).join('\n'),
        severity: 'error',
      });
    }

    // Expired — need follow-up
    if (expiredList.length) {
      this.gateway.push({
        type: 'policy_summary_expired',
        title: `⚠️ Expired Policies — Follow-up Needed`,
        message: expiredList.map((v) => `${v.vehicleNumber} · ${v.ownerName} · expired ${fmt(v.policyExpiryDate)}`).join('\n'),
        severity: 'warning',
      });
    }

    // Upcoming count summary
    const upcomingParts: string[] = [];
    if (week7  > 0) upcomingParts.push(`${week7} within 7 days`);
    if (week15 > 0) upcomingParts.push(`${week15} within 15 days`);
    if (week30 > 0) upcomingParts.push(`${week30} within 30 days`);

    if (upcomingParts.length) {
      this.gateway.push({
        type: 'policy_summary_upcoming',
        title: '📋 Upcoming Expirations',
        message: upcomingParts.join(' · '),
        severity: 'info',
      });
    }
  }

  // ── Log cleanup ──────────────────────────────────────────────────────────

  async cleanupOldLogs(days = 2): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.notificationLog.deleteMany({
      where: { sentAt: { lt: cutoff } },
    });
    this.logger.log(`Log cleanup: deleted ${count} records older than ${days} days`);
    return count;
  }

  // ── Scheduled job entry point ─────────────────────────────────────────────

  async processScheduledAlerts() {
    this.logger.log('Running scheduled expiry alerts check...');

    // Push today's policy summary to admin notification bell first
    await this.pushPolicySummary();

    const settings = await this.getSettings();
    if (!settings.enableWhatsApp) {
      this.logger.log('WhatsApp disabled — skipping scheduled alerts');
      return;
    }

    const now      = new Date();
    const MSperDay = 86_400_000;

    const buildRange = (daysAhead: number) => ({
      gte: new Date(now.getTime() + (daysAhead - 1) * MSperDay),
      lte: new Date(now.getTime() +  daysAhead      * MSperDay),
    });

    const [expiry30, expiry15, expiry7, expired] = await Promise.all([
      this.prisma.vehicleRecord.findMany({ where: { policyExpiryDate: buildRange(settings.firstAlertDays) } }),
      this.prisma.vehicleRecord.findMany({ where: { policyExpiryDate: buildRange(settings.secondAlertDays) } }),
      this.prisma.vehicleRecord.findMany({ where: { policyExpiryDate: buildRange(settings.finalAlertDays) } }),
      this.prisma.vehicleRecord.findMany({
        where: { policyExpiryDate: { gte: new Date(now.getTime() - 7 * MSperDay), lt: now } },
      }),
    ]);

    const jobs: Array<{ vehicle: any; type: NotificationType; days: number }> = [
      ...expiry30.map((v) => ({ vehicle: v, type: NotificationType.EXPIRY_30, days: settings.firstAlertDays })),
      ...expiry15.map((v) => ({ vehicle: v, type: NotificationType.EXPIRY_15, days: settings.secondAlertDays })),
      ...expiry7.map( (v) => ({ vehicle: v, type: NotificationType.EXPIRY_7,  days: settings.finalAlertDays })),
      ...expired.map( (v) => ({ vehicle: v, type: NotificationType.EXPIRED,   days: 0 })),
    ];

    this.logger.log(`Found ${jobs.length} alerts to process`);

    for (const job of jobs) {
      try {
        await this.sendExpiryAlert(job.vehicle, job.type, job.days);
      } catch (err: any) {
        this.logger.error(`Alert failed for ${job.vehicle.vehicleNumber}: ${err.message}`);
      }
    }

    this.logger.log('Scheduled vehicle alerts check complete');

    // ── Health Insurance renewal alerts ──────────────────────────
    await this.processScheduledHealthAlerts();

    this.gateway.push({
      type: 'scheduler_done',
      title: 'Scheduled Alerts Complete',
      message: `Processed ${jobs.length} vehicle alert${jobs.length !== 1 ? 's' : ''}.`,
      severity: 'info',
    });
  }

  async processTodayAlerts() {
    const settings = await this.getSettings();
    if (!settings.enableWhatsApp) return;

    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const vehicles = await this.prisma.vehicleRecord.findMany({
      where: { policyExpiryDate: { gte: startOfDay, lte: endOfDay } },
    });

    if (!vehicles.length) return;

    this.logger.log(`Today alerts: ${vehicles.length} vehicle(s) expire today`);

    for (const v of vehicles) {
      try {
        await this.sendExpiryAlert(v, NotificationType.EXPIRY_TODAY, 0);
      } catch (err: any) {
        this.logger.error(`Today alert failed for ${v.vehicleNumber}: ${err.message}`);
      }
    }
  }
}
