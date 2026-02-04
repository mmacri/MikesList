import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function enforceRateLimit(key: string, limit: number, windowMs = DAY_MS) {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing) {
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        windowStart: now
      }
    });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now.getTime() + windowMs) };
  }

  const elapsed = now.getTime() - existing.windowStart.getTime();
  if (elapsed > windowMs) {
    await prisma.rateLimit.update({
      where: { key },
      data: {
        count: 1,
        windowStart: now
      }
    });
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now.getTime() + windowMs) };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(existing.windowStart.getTime() + windowMs) };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: {
      count: existing.count + 1
    }
  });

  return {
    allowed: true,
    remaining: limit - (existing.count + 1),
    resetAt: new Date(existing.windowStart.getTime() + windowMs)
  };
}
