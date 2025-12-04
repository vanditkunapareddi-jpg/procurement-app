// pages/transaction.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import AppLayout from "../components/AppLayout";
import { getTrackingUrl } from "../lib/tracking";
import { useAccount } from "../lib/accountContext";
import { accountDoc } from "../lib/firestorePaths";

export default function TransactionDetailPage() {
  const router = useRouter();
  const { id, supplierName: supplierNameQuery } = router.query;
  const { accountId, ready } = useAccount();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingValue, setTrackingValue] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [copying, setCopying] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const invoiceInputRef = useRef(null);

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditFilter, setAuditFilter] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    itemName: "",
    supplierName: "",
    quantity: "",
    unitPrice: "",
    shippingCost: "",
    totalCost: "",
    paymentStatus: "",
    amountPaid: "",
    amountDue: "",
    orderDate: "",
    notes: "",
  });

  useEffect(() => {
    if (!showEditModal) return;
    const q = parseFloat(editForm.quantity || 0) || 0;
    const u = parseFloat(editForm.unitPrice || 0) || 0;
    const ship = parseFloat(editForm.shippingCost || 0) || 0;
    const paid = parseFloat(editForm.amountPaid || 0) || 0;

    const total = q * u + ship;
    const due = total - paid;
    const roundedTotal = Number.isFinite(total) ? Number(total.toFixed(2)) : "";
    const roundedDue = Number.isFinite(due) ? Number(due.toFixed(2)) : "";

    setEditForm((prev) => {
      if (prev.totalCost === roundedTotal && prev.amountDue === roundedDue) {
        return prev;
      }
      return {
        ...prev,
        totalCost: roundedTotal,
        amountDue: roundedDue,
      };
    });
  }, [
    showEditModal,
    editForm.quantity,
    editForm.unitPrice,
    editForm.shippingCost,
    editForm.amountPaid,
  ]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
        setShowActionsMenu(false);
      }
    };
    if (showActionsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionsMenu]);

  useEffect(() => {
    if (!id || !ready) return;

    const loadTransaction = async () => {
      if (!accountId) {
        setTransaction(null);
        setMessage("Set an account to load this transaction.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const ref = accountDoc(db, accountId, "transactions", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setMessage("Transaction not found.");
          setTransaction(null);
          return;
        }

        const data = snap.data();
        const resolvedOrderDate =
          normalizeDate(data.orderDate) || normalizeDate(data.createdAt);

        const tx = { id: snap.id, ...data, orderDate: resolvedOrderDate };
        setTransaction(tx);
        setTrackingValue(tx.trackingNumber || "");
        setTrackingCarrier(tx.trackingCarrier || "");
        setEditForm({
          itemName: tx.itemName || "",
          supplierName: tx.supplierName || "",
          quantity: tx.quantity ?? "",
          unitPrice: tx.unitPrice ?? "",
          shippingCost: tx.shippingCost ?? "",
          totalCost: tx.totalCost ?? "",
          paymentStatus: tx.paymentStatus || "",
          amountPaid: tx.amountPaid ?? "",
          amountDue: tx.amountDue ?? "",
          orderDate: toInputDate(resolvedOrderDate),
          notes: tx.notes || "",
        });
      } catch (err) {
        console.error("Error loading transaction:", err);
        setMessage("Error loading transaction. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id, accountId, ready]);

  const formatDate = (date) => {
    if (!date) return "--";
    try {
      const d = new Date(date);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    } catch {
      return "--";
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "--";
    try {
      const d = new Date(date);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const hr12 = hours % 12 === 0 ? 12 : hours % 12;
      return `${mm}/${dd}/${yyyy} ${hr12}:${minutes} ${ampm}`;
    } catch {
      return "--";
    }
  };

  const normalizeDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value?.toDate && typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const toInputDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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

  const auditEvents = useMemo(() => {
    if (!transaction) return [];
    const events = [];

    // Order placed
    const placedDate =
      normalizeDate(transaction.orderDate) ||
      normalizeDate(transaction.createdAt) ||
      null;
    if (placedDate) {
      events.push({
        type: "Order placed",
        detail: `Order created for ${transaction.itemName || "item"}`,
        at: placedDate,
      });
    }

    // Payment status
    if (transaction.paymentStatus) {
      const paidDetail =
        transaction.paymentStatus === "Paid"
          ? `Marked paid (${formatMoney(transaction.amountPaid || 0)})`
          : `Status set to ${transaction.paymentStatus}`;
      events.push({
        type: "Payment",
        detail: paidDetail,
        at:
          normalizeDate(transaction.statusUpdatedAt) ||
          normalizeDate(transaction.updatedAt) ||
          placedDate ||
          null,
      });
    }

    // Tracking
    if (transaction.trackingNumber) {
      events.push({
        type: "Tracking",
        detail: `Tracking added: ${transaction.trackingNumber} (${transaction.trackingCarrier || "carrier N/A"})`,
        at:
          normalizeDate(transaction.updatedAt) ||
          normalizeDate(transaction.createdAt) ||
          placedDate ||
          null,
      });
    }

    // Invoice
    if (transaction.invoiceUrl) {
      events.push({
        type: "Invoice",
        detail: `Invoice uploaded${transaction.invoiceFileName ? ` (${transaction.invoiceFileName})` : ""}`,
        at:
          normalizeDate(transaction.updatedAt) ||
          normalizeDate(transaction.createdAt) ||
          placedDate ||
          null,
      });
    }

    // Notes
    if (transaction.notes) {
      events.push({
        type: "Notes",
        detail: "Notes updated",
        at:
          normalizeDate(transaction.updatedAt) ||
          normalizeDate(transaction.createdAt) ||
          placedDate ||
          null,
      });
    }

    // Sort newest first
    events.sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });

    if (auditFilter.trim()) {
      const term = auditFilter.trim().toLowerCase();
      return events.filter(
        (e) =>
          e.type.toLowerCase().includes(term) ||
          (e.detail || "").toLowerCase().includes(term)
      );
    }

    return events;
  }, [transaction, auditFilter, formatMoney]);

  const handleSaveTracking = async () => {
    if (!id) return;
    if (!accountId) {
      setMessage("Set an account before updating tracking.");
      return;
    }
    try {
      setSavingTracking(true);
      const trimmed = trackingValue.trim();
      const carrier = trackingCarrier.trim();
      const ref = accountDoc(db, accountId, "transactions", id);
      await updateDoc(ref, {
        trackingNumber: trimmed || null,
        trackingCarrier: carrier || null,
      });

      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              trackingNumber: trimmed || null,
              trackingCarrier: carrier || null,
            }
          : prev
      );
      setMessage("Tracking updated.");
      setShowTrackingModal(false);
    } catch (err) {
      console.error("Error updating tracking:", err);
      setMessage("Error updating tracking. Check console.");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleBack = () => {
    const qs =
      typeof supplierNameQuery === "string" && supplierNameQuery.trim()
        ? `?supplierName=${encodeURIComponent(supplierNameQuery)}`
        : "";
    router.push(`/transactions${qs}`);
  };

  const handleOpenTracking = () => {
    setTrackingValue(transaction?.trackingNumber || "");
    setTrackingCarrier(transaction?.trackingCarrier || "");
    setShowTrackingModal(true);
  };

  const handleConfirmBalancePayment = async () => {
    if (!id) return;
    if (!accountId) {
      setMessage("Set an account before updating payment status.");
      return;
    }
    try {
      setSavingEdit(true);
      const ref = accountDoc(db, accountId, "transactions", id);
      const due = transaction?.amountDue || 0;
      const paid = transaction?.amountPaid || 0;
      await updateDoc(ref, {
        paymentStatus: "Paid",
        amountDue: 0,
        amountPaid: paid + due,
      });
      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: "Paid",
              amountDue: 0,
              amountPaid: paid + due,
            }
          : prev
      );
      setMessage("Balance marked as paid.");
      setShowPayModal(false);
    } catch (err) {
      console.error("Error updating payment status:", err);
      setMessage("Error updating payment status. Check console.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseNumber = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  };

  const handleInvoiceUpload = async (file) => {
    if (!id || !file) return;
    if (!accountId) {
      setMessage("Set an account before uploading invoices.");
      return;
    }
    try {
      setUploadingInvoice(true);
      setMessage("");

      const storageBucketConfigured =
        storage?.app?.options?.storageBucket ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

      if (!storageBucketConfigured) {
        setMessage(
          "Invoice upload failed: storage bucket is not configured (set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)."
        );
        setUploadingInvoice(false);
        return;
      }

      const safeName = (file.name || "invoice").replace(/[^\w.-]+/g, "_");
      const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const invoicePath = `invoices/${uniqueKey}-${safeName}`;
      const storageRef = ref(storage, invoicePath);

      await uploadBytes(storageRef, file);
      const invoiceUrl = await getDownloadURL(storageRef);

      const payload = {
        invoiceUrl,
        invoicePath,
        invoiceFileName: file.name || "invoice",
      };
      const refDoc = accountDoc(db, accountId, "transactions", id);
      await updateDoc(refDoc, payload);
      setTransaction((prev) => (prev ? { ...prev, ...payload } : prev));
      setMessage("Invoice uploaded.");
    } catch (err) {
      console.error("Error uploading invoice:", err);
      const errMsg = err?.message || err?.code || "Check console.";
      setMessage(`Error uploading invoice: ${errMsg}`);
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    if (!accountId) {
      setMessage("Set an account before updating transactions.");
      return;
    }
    try {
      setSavingEdit(true);
      const ref = accountDoc(db, accountId, "transactions", id);
      const payload = {
        itemName: editForm.itemName.trim() || null,
        supplierName: editForm.supplierName.trim() || null,
        quantity: parseNumber(editForm.quantity),
        unitPrice: parseNumber(editForm.unitPrice),
        shippingCost: parseNumber(editForm.shippingCost),
        totalCost: parseNumber(editForm.totalCost),
        paymentStatus: editForm.paymentStatus.trim() || null,
        amountPaid: parseNumber(editForm.amountPaid),
        amountDue: parseNumber(editForm.amountDue),
        notes: editForm.notes.trim() || null,
      };

      if (editForm.orderDate) {
        const [y, m, d] = editForm.orderDate.split("-").map(Number);
        const localDate = new Date(y, (m || 1) - 1, d || 1);
        payload.orderDate = Number.isNaN(localDate.getTime())
          ? null
          : localDate;
      } else {
        payload.orderDate = null;
      }

      await updateDoc(ref, payload);

      setTransaction((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : prev
      );
      setMessage("Transaction updated.");
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating transaction:", err);
      setMessage("Error updating transaction. Check console.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!id) return;
    if (!accountId) {
      setMessage("Set an account before deleting transactions.");
      return;
    }
    try {
      setSavingEdit(true);
      const ref = accountDoc(db, accountId, "transactions", id);
      await deleteDoc(ref);
      router.push("/transactions");
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setMessage("Error deleting transaction. Check console.");
    } finally {
      setSavingEdit(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyTracking = async () => {
    if (!transaction?.trackingNumber) return;
    try {
      setCopying(true);
      await navigator.clipboard.writeText(transaction.trackingNumber);
      setMessage("Tracking number copied to clipboard.");
    } catch (err) {
      console.error("Error copying tracking number:", err);
      setMessage("Could not copy tracking number.");
    } finally {
      setCopying(false);
    }
  };

  const orderPlacedDate =
    normalizeDate(transaction?.orderDate) ||
    normalizeDate(transaction?.createdAt);
  const statusChangeDate =
    normalizeDate(transaction?.statusUpdatedAt) ||
    normalizeDate(transaction?.updatedAt) ||
    orderPlacedDate;

  return (
    <>
      <AppLayout active="transactions">
        <main className="transaction-page mx-auto max-w-3xl px-6 py-8">
        {/* Header + back link */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"
            >
              {"<"} Back to transactions
            </button>
            <h2 className="text-xl font-semibold text-slate-900">
              Transaction details
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              View purchase order details and update tracking.
            </p>
          </div>
          <div className="relative" ref={actionsMenuRef}>
            <button
              type="button"
              onClick={() => setShowActionsMenu((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
            >
              <span className="sr-only">Open actions</span>
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="5" cy="12" r="1.2" />
                <circle cx="12" cy="12" r="1.2" />
                <circle cx="19" cy="12" r="1.2" />
              </svg>
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setShowActionsMenu(false);
                    setShowEditModal(true);
                  }}
                >
                  Edit transaction
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    setShowActionsMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete transaction
                </button>
              </div>
            )}
          </div>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading transaction...</p>
        ) : !transaction ? (
          <p className="text-sm text-slate-500">
            Transaction could not be found.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
              {/* Supplier & Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Item</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {transaction.itemName || "--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Supplier</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {transaction.supplierName || "--"}
                  </p>
                </div>
              </div>

              {/* Quantities & pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Quantity</p>
                  <p className="text-sm text-slate-900 mt-1">
                    {transaction.quantity ?? "--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Unit price
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {formatMoney(transaction.unitPrice || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Shipping cost (total)
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {formatMoney(transaction.shippingCost || 0)}
                  </p>
                </div>
              </div>

              {/* Totals & payment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Total cost
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {formatMoney(transaction.totalCost || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Payment status
                  </p>
                  <p className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        transaction.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : transaction.paymentStatus === "Partially paid"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {transaction.paymentStatus || "Pending"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Amount paid / due
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {formatMoney(transaction.amountPaid || 0)}{" "}
                    <span className="text-xs text-slate-500">paid</span>
                  </p>
                  <p className="text-sm text-slate-900">
                    {formatMoney(transaction.amountDue || 0)}{" "}
                    <span className="text-xs text-slate-500">due</span>
                  </p>
                  {(transaction.amountDue || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPayModal(true)}
                      className="mt-2 inline-flex items-center rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800"
                    >
                      Pay balance
                    </button>
                  )}
                </div>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Order date
                  </p>
                  <p className="text-sm text-slate-900 mt-1">
                    {formatDate(orderPlacedDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  <p
                    className="text-xs text-slate-900 mt-1 truncate"
                    title={transaction.notes || "No notes"}
                  >
                    {transaction.notes || "--"}
                  </p>
                </div>
              </div>

              {/* Invoice */}
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500">Invoice</p>
                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInvoiceUpload(file);
                    }
                    e.target.value = "";
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {transaction.invoiceUrl ? (
                    <a
                      href={transaction.invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:border-indigo-200 hover:text-indigo-800"
                    >
                      {transaction.invoiceFileName || "View invoice"}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-700">No invoice uploaded.</span>
                  )}
                  <button
                    type="button"
                    onClick={() => invoiceInputRef.current?.click()}
                    disabled={uploadingInvoice}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {uploadingInvoice ? "Uploading..." : "Upload invoice"}
                  </button>
                </div>
              </div>

              {/* Tracking section (summary + edit action) */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 text-xs">
                        —
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        Shipment details
                      </span>
                      {transaction.trackingCarrier && (
                        <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          {transaction.trackingCarrier}
                        </span>
                      )}
                      {transaction.trackingNumber ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={getTrackingUrl(
                              transaction.trackingCarrier,
                              transaction.trackingNumber
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 underline-offset-2"
                          >
                            {transaction.trackingNumber}
                          </a>
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={handleCopyTracking}
                              disabled={copying}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
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
                            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-hover:translate-y-0">
                              Copy to clipboard
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-slate-800" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">
                          No tracking added yet.
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenTracking}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-full border border-slate-300 px-3 py-1 bg-white hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  </div>
                  {transaction.trackingNumber && (
                    <p className="text-[11px] text-slate-500 pl-9">
                      Click the tracking number to open the courier page.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Timeline sidebar */}
            <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Timeline</p>
                <button
                  type="button"
                  onClick={() => setShowAuditLog(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View audit log
                </button>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Order placed
                  </p>
                  <p className="text-slate-900 mt-1">
                    {formatDate(orderPlacedDate)}
                  </p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500">
                    Last status change
                  </p>
                  <p className="text-slate-900 mt-1">
                    {transaction.paymentStatus || "Pending"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {`As of ${formatDateTime(
                      statusChangeDate
                    )}`}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Tracking modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tracking</p>
                <p className="text-xs text-slate-500 mt-1">
                  Update the carrier and tracking number for this shipment.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => setShowTrackingModal(false)}
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Carrier
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
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
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tracking number
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  placeholder="Enter tracking number"
                  value={trackingValue}
                  onChange={(e) => setTrackingValue(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTracking}
                disabled={savingTracking}
                className="text-xs font-medium rounded-lg px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {savingTracking ? "Saving..." : "Save tracking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit transaction modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Edit transaction
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Update core transaction details and amounts.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.itemName}
                  onChange={(e) => handleEditChange("itemName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.supplierName}
                  onChange={(e) =>
                    handleEditChange("supplierName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.quantity}
                  onChange={(e) => handleEditChange("quantity", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit price
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.unitPrice}
                  onChange={(e) => handleEditChange("unitPrice", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shipping cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.shippingCost}
                  onChange={(e) =>
                    handleEditChange("shippingCost", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={editForm.totalCost}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment status
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={editForm.paymentStatus}
                  onChange={(e) =>
                    handleEditChange("paymentStatus", e.target.value)
                  }
                >
                  <option value="">Select status</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially paid">Partially paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount paid
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.amountPaid}
                  onChange={(e) =>
                    handleEditChange("amountPaid", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount due
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={editForm.amountDue}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.orderDate}
                  onChange={(e) =>
                    handleEditChange("orderDate", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.notes}
                  onChange={(e) => handleEditChange("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="text-xs font-medium rounded-lg px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">
              Delete transaction?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={savingEdit}
                className="text-xs font-semibold rounded-lg px-4 py-2 bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay balance modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">
              Confirm balance payment
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Amount due: {formatMoney(transaction?.amountDue || 0)}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50 cursor-pointer"
                onClick={() => setShowPayModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBalancePayment}
                disabled={savingEdit}
                className="text-xs font-semibold rounded-lg px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
              >
                Confirm balance payment
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Audit log side panel */}
      {showAuditLog && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
          <div className="w-full max-w-sm h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="px-4 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  Audit log
                </p>
                <p className="text-sm text-slate-500">
                  Timeline of changes for this order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditLog(false)}
                className="text-slate-500 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Filter
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  placeholder="Search events..."
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {auditEvents.length === 0 ? (
                <p className="text-base text-slate-500">
                  No events to display.
                </p>
              ) : (
                auditEvents.map((ev, idx) => (
                  <div key={idx} className="pl-3 relative">
                    <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-slate-300" />
                    <p className="text-sm font-semibold text-slate-900">
                      {ev.type}
                    </p>
                    <p className="text-sm text-slate-600">{ev.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDateTime(ev.at) || "--"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </AppLayout>
      <style jsx global>{`
        .transaction-page button,
        .transaction-page .fixed button {
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
