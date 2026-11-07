import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "areej_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }

  return secret;
}

export function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = `areej-admin-session:${expiresAt}`;

  const signature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  return `${expiresAt}.${signature}`;
}

export function isAdminAuthenticated(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token) return false;

  const [expiresAtText, receivedSignature] = token.split(".");
  const expiresAt = Number(expiresAtText);

  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000) ||
    !receivedSignature
  ) {
    return false;
  }

  const payload = `areej-admin-session:${expiresAt}`;

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");

  const received = Buffer.from(receivedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}