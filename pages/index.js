// pages/index.js (Dashboard)
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";
import { getTrackingUrl } from "../lib/tracking";
import { useAccount } from "../lib/accountContext";
import { accountCollection, accountDoc } from "../lib/firestorePaths";

export default function DashboardPage() {
  const router = useRouter();
  const { accountId, ready } = useAccount();

  const [supplierCount, setSupplierCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [copyingId, setCopyingId] = useState(null);
  const [trackingModal, setTrackingModal] = useState({
    show: false,
    txId: null,
    carrier: "",
    number: "",
    saving: false,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!ready) return;
      if (!accountId) {
        setSupplierCount(0);
        setItemCount(0);
        setTransactionCount(0);
        setTotalSpend(0);
        setRecentOrders([]);
        setErrorMsg("Set an account to load dashboard data.");
        return;
      }

      try {
        setErrorMsg("");

        const [supSnap, itemSnap, txSnap] = await Promise.all([
          getDocs(accountCollection(db, accountId, "suppliers")),
          getDocs(accountCollection(db, accountId, "items")),
          getDocs(accountCollection(db, accountId, "transactions")),
        ]);

        setSupplierCount(supSnap.size);
        setItemCount(itemSnap.size);
        setTransactionCount(txSnap.size);

        let total = 0;
        txSnap.forEach((d) => {
          const data = d.data();
          const t = typeof data.totalCost === "number" ? data.totalCost : 0;
          total += t;
        });
        setTotalSpend(total);

        const qTx = query(
          accountCollection(db, accountId, "transactions"),
          orderBy("orderDate", "desc"),
          limit(5)
        );
        const recentSnap = await getDocs(qTx);

        const rows = recentSnap.docs.map((d) => {
          const data = d.data();
          let orderDate = null;
          if (data.orderDate && typeof data.orderDate.toDate === "function") {
            orderDate = data.orderDate.toDate();
          } else if (data.orderDate instanceof Date) {
            orderDate = data.orderDate;
          }

          return {
            id: d.id,
            ...data,
            orderDate,
          };
        });

        setRecentOrders(rows);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setErrorMsg("Error loading dashboard data. Check console.");
      }
    };

    loadDashboardData();
  }, [accountId, ready]);

  const formatMoney = (amount) => {
    const n = !amount ? 0 : amount;
    try {
      return n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    } catch {
      return `$${n}`;
    }
  };

  const formatDate = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "--";
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleTrackingClick = (tx) => {
    setTrackingModal({
      show: true,
      txId: tx.id,
      carrier: tx.trackingCarrier || "",
      number: tx.trackingNumber || "",
      saving: false,
    });
  };

  const handleOpenTransaction = (tx) => {
    router.push(`/transaction?id=${tx.id}`);
  };

  const handleCopyTracking = async (tx) => {
    if (!tx?.trackingNumber) return;
    try {
      setCopyingId(tx.id);
      await navigator.clipboard.writeText(tx.trackingNumber);
    } catch (err) {
      console.error("Error copying tracking number:", err);
      setErrorMsg("Could not copy tracking number.");
    } finally {
      setCopyingId(null);
    }
  };

  const handleSaveTrackingFromModal = async () => {
    if (!trackingModal.txId) return;
    if (!accountId) {
      setErrorMsg("Set an account before saving tracking.");
      return;
    }
    try {
      setTrackingModal((prev) => ({ ...prev, saving: true }));
      const trimmedNum = trackingModal.number.trim();
      const trimmedCarrier = trackingModal.carrier.trim();
      const ref = accountDoc(
        db,
        accountId,
        "transactions",
        trackingModal.txId
      );
      await updateDoc(ref, {
        trackingNumber: trimmedNum || null,
        trackingCarrier: trimmedCarrier || null,
      });

      setRecentOrders((prev) =>
        prev.map((tx) =>
          tx.id === trackingModal.txId
            ? {
                ...tx,
                trackingNumber: trimmedNum || null,
                trackingCarrier: trimmedCarrier || null,
              }
            : tx
        )
      );

      setTrackingModal({
        show: false,
        txId: null,
        carrier: "",
        number: "",
        saving: false,
      });
      setErrorMsg("Tracking updated.");
      setTimeout(() => setErrorMsg(""), 3000);
    } catch (err) {
      console.error("Error updating tracking from dashboard:", err);
      setErrorMsg("Error updating tracking. Check console.");
    } finally {
      setTrackingModal((prev) => ({ ...prev, saving: false }));
    }
  };

  return (
    <AppLayout active="dashboard">
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Page header */}
        <section className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500 mt-1">
              Quick snapshot of your suppliers, items, and purchase history.
            </p>
          </div>
        </section>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}
      {/* Tracking modal */}
      {trackingModal.show && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {trackingModal.number ? "Update tracking" : "Add tracking"}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() =>
                  setTrackingModal({
                    show: false,
                    txId: null,
                    carrier: "",
                    number: "",
                    saving: false,
                  })
                }
              >
                ×
              </button>
            </div>

            <label className="block text-xs font-medium text-slate-700 mb-1">
              Carrier
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-3"
              value={trackingModal.carrier}
              onChange={(e) =>
                setTrackingModal((prev) => ({ ...prev, carrier: e.target.value }))
              }
            >
              <option value="">Select carrier</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
              <option value="DHL">DHL Express</option>
              <option value="USPS">USPS</option>
              <option value="Other">Other</option>
            </select>

            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tracking number
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-4"
              value={trackingModal.number}
              onChange={(e) =>
                setTrackingModal((prev) => ({ ...prev, number: e.target.value }))
              }
              placeholder="Enter tracking number"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
                onClick={() =>
                  setTrackingModal({
                    show: false,
                    txId: null,
                    carrier: "",
                    number: "",
                    saving: false,
                  })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={trackingModal.saving}
                onClick={handleSaveTrackingFromModal}
                className="text-xs font-semibold rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {trackingModal.saving ? "Saving…" : "Save tracking"}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="w-full text-left rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white px-5 py-5 shadow-lg flex items-start gap-3 transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 cursor-pointer"
          >
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold">
              S
            </div>
            <div>
              <p className="text-sm font-semibold opacity-90">Suppliers</p>
              <p className="text-4xl font-bold leading-tight">{supplierCount}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => router.push("/items")}
            className="w-full text-left rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white px-5 py-5 shadow-lg flex items-start gap-3 transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-200 cursor-pointer"
          >
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold">
              I
            </div>
            <div>
              <p className="text-sm font-semibold opacity-90">Items</p>
              <p className="text-4xl font-bold leading-tight">{itemCount}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => router.push("/transactions")}
            className="w-full text-left rounded-3xl bg-gradient-to-br from-orange-400 via-amber-400 to-rose-400 text-white px-5 py-5 shadow-lg flex items-start gap-3 transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-200 cursor-pointer"
          >
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold">
              T
            </div>
            <div>
              <p className="text-sm font-semibold opacity-90">Transactions</p>
              <p className="text-4xl font-bold leading-tight">{transactionCount}</p>
            </div>
          </button>
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 text-white px-5 py-5 shadow-lg flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-lg font-semibold">$</div>
            <div>
              <p className="text-sm font-semibold opacity-90">Total spend</p>
              <p className="text-3xl sm:text-4xl font-bold leading-tight">
                {formatMoney(totalSpend)}
              </p>
            </div>
          </div>
        </section>

        {/* Two equal cards: Quick actions (left) + Incoming Orders (right) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick actions — LEFT */}
          <div>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm px-5 py-5 h-full">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Quick actions
              </h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => router.push("/add-transaction")}
                  className="w-full rounded-xl bg-amber-400 text-slate-900 text-sm font-semibold px-3 py-3 hover:bg-amber-300 cursor-pointer shadow-sm"
                >
                  + Add new transaction
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/transactions")}
                  className="w-full rounded-xl border border-slate-200 text-sm px-3 py-3 text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  View all transactions
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/suppliers")}
                  className="w-full rounded-xl border border-slate-200 text-sm px-3 py-3 text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  Manage suppliers
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/items")}
                  className="w-full rounded-xl border border-slate-200 text-sm px-3 py-3 text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  Manage items
                </button>
              </div>
            </div>
          </div>

          {/* Incoming Orders — RIGHT */}
          <div>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-full">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">
                  Incoming Orders
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Latest 5 recorded purchase orders.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white text-xs text-slate-500">
                      <th className="text-left px-4 py-2 font-semibold w-1/3">
                        Item
                      </th>
                      <th className="text-left px-4 py-2 font-semibold w-1/3">
                        Tracking
                      </th>
                      <th className="text-left px-4 py-2 font-semibold w-1/3">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      No recent orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-t border-slate-100 bg-slate-50/40"
                    >
                      <td className="px-4 py-3 text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenTransaction(tx)}
                          className="text-left text-slate-900 hover:text-slate-900 underline-offset-2 hover:underline cursor-pointer"
                        >
                          {tx.itemName || "-"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {tx.trackingNumber ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={getTrackingUrl(
                                tx.trackingCarrier,
                                tx.trackingNumber
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 underline-offset-2 hover:underline cursor-pointer"
                            >
                              {tx.trackingNumber}
                            </a>
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(tx)}
                                disabled={copyingId === tx.id}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 cursor-pointer"
                              >
                                <svg
                                  aria-hidden="true"
                                  focusable="false"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"
                                  />
                                  <rect
                                    x="4"
                                    y="7"
                                    width="12"
                                    height="14"
                                    rx="2"
                                    ry="2"
                                  />
                                </svg>
                              </button>
                              <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-hover:translate-y-0">
                                Copy to clipboard
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-slate-800" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTrackingClick(tx)}
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
                          >
                            Update tracking number
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDate(tx.orderDate)}
                      </td>
                    </tr>
                  ))
                )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}


