import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as QRCode from 'qrcode';
import * as path from 'path';
import { AppNotificationGateway } from './app-notification.gateway';

@Injectable()
export class WhatsAppWebService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppWebService.name);
  private client: Client;
  private ready = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private qrString: string | null = null;

  constructor(private readonly gateway: AppNotificationGateway) {}

  async onModuleInit() {
    process.on('unhandledRejection', (reason: any) => {
      const msg = reason?.message ?? String(reason);
      if (
        msg.includes('EBUSY') ||
        msg.includes('resource busy or locked') ||
        msg.includes('Execution context was destroyed') ||
        msg.includes('Protocol error (Runtime')
      ) {
        this.logger.warn(`WhatsApp transient error suppressed: ${msg.split('\n')[0]}`);
        return;
      }
    });

    await this.initClient();
  }

  private buildClient(): Client {
    return new Client({
      authStrategy: new LocalAuth({
        clientId: 'a2insurance',
        dataPath: path.resolve(process.cwd(), '.wwebjs_auth'),
      }),
      puppeteer: {
        headless: true,
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        }),
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });
  }

  private async initClient() {
    this.client = this.buildClient();
    this.attachListeners();

    try {
      await this.client.initialize();
    } catch (err: any) {
      // If the ready event already fired before the exception bubbled, we're good
      if (this.ready) return;

      const msg = err?.message ?? String(err);
      if (msg.includes('EBUSY') || msg.includes('resource busy')) {
        this.logger.warn('WhatsApp init blocked by file lock — retrying in 8s...');
        this.scheduleReconnect(8_000);
      } else if (msg.includes('Execution context was destroyed') || msg.includes('Protocol error (Runtime')) {
        // WhatsApp Web navigates internally during load — this is transient, retry quickly
        this.logger.warn('WhatsApp page reloaded during startup (transient) — retrying in 6s...');
        this.scheduleReconnect(6_000);
      } else {
        this.logger.error(`WhatsApp init error: ${msg}`);
        this.scheduleReconnect(15_000);
      }
    }
  }

  private attachListeners() {
    this.client.on('qr', (qr) => {
      this.qrString = qr;
      this.logger.warn('📱 Scan this QR code with WhatsApp (one-time only):');
      qrcode.generate(qr, { small: true });
      this.gateway.push({
        type: 'whatsapp_qr',
        title: 'WhatsApp QR Ready',
        message: 'New QR code generated. Go to Settings → WhatsApp Connection to scan it.',
        severity: 'info',
      });
    });

    this.client.on('authenticated', () => {
      this.logger.log('WhatsApp authenticated — session saved, no QR needed next restart');
    });

    this.client.on('ready', () => {
      this.ready = true;
      this.qrString = null;
      this.logger.log('WhatsApp client ready ✓');
      this.gateway.push({
        type: 'whatsapp_connected',
        title: 'WhatsApp Connected',
        message: 'WhatsApp is connected and ready to send messages.',
        severity: 'success',
      });
    });

    this.client.on('auth_failure', (msg) => {
      this.ready = false;
      this.logger.error(`WhatsApp auth failure: ${msg}`);
      this.gateway.push({
        type: 'whatsapp_auth_failure',
        title: 'WhatsApp Auth Failed',
        message: 'Authentication failed. Go to Settings to scan the QR code again.',
        severity: 'error',
      });
      this.scheduleReconnect(10_000);
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      this.logger.warn(`WhatsApp disconnected: ${reason} — reconnecting in 10s...`);
      this.gateway.push({
        type: 'whatsapp_disconnected',
        title: 'WhatsApp Disconnected',
        message: `WhatsApp disconnected (${reason}). Reconnecting automatically…`,
        severity: 'error',
      });
      this.scheduleReconnect(10_000);
    });
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimer) return; // already scheduled
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      this.logger.log('WhatsApp reconnecting...');
      try {
        // Destroy old client gracefully — ignore EBUSY on Windows
        await this.client.destroy().catch(() => {});
      } catch { /* ignore */ }
      await this.initClient();
    }, delayMs);
  }

  isReady() {
    return this.ready;
  }

  async getQRCode(): Promise<string | null> {
    if (!this.qrString) return null;
    return QRCode.toDataURL(this.qrString, { width: 280, margin: 2 });
  }

  async refreshQR() {
    this.ready = false;
    this.qrString = null;
    await this.client.destroy().catch(() => {});
    await this.initClient();
  }

  async send(phone: string, message: string): Promise<{ success: boolean; response: string }> {
    if (!this.ready) {
      return { success: false, response: 'WhatsApp not connected. Check server terminal for QR code.' };
    }
    try {
      const digits = phone.replace(/\D/g, '');
      const withCountry = digits.startsWith('91') ? digits : `91${digits}`;
      const chatId = `${withCountry}@c.us`;
      await this.client.sendMessage(chatId, message);
      this.logger.log(`WhatsApp → ${phone}: sent`);
      return { success: true, response: 'Message sent' };
    } catch (err: any) {
      this.logger.error(`WhatsApp send error: ${err.message}`);
      return { success: false, response: err.message };
    }
  }
}
