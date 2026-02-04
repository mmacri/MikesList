import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminFromRequest } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const session = requireAdminFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const formData = await request.formData();
  const reportId = formData.get("report_id");
  const action = formData.get("action");

  if (typeof reportId !== "string" || typeof action !== "string") {
    return NextResponse.redirect(new URL("/admin/reports", request.url));
  }

  if (action === "reviewed") {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "reviewed" }
    });
  }

  if (action === "dismiss") {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "dismissed" }
    });
  }

  if (action === "remove_listing") {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (report) {
      await prisma.listing.update({
        where: { id: report.listingId },
        data: { status: "removed" }
      });
      await prisma.report.update({
        where: { id: reportId },
        data: { status: "reviewed" }
      });
    }
  }

  const referer = request.headers.get("referer") || "/admin/reports";
  return NextResponse.redirect(new URL(referer, request.url));
}
