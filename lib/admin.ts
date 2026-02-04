import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieName, verifyAdminSessionToken } from "./admin-session";

export function getAdminSession() {
  const token = cookies().get(adminCookieName)?.value;
  return verifyAdminSessionToken(token);
}

export function requireAdmin() {
  const session = getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
