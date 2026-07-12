import { NextRequest, NextResponse } from "next/server";
import { listRows } from "@/lib/sheets";
import {
  verifyPassword,
  createSessionToken,
  resolveRole,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const users = await listRows("Users");
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Role is recomputed from ADMIN_EMAIL on every login, not trusted from
    // the stored row — so the designated admin stays admin even if their
    // account was created before ADMIN_EMAIL existed, and nobody can grant
    // themselves admin by editing the Sheet's role column directly.
    const role = resolveRole(normalizedEmail);
    const token = await createSessionToken(user.id, normalizedEmail, role);
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
