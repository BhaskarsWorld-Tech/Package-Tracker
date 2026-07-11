import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { listRows, appendRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession(req);
    return listRows("Payments");
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession(req);
    const body = await req.json();
    const id = randomUUID();
    await appendRow("Payments", {
      id,
      packageId: body.packageId ?? "",
      customerName: body.customerName ?? "",
      amount: body.amount ?? "",
      currency: body.currency ?? "USD",
      method: body.method ?? "",
      status: body.status ?? "Pending",
      date: body.date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes ?? "",
    });
    return { id };
  }, 201);
}
