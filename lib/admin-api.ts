import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, verifyAdminSessionToken } from "./admin-session";

export function requireAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(adminCookieName)?.value;
  const session = verifyAdminSessionToken(token);
  if (!session) {
    return null;
  }
  return session;
}

export function requireAdminOrRedirect(request: NextRequest) {
  const session = requireAdminFromRequest(request);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return null;
}
