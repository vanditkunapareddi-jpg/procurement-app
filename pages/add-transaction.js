// pages/add-transaction.js
import { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import AppLayout from "../components/AppLayout";

function Dropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full inline-flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <span className="ml-2 text-slate-500">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-300 bg-white shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              No options
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 ${
                  opt.value === value ? "bg-slate-50 font-semibold" : ""
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AddTransaction() {
  // Dropdown data
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);

  // Selected IDs
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");

  // Transaction fields
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceFileName, setInvoiceFileName] = useState("");
  const invoiceInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Quick-add supplier
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [qaSupplierName, setQaSupplierName] = useState("");
  const [qaSupplierEmail, setQaSupplierEmail] = useState("");

  // Quick-add item (folder + item name)
  const [showAddItem, setShowAddItem] = useState(false);
  const [qaFolderId, setQaFolderId] = useState("");
  const [qaItemName, setQaItemName] = useState("");
  const [qaCreateFolder, setQaCreateFolder] = useState(false);
  const [qaNewFolderName, setQaNewFolderName] = useState("");

  // ---------- Load suppliers, items, folders ----------

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supSnap, itemSnap, folderSnap] = await Promise.all([
          getDocs(collection(db, "suppliers")),
          getDocs(collection(db, "items")),
          getDocs(collection(db, "itemFolders")),
        ]);

        const supData = supSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        supData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setSuppliers(supData);

        const itemData = itemSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Filter out items with missing or whitespace-only names so the
        // dropdown doesn't render blank-looking entries.
        const filtered = itemData.filter(
          (i) => (i.name || "").toString().trim() !== ""
        );
        // Deduplicate by trimmed name (keeps first occurrence) to avoid
        // duplicate labels in the dropdown.
        const dedupedByName = Object.values(
          filtered.reduce((acc, cur) => {
            const key = (cur.name || "").toString().trim();
            if (!acc[key]) acc[key] = cur;
            return acc;
          }, {})
        );
        dedupedByName.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setItems(dedupedByName);

        const folderData = folderSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        folderData.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        setFolders(folderData);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
        setMessage("Error loading suppliers/items. Check console.");
      }
    };

    loadData();
  }, []);

  const selectedSupplier =
    suppliers.find((s) => s.id === supplierId) || null;
  const selectedItem = items.find((i) => i.id === itemId) || null;

  const parseNumber = (value) => {
    if (!value) return 0;
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  };

  const qtyNum = parseNumber(quantity);
  const unitPriceNum = parseNumber(unitPrice);
  const shippingCostNum = parseNumber(shippingCost);
  const baseTotal = qtyNum * unitPriceNum + shippingCostNum || 0;

  let computedAmountPaid = 0;
  let computedAmountDue = 0;

  if (paymentStatus === "Paid") {
    computedAmountPaid = baseTotal;
    computedAmountDue = 0;
  } else if (paymentStatus === "Partially paid") {
    const partial = parseNumber(amountPaid);
    computedAmountPaid = partial;
    computedAmountDue = Math.max(baseTotal - partial, 0);
  } else {
    // Pending
    computedAmountPaid = 0;
    computedAmountDue = baseTotal;
  }

  const handleInvoiceChange = (e) => {
    const file = e.target.files?.[0];
    setInvoiceFile(file || null);
    setInvoiceFileName(file ? file.name : "");
  };

  // ---------- Submit Transaction ----------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const storageBucketConfigured =
      storage?.app?.options?.storageBucket ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!supplierId) {
      setMessage("Please select a supplier.");
      return;
    }
    if (!itemId) {
      setMessage("Please select an item.");
      return;
    }
    if (!qtyNum || !unitPriceNum) {
      setMessage("Quantity and unit price are required.");
      return;
    }

    try {
      setSaving(true);

      let invoiceUrl = null;
      let invoicePath = null;
      let invoiceOriginalName = null;

      if (invoiceFile) {
        if (!storageBucketConfigured) {
          // Continue saving the transaction, but let the user know the invoice was skipped.
          setMessage(
            "Invoice upload skipped: storage bucket is not configured (set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)."
          );
        } else {
          try {
            const safeName = (invoiceFile.name || "invoice").replace(/[^\w.-]+/g, "_");
            const uniqueKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            invoicePath = `invoices/${uniqueKey}-${safeName}`;
            const storageRef = ref(storage, invoicePath);
            await uploadBytes(storageRef, invoiceFile);
            invoiceUrl = await getDownloadURL(storageRef);
            invoiceOriginalName = invoiceFile.name || "invoice";
          } catch (uploadErr) {
            console.error("Error uploading invoice:", uploadErr);
            // Keep saving the transaction even if invoice upload fails.
            setMessage(
              `Invoice upload failed; transaction saved without invoice. ${uploadErr?.message || ""}`
            );
            invoiceUrl = null;
            invoicePath = null;
            invoiceOriginalName = null;
          }
        }
      }

      const payload = {
        supplierId,
        supplierName: selectedSupplier?.name || "",
        itemId,
        itemName: selectedItem?.name || "",
        quantity: qtyNum,
        unitPrice: unitPriceNum,
        shippingCost: shippingCostNum, // total shipping cost
        totalCost: baseTotal,
        orderDate: orderDate ? new Date(orderDate) : null,
        paymentStatus,
        amountPaid: computedAmountPaid,
        amountDue: computedAmountDue,
        notes: notes.trim(),
        invoiceUrl: invoiceUrl || null,
        invoicePath: invoicePath || null,
        invoiceFileName: invoiceOriginalName || null,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "transactions"), payload);

      setMessage("Transaction saved.");

      // Reset form
      setSupplierId("");
      setItemId("");
      setQuantity("");
      setUnitPrice("");
      setShippingCost("");
      setOrderDate("");
      setPaymentStatus("Pending");
      setAmountPaid("");
      setNotes("");
      setInvoiceFile(null);
      setInvoiceFileName("");
    } catch (err) {
      console.error("Error saving transaction:", err);
      const errMsg =
        err?.message ||
        err?.code ||
        "Error saving transaction. Please check console.";
      setMessage(`Error saving transaction: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Quick-add Supplier ----------

  const resetQaSupplier = () => {
    setQaSupplierName("");
    setQaSupplierEmail("");
  };

  const handleSaveQuickSupplier = async () => {
    if (!qaSupplierName.trim()) {
      setMessage("Supplier name is required for quick add.");
      return;
    }

    try {
      const payload = {
        name: qaSupplierName.trim(),
        email: qaSupplierEmail.trim(),
        createdAt: new Date(),
      };
      const ref = await addDoc(collection(db, "suppliers"), payload);

      const newSupplier = { id: ref.id, ...payload };
      setSuppliers((prev) =>
        [...prev, newSupplier].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        )
      );
      setSupplierId(ref.id);
      resetQaSupplier();
      setShowAddSupplier(false);
    } catch (err) {
      console.error("Error adding supplier:", err);
      setMessage("Error adding supplier. Check console.");
    }
  };

  // ---------- Quick-add Item (folder + item name) ----------

  const resetQaItem = () => {
    setQaFolderId("");
    setQaItemName("");
    setQaCreateFolder(false);
    setQaNewFolderName("");
  };

  const handleSaveQuickItem = async () => {
    if (qaCreateFolder) {
      if (!qaNewFolderName.trim()) {
        setMessage("Folder name is required when creating a new folder.");
        return;
      }
    } else {
      if (!qaFolderId) {
        setMessage("Please choose a folder for the new item.");
        return;
      }
    }

    if (!qaItemName.trim()) {
      setMessage("Item name is required.");
      return;
    }

    try {
      let folderId = qaFolderId;
      let folderName = "";

      if (qaCreateFolder) {
        // create the folder first
        const fPayload = {
          name: qaNewFolderName.trim(),
          createdAt: new Date(),
        };
        const fRef = await addDoc(collection(db, "itemFolders"), fPayload);
        folderId = fRef.id;
        folderName = fPayload.name;

        const newFolder = { id: folderId, ...fPayload };
        setFolders((prev) =>
          [...prev, newFolder].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
      } else {
        const folderDoc = await getDoc(doc(db, "itemFolders", folderId));
        folderName = folderDoc.exists() ? folderDoc.data().name || "" : "";
      }

      const payload = {
        name: qaItemName.trim(),
        folderId,
        folderName,
        createdAt: new Date(),
      };

      const ref = await addDoc(collection(db, "items"), payload);
      const newItem = { id: ref.id, ...payload };

      setItems((prev) =>
        [...prev, newItem].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      );
      setItemId(ref.id);
      resetQaItem();
      setShowAddItem(false);
    } catch (err) {
      console.error("Error adding item:", err);
      setMessage("Error adding item. Check console.");
    }
  };

  return (
    <AppLayout active="add-transaction">
      <main className="add-transaction-page mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Add transaction
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Record a new purchase order with supplier, item, and cost details.
          </p>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Supplier + Item */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier column */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier
                </label>
                <Dropdown
                  value={supplierId}
                  onChange={setSupplierId}
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name || "(untitled)",
                  }))}
                  placeholder="Select supplier"
                />
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(true)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  + Add new supplier
                </button>

                {/* INLINE quick-add supplier */}
                {showAddSupplier && (
                  <div className="mt-3 border border-dashed border-slate-300 rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Quick add supplier
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          resetQaSupplier();
                          setShowAddSupplier(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Supplier name
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          value={qaSupplierName}
                          onChange={(e) =>
                            setQaSupplierName(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Supplier email (optional)
                        </label>
                        <input
                          type="email"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          value={qaSupplierEmail}
                          onChange={(e) =>
                            setQaSupplierEmail(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleSaveQuickSupplier}
                        className="inline-flex items-center rounded-lg bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 hover:bg-slate-800"
                      >
                        Save supplier
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Item column */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item
                </label>
                <Dropdown
                  value={itemId}
                  onChange={setItemId}
                  options={items.map((i) => {
                    const name = (i.name || "").toString().trim();
                    return {
                      value: i.id,
                      label: name || "(untitled item)",
                    };
                  })}
                  placeholder="Select item"
                />
                <button
                  type="button"
                  onClick={() => setShowAddItem(true)}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  + Add new item
                </button>

                {/* INLINE quick-add item */}
                {showAddItem && (
                  <div className="mt-3 border border-dashed border-slate-300 rounded-2xl bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-800">
                        Quick add item
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          resetQaItem();
                          setShowAddItem(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Folder
                        </label>
                        <div className="flex items-center gap-3">
                          <select
                            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={qaFolderId}
                            onChange={(e) => setQaFolderId(e.target.value)}
                            disabled={qaCreateFolder}
                          >
                            <option value="">Choose existing folder…</option>
                            {folders.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>

                          <label className="text-[11px] flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-3 h-3"
                              checked={qaCreateFolder}
                              onChange={(e) => setQaCreateFolder(e.target.checked)}
                            />
                            <span className="text-xs text-slate-500">Create new folder</span>
                          </label>
                        </div>

                        {qaCreateFolder && (
                          <div className="mt-2">
                            <input
                              type="text"
                              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                              placeholder="New folder name"
                              value={qaNewFolderName}
                              onChange={(e) => setQaNewFolderName(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Item name
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          placeholder="e.g. Small mailers"
                          value={qaItemName}
                          onChange={(e) =>
                            setQaItemName(e.target.value)
                          }
                        />
                        <p className="mt-1 text-[10px] text-slate-500">
                          Pick an existing name from the list or type a new
                          one.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleSaveQuickItem}
                        className="inline-flex items-center rounded-lg bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 hover:bg-slate-800"
                      >
                        Save item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity / unit price / shipping */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shipping cost (total)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>
            </div>

            {/* Dates + totals + payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Order date
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total cost
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 text-slate-900"
                  value={
                    baseTotal
                      ? baseTotal.toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 2,
                        })
                      : "$0.00"
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment status
                </label>
                <Dropdown
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  options={[
                    { value: "Pending", label: "Pending" },
                    { value: "Partially paid", label: "Partially paid" },
                    { value: "Paid", label: "Paid" },
                  ]}
                  placeholder="Select status"
                />

                {paymentStatus === "Partially paid" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Amount paid
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Remaining due will be calculated automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes + Invoice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-11 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Invoice (optional)
                </label>
                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleInvoiceChange}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => invoiceInputRef.current?.click()}
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Upload invoice
                  </button>
                  {invoiceFileName ? (
                    <span className="text-[11px] text-slate-600">
                      Selected: {invoiceFileName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      PDF or image
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save transaction"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <style jsx global>{`
        .add-transaction-page button {
          cursor: pointer;
        }
      `}</style>
    </AppLayout>
  );
}
