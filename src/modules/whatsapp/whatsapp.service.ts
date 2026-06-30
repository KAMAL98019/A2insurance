import { Injectable, Logger } from '@nestjs/common';

export interface WhatsAppConfig {
  apiKey:        string;
  apiUrl:        string;
  messageId:     string;
  phoneNumberId: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  response: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  async send(
    to: string,
    variable: string,
    config: WhatsAppConfig,
  ): Promise<WhatsAppSendResult> {
    try {
      // Sanitize: strip non-digits, remove leading 91 country code, keep last 10 digits
      const number = to.replace(/\D/g, '').replace(/^91/, '').slice(-10);
      if (number.length !== 10) {
        return { success: false, response: `Invalid mobile number: ${to}` };
      }

      const url = new URL(config.apiUrl || process.env.WHATSAPP_API_URL || '');
      url.searchParams.set('authorization',    config.apiKey);
      url.searchParams.set('phone_number_id',  config.phoneNumberId);
      url.searchParams.set('message_id',       config.messageId);
      url.searchParams.set('numbers',          number);
      url.searchParams.set('variables_values', variable);
      url.searchParams.set('language',         'english');

      const res  = await fetch(url.toString(), { method: 'GET' });
      const text = await res.text();

      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { /* non-JSON response */ }

      const success = res.ok && (parsed.return === true || parsed.return === undefined);
      this.logger[success ? 'log' : 'warn'](`WhatsApp → ${number}: ${text}`);
      return { success, response: text };
    } catch (err: any) {
      this.logger.error(`WhatsApp send error: ${err.message}`);
      return { success: false, response: err.message };
    }
  }
}
