import { NextRequest, NextResponse } from "next/server";
import { getListingById } from "@/lib/listings";
import { reportSchema } from "@/lib/validators";
import { getIpFromHeaders, hashIp } from "@/lib/ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { postingLimits } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string; slug: string } }) {
  const formData = await request.formData();
  const honeypot = formData.get("website");
  const baseUrl = `/listing/${params.id}/${params.slug}/report`;

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.redirect(new URL(`${baseUrl}?sent=1`, request.url));
  }

  const listing = await getListingById(params.id);
  if (!listing) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=not_found`, request.url));
  }

  const ip = getIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);
  const rateKey = `report:${ipHash}`;
  const rate = await enforceRateLimit(rateKey, postingLimits.reportPerDay);
  if (!rate.allowed) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=rate_limit`, request.url));
  }

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details"),
    reporterEmail: formData.get("reporter_email")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=invalid`, request.url));
  }

  await prisma.report.create({
    data: {
      listingId: listing.id,
      reason: parsed.data.reason,
      details: parsed.data.details,
      reporterEmail: parsed.data.reporterEmail || null,
      ipHash
    }
  });

  return NextResponse.redirect(new URL(`${baseUrl}?sent=1`, request.url));
}
