import nodemailer from "nodemailer";
import { siteName, siteUrl } from "./config";
import { formatDate } from "./format";

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration is incomplete");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
}

function getFromAddress() {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("SMTP_FROM is not set");
  }
  return from;
}

export async function sendManageEmail(input: {
  to: string;
  manageUrl: string;
  editUrl: string;
  renewUrl: string;
  deleteUrl: string;
  expiresAt: Date;
}) {
  const transporter = getTransporter();
  const from = getFromAddress();
  const subject = `Manage your ${siteName} listing`;
  const body = [
    `Manage your listing: ${input.manageUrl}`,
    `Edit: ${input.editUrl}`,
    `Renew: ${input.renewUrl}`,
    `Delete: ${input.deleteUrl}`,
    "",
    `Expires on ${formatDate(input.expiresAt)}.`
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text: body
  });
}

export async function sendReplyEmail(input: {
  to: string;
  responderEmail: string;
  message: string;
  listingUrl: string;
}) {
  const transporter = getTransporter();
  const from = getFromAddress();
  const subject = `New reply to your ${siteName} listing`;
  const body = [
    `Responder: ${input.responderEmail}`,
    "",
    input.message,
    "",
    `Listing: ${input.listingUrl}`
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text: body,
    replyTo: input.responderEmail
  });
}

export async function sendReminderEmail(input: {
  to: string;
  expiresAt: Date;
  renewUrl: string;
}) {
  const transporter = getTransporter();
  const from = getFromAddress();
  const subject = `Your ${siteName} listing expires soon`;
  const body = [
    `Your listing expires on ${formatDate(input.expiresAt)}.`,
    `Renew here: ${input.renewUrl}`,
    "",
    `Thanks for using ${siteName}.`
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.to,
    subject,
    text: body
  });
}

export function ensureSiteUrl() {
  if (!siteUrl) {
    throw new Error("SITE_URL is not set");
  }
  return siteUrl.replace(/\/$/, "");
}
