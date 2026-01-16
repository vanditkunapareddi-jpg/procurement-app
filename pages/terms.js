import MarketingHeader from "../components/MarketingHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="max-w-6xl mx-auto px-6 py-12 pt-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Legal
          </p>
          <h1 className="text-4xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-slate-500">
            Last updated: January 15, 2026
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Legal
              </p>
              <nav className="mt-3 space-y-2 text-sm text-slate-700">
                <a href="/terms" className="block font-semibold text-slate-900">
                  User Terms of Service
                </a>
                <a href="/privacy" className="block hover:text-slate-900">
                  Privacy Policy
                </a>
                <button
                  type="button"
                  className="block text-left text-slate-400 cursor-not-allowed"
                  disabled
                >
                  Subscriber Terms (coming soon)
                </button>
                <button
                  type="button"
                  className="block text-left text-slate-400 cursor-not-allowed"
                  disabled
                >
                  API Terms (coming soon)
                </button>
              </nav>
            </div>
          </aside>

          <div className="space-y-8">
            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p>
                By using Konnuko, you agree to these Terms of Service. If you do
                not agree, do not use the service.
              </p>
              <p>
                You are responsible for your account credentials and for all
                activity under your account. You agree to use the service in
                compliance with applicable laws.
              </p>
              <p>
                You may not misuse the service, interfere with its operation,
                or attempt to access data that does not belong to you.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-lg font-semibold text-slate-900">Service</h2>
              <p>
                We may change, suspend, or discontinue any part of the service
                at any time. We do not guarantee uninterrupted availability.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-lg font-semibold text-slate-900">
                Termination
              </h2>
              <p>
                We may suspend or terminate access if you violate these terms
                or pose a risk to the service or other users.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
              <p>
                Questions about these terms can be sent to support@konnuko.com.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
