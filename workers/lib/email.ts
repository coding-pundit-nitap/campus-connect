import nodemailer, { Transporter } from "nodemailer";

import { loggers } from "./logger";

const logger = loggers.notification;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || "587");
const smtpUsername = process.env.SMTP_USERNAME;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom =
  process.env.NOTIFICATION_EMAIL_FROM ||
  process.env.ALERT_EMAIL_FROM ||
  smtpUsername;

const isEmailEnabled =
  !!smtpHost &&
  Number.isFinite(smtpPort) &&
  !!smtpUsername &&
  !!smtpPassword &&
  !!smtpFrom;

let transporter: Transporter | null = null;

if (isEmailEnabled) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
  });
} else {
  logger.warn(
    "Email notifications are disabled. Set SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and NOTIFICATION_EMAIL_FROM (or ALERT_EMAIL_FROM)."
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type SendNotificationEmailParams = {
  to: string;
  recipientName?: string | null;
  title: string;
  message: string;
  actionUrl?: string | null;
};

export async function sendNotificationEmail({
  to,
  recipientName,
  title,
  message,
  actionUrl,
}: SendNotificationEmailParams): Promise<boolean> {
  if (!transporter || !smtpFrom) {
    return false;
  }

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeName = recipientName ? escapeHtml(recipientName) : "there";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Hello ${safeName},</p>
      <h2 style="margin-bottom: 8px;">${safeTitle}</h2>
      <p>${safeMessage}</p>
      ${
        actionUrl
          ? `<p style="margin-top: 20px;"><a href="${actionUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; text-decoration: none; border-radius: 6px;">View Details</a></p>`
          : ""
      }
      <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">This is an automated notification from Campus Connect.</p>
    </div>
  `;

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `[Campus Connect] ${title}`,
    text: `${title}\n\n${message}${actionUrl ? `\n\nOpen: ${actionUrl}` : ""}`,
    html,
  });

  return true;
}
