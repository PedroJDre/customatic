import nodemailer from "nodemailer";

export type EmailResult = "sent" | "skipped" | "failed";

let transport: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransport() {
  if (transport === undefined) {
    // Any SMTP server works: Resend, Brevo, Postmark, SES, Gmail...
    // smtps://user:pass@smtp.example.com:465 or smtp://user:pass@host:587
    transport = process.env.SMTP_URL ? nodemailer.createTransport(process.env.SMTP_URL) : null;
  }
  return transport;
}

export function emailEnabled(): boolean {
  return Boolean(process.env.SMTP_URL);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const t = getTransport();
  if (!t) {
    console.info(`[email skipped: SMTP_URL not set] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return "skipped";
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM ?? "Customatic <no-reply@localhost>",
      to: input.to,
      subject: input.subject,
      text: input.text,
      replyTo: input.replyTo,
    });
    return "sent";
  } catch (error) {
    console.error("[email failed]", error);
    return "failed";
  }
}
