export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export interface SendResult {
  ok: boolean;
  /** Present when ok is false — human-readable reason (missing config, provider error, etc). */
  error?: string;
  /** Provider-assigned message id, when available. */
  providerId?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface SmsMessage {
  to: string;
  body: string;
}

export interface WhatsappMessage {
  to: string;
  body: string;
}
