import { NextRequest, NextResponse } from "next/server";
import { getListingByToken } from "@/lib/listings";
import { listingEditSchema } from "@/lib/validators";
import { getFormValue, getOptionalFormValue, getNumberFromForm, getTagsFromForm } from "@/lib/forms";
import { buildLocation } from "@/lib/location";
import { evaluateListingForSpam } from "@/lib/spam";
import { autoApprove, getCategoryBySlug, slugify } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const formData = await request.formData();
  const honeypot = formData.get("website");
  const baseUrl = `/manage/${params.token}/edit`;

  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?updated=1`, request.url));
  }

  const listing = await getListingByToken(params.token);
  if (!listing) {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=not_found`, request.url));
  }

  if (listing.status === "removed") {
    return NextResponse.redirect(new URL(`/manage/${params.token}?error=removed`, request.url));
  }

  const title = getFormValue(formData, "title");
  const categorySlug = getFormValue(formData, "category");
  const locationType = getFormValue(formData, "location_type") as "city" | "remote";
  const city = getOptionalFormValue(formData, "city");
  const state = getOptionalFormValue(formData, "state");
  const tags = getTagsFromForm(formData);
  const priceAmount = getNumberFromForm(formData, "price_amount");
  const priceUnit = getOptionalFormValue(formData, "price_unit");
  const description = getFormValue(formData, "description");

  const parsed = listingEditSchema.safeParse({
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
    return NextResponse.redirect(new URL(`${baseUrl}?error=invalid`, request.url));
  }

  const moderationStatus = autoApprove && !spamCheck.suspicious ? "approved" : "pending";
  const location = buildLocation({
    locationType: parsed.data.locationType,
    city: parsed.data.city,
    state: parsed.data.state
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      title: parsed.data.title,
      slug: slugify(parsed.data.title) || listing.slug,
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
      moderationStatus
    }
  });

  return NextResponse.redirect(new URL(`/manage/${params.token}?updated=1`, request.url));
}
