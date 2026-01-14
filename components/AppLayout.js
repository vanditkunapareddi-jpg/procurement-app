// components/AppLayout.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";

export default function AppLayout({ children, active }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleRoute = () => setSidebarOpen(false);
    router.events.on("routeChangeComplete", handleRoute);
    return () => router.events.off("routeChangeComplete", handleRoute);
  }, [router.events]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/konnuko-logo.svg"
              alt="Konnuko logo"
              className="h-12 w-auto"
            />
            <span className="sr-only">Konnuko</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            aria-label="Open navigation"
          >
            <div className="flex flex-col gap-1">
              <span className="h-0.5 w-4 bg-slate-900 block" />
              <span className="h-0.5 w-4 bg-slate-900 block" />
              <span className="h-0.5 w-4 bg-slate-900 block" />
            </div>
            <span>Menu</span>
          </button>
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
