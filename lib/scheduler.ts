import cron from "node-cron";
import { runExpireJob, runReminderJob } from "./cron";

const globalForScheduler = global as unknown as { schedulerStarted?: boolean };

export function initScheduler() {
  if (globalForScheduler.schedulerStarted) {
    return;
  }

  if (process.env.NODE_ENV === "test") {
    return;
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  cron.schedule("15 3 * * *", async () => {
    await runExpireJob();
  });

  cron.schedule("30 3 * * *", async () => {
    await runReminderJob();
  });

  globalForScheduler.schedulerStarted = true;
}
