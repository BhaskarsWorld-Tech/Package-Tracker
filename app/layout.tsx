import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Package Tracker",
  description: "Track leads, in-transit packages, and payments",
};

// Every page here is a client component that fetches live data from Google
// Sheets on mount — there's nothing meaningful to prerender or cache as
// static. Forcing dynamic rendering stops Cloudflare/OpenNext from caching
// the HTML shell for a year, which was serving stale pages (referencing
// JS chunks from a prior deploy) to some visitors after a redeploy.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        <Sidebar />
        <MobileNav />
        <main className="md:pl-64">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
