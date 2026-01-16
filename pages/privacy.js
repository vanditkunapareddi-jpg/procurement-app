import MarketingHeader from "../components/MarketingHeader";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="max-w-6xl mx-auto px-6 py-12 pt-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Legal
          </p>
          <h1 className="text-4xl font-semibold">Privacy Policy</h1>
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
                <a href="/terms" className="block hover:text-slate-900">
                  User Terms of Service
                </a>
                <a
                  href="/privacy"
                  className="block font-semibold text-slate-900"
                >
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
                This Privacy Policy explains how Konnuko collects, uses, and
                shares information when you use our website and services.
              </p>
              <p>
                We collect information you provide directly, such as your name,
                email address, and account details. We also collect usage data
                to improve the product.
              </p>
              <p>
                We use your information to operate the service, provide
                support, communicate with you, and improve functionality.
              </p>
              <p>
                We do not sell your personal information. We may share data
                with service providers who help us operate the platform, subject
                to confidentiality obligations.
              </p>
              <p>
                You can request access, correction, or deletion of your data by
                contacting us at support@konnuko.com.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-lg font-semibold text-slate-900">Security</h2>
              <p>
                We use reasonable administrative, technical, and organizational
                measures to protect your information. No system is 100% secure.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-lg font-semibold text-slate-900">Changes</h2>
              <p>
                We may update this policy from time to time. We will revise the
                "Last updated" date when changes are made.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}


