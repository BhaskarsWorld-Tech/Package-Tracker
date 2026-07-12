"use client";

import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setEmail(data?.email ?? null);
        setRole(data?.role ?? null);
      })
      .catch(() => {
        setEmail(null);
        setRole(null);
      });
  }, []);

  return { email, role, isAdmin: role === "admin" };
}
