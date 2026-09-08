import type { EmailMessage, SendResult } from "@/lib/notifications/types";

/**
 * Email via Resend (https://resend.com). Configure RESEND_API_KEY and
 * EMAIL_FROM in .env to activate — until then this safely no-ops so the rest
 * of the app (order flow, status updates) keeps working without a provider.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: "Email provider not configured (set RESEND_API_KEY and EMAIL_FROM in .env)" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, providerId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown email send error" };
  }
}
