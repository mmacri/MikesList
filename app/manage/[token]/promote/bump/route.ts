import { NextRequest, NextResponse } from "next/server";
import { getListingByToken } from "@/lib/listings";
import { getStripe } from "@/lib/stripe";
import { monetizationEnabled, stripePriceIds, siteUrl } from "@/lib/config";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  if (!monetizationEnabled) {
    return NextResponse.redirect(new URL(`/manage/${params.token}`, request.url));
  }

  const listing = await getListingByToken(params.token);
  if (!listing) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=not_found`, request.url));
  }

  const priceId = stripePriceIds.bumpOnce;
  if (!priceId || !siteUrl) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=payment`, request.url));
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=payment`, request.url));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/manage/${params.token}?promoted=1`,
    cancel_url: `${siteUrl}/manage/${params.token}`,
    metadata: {
      listingId: listing.id,
      action: "bump"
    }
  });

  return NextResponse.redirect(session.url || `${siteUrl}/manage/${params.token}`);
}
