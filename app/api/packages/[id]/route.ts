import { NextRequest } from "next/server";
import { updateRow, deleteRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireSession(req);
    const { id } = await params;
    const body = await req.json();
    await updateRow("Packages", id, body);
    return { ok: true };
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireSession(req);
    const { id } = await params;
    await deleteRow("Packages", id);
    return { ok: true };
  });
}
