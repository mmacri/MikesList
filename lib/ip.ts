import crypto from "crypto";

export function getIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "0.0.0.0";
}

export function hashIp(ip: string) {
  const secret = process.env.IP_HASH_SALT_SECRET;
  if (!secret) {
    throw new Error("IP_HASH_SALT_SECRET is not set");
  }
  return crypto.createHash("sha256").update(ip + secret).digest("hex");
}
