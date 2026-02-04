import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { noStore } from "next/cache";
import { getListingById, parseTags } from "@/lib/listings";
import { formatDate, formatPrice } from "@/lib/format";
import { getListingUrl } from "@/lib/urls";
import { siteName } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { id: string; slug: string };
}) {
  const listing = await getListingById(params.id);
  if (!listing) {
    return { title: `Listing not found - ${siteName}` };
  }
  return {
    title: `${listing.title} - ${siteName}`,
    alternates: {
      canonical: getListingUrl(listing.id, listing.slug)
    }
  };
}

export default async function ListingPage({
  params
}: {
  params: { id: string; slug: string };
}) {
  noStore();
  const listing = await getListingById(params.id);
  if (!listing) {
    notFound();
  }

  if (listing.slug !== params.slug) {
    redirect(`/listing/${listing.id}/${listing.slug}`);
  }

  const now = new Date();
  const expired = listing.expiresAt < now || listing.status !== "active";
  const unapproved = listing.moderationStatus !== "approved";
  const tags = parseTags(listing.tags);
  const price = formatPrice(listing.priceAmount, listing.priceUnit);

  return (
    <div>
      {(expired || unapproved) && (
        <div className="banner">
          This listing is not currently available for replies.
        </div>
      )}
      <section>
        <h1>{listing.title}</h1>
        <p className="small">
          {listing.category} | {listing.locationLabel}
        </p>
        {tags.length > 0 ? (
          <p className="small">Tags: {tags.join(", ")}</p>
        ) : null}
        {price ? <p className="small">Price: {price}</p> : null}
      </section>

      <section>
        <div className="listing-description">{listing.description}</div>
      </section>

      <section>
        <p className="small">Posted: {formatDate(listing.createdAt)}</p>
        <p className="small">Updated: {formatDate(listing.updatedAt)}</p>
        <p className="small">Expires: {formatDate(listing.expiresAt)}</p>
      </section>

      <section className="inline-actions">
        {expired || unapproved ? (
          <span className="small">reply to this listing (unavailable)</span>
        ) : (
          <Link href={`/listing/${listing.id}/${listing.slug}/reply`}>
            reply to this listing
          </Link>
        )}
        <Link href={`/listing/${listing.id}/${listing.slug}/report`}>report abuse</Link>
      </section>
    </div>
  );
}
