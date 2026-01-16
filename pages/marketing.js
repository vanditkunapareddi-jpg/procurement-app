import MarketingHeader from "../components/MarketingHeader";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <MarketingHeader />

      <main className="max-w-6xl mx-auto px-6 pb-16 pt-8">
        <section className="py-8 md:py-12 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-200 text-xs font-semibold border border-indigo-400/40">
              Purpose-built for growing teams
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Track suppliers, items, and purchase orders in one secure workspace.
            </h1>
            <p className="text-slate-200 text-base md:text-lg leading-relaxed">
              Konnuko centralizes your vendors, SKUs, and transactions so you never lose track of inventory or spend. Multi-tenant by design, ready for your team out of the box.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://app.konnuko.com/login"
                className="inline-flex items-center px-5 py-3 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-500/30"
              >
                Get started
              </a>
              <a
                href="#features"
                className="inline-flex items-center px-5 py-3 rounded-lg border border-white/20 text-sm font-semibold hover:bg-white/5 transition"
              >
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-300">
              <div>
                <p className="text-lg font-semibold text-white">Multi-tenant</p>
                <p>Account-based isolation</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Fast setup</p>
                <p>Sign in with Google, start tracking</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl bg-indigo-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Suppliers", value: "All vendors, one view" },
                  { label: "Items", value: "Folders + specs + reorder" },
                  { label: "Transactions", value: "Costs, tracking, invoices" },
                  { label: "Members", value: "Role-based access" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      {card.label}
                    </p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-100 text-sm">
                “Konnuko keeps our suppliers and orders organized across teams. We ship faster with fewer mistakes.”
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Supplier source of truth",
                desc: "Contacts, emails, notes, and alt addresses in one place.",
              },
              {
                title: "Item folders & specs",
                desc: "Organize SKUs with nested folders, reorder points, and order instructions.",
              },
              {
                title: "Transactions with tracking",
                desc: "Track costs, shipping, payments, and link invoices with storage.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-lg font-semibold text-white">{f.title}</p>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold text-white">
                Ready to centralize suppliers, items, and POs?
              </p>
              <p className="text-sm text-slate-200">
                Sign in with Google and start tracking in minutes.
              </p>
            </div>
            <a
              href="https://app.konnuko.com/login"
              className="inline-flex items-center px-5 py-3 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 transition shadow-lg shadow-amber-500/30"
            >
              Launch app
            </a>
          </div>
        </section>
      </main>

      <footer className="mt-6 bg-[#6B0F2E] text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span>© 2026 Konnuko, Inc.</span>
            <span className="inline-flex items-center gap-2 text-white/80">
              <span className="inline-block h-7 w-7 rounded-full border border-white/30 text-center leading-7">
                🌐
              </span>
              English
            </span>
            <div className="flex items-center gap-2">
              {[
                { label: "X", href: "https://x.com" },
                { label: "in", href: "https://linkedin.com" },
                { label: "IG", href: "https://instagram.com" },
                { label: "f", href: "https://facebook.com" },
                { label: "yt", href: "https://youtube.com" },
              ].map((icon) => (
                <a
                  key={icon.label}
                  href={icon.href}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xs font-semibold uppercase tracking-wide hover:bg-black/60 transition"
                  aria-label={icon.label}
                  target="_blank"
                  rel="noreferrer"
                >
                  {icon.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-3">
              <a href="/terms" className="hover:text-white/80 transition">
                Terms
              </a>
              <span className="text-white/50">•</span>
              <a href="/privacy" className="hover:text-white/80 transition">
                Privacy
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/70">
              <span className="rounded-md border border-white/30 px-3 py-2">
                Download on the App Store
              </span>
              <span className="rounded-md border border-white/30 px-3 py-2">
                Get it on Google Play
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

