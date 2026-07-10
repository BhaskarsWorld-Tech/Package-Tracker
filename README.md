# Package Tracker

Track leads, in-transit shipments (India ↔ USA), and payments — all stored in a Google Sheet.

## 1. Create a Google Sheet

Create a new Google Sheet with three tabs, named exactly:

- `Leads`
- `Packages`
- `Payments`

You can leave them empty — the app writes header rows automatically on first use.

Copy the Sheet ID from its URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART_IS_THE_ID`**`/edit`

## 2. Create a Google Cloud service account

1. Go to https://console.cloud.google.com/ and create (or pick) a project.
2. Enable the **Google Sheets API** for that project (APIs & Services → Library).
3. Go to APIs & Services → Credentials → Create Credentials → Service Account.
4. Give it any name, finish creation.
5. Open the service account → Keys → Add Key → Create new key → JSON. This downloads a JSON file — keep it private, never commit it.
6. Copy the service account's email (looks like `xxx@yyy.iam.gserviceaccount.com`).

## 3. Share the Sheet with the service account

Open your Google Sheet → Share → paste the service account email → give it **Editor** access.

## 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in from the downloaded JSON key file:

- `GOOGLE_SHEET_ID` — the Sheet ID from step 1
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` field in the JSON key
- `GOOGLE_PRIVATE_KEY` — the `private_key` field in the JSON key, wrapped in quotes exactly as downloaded (keep the `\n` sequences)

## 5. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The Dashboard shows active leads, in-transit packages, and outstanding payments; use the Leads / Packages / Payments tabs to add and update records — everything is saved straight to your Google Sheet.

## 6. Deploy to Cloudflare

This app deploys to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare).

1. Log in once: `npx wrangler login`.
2. Push your secrets to Cloudflare (do this once per environment):
   ```bash
   npx wrangler secret put GOOGLE_SHEET_ID
   npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
   npx wrangler secret put GOOGLE_PRIVATE_KEY
   ```
3. Deploy:
   ```bash
   npm run cf:deploy
   ```

To test the Workers build locally first (uses `.dev.vars`, a gitignored copy of `.env.local`):
```bash
cp .env.local .dev.vars
npm run cf:preview
```

Note: the Sheets client talks to the Google Sheets REST API directly with a hand-rolled JWT signer (`lib/google-auth.ts`) instead of the `googleapis` package — `googleapis`'s HTTP client doesn't decompress gzip response bodies correctly under the Workers runtime, which corrupts API responses.
