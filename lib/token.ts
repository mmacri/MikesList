import crypto from "crypto";

const TOKEN_BYTES = 32;

export function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashToken(token: string) {
  const secret = process.env.TOKEN_SALT_SECRET;
  if (!secret) {
    throw new Error("TOKEN_SALT_SECRET is not set");
  }
  return crypto.createHash("sha256").update(token + secret).digest("hex");
}
