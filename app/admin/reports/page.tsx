import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  unstable_noStore();
  requireAdmin();

  const reports = await prisma.report.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { listing: true },
    take: 100
  });

  return (
    <div>
      <h1>Reports</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Listing</th>
            <th>Reason</th>
            <th>Details</th>
            <th>Reported</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>
                <Link href={`/listing/${report.listing.id}/${report.listing.slug}`}>
                  {report.listing.title}
                </Link>
              </td>
              <td>{report.reason}</td>
              <td>{report.details}</td>
              <td>{formatDate(report.createdAt)}</td>
              <td className="admin-actions">
                <form method="post" action="/admin/reports/action">
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="action" value="reviewed" />
                  <button type="submit">Mark reviewed</button>
                </form>
                <form method="post" action="/admin/reports/action">
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="action" value="dismiss" />
                  <button type="submit">Dismiss</button>
                </form>
                <form method="post" action="/admin/reports/action">
                  <input type="hidden" name="report_id" value={report.id} />
                  <input type="hidden" name="action" value="remove_listing" />
                  <button type="submit">Remove listing</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
