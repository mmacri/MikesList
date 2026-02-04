import { NextRequest, NextResponse } from "next/server";
import { runExpireJob } from "@/lib/cron";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await runExpireJob();
  return NextResponse.json({ expired: count });
}
