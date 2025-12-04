// components/AppLayout.js
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useAccount } from "../lib/accountContext";

function AccountBanner() {
  const { accountId, setAccountId, ready } = useAccount();
  const [draft, setDraft] = useState(accountId || "");

  useEffect(() => {
    setDraft(accountId || "");
  }, [accountId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAccountId(draft);
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Account</p>
          <p className="text-xs text-slate-500">
            Data loads from this account&apos;s subcollections.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
          aria-label="Account selector"
        >
          <input
            type="text"
            placeholder="Enter account id"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            disabled={!ready}
          />
          <button
            type="submit"
            className="text-xs font-semibold rounded-lg px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={!ready}
          >
            Set account
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppLayout({ children, active }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar active={active} />
      <div className="flex-1">
        <AccountBanner />
        {/* children = page content */}
        {children}
      </div>
    </div>
  );
}
