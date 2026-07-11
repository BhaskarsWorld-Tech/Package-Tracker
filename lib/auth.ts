// Password hashing (PBKDF2) and session token signing (HMAC), both via Web
// Crypto — runs identically under Node.js and the Cloudflare Workers runtime,
// same approach as the Google service-account JWT signing in lib/google-auth.ts.

import { AuthError } from "@/lib/api";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function base64url(bytes: ArrayBuffer | Uint8Array) {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    value.length + ((4 - (value.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export async function hashPassword(password: string, saltInput?: Uint8Array) {
  const salt = saltInput ?? randomBytes(16);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return { hash: base64url(bits), salt: base64url(salt) };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string
) {
  const { hash: computed } = await hashPassword(password, base64urlToBytes(salt));
  // Constant-time-ish comparison to avoid trivial timing leaks.
  if (computed.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");
  return secret;
}

async function hmacKey() {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export type SessionPayload = { sub: string; email: string; exp: number };

export async function createSessionToken(userId: string, email: string) {
  const payload: SessionPayload = {
    sub: userId,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoder = new TextEncoder();
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  return `${payloadB64}.${base64url(signature)}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await hmacKey();
    const encoder = new TextEncoder();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigB64),
      encoder.encode(payloadB64)
    );
    if (!valid) return null;
    const payload: SessionPayload = JSON.parse(
      new TextDecoder().decode(base64urlToBytes(payloadB64))
    );
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "session";
export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;

// For use in Route Handlers: reads the session cookie off the request and
// throws AuthError (which lib/api.ts's withErrorHandling turns into a 401)
// if it's missing or invalid. There's no Next.js Proxy/Middleware gating
// requests before they reach these routes (OpenNext Cloudflare doesn't yet
// support Next.js 16's Node.js-runtime Proxy), so each route checks itself.
export async function requireSession(req: {
  cookies: { get(name: string): { value: string } | undefined };
}) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) throw new AuthError("Not authenticated");
  return session;
}
