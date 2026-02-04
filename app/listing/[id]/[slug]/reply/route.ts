import { NextRequest, NextResponse } from "next/server";
import { getListingById } from "@/lib/listings";
import { replySchema } from "@/lib/validators";
import { getIpFromHeaders, hashIp } from "@/lib/ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { postingLimits } from "@/lib/config";
import { sendReplyEmail, ensureSiteUrl } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string; slug: string } }) {
  const formData = await request.formData();
  const honeypot = formData.get("website");
  const baseUrl = `/listing/${params.id}/${params.slug}/reply`;

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.redirect(new URL(`${baseUrl}?sent=1`, request.url));
  }

  const listing = await getListingById(params.id);
  if (!listing) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=not_found`, request.url));
  }

  const now = new Date();
  if (listing.expiresAt < now || listing.status !== "active" || listing.moderationStatus !== "approved") {
    return NextResponse.redirect(new URL(`${baseUrl}?error=closed`, request.url));
  }

  const ip = getIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);
  const rateKey = `reply:${ipHash}`;
  const rate = await enforceRateLimit(rateKey, postingLimits.replyPerDay);
  if (!rate.allowed) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=rate_limit`, request.url));
  }

  const parsed = replySchema.safeParse({
    yourEmail: formData.get("your_email"),
    message: formData.get("message")
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=invalid`, request.url));
  }

  const siteUrl = ensureSiteUrl();
  await sendReplyEmail({
    to: listing.posterEmail,
    responderEmail: parsed.data.yourEmail,
    message: parsed.data.message,
    listingUrl: `${siteUrl}/listing/${listing.id}/${listing.slug}`
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      replyCount: { increment: 1 }
    }
  });

  return NextResponse.redirect(new URL(`${baseUrl}?sent=1`, request.url));
}
