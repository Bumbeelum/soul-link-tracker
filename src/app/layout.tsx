import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Soul-Link Tracker",
  description: "Track your Pokémon Soul-Link runs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <nav className="bg-poke-card/98 border-b border-slate-700/50 shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="text-2xl font-bold text-poke-accent">
                  Soul-Link Tracker
                </Link>
                <div className="flex gap-6">
                  <Link
                    href="/"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/pairs"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Pairs
                  </Link>
                  <Link
                    href="/builder"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Builder
                  </Link>
                  <Link
                    href="/battle"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Battle Helper
                  </Link>
                  <Link
                    href="/dex"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Pokédex
                  </Link>
                  <Link
                    href="/settings"
                    className="text-slate-300 hover:text-poke-accent transition-colors"
                  >
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

