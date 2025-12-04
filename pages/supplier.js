// pages/supplier.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";
import { useAccount } from "../lib/accountContext";
import { accountCollection, accountDoc } from "../lib/firestorePaths";

export default function SupplierDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accountId, ready } = useAccount();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    lastOrderDate: null,
    totalSpend: 0,
  });

  useEffect(() => {
    if (!id || !ready) return;

    const loadSupplier = async () => {
      if (!accountId) {
        setSupplier(null);
        setStats({ totalOrders: 0, lastOrderDate: null, totalSpend: 0 });
        setLoading(false);
        setMessage("Set an account to load this supplier.");
        return;
      }
      try {
        setLoading(true);
        const ref = accountDoc(db, accountId, "suppliers", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setSupplier(null);
          setMessage("Supplier not found.");
          return;
        }

        const data = snap.data();
        setSupplier({ id: snap.id, ...data });

        // Load transaction stats for this supplier
        const txSnap = await getDocs(
          query(
            accountCollection(db, accountId, "transactions"),
            where("supplierId", "==", id)
          )
        );

        let totalOrders = 0;
        let totalSpend = 0;
        let lastOrderDate = null;

        txSnap.forEach((d) => {
          totalOrders += 1;
          const tx = d.data();
          const cost = typeof tx.totalCost === "number" ? tx.totalCost : 0;
          totalSpend += cost;
          let od = null;
          if (tx.orderDate && typeof tx.orderDate.toDate === "function") {
            od = tx.orderDate.toDate();
          } else if (tx.orderDate instanceof Date) {
            od = tx.orderDate;
          } else if (tx.orderDate) {
            const parsed = new Date(tx.orderDate);
            od = Number.isNaN(parsed.getTime()) ? null : parsed;
          }
          if (od && (!lastOrderDate || od > lastOrderDate)) {
            lastOrderDate = od;
          }
        });

        setStats({ totalOrders, totalSpend, lastOrderDate });
      } catch (err) {
        console.error("Error loading supplier:", err);
        setMessage("Error loading supplier. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadSupplier();
  }, [id, accountId, ready]);

  const handleBack = () => {
    router.push("/suppliers");
  };

  const altEmails = supplier?.altEmails || [];

  const formatDate = (date) => {
    if (!date) return "--";
    try {
      return date.toLocaleDateString();
    } catch {
      return "--";
    }
  };

  const formatMoney = (amount) => {
    const n = !amount ? 0 : amount;
    try {
      return n.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    } catch {
      return `$${n}`;
    }
  };

  return (
    <AppLayout active="suppliers">
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Header + back link */}
        <header className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
          >
            ← Back to suppliers
          </button>
          <h2 className="text-xl font-semibold text-slate-900">
            Supplier details
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View contact information and notes for this supplier.
          </p>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading supplier…</p>
        ) : !supplier ? (
          <p className="text-sm text-slate-500">
            Supplier could not be found.
          </p>
        ) : (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            {/* Name & website */}
            <div className="border-b border-slate-100 pb-4">
              <p className="text-xs font-medium text-slate-500">Supplier</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {supplier.name || "—"}
              </p>
              {supplier.website && (
                <p className="text-sm text-slate-700 mt-1">
                  <span className="text-xs font-medium text-slate-500">
                    Website:&nbsp;
                  </span>
                  <a
                    className="text-indigo-700 hover:text-indigo-800 underline-offset-2 hover:underline"
                    href={supplier.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {supplier.website}
                  </a>
                </p>
              )}
            </div>

            {/* POC info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Point of contact
                </p>
                <p className="text-sm text-slate-900 mt-1">
                  {supplier.pocName || "—"}
                </p>
                {supplier.pocEmail && (
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="text-xs font-medium text-slate-500">
                      Email:&nbsp;
                    </span>
                    {supplier.pocEmail}
                  </p>
                )}
                {supplier.pocPhone && (
                  <p className="text-sm text-slate-700 mt-1">
                    <span className="text-xs font-medium text-slate-500">
                      Phone:&nbsp;
                    </span>
                    {supplier.pocPhone}
                  </p>
                )}
              </div>

              {/* Alt emails */}
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Alternative emails
                </p>
                {altEmails.length === 0 ? (
                  <p className="text-sm text-slate-900 mt-1">—</p>
                ) : (
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    {altEmails.map((e, idx) => (
                      <li
                        key={idx}
                        className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 mr-1"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total orders
                </p>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/transactions?supplierId=${encodeURIComponent(
                        supplier.id
                      )}&supplierName=${encodeURIComponent(supplier.name || "")}`
                    )
                  }
                  className="text-lg font-semibold text-indigo-700 mt-1 hover:text-indigo-800 underline-offset-2 hover:underline"
                >
                  {stats.totalOrders}
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Last order date
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {formatDate(stats.lastOrderDate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total spend
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {formatMoney(stats.totalSpend)}
                </p>
              </div>
            </div>

            {/* Address & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Address</p>
                <p className="text-sm text-slate-900 mt-1 whitespace-pre-wrap">
                  {supplier.address || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Notes</p>
                <p className="text-sm text-slate-900 mt-1 whitespace-pre-wrap">
                  {supplier.notes || "—"}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </AppLayout>
  );
}
