import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategoryBySlug, autoApprove } from "@/lib/config";
import { listingCreateSchema } from "@/lib/validators";
import { getFormValue, getOptionalFormValue, getNumberFromForm, getTagsFromForm } from "@/lib/forms";
import { buildLocation } from "@/lib/location";
import { generateToken, hashToken } from "@/lib/token";
import { evaluateListingForSpam } from "@/lib/spam";
import { enforceRateLimit } from "@/lib/rate-limit";
import { postingLimits, slugify } from "@/lib/config";
import { getIpFromHeaders, hashIp } from "@/lib/ip";
import { sendManageEmail, ensureSiteUrl } from "@/lib/mailer";
import { getExpirationDate } from "@/lib/cron";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const honeypot = formData.get("website");
  const baseUrl = "/post";

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.redirect(new URL(`${baseUrl}?success=1`, request.url));
  }

  const ip = getIpFromHeaders(request.headers);
  const ipHash = hashIp(ip);
  const rateKey = `post:${ipHash}`;
  const rate = await enforceRateLimit(rateKey, postingLimits.postPerDay);
  if (!rate.allowed) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=rate_limit`, request.url));
  }

  const posterEmail = getFormValue(formData, "poster_email");
  const title = getFormValue(formData, "title");
  const categorySlug = getFormValue(formData, "category");
  const locationType = getFormValue(formData, "location_type") as "city" | "remote";
  const city = getOptionalFormValue(formData, "city");
  const state = getOptionalFormValue(formData, "state");
  const tags = getTagsFromForm(formData);
  const priceAmount = getNumberFromForm(formData, "price_amount");
  const priceUnit = getOptionalFormValue(formData, "price_unit");
  const description = getFormValue(formData, "description");

  const parsed = listingCreateSchema.safeParse({
    posterEmail,
    title,
    categorySlug,
    locationType,
    city: city ?? undefined,
    state: state ?? undefined,
    tags,
    priceAmount: priceAmount ?? undefined,
    priceUnit: priceUnit ?? undefined,
    description
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=invalid`, request.url));
  }

  const category = getCategoryBySlug(parsed.data.categorySlug);
  if (!category) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=invalid`, request.url));
  }

  const spamCheck = evaluateListingForSpam({
    title: parsed.data.title,
    description: parsed.data.description
  });

  if (spamCheck.tooManyLinks) {
    return NextResponse.redirect(new URL(`${baseUrl}?error=links`, request.url));
  }

  const suspicious = spamCheck.suspicious;
  const moderationStatus = autoApprove && !suspicious ? "approved" : "pending";

  const location = buildLocation({
    locationType: parsed.data.locationType,
    city: parsed.data.city,
    state: parsed.data.state
  });

  const token = generateToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = getExpirationDate(now);
  const slug = slugify(parsed.data.title) || "listing";

  const listing = await prisma.listing.create({
    data: {
      title: parsed.data.title,
      slug,
      category,
      categorySlug: parsed.data.categorySlug,
      locationType: parsed.data.locationType,
      city: location.city,
      state: location.state,
      locationLabel: location.locationLabel,
      locationSlug: location.locationSlug,
      tags: parsed.data.tags,
      priceAmount: parsed.data.priceAmount ?? null,
      priceUnit: parsed.data.priceUnit ?? null,
      description: parsed.data.description,
      posterEmail: parsed.data.posterEmail,
      manageTokenHash: tokenHash,
      status: "active",
      moderationStatus,
      expiresAt,
      lastBumpedAt: now
    }
  });

  const siteUrl = ensureSiteUrl();
  await sendManageEmail({
    to: listing.posterEmail,
    manageUrl: `${siteUrl}/manage/${token}`,
    editUrl: `${siteUrl}/manage/${token}/edit`,
    renewUrl: `${siteUrl}/manage/${token}/renew`,
    deleteUrl: `${siteUrl}/manage/${token}/delete`,
    expiresAt
  });

  const redirectUrl = moderationStatus === "approved" ? `${baseUrl}?success=1` : `${baseUrl}?pending=1`;
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
