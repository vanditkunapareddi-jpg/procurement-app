// pages/transactions.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getDocs, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";
import { getTrackingUrl } from "../lib/tracking";
import { useAccount } from "../lib/accountContext";
import { accountCollection, accountDoc } from "../lib/firestorePaths";

export default function TransactionsPage() {
  const router = useRouter();
  const { accountId, ready } = useAccount();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sort, setSort] = useState({ field: null, dir: "asc" }); // dir: asc | desc
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const supplierNameQuery =
    typeof router.query?.supplierName === "string"
      ? router.query.supplierName
      : "";

  // Tracking modal state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingEditId, setTrackingEditId] = useState(null);
  const [trackingValue, setTrackingValue] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      if (!ready) return;
      if (!accountId) {
        setTransactions([]);
        setLoading(false);
        setMessage("Set an account to load transactions.");
        return;
      }
      try {
        setLoading(true);

        // Order by orderDate desc, then createdAt desc if available
        const qTrans = query(
          accountCollection(db, accountId, "transactions"),
          orderBy("orderDate", "desc")
        );
        const snap = await getDocs(qTrans);

        const rows = snap.docs.map((d) => {
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

        setTransactions(rows);
      } catch (err) {
        console.error("Error loading transactions:", err);
        setMessage("Error loading transactions. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [accountId, ready]);

  // Prefill search from query param so clearing it shows all transactions again
  useEffect(() => {
    const supplierName = router.query?.supplierName;
    if (typeof supplierName === "string" && supplierName.trim()) {
      setSearchQuery(supplierName);
      setShowSearch(true);
    }
  }, [router.query?.supplierName]);

  const handleSort = (field) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  };

  const renderSortArrow = (field) => {
    if (sort.field !== field) return null;
    return sort.dir === "asc" ? "↑" : "↓";
  };

  const arrowClass = (field) =>
    sort.field === field
      ? "opacity-100"
      : "opacity-0 group-hover:opacity-100 transition-opacity";

  const filteredTransactions = useMemo(() => {
    let base = transactions;

    if (!searchQuery.trim()) return base;

    const term = searchQuery.trim().toLowerCase();
    return base.filter((t) => {
      const fields = [
        t.itemName,
        t.supplierName,
        t.paymentStatus,
        t.trackingNumber,
        t.invoiceFileName,
        t.invoiceUrl,
        formatDate(t.orderDate),
      ];
      return fields.some((val) =>
        (val || "").toString().toLowerCase().includes(term)
      );
    });
  }, [transactions, searchQuery]);

  const sortedTransactions = useMemo(() => {
    const base = filteredTransactions;
    if (!sort.field) return base;

    const compareString = (a, b) => {
      const aa = (a || "").toString().toLowerCase();
      const bb = (b || "").toString().toLowerCase();
      return aa.localeCompare(bb);
    };

    const compareNumber = (a, b) => {
      const na = Number(a) || 0;
      const nb = Number(b) || 0;
      return na - nb;
    };

    const compareDate = (a, b) => {
      const da = a ? new Date(a).getTime() : 0;
      const db = b ? new Date(b).getTime() : 0;
      return da - db;
    };

    const getValue = (t) => {
      switch (sort.field) {
        case "orderDate":
          return t.orderDate;
        case "itemName":
          return t.itemName;
        case "supplierName":
          return t.supplierName;
        case "quantity":
          return t.quantity;
        case "totalCost":
          return t.totalCost;
        case "paymentStatus":
          return t.paymentStatus;
        case "invoice":
          return t.invoiceFileName || t.invoiceUrl || "";
        case "tracking":
          return t.trackingNumber || "";
        default:
          return "";
      }
    };

    const comparator = (a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      let cmp = 0;

      if (sort.field === "orderDate") cmp = compareDate(va, vb);
      else if (["quantity", "totalCost"].includes(sort.field)) cmp = compareNumber(va, vb);
      else cmp = compareString(va, vb);

      return sort.dir === "asc" ? cmp : -cmp;
    };

    return [...base].sort(comparator);
  }, [filteredTransactions, sort]);

  const handleRowClick = (id) => {
    // Navigate to a future transaction detail page
    const qs = supplierNameQuery
      ? `&supplierName=${encodeURIComponent(supplierNameQuery)}`
      : "";
    router.push(`/transaction?id=${id}${qs}`);
  };

  const openTrackingModal = (e, transaction) => {
    // Don't trigger row click
    e.stopPropagation();
    setTrackingEditId(transaction.id);
    setTrackingValue(transaction.trackingNumber || "");
    setTrackingCarrier(transaction.trackingCarrier || "");
    setShowTrackingModal(true);
  };

  const handleSaveTracking = async () => {
    if (!trackingEditId) return;
    if (!accountId) {
      setMessage("Set an account before updating tracking.");
      return;
    }

    try {
      const trimmed = trackingValue.trim();
      const carrier = trackingCarrier.trim();
      const ref = accountDoc(db, accountId, "transactions", trackingEditId);
      await updateDoc(ref, {
        trackingNumber: trimmed || null,
        trackingCarrier: carrier || null,
      });

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === trackingEditId
            ? {
                ...t,
                trackingNumber: trimmed || null,
                trackingCarrier: carrier || null,
              }
            : t
        )
      );

      setShowTrackingModal(false);
      setTrackingEditId(null);
      setTrackingValue("");
      setTrackingCarrier("");
      setMessage("Tracking updated.");
    } catch (err) {
      console.error("Error updating tracking:", err);
      setMessage("Error updating tracking. Check console.");
    }
  };

  function formatDate(date) {
    if (!date) return "--";
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return "--";
    }
  }

  const formatMoney = (amount) => {
    if (!amount) return "$0.00";
    try {
      return amount.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    } catch {
      return `$${amount}`;
    }
  };

  return (
    <AppLayout active="transactions">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Transactions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              View all purchase orders, payment status, and tracking info.
            </p>
          </div>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <p className="text-sm font-medium text-slate-800">
              All transactions
            </p>
            <div
              className={
                showSearch
                  ? "ml-auto flex items-center gap-2 w-full max-w-3xl"
                  : "ml-auto flex items-center justify-end"
              }
            >
              {showSearch ? (
                <>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m15.75 15.75 3.5 3.5m-7-14.75a6.75 6.75 0 1 1 0 13.5 6.75 6.75 0 0 1 0-13.5z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search transactions..."
                      className="w-full text-sm rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  title="Search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15.75 15.75 3.5 3.5m-7-14.75a6.75 6.75 0 1 1 0 13.5 6.75 6.75 0 0 1 0-13.5z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 bg-slate-50">
                  <th className="text-left px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("orderDate")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Date</span>
                      <span className={arrowClass("orderDate")}>
                        {renderSortArrow("orderDate") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("itemName")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Item</span>
                      <span className={arrowClass("itemName")}>
                        {renderSortArrow("itemName") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("supplierName")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Supplier</span>
                      <span className={arrowClass("supplierName")}>
                        {renderSortArrow("supplierName") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-right px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("quantity")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Qty</span>
                      <span className={arrowClass("quantity")}>
                        {renderSortArrow("quantity") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-right px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("totalCost")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Total cost</span>
                      <span className={arrowClass("totalCost")}>
                        {renderSortArrow("totalCost") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("paymentStatus")}
                      className="group inline-flex items-center gap-1 hover:text-slate-700 cursor-pointer"
                    >
                      <span>Payment status</span>
                      <span className={arrowClass("paymentStatus")}>
                        {renderSortArrow("paymentStatus") || "↕"}
                      </span>
                    </button>
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <span>Invoice</span>
                  </th>
                  <th className="text-left px-4 py-2 font-medium">
                    <span>Tracking</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      Loading transactions…
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  sortedTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleRowClick(t.id)}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 align-top text-slate-700">
                        {formatDate(t.orderDate)}
                      </td>

                      {/* Item BEFORE Supplier */}
                      <td className="px-4 py-3 align-top text-slate-900 font-medium">
                        {t.itemName || "—"}
                      </td>

                      {/* Supplier */}
                      <td className="px-4 py-3 align-top text-slate-700">
                        {t.supplierName || "—"}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3 align-top text-right text-slate-700">
                        {t.quantity ?? "—"}
                      </td>

                      {/* Total cost */}
                      <td className="px-4 py-3 align-top text-right text-slate-900 font-medium">
                        {formatMoney(t.totalCost || 0)}
                      </td>

                      {/* Payment status */}
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            t.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : t.paymentStatus === "Partially paid"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-slate-50 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {t.paymentStatus || "Pending"}
                        </span>
                      </td>

                      {/* Invoice */}
                      <td className="px-4 py-3 align-top">
                        {t.invoiceUrl ? (
                          <a
                            href={t.invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 underline-offset-2 hover:underline"
                          >
                            {t.invoiceFileName || "View invoice"}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">--</span>
                        )}
                      </td>

                      {/* Tracking column */}
                      <td className="px-4 py-3 align-top">
                        {t.trackingNumber ? (
                          <a
                            href={getTrackingUrl(t.trackingCarrier, t.trackingNumber)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 underline-offset-2 hover:underline"
                          >
                            {t.trackingNumber}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => openTrackingModal(e, t)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline"
                          >
                            Add tracking
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {trackingValue ? "Update tracking number" : "Add tracking number"}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingEditId(null);
                  setTrackingValue("");
                }}
              >
                ×
              </button>
            </div>

            <label className="block text-xs font-medium text-slate-700 mb-1">
              Carrier
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-3"
              value={trackingCarrier}
              onChange={(e) => setTrackingCarrier(e.target.value)}
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-3"
              value={trackingValue}
              onChange={(e) => setTrackingValue(e.target.value)}
            />

            {trackingValue.trim() && (
              <p className="text-[11px] text-slate-500 mb-3">
                After saving, you can search for this tracking number directly
                with your courier or on Google.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingEditId(null);
                  setTrackingValue("");
                }}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTracking}
                className="text-xs font-medium rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800"
              >
                Save tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

