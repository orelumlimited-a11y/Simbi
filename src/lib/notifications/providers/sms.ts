import type { SmsMessage, SendResult } from "@/lib/notifications/types";

/**
 * SMS via Twilio. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
 * TWILIO_SMS_FROM in .env to activate — safely no-ops until then.
 *
 * Note: sending to US numbers requires A2P 10DLC brand + campaign
 * registration with Twilio before carriers will deliver the traffic.
 */
export async function sendSms(message: SmsMessage): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "SMS provider not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM in .env)" };
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({ from, to: message.to, body: message.body });
    return { ok: true, providerId: result.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS send error" };
  }
}
