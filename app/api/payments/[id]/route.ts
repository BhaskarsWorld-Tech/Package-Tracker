import { NextRequest } from "next/server";
import { updateRow, deleteRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireSession(req);
    const { id } = await params;
    const body = await req.json();
    await updateRow("Payments", id, body);
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
    await deleteRow("Payments", id);
    return { ok: true };
  });
}
