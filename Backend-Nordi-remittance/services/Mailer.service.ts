// ============================================================================
// MAILER SERVICE — Primary SMTP (nodemailer) + automatic backup provider
// ----------------------------------------------------------------------------
// Delivery chain:
//   1. PRIMARY  — SMTP via nodemailer (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS)
//   2. BACKUP   — HTTP API provider, used automatically when the primary fails
//                 or is not configured. Selected with BACKUP_MAIL_PROVIDER:
//                   "resend" → RESEND_API_KEY   (https://resend.com)
//                   "brevo"  → BREVO_API_KEY    (https://brevo.com)
//                 Sender address comes from BACKUP_MAIL_FROM (must be a verified
//                 sender/domain at the backup provider).
//
// The public API (sendMail / sendTemplatedMail) is unchanged, so the BullMQ mail
// worker, outbox relay and idempotency layers keep working exactly as before.
// If every configured provider fails the last error is thrown, so BullMQ retry
// semantics are preserved.
// ============================================================================

import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import dotenv from "dotenv";
import { render } from "../core/mail/Mail-renderer.js";
import type { EmailTemplateData, SendMailResult } from "../types/Mail.types.js";

dotenv.config();

// ----------------------------------------------------------------------------
// Provider configuration
// ----------------------------------------------------------------------------

const smtpRequired = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
const smtpMissing = smtpRequired.filter((v) => !process.env[v]);
const isPrimaryConfigured = smtpMissing.length === 0;

type BackupProvider = "resend" | "brevo";

function resolveBackupProvider(): BackupProvider | null {
  const requested = (process.env.BACKUP_MAIL_PROVIDER || "").toLowerCase();
  if (requested === "resend" && process.env.RESEND_API_KEY) return "resend";
  if (requested === "brevo" && process.env.BREVO_API_KEY) return "brevo";
  // Auto-detect when only a key is supplied
  if (!requested) {
    if (process.env.RESEND_API_KEY) return "resend";
    if (process.env.BREVO_API_KEY) return "brevo";
  }
  return null;
}

const backupProvider = resolveBackupProvider();

if (!isPrimaryConfigured && !backupProvider) {
  console.error(`Missing required email environment variables: ${smtpMissing.join(", ")}`);
  console.error("Configure SMTP settings, or a backup provider (BACKUP_MAIL_PROVIDER + API key) in .env.");
  throw new Error("Email service not configured properly");
}

if (!isPrimaryConfigured) {
  console.warn(`[Mailer] Primary SMTP not configured (${smtpMissing.join(", ")}) — using backup provider "${backupProvider}"`);
}

// ----------------------------------------------------------------------------
// Primary transport (nodemailer SMTP)
// ----------------------------------------------------------------------------

const transporter: Transporter | null = isPrimaryConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465", 10),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For self-signed certificates
      },
    })
  : null;

// Verify transporter configuration on startup
transporter?.verify((error) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
    if (backupProvider) console.warn(`[Mailer] Backup provider "${backupProvider}" will be used when SMTP fails`);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// ----------------------------------------------------------------------------
// Backup transports (HTTP APIs — no extra dependencies, uses Node's fetch)
// ----------------------------------------------------------------------------

function backupSender(): { name: string; email: string } {
  const name = process.env.SMTP_FROM_NAME || process.env.FROM_NAME || "Nordi Remittance";
  const email =
    process.env.BACKUP_MAIL_FROM || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@nordi-remittance.com";
  return { name, email };
}

export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  attachments?: MailAttachment[],
): Promise<SendMailResult> {
  const sender = backupSender();
  const payload: Record<string, any> = {
    from: `${sender.name} <${sender.email}>`,
    to: [to],
    subject,
    html,
  };
  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : Buffer.from(String(a.content)).toString("base64"),
    }));
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${body?.message || res.statusText}`);
  }
  return { messageId: body.id || `resend-${Date.now()}`, accepted: [to], rejected: [], response: "resend:accepted" };
}

async function sendViaBrevo(
  to: string,
  subject: string,
  html: string,
  attachments?: MailAttachment[],
): Promise<SendMailResult> {
  const sender = backupSender();
  const payload: Record<string, any> = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };
  if (attachments && attachments.length > 0) {
    payload.attachment = attachments.map((a) => ({
      name: a.filename,
      content: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : Buffer.from(String(a.content)).toString("base64"),
    }));
  }
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${body?.message || res.statusText}`);
  }
  return { messageId: body.messageId || `brevo-${Date.now()}`, accepted: [to], rejected: [], response: "brevo:accepted" };
}

async function sendViaBackup(
  to: string,
  subject: string,
  html: string,
  attachments?: MailAttachment[],
): Promise<SendMailResult> {
  if (backupProvider === "resend") return sendViaResend(to, subject, html, attachments);
  if (backupProvider === "brevo") return sendViaBrevo(to, subject, html, attachments);
  throw new Error("No backup mail provider configured");
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Send a raw HTML email — primary SMTP first, backup provider on failure.
 */
export async function sendMail(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: MailAttachment[],
): Promise<SendMailResult> {
  let primaryError: unknown = null;

  if (transporter) {
    const mailOptions: SendMailOptions = {
      from: `${process.env.FROM_NAME || "Nordea Remittance"} <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      ...(attachments && attachments.length > 0
        ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              contentType: a.contentType || "application/pdf",
            })),
          }
        : {}),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to} | Subject: ${subject} | MessageID: ${info.messageId}`);
      return {
        messageId: info.messageId,
        accepted: info.accepted as string[],
        rejected: info.rejected as string[],
        response: info.response,
      };
    } catch (error) {
      primaryError = error;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Mailer] Primary SMTP failed for ${to}: ${errorMessage}`);
    }
  }

  if (!backupProvider) {
    throw primaryError ?? new Error("No mail provider available");
  }

  try {
    const result = await sendViaBackup(to, subject, htmlContent, attachments);
    console.log(`[Mailer] Email sent via backup "${backupProvider}" to ${to} | Subject: ${subject} | MessageID: ${result.messageId}`);
    return result;
  } catch (backupError) {
    const backupMessage = backupError instanceof Error ? backupError.message : "Unknown error";
    console.error(`[Mailer] Backup provider "${backupProvider}" failed for ${to}: ${backupMessage}`);
    // Surface the failure so BullMQ retry / outbox semantics still apply
    throw backupError;
  }
}

/**
 * Render template data into base.html and send (with optional attachments)
 */
export async function sendTemplatedMail(
  to: string,
  templateData: EmailTemplateData,
  attachments?: MailAttachment[],
): Promise<SendMailResult> {
  const html = render(templateData);
  const subject = templateData.EMAIL_TITLE || "Notification from Nordea Remittance";
  return sendMail(to, subject, html, attachments);
}
