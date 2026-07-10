import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-red-200/70 bg-red-50/60 p-5 text-sm animate-fade-in">
      <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
      <div>
        <p className="font-medium text-red-700">Couldn&apos;t load data.</p>
        <p className="mt-1 text-red-600">{message}</p>
        <p className="mt-2 text-red-400">
          Make sure GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and
          GOOGLE_PRIVATE_KEY are set in .env.local, and the sheet is shared
          with the service account email.
        </p>
      </div>
    </div>
  );
}
