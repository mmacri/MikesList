import { slugify } from "./config";

export function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeState(value: string) {
  return value.trim().toUpperCase();
}

export function buildLocation(input: {
  locationType: "city" | "remote";
  city?: string | null;
  state?: string | null;
}) {
  if (input.locationType === "remote") {
    return {
      locationLabel: "Remote/Online",
      locationSlug: "remote",
      city: null,
      state: null
    };
  }

  const city = input.city ? toTitleCase(input.city) : "";
  const state = input.state ? normalizeState(input.state) : "";
  const locationLabel = `${city}, ${state}`;

  return {
    locationLabel,
    locationSlug: slugify(`${city}-${state}`),
    city,
    state
  };
}

export function locationLabelFromSlug(slug: string) {
  if (slug === "remote") {
    return "Remote/Online";
  }
  const parsed = parseLocationSlug(slug);
  if (!parsed) {
    return slug;
  }
  return `${toTitleCase(parsed.city)}${parsed.state ? `, ${parsed.state}` : ""}`;
}

export function parseLocationSlug(slug: string) {
  if (slug === "remote") {
    return null;
  }
  const parts = slug.split("-");
  if (parts.length < 2) {
    return null;
  }
  const state = parts[parts.length - 1]?.toUpperCase();
  const city = parts.slice(0, -1).join(" ");
  return { city, state };
}
