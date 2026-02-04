import { NextRequest, NextResponse } from "next/server";
import { getListingByToken } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const listing = await getListingByToken(params.token);
  if (!listing) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=not_found`, request.url));
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      status: "removed"
    }
  });

  return NextResponse.redirect(new URL(`/manage/${params.token}?deleted=1`, request.url));
}
