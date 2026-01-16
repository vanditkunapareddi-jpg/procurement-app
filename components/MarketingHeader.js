export default function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img
            src="/konnuko-logo.svg"
            alt="Konnuko logo"
            className="h-12 w-auto"
          />
          <div>
            <p className="text-xs text-slate-300">Supplier & purchase tracking</p>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <a
            href="https://app.konnuko.com/login"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Log in
          </a>
          <a
            href="https://app.konnuko.com/login"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-500/30"
          >
            Launch app
          </a>
        </div>
      </div>
    </header>
  );
}
