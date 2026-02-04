import crypto from "crypto";

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.TOKEN_SALT_SECRET;
  if (!secret) {
    throw new Error("TOKEN_SALT_SECRET is not set");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function createAdminSessionToken() {
  const payload = {
    exp: Date.now() + SESSION_TTL_MS
  };
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(base);
  return `${base}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }
  const [base, signature] = token.split(".");
  if (!base || !signature) {
    return null;
  }
  const expected = sign(base);
  if (signature.length !== expected.length) {
    return null;
  }
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as {
      exp: number;
    };
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const adminCookieName = "ml_admin";
