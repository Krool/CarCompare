import Link from "next/link";

// Header and footer for the static text pages (privacy, 404), matching the
// main page's look without pulling in its client-side state.
export function SimplePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 relative flex flex-col">
      <div className="ambient-glow" />

      <header className="relative z-20 border-b border-gray-800/80 px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-4" aria-label="CarCompare home">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/20">
            <svg className="w-5 h-5 text-gray-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2M5 17l-1 2m15-2l1 2" />
              <circle cx="7.5" cy="17" r="1" fill="currentColor" />
              <circle cx="16.5" cy="17" r="1" fill="currentColor" />
            </svg>
          </span>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-gradient-gold">Car</span>
            <span className="text-white">Compare</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>

      <footer className="relative z-10 border-t border-gray-800/50 px-6 py-5">
        <p className="text-gray-500 text-xs text-center">
          <Link href="/" className="text-amber-600 hover:text-amber-500 transition-colors">
            Back to CarCompare
          </Link>
          {" · "}
          <Link href="/privacy" prefetch={false} className="text-amber-600 hover:text-amber-500 transition-colors">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  );
}
