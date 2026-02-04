import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { hashToken } from "./token";

export type ListingSummary = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  locationLabel: string;
  locationSlug: string;
  locationType: "city" | "remote";
  priceAmount: number | null;
  priceUnit: string | null;
  updatedAt: Date;
  lastBumpedAt: Date;
  expiresAt: Date;
  isFeatured: boolean;
  featuredUntil: Date | null;
  tags: string[];
};

export function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string") as string[];
  }
  return [];
}

function isFeaturedActive(listing: ListingSummary, now: Date) {
  return Boolean(listing.isFeatured && listing.featuredUntil && listing.featuredUntil > now);
}

function sortListings(listings: ListingSummary[], sort: string | undefined, now: Date) {
  const sortNewest = (a: ListingSummary, b: ListingSummary) => {
    const bumped = b.lastBumpedAt.getTime() - a.lastBumpedAt.getTime();
    if (bumped !== 0) return bumped;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  };

  const sortExpiring = (a: ListingSummary, b: ListingSummary) => {
    const exp = a.expiresAt.getTime() - b.expiresAt.getTime();
    if (exp !== 0) return exp;
    return sortNewest(a, b);
  };

  const featured = listings.filter((listing) => isFeaturedActive(listing, now));
  const regular = listings.filter((listing) => !isFeaturedActive(listing, now));

  if (sort === "expiring") {
    featured.sort(sortExpiring);
    regular.sort(sortExpiring);
  } else {
    featured.sort(sortNewest);
    regular.sort(sortNewest);
  }

  return [...featured, ...regular];
}

export async function searchListings(filters: {
  categorySlug?: string;
  locationType?: "city" | "remote";
  locationSlug?: string;
  tags?: string[];
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const now = new Date();
  const where: Prisma.ListingWhereInput = {
    status: "active",
    moderationStatus: "approved",
    expiresAt: { gt: now }
  };

  if (filters.categorySlug) {
    where.categorySlug = filters.categorySlug;
  }

  if (filters.locationType) {
    where.locationType = filters.locationType;
    if (filters.locationType === "city" && filters.locationSlug) {
      where.locationSlug = filters.locationSlug;
    }
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { description: { contains: filters.q } }
    ];
  }

  const rawListings = await prisma.listing.findMany({ where });

  let listings = rawListings.map((listing) => ({
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    category: listing.category,
    categorySlug: listing.categorySlug,
    locationLabel: listing.locationLabel,
    locationSlug: listing.locationSlug,
    locationType: listing.locationType,
    priceAmount: listing.priceAmount,
    priceUnit: listing.priceUnit,
    updatedAt: listing.updatedAt,
    lastBumpedAt: listing.lastBumpedAt,
    expiresAt: listing.expiresAt,
    isFeatured: listing.isFeatured,
    featuredUntil: listing.featuredUntil,
    tags: parseTags(listing.tags)
  }));

  if (filters.tags && filters.tags.length > 0) {
    listings = listings.filter((listing) =>
      filters.tags!.every((tag) => listing.tags.includes(tag))
    );
  }

  const ordered = sortListings(listings, filters.sort, now);
  const pageSize = filters.pageSize ?? 20;
  const page = filters.page ?? 1;
  const total = ordered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    listings: ordered.slice(start, end),
    total,
    page,
    pageSize
  };
}

export async function getNewestListings(limit = 20) {
  const result = await searchListings({ page: 1, pageSize: limit });
  return result.listings;
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({ where: { id } });
}

export async function getListingByToken(token: string) {
  const tokenHash = hashToken(token);
  return prisma.listing.findFirst({ where: { manageTokenHash: tokenHash } });
}
