import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { listRows, appendRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";

export async function GET() {
  return withErrorHandling(() => listRows("CourierPayments"));
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const id = randomUUID();
    await appendRow("CourierPayments", {
      id,
      packageId: body.packageId ?? "",
      customerName: body.customerName ?? "",
      paidContactName: body.paidContactName ?? "",
      paidContactNumber: body.paidContactNumber ?? "",
      paidBy: body.paidBy ?? "",
      total: body.total ?? "",
      currency: body.currency ?? "USD",
      paymentSource: body.paymentSource ?? "",
      customerPaymentStatus: body.customerPaymentStatus ?? "Pending",
      date: body.date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes ?? "",
    });
    return { id };
  }, 201);
}
