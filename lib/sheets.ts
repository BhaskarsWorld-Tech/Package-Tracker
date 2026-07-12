import { getAccessToken } from "@/lib/google-auth";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

async function sheetsFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/${SHEET_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Sheets API error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Row 1 of each tab is a header row matching these column orders.
export const SHEETS = {
  Leads: [
    "id",
    "date",
    "customerName",
    "phone",
    "email",
    "route",
    "status",
    "notes",
    "fromAddress",
    "shipToAddress",
    "shipToContactName",
    "shipToContactPhone",
  ],
  Packages: [
    "id",
    "leadId",
    "customerName",
    "originAddress",
    "destinationAddress",
    "route",
    "weightKg",
    "status",
    "shippedDate",
    "expectedDelivery",
    "carrier",
    "trackingNumber",
    "notes",
    "amountDue",
    "currency",
  ],
  Payments: [
    "id",
    "packageId",
    "customerName",
    "amount",
    "currency",
    "method",
    "status",
    "date",
    "notes",
  ],
  CourierPayments: [
    "id",
    "packageId",
    "customerName",
    "paidContactName",
    "paidContactNumber",
    "paidBy",
    "total",
    "currency",
    "paymentSource",
    "customerPaymentStatus",
    "date",
    "notes",
  ],
  Users: ["id", "email", "passwordHash", "passwordSalt", "role", "createdAt"],
} as const;

export type SheetName = keyof typeof SHEETS;

function rowToObject<T extends SheetName>(sheet: T, row: string[]) {
  const cols = SHEETS[sheet];
  const obj: Record<string, string> = {};
  cols.forEach((col, i) => {
    obj[col] = row[i] ?? "";
  });
  return obj as Record<(typeof cols)[number], string>;
}

function objectToRow<T extends SheetName>(
  sheet: T,
  obj: Record<string, string>
) {
  const cols = SHEETS[sheet];
  return cols.map((col) => obj[col] ?? "");
}

// Spreadsheet metadata (which tabs exist) rarely changes, so cache it for
// the lifetime of the warm instance instead of re-fetching on every read —
// each fetch counts against Google's per-minute read quota, and doubling
// every list/update/delete call with a metadata round-trip exhausts it fast.
type SheetMeta = { sheets?: { properties?: { title?: string; sheetId?: number } }[] };
let sheetMetaCache: SheetMeta | null = null;

async function getSheetMeta(forceRefresh = false): Promise<SheetMeta> {
  if (!sheetMetaCache || forceRefresh) {
    sheetMetaCache = await sheetsFetch("");
  }
  return sheetMetaCache as SheetMeta;
}

async function getSheetId(sheet: SheetName) {
  const meta = await getSheetMeta();
  return meta.sheets?.find((s) => s.properties?.title === sheet)?.properties
    ?.sheetId;
}

async function ensureSheetTab(sheet: SheetName) {
  let meta = await getSheetMeta();
  let exists = meta.sheets?.some((s) => s.properties?.title === sheet);
  if (!exists) {
    // Cache may just be stale (created by another request) — refresh once
    // before assuming it's truly missing.
    meta = await getSheetMeta(true);
    exists = meta.sheets?.some((s) => s.properties?.title === sheet);
  }
  if (!exists) {
    await sheetsFetch(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: sheet } } }],
      }),
    });
    sheetMetaCache = null;
  }
}

// Once headers are confirmed correct for a sheet in this warm instance,
// there's no need to re-read them before every single append.
const headersVerified = new Set<SheetName>();

export async function ensureHeaders(sheet: SheetName) {
  if (headersVerified.has(sheet)) return;
  await ensureSheetTab(sheet);
  const data = await sheetsFetch(
    `/values/${encodeURIComponent(`${sheet}!1:1`)}`
  );
  const current: string[] = data.values?.[0] ?? [];
  const expected = SHEETS[sheet] as readonly string[];
  // Re-write the header row whenever it's missing or shorter than the
  // current schema, so newly added columns get their labels without
  // touching (or reordering) any existing data below row 1.
  const needsUpdate =
    current.length < expected.length ||
    expected.some((col, i) => current[i] !== col);
  if (needsUpdate) {
    await sheetsFetch(
      `/values/${encodeURIComponent(`${sheet}!A1`)}?valueInputOption=RAW`,
      {
        method: "PUT",
        body: JSON.stringify({ values: [[...expected]] }),
      }
    );
  }
  headersVerified.add(sheet);
}

export async function listRows(sheet: SheetName) {
  await ensureSheetTab(sheet);
  const data = await sheetsFetch(
    `/values/${encodeURIComponent(`${sheet}!A2:Z`)}`
  );
  const rows: string[][] = data.values ?? [];
  return rows
    .map((row, i) => ({ _row: i + 2, ...rowToObject(sheet, row) }))
    .filter((r) => r.id);
}

export async function appendRow(
  sheet: SheetName,
  data: Record<string, string>
) {
  await ensureHeaders(sheet);
  await sheetsFetch(
    `/values/${encodeURIComponent(`${sheet}!A1`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      body: JSON.stringify({ values: [objectToRow(sheet, data)] }),
    }
  );
}

export async function updateRow(
  sheet: SheetName,
  id: string,
  data: Record<string, string>
) {
  const rows = await listRows(sheet);
  const target = rows.find((r) => r.id === id);
  if (!target) throw new Error(`Row with id ${id} not found in ${sheet}`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip row-index metadata before writing back
  const { _row, ...targetData } = target;
  const merged = { ...targetData, ...data, id };
  await sheetsFetch(
    `/values/${encodeURIComponent(`${sheet}!A${target._row}`)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values: [objectToRow(sheet, merged)] }),
    }
  );
}

export async function deleteRow(sheet: SheetName, id: string) {
  const rows = await listRows(sheet);
  const target = rows.find((r) => r.id === id);
  if (!target) throw new Error(`Row with id ${id} not found in ${sheet}`);
  const sheetId = await getSheetId(sheet);
  await sheetsFetch(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: target._row - 1,
              endIndex: target._row,
            },
          },
        },
      ],
    }),
  });
}
