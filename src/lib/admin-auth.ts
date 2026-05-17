import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "lsr_staff_session";
const SESSION_TTL_SECONDS = 60 * 60 * 10;

type StaffSessionPayload = {
  role: "staff" | "admin";
  iat: number;
  exp: number;
  nonce: string;
};

function sessionSecret() {
  return process.env.STAFF_SESSION_SECRET || process.env.ADMIN_PASSWORD || "development-only-lsr-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function encodePayload(payload: StaffSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string): StaffSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (parsed?.role !== "staff" && parsed?.role !== "admin") return null;
    if (!Number.isFinite(parsed.exp) || !Number.isFinite(parsed.iat) || typeof parsed.nonce !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createStaffSessionToken(role: "staff" | "admin" = "staff") {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ role, iat: now, exp: now + SESSION_TTL_SECONDS, nonce: randomBytes(16).toString("base64url") });
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffSessionToken(token?: string | null) {
  if (!token || !token.includes(".")) return false;
  const [payload, signature] = token.split(".", 2);
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  const decoded = decodePayload(payload);
  return Boolean(decoded && decoded.exp > Math.floor(Date.now() / 1000));
}

function cookieFromHeader(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
}

export function isAdminAuthorized(request: Request) {
  if (verifyStaffSessionToken(cookieFromHeader(request))) return true;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${adminPassword}`;
}

export async function hasStaffSession() {
  const store = await cookies();
  return verifyStaffSessionToken(store.get(COOKIE_NAME)?.value);
}

export async function setStaffSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, createStaffSessionToken("staff"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearStaffSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function validateStaffPassword(password: unknown) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (typeof password !== "string" || !adminPassword) return false;
  return safeEqual(password, adminPassword);
}

export function adminError(error: string, message: string, status = 400) {
  return { body: { ok: false, error, message }, status };
}
