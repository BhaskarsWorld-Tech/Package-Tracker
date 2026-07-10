import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { listRows, appendRow } from "@/lib/sheets";
import { withErrorHandling } from "@/lib/api";

export async function GET() {
  return withErrorHandling(() => listRows("Leads"));
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json();
    const id = randomUUID();
    await appendRow("Leads", {
      id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      customerName: body.customerName ?? "",
      phone: body.phone ?? "",
      email: body.email ?? "",
      route: body.route ?? "",
      status: body.status ?? "New",
      notes: body.notes ?? "",
      fromAddress: body.fromAddress ?? "",
      shipToAddress: body.shipToAddress ?? "",
      shipToContactName: body.shipToContactName ?? "",
      shipToContactPhone: body.shipToContactPhone ?? "",
    });
    return { id };
  }, 201);
}
