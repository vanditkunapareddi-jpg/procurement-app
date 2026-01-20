import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import SettingsModal from "./SettingsModal";

export default function Sidebar({ active, open = true, onClose }) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [initials, setInitials] = useState("?");
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const cardRef = useRef(null);
  const triggerRef = useRef(null);
  const baseLinkClasses =
    "flex items-center gap-2 px-3 py-2 rounded-lg text-[15px]";
  const inactiveClasses =
    "text-slate-200 hover:bg-slate-800 hover:text-white";
  const activeClasses = "bg-slate-800 text-white";

  const linkClass = (key) =>
    `${baseLinkClasses} ${active === key ? activeClasses : inactiveClasses}`;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  useEffect(() => {
    const deriveInitials = (name, email) => {
      const pulled = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      if (pulled) return pulled;
      if (email) return email[0]?.toUpperCase() || "?";
      return "?";
    };

    const unsub = auth.onAuthStateChanged((user) => {
      const display = user?.displayName || "";
      const mail = user?.email || "";
      const preferred = display || (mail ? mail.split("@")[0] : "");
      setUserName(preferred || "User");
      setUserEmail(mail);
      setInitials(deriveInitials(preferred, mail));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!showProfileCard) return;
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setShowProfileCard(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileCard]);

  const isOpen = open ?? true;
  const handleClose = onClose || (() => {});
  const iconClasses =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-white";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 w-56 bg-slate-900 text-slate-100 flex flex-col min-h-screen max-h-screen overflow-y-auto shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:shadow-none transform transition-transform duration-200 lg:transform-none z-50 lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 py-3 border-b border-slate-800 relative">
          <div className="flex items-center justify-center overflow-hidden h-24 w-full">
            <img
              src="/konnuko-logo.svg"
              alt="Konnuko logo"
              className="h-full w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="lg:hidden absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-md border border-slate-200"
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="mt-4 flex-1 px-2 space-y-1 text-sm">
          <Link href="/" className={linkClass("dashboard")}>
            <span className={iconClasses} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                <rect x="40" y="32" width="176" height="176" rx="48" ry="48" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="296" y="32" width="176" height="240" rx="48" ry="48" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="40" y="264" width="176" height="240" rx="48" ry="48" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="296" y="296" width="176" height="176" rx="48" ry="48" fill="none" stroke="currentColor" strokeWidth="24" />
              </svg>
            </span>
            <span>Dashboard</span>
          </Link>

          <Link href="/suppliers" className={linkClass("suppliers")}>
            <span className={iconClasses} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                <circle cx="176" cy="176" r="72" stroke="currentColor" strokeWidth="24" fill="none" />
                <path d="M80 384c0-53 43-96 96-96h0c53 0 96 43 96 96v64H80v-64z" stroke="currentColor" strokeWidth="24" fill="none" strokeLinecap="round" />
                <circle cx="352" cy="144" r="64" stroke="currentColor" strokeWidth="24" fill="none" />
                <path d="M272 320c12-36 46-64 80-64h0c45 0 88 39 88 96v32h-88" stroke="currentColor" strokeWidth="24" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <span>Suppliers</span>
          </Link>

          <Link href="/items" className={linkClass("items")}>
            <span className={iconClasses} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                <path d="M64 96v304c0 26 22 48 48 48h336" fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
                <rect x="160" y="112" width="112" height="112" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="320" y="112" width="112" height="80" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="160" y="256" width="272" height="112" fill="none" stroke="currentColor" strokeWidth="24" />
                <circle cx="200" cy="448" r="40" stroke="currentColor" strokeWidth="24" fill="none" />
                <circle cx="336" cy="448" r="40" stroke="currentColor" strokeWidth="24" fill="none" />
              </svg>
            </span>
            <span>Items</span>
          </Link>

          <Link href="/add-transaction" className={linkClass("add-transaction")}>
            <span className={iconClasses} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Add Transaction</span>
          </Link>

          <Link href="/transactions" className={linkClass("transactions")}>
            <span className={iconClasses} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="none">
                <rect x="80" y="128" width="352" height="256" rx="48" ry="48" fill="none" stroke="currentColor" strokeWidth="24" />
                <rect x="80" y="192" width="352" height="32" fill="currentColor" />
                <circle cx="160" cy="304" r="32" fill="none" stroke="currentColor" strokeWidth="24" />
              </svg>
            </span>
            <span>View Transactions</span>
          </Link>
        </nav>

        <div className="mt-auto relative px-3 py-4 border-t border-slate-800">
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setShowProfileCard((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-semibold">
              {initials}
            </span>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-semibold leading-tight truncate">
                {userName || "User"}
              </span>
              <span className="text-xs text-slate-300 truncate">
                {userEmail || "Signed in"}
              </span>
            </div>
          </button>

          {showProfileCard && (
            <div
              ref={cardRef}
              className="absolute left-3 right-3 bottom-24 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-4 z-20"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">
                    {userName || "User"}
                  </p>
                  <p className="text-xs text-slate-500 break-all">
                    {userEmail || "Signed in"}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(true);
                    setShowProfileCard(false);
                  }}
                  className="w-full text-left text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left text-sm font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
