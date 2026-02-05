import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  unstable_noStore();
  requireAdmin();

  const [activeCount, pendingCount, reportCount] = await Promise.all([
    prisma.listing.count({ where: { status: "active" } }),
    prisma.listing.count({ where: { moderationStatus: "pending" } }),
    prisma.report.count({ where: { status: "open" } })
  ]);

  return (
    <div>
      <h1>Admin</h1>
      <p className="small">Active listings: {activeCount}</p>
      <p className="small">Pending moderation: {pendingCount}</p>
      <p className="small">Open reports: {reportCount}</p>
      <p>
        <Link href="/admin/listings">Manage listings</Link>
      </p>
      <p>
        <Link href="/admin/reports">View reports</Link>
      </p>
    </div>
  );
}
