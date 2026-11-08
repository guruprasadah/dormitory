import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { isDemoMode } from "@/lib/fijii";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dormitory · Attendance & Assignments",
  description: "Your Digiicampus attendance and pending assignments, in one place.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/assignments", label: "Assignments" },
  { href: "/resources", label: "Resources" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  const demo = isDemoMode();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {demo && (
          <p className="bg-amber-400 py-1 text-center text-[11px] font-medium tracking-wide text-amber-950">
            DEMO DATA · fictional student, courses and deadlines
          </p>
        )}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
            >
              <span className="grid size-7 place-items-center rounded-md bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
                D
              </span>
              <span className="hidden min-[380px]:inline">Dormitory</span>
            </Link>
            {demo && <DemoBadge />}
            <nav
              aria-label="Main"
              className="nav-fade -mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto px-1 text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-800 sm:px-3"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-6 sm:py-8">{children}</main>
        <footer className="border-t border-zinc-200 px-3 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          {demo
            ? "Demo build — every name, course and deadline on this page is fictional."
            : "Unofficial view of your Digiicampus data via the fijii SDK."}
        </footer>
      </body>
    </html>
  );
}

/** Small pill next to the wordmark so screenshots are self-evidently demo data. */
function DemoBadge() {
  return (
    <span
      title="Running against fictional fixtures — no portal data is used"
      className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
    >
      Demo
    </span>
  );
}
