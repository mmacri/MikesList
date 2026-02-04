import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import type { ListingSummary } from "@/lib/listings";

export function ListingList({ listings }: { listings: ListingSummary[] }) {
  if (listings.length === 0) {
    return <p>No listings found.</p>;
  }

  return (
    <ul className="listing-list">
      {listings.map((listing) => {
        const price = formatPrice(listing.priceAmount, listing.priceUnit);
        return (
          <li key={listing.id} className="listing-row">
            <Link href={`/listing/${listing.id}/${listing.slug}`} className="listing-link">
              {listing.title}
            </Link>
            {listing.isFeatured && listing.featuredUntil && listing.featuredUntil > new Date() ? (
              <span className="listing-featured">featured</span>
            ) : null}
            <span className="listing-meta">{listing.locationLabel}</span>
            <span className="listing-meta">{formatDate(listing.updatedAt)}</span>
            <span className="listing-meta">{listing.category}</span>
            {price ? <span className="listing-meta">{price}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
