import { prisma } from "./prisma";
import { sendReminderEmail, ensureSiteUrl } from "./mailer";
import { expirationDays } from "./config";
import { generateToken, hashToken } from "./token";

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function runExpireJob() {
  const now = new Date();
  const result = await prisma.listing.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: now }
    },
    data: {
      status: "expired"
    }
  });
  return result.count;
}

export async function runReminderJob() {
  const now = new Date();
  const dayStart = startOfDay(now);
  const oneDayStart = addDays(dayStart, 1);
  const oneDayEnd = addDays(dayStart, 2);
  const sevenDayStart = addDays(dayStart, 7);
  const sevenDayEnd = addDays(dayStart, 8);

  const candidates = await prisma.listing.findMany({
    where: {
      status: "active",
      moderationStatus: "approved",
      expiresAt: {
        gt: now,
        lte: sevenDayEnd
      }
    }
  });

  const siteUrl = ensureSiteUrl();
  let sent = 0;

  for (const listing of candidates) {
    const expiresAt = listing.expiresAt;
    let stage: "seven_day" | "one_day" | null = null;

    if (expiresAt >= oneDayStart && expiresAt < oneDayEnd) {
      stage = "one_day";
    } else if (expiresAt >= sevenDayStart && expiresAt < sevenDayEnd) {
      stage = "seven_day";
    }

    if (!stage || listing.lastReminderStage === stage) {
      continue;
    }

    const token = generateToken();
    const tokenHash = hashToken(token);

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        manageTokenHash: tokenHash
      }
    });

    const renewUrl = `${siteUrl}/manage/${token}/renew`;

    await sendReminderEmail({
      to: listing.posterEmail,
      expiresAt,
      renewUrl
    });

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        lastReminderStage: stage,
        lastReminderSentAt: now
      }
    });

    sent += 1;
  }

  return sent;
}

export function getExpirationDate(from = new Date()) {
  return addDays(from, expirationDays);
}
