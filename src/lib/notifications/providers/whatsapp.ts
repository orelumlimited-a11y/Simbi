import type { WhatsappMessage, SendResult } from "@/lib/notifications/types";

/**
 * WhatsApp via Twilio's WhatsApp Business API integration. Configure
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM
 * (e.g. "whatsapp:+14155238886") in .env to activate — no-ops until then.
 *
 * Note: any message you initiate (not a reply within a customer-started
 * 24-hour session) must use a WhatsApp template pre-approved by Meta.
 * `message.body` here should match an approved template's content once
 * you've set one up in the Twilio/Meta console.
 */
export async function sendWhatsapp(message: WhatsappMessage): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "WhatsApp provider not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env)" };
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      from,
      to: `whatsapp:${message.to}`,
      body: message.body,
    });
    return { ok: true, providerId: result.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown WhatsApp send error" };
  }
}
