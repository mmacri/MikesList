export const siteName = "Mike's List";

export const categories = [
  "Accounting & Tax",
  "Legal",
  "Compliance & Risk",
  "IT & Security",
  "Real Estate Services",
  "Health & Wellness",
  "Coaching & Career"
];

export const tags = [
  "Remote available",
  "In-person",
  "Urgent",
  "Ongoing",
  "One-time",
  "Free consult",
  "Fixed price",
  "Hourly"
];

export const expirationDays = 30;

export const postingLimits = {
  postPerDay: 3,
  replyPerDay: 10,
  reportPerDay: 10
};

export const maxLinksInDescription = 2;

export const spamKeywords = [
  "crypto",
  "bitcoin",
  "wire transfer",
  "cash app",
  "adult"
];

export const autoApprove = true;

export const monetizationEnabled = process.env.MONETIZATION_ENABLED === "true";

export const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";

export const siteUrl = process.env.SITE_URL || "";

export const stripePriceIds = {
  featured30Days: process.env.STRIPE_PRICE_FEATURED_30_DAYS || "",
  bumpOnce: process.env.STRIPE_PRICE_BUMP_ONCE || ""
};

export const categorySlugMap = new Map(
  categories.map((category) => [slugify(category), category])
);

export const tagSet = new Set(tags);

export function getCategoryBySlug(slug: string) {
  return categorySlugMap.get(slug) || null;
}

export function getAllCategorySlugs() {
  return categories.map((category) => slugify(category));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
