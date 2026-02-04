import { NextRequest, NextResponse } from "next/server";
import { getListingByToken } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getExpirationDate } from "@/lib/cron";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const listing = await getListingByToken(params.token);
  if (!listing) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=not_found`, request.url));
  }

  const now = new Date();
  const expiresAt = getExpirationDate(now);

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      expiresAt,
      status: "active",
      lastRenewedAt: now
    }
  });

  return NextResponse.redirect(new URL(`/manage/${params.token}?renewed=1`, request.url));
}
