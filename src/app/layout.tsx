import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Prowider Mini - Lead Distribution System',
  description: 'Production-style high-concurrency lead allocation engine with real-time updates and webhook safety.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-950 text-slate-100 flex flex-col font-sans`}
      >
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    P
                  </div>
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                    Prowider<span className="text-indigo-400 font-medium text-sm ml-1 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800/50">MINI</span>
                  </span>
                </Link>
              </div>
              <nav className="flex space-x-1 sm:space-x-4">
                <Link
                  href="/request-service"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                >
                  🚀 Request Service
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                >
                  📊 Provider Dashboard
                </Link>
                <Link
                  href="/test-tools"
                  className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
                >
                  🧪 Test Panel
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            Prowider Mini Lead Distribution System • Designed with Concurrency Safety & Fair Allocation
          </div>
        </footer>
      </body>
    </html>
  );
}
