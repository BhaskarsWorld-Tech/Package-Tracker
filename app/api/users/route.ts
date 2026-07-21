import { NextRequest } from "next/server";
import { listRows } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireAdmin(req);
    const users = await listRows("Users");
    // Never send password hash/salt to the client.
    return users.map(({ id, email, role, createdAt }) => ({
      id,
      email,
      role,
      createdAt,
    }));
  });
}
