import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Sidebar({ active }) {
  const router = useRouter();
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

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen">
      <div className="px-5 py-4 border-b border-slate-800">
        <h1 className="text-base font-semibold">Procurement Tracker</h1>
      </div>

      <nav className="mt-4 flex-1 px-2 space-y-1 text-sm">
        <Link href="/" className={linkClass("dashboard")}>
          <span className="text-lg">🏠</span>
          <span>Dashboard</span>
        </Link>

        <Link href="/suppliers" className={linkClass("suppliers")}>
          <span className="text-lg">📇</span>
          <span>Suppliers</span>
        </Link>

        <Link href="/items" className={linkClass("items")}>
          <span className="text-lg">📦</span>
          <span>Items</span>
        </Link>

        <Link href="/add-transaction" className={linkClass("add-transaction")}>
          <span className="text-lg">➕</span>
          <span>Add Transaction</span>
        </Link>

        <Link href="/transactions" className={linkClass("transactions")}>
          <span className="text-lg">📜</span>
          <span>View Transactions</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`${baseLinkClasses} mt-4 w-full text-left border border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white`}
        >
          <span className="text-lg">⎋</span>
          <span>Log out</span>
        </button>
      </nav>
    </aside>
  );
}
