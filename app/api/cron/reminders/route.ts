import { NextRequest, NextResponse } from "next/server";
import { runReminderJob } from "@/lib/cron";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await runReminderJob();
  return NextResponse.json({ reminders: sent });
}
