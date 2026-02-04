import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { monetizationEnabled } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!monetizationEnabled) {
    return NextResponse.json({ error: "Not enabled" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: Record<string, string> };
    const listingId = session.metadata?.listingId;
    const action = session.metadata?.action;

    if (listingId && action) {
      if (action === "feature") {
        const now = new Date();
        const featuredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await prisma.listing.update({
          where: { id: listingId },
          data: {
            isFeatured: true,
            featuredUntil
          }
        });
      }

      if (action === "bump") {
        await prisma.listing.update({
          where: { id: listingId },
          data: {
            lastBumpedAt: new Date()
          }
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
