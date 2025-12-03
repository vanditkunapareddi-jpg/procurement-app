// pages/suppliers.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";

export default function Suppliers() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copyingId, setCopyingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // form fields
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [pocName, setPocName] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [pocPhone, setPocPhone] = useState("");
  const [altEmails, setAltEmails] = useState([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);

  const resetForm = () => {
    setName("");
    setWebsite("");
    setPocName("");
    setPocEmail("");
    setPocPhone("");
    setAltEmails([]);
    setAddress("");
    setCity("");
    setStateRegion("");
    setCountry("");
    setZipcode("");
    setNotes("");
    setEditingId(null);
    setAddStep(1);
  };

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "suppliers"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // sort alphabetically by name
        data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setSuppliers(data);
      } catch (err) {
        console.error("Error loading suppliers:", err);
        setMessage("Error loading suppliers. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const handleAddAltEmail = () => {
    setAltEmails((prev) => [...prev, ""]);
  };

  const handleAltEmailChange = (index, value) => {
    setAltEmails((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Supplier name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      website: website.trim(),
      pocName: pocName.trim(),
      pocEmail: pocEmail.trim(),
      pocPhone: pocPhone.trim(),
      altEmails: altEmails
        .map((e) => e.trim())
        .filter((e) => e.length > 0),
      address: address.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      country: country.trim(),
      zipcode: zipcode.trim(),
      notes: notes.trim(),
    };

    try {
      setSaving(true);

      if (editingId) {
        const ref = doc(db, "suppliers", editingId);
        await updateDoc(ref, payload);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
        );
        setMessage("Supplier updated.");
      } else {
        const ref = await addDoc(collection(db, "suppliers"), {
          ...payload,
          createdAt: new Date(),
        });
        setSuppliers((prev) => [...prev, { id: ref.id, ...payload }]);
        setMessage("Supplier added.");
      }

      resetForm();
      setShowForm(false);
      setShowAddModal(false);
    } catch (err) {
      console.error("Error saving supplier:", err);
      setMessage("Error saving supplier.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (email, id) => {
    if (!email) return;
    try {
      setCopyingId(id);
      await navigator.clipboard.writeText(email);
      setMessage("Email copied to clipboard.");
      setTimeout(() => setMessage(""), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
      setMessage("Failed to copy email.");
    } finally {
      setCopyingId(null);
    }
  };

  const startEdit = (supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name || "");
    setWebsite(supplier.website || "");
    setPocName(supplier.pocName || "");
    setPocEmail(supplier.pocEmail || "");
    setPocPhone(supplier.pocPhone || "");
    setAltEmails(supplier.altEmails || []);
    setAddress(supplier.address || "");
    setCity(supplier.city || "");
    setStateRegion(supplier.state || "");
    setCountry(supplier.country || "");
    setZipcode(supplier.zipcode || "");
    setNotes(supplier.notes || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppLayout active="suppliers">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Store supplier details, points of contact, and alternative emails.
          </p>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {/* Collapsible form */}
        <section className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Add new supplier
              </p>
              <p className="text-xs text-slate-500">
                Click the button to open the multi-step form.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800"
            >
              + Add supplier
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="px-4 py-4 border-t border-slate-100 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supplier name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Supplier website
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    POC name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={pocName}
                    onChange={(e) => setPocName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    POC email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={pocEmail}
                    onChange={(e) => setPocEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    POC phone
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={pocPhone}
                    onChange={(e) => setPocPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alternative emails
                </label>
                <div className="space-y-2">
                  {altEmails.map((val, idx) => (
                    <input
                      key={idx}
                      type="email"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      placeholder="cc@example.com"
                      value={val}
                      onChange={(e) =>
                        handleAltEmailChange(idx, e.target.value)
                      }
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAltEmail}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    + Add email
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-20 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-20 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-xs font-medium rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update supplier"
                    : "Save supplier"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Add supplier modal (multi-step) */}
        {showAddModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Add new supplier
                  </p>
                  <p className="text-xs text-slate-500">
                    Step {addStep} of 2
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(false);
                  }}
                  className="text-slate-500 hover:text-slate-700 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  if (addStep === 1) {
                    e.preventDefault();
                    setAddStep(2);
                  } else {
                    handleSubmit(e);
                  }
                }}
                className="space-y-4"
              >
                {addStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Supplier name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Supplier website
                        </label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          State / Province
                        </label>
                        <input
                          type="text"
                          value={stateRegion}
                          onChange={(e) => setStateRegion(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Zip / Postal code
                        </label>
                        <input
                          type="text"
                          value={zipcode}
                          onChange={(e) => setZipcode(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {addStep === 2 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          POC name
                        </label>
                        <input
                          type="text"
                          value={pocName}
                          onChange={(e) => setPocName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          POC email
                        </label>
                        <input
                          type="email"
                          value={pocEmail}
                          onChange={(e) => setPocEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          POC phone
                        </label>
                        <input
                          type="tel"
                          value={pocPhone}
                          onChange={(e) => setPocPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Alternative emails
                        </label>
                        <div className="space-y-2">
                          {altEmails.map((email, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                  handleAltEmailChange(idx, e.target.value)
                                }
                                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setAltEmails((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                aria-label="Remove alternative email"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddAltEmail}
                            className="text-xs text-indigo-700 hover:text-indigo-800"
                          >
                            + Add alternative email
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  {addStep === 2 ? (
                    <button
                      type="button"
                      onClick={() => setAddStep(1)}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      ← Back
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowAddModal(false);
                      }}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
                    >
                      {addStep === 1
                        ? "Next"
                        : saving
                        ? "Saving…"
                        : "Save supplier"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Suppliers table */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800">All suppliers</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="text-left px-4 py-2 font-medium w-1/4">Name</th>
                  <th className="text-left px-4 py-2 font-medium w-1/4">
                    POC Email
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-1/5">POC</th>
                  <th className="text-left px-4 py-2 font-medium w-1/4">
                    Notes
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      No suppliers yet. Use "Add supplier" above to create one.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 align-top">
                        {s.name ? (
                          <Link
                            href={`/supplier?id=${s.id}`}
                            className="flex items-center gap-1 text-slate-900 font-medium hover:underline"
                          >
                            <span>{s.name}</span>
                          </Link>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{s.pocEmail || "--"}</span>
                          {s.pocEmail && (
                            <div className="relative group">
                              <button
                                type="button"
                                onClick={() => handleCopy(s.pocEmail, s.id)}
                                disabled={copyingId === s.id}
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
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {s.pocName ? (
                          <div>
                            <div>{s.pocName}</div>
                            {s.pocEmail && (
                              <div className="text-[11px] text-slate-500">
                                {s.pocEmail}
                              </div>
                            )}
                            {s.pocPhone && (
                              <div className="text-[11px] text-slate-500">
                                {s.pocPhone}
                              </div>
                            )}
                          </div>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {s.notes || "--"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
