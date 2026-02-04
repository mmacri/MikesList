import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const session = requireAdminFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const formData = await request.formData();
  const listingId = formData.get("listing_id");
  const action = formData.get("action");

  if (typeof listingId !== "string" || typeof action !== "string") {
    return NextResponse.redirect(new URL("/admin/listings", request.url));
  }

  const now = new Date();

  if (action === "approve") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { moderationStatus: "approved" }
    });
  }

  if (action === "reject") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { moderationStatus: "rejected" }
    });
  }

  if (action === "remove") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "removed" }
    });
  }

  if (action === "toggle_featured") {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (listing) {
      const isActiveFeatured = listing.isFeatured && listing.featuredUntil && listing.featuredUntil > now;
      if (isActiveFeatured) {
        await prisma.listing.update({
          where: { id: listingId },
          data: { isFeatured: false, featuredUntil: null }
        });
      } else {
        await prisma.listing.update({
          where: { id: listingId },
          data: {
            isFeatured: true,
            featuredUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
  }

  if (action === "bump") {
    await prisma.listing.update({
      where: { id: listingId },
      data: { lastBumpedAt: now }
    });
  }

  const referer = request.headers.get("referer") || "/admin/listings";
  return NextResponse.redirect(new URL(referer, request.url));
}
