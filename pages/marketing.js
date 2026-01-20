import MarketingHeader from "../components/MarketingHeader";

const stats = [
  { value: "2x", label: "Faster purchasing cycles" },
  { value: "40%", label: "Fewer supplier follow-ups" },
  { value: "100%", label: "Centralized vendor data" },
];

const featureCards = [
  {
    title: "Supplier source of truth",
    desc: "Contacts, email threads, and alternative addresses in one place.",
  },
  {
    title: "Items and specs",
    desc: "Organize SKUs with folders, reorder points, and requirements.",
  },
  {
    title: "Transactions with context",
    desc: "Track costs, delivery status, and invoices together.",
  },
];

const steps = [
  {
    title: "Capture suppliers",
    desc: "Add vendor profiles with contacts, notes, and delivery details.",
  },
  {
    title: "Track items and orders",
    desc: "Create items, record orders, and keep spend visible.",
  },
  {
    title: "Collaborate with your team",
    desc: "Invite teammates and control access with roles.",
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <MarketingHeader />

      <main className="max-w-6xl mx-auto px-6 pb-16 pt-8">
        <section className="py-10 md:py-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-200 text-xs font-semibold border border-indigo-400/40">
              Built for modern procurement teams
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Track suppliers, items, and purchase orders in one secure
              workspace.
            </h1>
            <p className="text-slate-100 text-base md:text-lg leading-relaxed">
              Konnuko is a supplier and purchase tracking platform that helps
              teams manage vendors, items, and purchase orders in one place.
            </p>
            <p className="text-slate-200 text-base md:text-lg leading-relaxed">
              Centralize vendor data, keep orders visible, and give your team
              role-based access without spreadsheets.
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
            <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-white">
                    {stat.value}
                  </p>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl bg-indigo-500/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Workspace overview</span>
                <span className="rounded-full border border-white/20 px-2 py-1">
                  Today
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {[
                  { label: "Suppliers", value: "118 active" },
                  { label: "Items", value: "432 SKUs" },
                  { label: "Transactions", value: "$28.4k" },
                  { label: "Members", value: "8 people" },
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
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                Latest: PO-1842 approved and sent to Star Towers.
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-12">
          <div className="grid gap-6 md:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-lg font-semibold text-white">{card.title}</p>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 grid gap-10 lg:grid-cols-[1fr_1fr] items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-wide text-indigo-200">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold">
              A clearer workflow for purchasing teams
            </h2>
            <p className="text-slate-200 text-sm md:text-base">
              Replace scattered spreadsheets with a single view of suppliers,
              items, and orders.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-amber-400 text-slate-900 font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="text-sm text-slate-200 mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-wide text-indigo-200">
                Built for teams
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Control access without slowing people down
              </h2>
              <p className="text-sm text-slate-200">
                Invite teammates, set roles, and keep sensitive purchasing data
                organized by account.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-200">
              {[
                "Owner and member roles",
                "Shared supplier context",
                "Clean audit-friendly data",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
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

      <footer className="mt-6 bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/80">
            © 2026 Konnuko, Inc.
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/terms" className="hover:text-white/80 transition">
              Terms
            </a>
            <span className="text-white/40">|</span>
            <a href="/privacy" className="hover:text-white/80 transition">
              Privacy
            </a>
            <span className="text-white/40">|</span>
            <a
              href="mailto:support@konnuko.com"
              className="hover:text-white/80 transition"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
