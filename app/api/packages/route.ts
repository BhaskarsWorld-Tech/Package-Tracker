import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { listRows, appendRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";
import { requireSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession(req);
    return listRows("Packages");
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireSession(req);
    const body = await req.json();
    const id = randomUUID();
    await appendRow("Packages", {
      id,
      leadId: body.leadId ?? "",
      customerName: body.customerName ?? "",
      originAddress: body.originAddress ?? "",
      destinationAddress: body.destinationAddress ?? "",
      route: body.route ?? "",
      weightKg: body.weightKg ?? "",
      status: body.status ?? "Pending Pickup",
      shippedDate: body.shippedDate ?? "",
      expectedDelivery: body.expectedDelivery ?? "",
      carrier: body.carrier ?? "",
      trackingNumber: body.trackingNumber ?? "",
      notes: body.notes ?? "",
      amountDue: body.amountDue ?? "",
      currency: body.currency ?? "USD",
    });
    return { id };
  }, 201);
}
