import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { listRows, appendRow } from "@/lib/sheets";
import {
  hashPassword,
  createSessionToken,
  resolveRole,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || String(password).length < 8) {
      return NextResponse.json(
        { error: "Email and a password of at least 8 characters are required." },
        { status: 400 }
      );
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const users = await listRows("Users");
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const { hash, salt } = await hashPassword(password);
    const id = randomUUID();
    // Role is derived from ADMIN_EMAIL, never taken from client input — a
    // signup can never grant itself admin.
    const role = resolveRole(normalizedEmail);
    // Mint the session token before writing anything — if SESSION_SECRET is
    // misconfigured this throws here instead of leaving an orphaned user
    // row with no way to complete signup.
    const token = await createSessionToken(id, normalizedEmail, role);

    await appendRow("Users", {
      id,
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      role,
      createdAt: new Date().toISOString(),
    });

    const res = NextResponse.json({ ok: true, email: normalizedEmail, role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
