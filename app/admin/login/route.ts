import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminPasswordHash } from "@/lib/config";
import { adminCookieName, createAdminSessionToken } from "@/lib/admin-session";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password");
  const parsed = adminLoginSchema.safeParse({ password });

  if (!parsed.success || !adminPasswordHash) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }

  const match = await bcrypt.compare(parsed.data.password, adminPasswordHash);
  if (!match) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }

  const token = createAdminSessionToken();
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set({
    name: adminCookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
