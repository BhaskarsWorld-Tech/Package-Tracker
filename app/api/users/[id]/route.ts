import { NextRequest } from "next/server";
import { updateRow, deleteRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireAdmin, hashPassword } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const { password } = await req.json();
    if (!password || String(password).length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const { hash, salt } = await hashPassword(password);
    await updateRow("Users", id, { passwordHash: hash, passwordSalt: salt });
    return { ok: true };
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireAdmin(req);
    const { id } = await params;
    await deleteRow("Users", id);
    return { ok: true };
  });
}
