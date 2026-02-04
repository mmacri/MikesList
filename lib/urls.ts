import { siteUrl } from "./config";

export function getListingUrl(id: string, slug: string) {
  if (!siteUrl) {
    return `/listing/${id}/${slug}`;
  }
  return `${siteUrl.replace(/\/$/, "")}/listing/${id}/${slug}`;
}
