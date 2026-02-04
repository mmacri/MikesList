import Link from "next/link";
import { noStore } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  noStore();
  requireAdmin();

  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const moderationStatus =
    typeof searchParams.moderation_status === "string" ? searchParams.moderation_status : "";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const where: any = {};
  if (status) where.status = status;
  if (moderationStatus) where.moderationStatus = moderationStatus;
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100
  });

  return (
    <div>
      <h1>Listings</h1>
      <form method="get" className="form-row">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={status}>
          <option value="">Any</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="removed">Removed</option>
        </select>
        <label htmlFor="moderation_status">Moderation</label>
        <select id="moderation_status" name="moderation_status" defaultValue={moderationStatus}>
          <option value="">Any</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <label htmlFor="q">Search</label>
        <input id="q" name="q" type="text" defaultValue={q} />
        <button type="submit">Filter</button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Listing</th>
            <th>Status</th>
            <th>Moderation</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr key={listing.id}>
              <td>
                <Link href={`/listing/${listing.id}/${listing.slug}`}>{listing.title}</Link>
                <div className="small">{listing.locationLabel}</div>
              </td>
              <td>{listing.status}</td>
              <td>{listing.moderationStatus}</td>
              <td>{formatDate(listing.updatedAt)}</td>
              <td className="admin-actions">
                <form method="post" action="/admin/listings/action">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button type="submit">Approve</button>
                </form>
                <form method="post" action="/admin/listings/action">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button type="submit">Reject</button>
                </form>
                <form method="post" action="/admin/listings/action">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="action" value="remove" />
                  <button type="submit">Remove</button>
                </form>
                <form method="post" action="/admin/listings/action">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="action" value="toggle_featured" />
                  <button type="submit">Toggle featured</button>
                </form>
                <form method="post" action="/admin/listings/action">
                  <input type="hidden" name="listing_id" value={listing.id} />
                  <input type="hidden" name="action" value="bump" />
                  <button type="submit">Bump</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
