import { NextRequest } from "next/server";
import { updateRow, deleteRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const body = await req.json();
    await updateRow("CourierPayments", id, body);
    return { ok: true };
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    await deleteRow("CourierPayments", id);
    return { ok: true };
  });
}
