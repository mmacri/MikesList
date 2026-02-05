import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { getListingByToken, parseTags } from "@/lib/listings";
import { formatDate, formatPrice, maskEmail } from "@/lib/format";
import { monetizationEnabled } from "@/lib/config";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  removed: "Removed"
};

const moderationLabels: Record<string, string> = {
  approved: "Approved",
  pending: "Pending review",
  rejected: "Rejected"
};

export default async function ManagePage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  unstable_noStore();
  const listing = await getListingByToken(params.token);
  const renewed = searchParams.renewed === "1";
  const deleted = searchParams.deleted === "1";
  const updated = searchParams.updated === "1";
  const promoted = searchParams.promoted === "1";

  if (!listing) {
    return (
      <div>
        <h1>Manage listing</h1>
        <div className="banner">This manage link is invalid or expired.</div>
      </div>
    );
  }

  const tags = parseTags(listing.tags);
  const price = formatPrice(listing.priceAmount, listing.priceUnit);

  return (
    <div>
      <section>
        <h1>Manage listing</h1>
        <p className="small">Email on file: {maskEmail(listing.posterEmail)}</p>
      </section>

      {renewed ? <div className="banner">Listing renewed.</div> : null}
      {deleted ? <div className="banner">Listing removed.</div> : null}
      {updated ? <div className="banner">Listing updated.</div> : null}
      {promoted ? <div className="banner">Promotion applied.</div> : null}

      <section>
        <h2>{listing.title}</h2>
        <p className="small">
          Status: {statusLabels[listing.status]} | Moderation: {moderationLabels[listing.moderationStatus]}
        </p>
        <p className="small">Expires: {formatDate(listing.expiresAt)}</p>
        <p className="small">Location: {listing.locationLabel}</p>
        <p className="small">Category: {listing.category}</p>
        {tags.length > 0 ? <p className="small">Tags: {tags.join(", ")}</p> : null}
        {price ? <p className="small">Price: {price}</p> : null}
      </section>

      <section className="inline-actions">
        <Link href={`/manage/${params.token}/edit`}>Edit</Link>
        <form method="post" action={`/manage/${params.token}/renew`}>
          <button type="submit">Renew</button>
        </form>
        <form method="post" action={`/manage/${params.token}/delete`}>
          <button type="submit">Delete</button>
        </form>
      </section>

      {monetizationEnabled ? (
        <section>
          <h2>Promote</h2>
          <form method="post" action={`/manage/${params.token}/promote/feature`}>
            <button type="submit">Feature my listing (30 days)</button>
          </form>
          <form method="post" action={`/manage/${params.token}/promote/bump`}>
            <button type="submit">Bump my listing</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
