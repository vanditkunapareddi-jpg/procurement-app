// pages/suppliers.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";
import { useAccount } from "../lib/accountContext";
import { accountCollection, accountDoc } from "../lib/firestorePaths";

export default function Suppliers() {
  const router = useRouter();
  const { accountId, ready } = useAccount();

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
  const [category, setCategory] = useState("");
  const [categoryChoice, setCategoryChoice] = useState("");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [status, setStatus] = useState("");
  const [altEmails, setAltEmails] = useState([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [statFilter, setStatFilter] = useState("total");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenuPosition, setOpenMenuPosition] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  const resetForm = () => {
    setName("");
    setWebsite("");
    setPocName("");
    setPocEmail("");
    setPocPhone("");
    setCategory("");
    setCategoryChoice("");
    setCategoryCustom("");
    setStatus("");
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
      if (!ready) return;
      if (!accountId) {
        setSuppliers([]);
        setLoading(false);
        setMessage("Set an account to load suppliers.");
        return;
      }
      try {
        setLoading(true);
        const snap = await getDocs(accountCollection(db, accountId, "suppliers"));
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
  }, [accountId, ready]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!openMenuId) return;
      if (!(event.target instanceof Element)) return;
      if (
        event.target.closest("[data-actions-menu]") ||
        event.target.closest("[data-actions-trigger]")
      ) {
        return;
      }
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const openSupplier = openMenuId
    ? suppliers.find((supplier) => supplier.id === openMenuId)
    : null;

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
    e?.preventDefault?.();
    setMessage("");

    if (!name.trim()) {
      setMessage("Supplier name is required.");
      return;
    }
    if (!accountId) {
      setMessage("Set an account before saving.");
      return;
    }

    const payload = {
      name: name.trim(),
      website: website.trim(),
      pocName: pocName.trim(),
      pocEmail: pocEmail.trim(),
      pocPhone: pocPhone.trim(),
      category: category.trim(),
      status: status.trim(),
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
        const ref = accountDoc(db, accountId, "suppliers", editingId);
        await updateDoc(ref, payload);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
        );
        setMessage("Supplier updated.");
      } else {
        const ref = await addDoc(accountCollection(db, accountId, "suppliers"), {
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
    setCategory(supplier.category || "");
    setStatus(supplier.status || "");
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

  const handleArchive = async (supplier) => {
    if (!accountId) return;
    try {
      const ref = accountDoc(db, accountId, "suppliers", supplier.id);
      await updateDoc(ref, { status: "Archived" });
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier.id ? { ...s, status: "Archived" } : s
        )
      );
      setMessage("Supplier archived.");
    } catch (err) {
      console.error("Error archiving supplier:", err);
      setMessage("Error archiving supplier.");
    }
  };

  const handleUnarchive = async (supplier) => {
    if (!accountId) return;
    try {
      const ref = accountDoc(db, accountId, "suppliers", supplier.id);
      await updateDoc(ref, { status: "Active" });
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supplier.id ? { ...s, status: "Active" } : s
        )
      );
      setMessage("Supplier unarchived.");
    } catch (err) {
      console.error("Error unarchiving supplier:", err);
      setMessage("Error unarchiving supplier.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !accountId) return;
    try {
      const ref = accountDoc(db, accountId, "suppliers", deleteTarget.id);
      await deleteDoc(ref);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setMessage("Supplier deleted.");
    } catch (err) {
      console.error("Error deleting supplier:", err);
      setMessage("Error deleting supplier.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const normalized = (value) => (value || "").toLowerCase().trim();
  const statusLabel = (supplier) => supplier.status || "Active";
  const categoryLabel = (supplier) => supplier.category || "General";
  const locationLabel = (supplier) => {
    const cityPart = supplier.city ? `${supplier.city}, ` : "";
    const regionPart = supplier.state ? `${supplier.state} ` : "";
    return `${cityPart}${regionPart}${supplier.country || ""}`.trim();
  };

  const searchMatches = (supplier) => {
    if (!searchQuery.trim()) return true;
    const query = normalized(searchQuery);
    return [
      supplier.name,
      supplier.pocName,
      supplier.pocEmail,
      supplier.pocPhone,
      supplier.website,
    ].some((field) => normalized(field).includes(query));
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = searchMatches(supplier);
    const matchesCategory =
      selectedCategory === "All" ||
      categoryLabel(supplier) === selectedCategory;
    const matchesStatus =
      selectedStatus === "All" || statusLabel(supplier) === selectedStatus;
    const matchesLocation =
      selectedLocation === "All" ||
      (supplier.country || "--") === selectedLocation;
    const countryValue = normalized(supplier.country);
    const isInternational =
      countryValue && !["us", "usa", "united states"].includes(countryValue);
    const missingInfo = [
      supplier.pocName,
      supplier.pocEmail,
      supplier.pocPhone,
      supplier.address,
      supplier.city,
      supplier.state,
      supplier.country,
      supplier.zipcode,
    ].some((value) => !value || !value.trim());
    const matchesStat =
      statFilter === "total" ||
      (statFilter === "active" && statusLabel(supplier) === "Active") ||
      (statFilter === "international" && isInternational) ||
      (statFilter === "missing" && missingInfo);
    const statusValue = statusLabel(supplier);
    const archiveAllowed =
      statusValue !== "Archived" || selectedStatus === "Archived";
    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesLocation &&
      archiveAllowed &&
      matchesStat
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedSuppliers = filteredSuppliers.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );

  const supplierStats = (() => {
    const total = suppliers.length;
    const active = suppliers.filter(
      (supplier) => statusLabel(supplier) === "Active"
    ).length;
    const international = suppliers.filter((supplier) => {
      const country = normalized(supplier.country);
      return country && !["us", "usa", "united states"].includes(country);
    }).length;
    const missingInfo = suppliers.filter((supplier) =>
      [
        supplier.pocName,
        supplier.pocEmail,
        supplier.pocPhone,
        supplier.address,
        supplier.city,
        supplier.state,
        supplier.country,
        supplier.zipcode,
      ].some((value) => !value || !value.trim())
    ).length;
    return { total, active, international, missingInfo };
  })();

  const uniqueCategories = Array.from(
    new Set(suppliers.map((supplier) => categoryLabel(supplier)))
  ).sort((a, b) => a.localeCompare(b));
  const uniqueStatuses = Array.from(
    new Set(suppliers.map((supplier) => statusLabel(supplier)))
  ).sort((a, b) => a.localeCompare(b));
  const statusOptions = Array.from(
    new Set([...uniqueStatuses.filter((s) => s !== "Archived"), "Archived"])
  );
  const uniqueCountries = Array.from(
    new Set(suppliers.map((supplier) => supplier.country || "--"))
  ).sort((a, b) => a.localeCompare(b));
  return (
    <AppLayout active="suppliers">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 cursor-pointer"
            >
              + Add supplier
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <section className="mb-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Total suppliers", value: supplierStats.total, key: "total" },
            { label: "Active", value: supplierStats.active, key: "active" },
            { label: "International", value: supplierStats.international, key: "international" },
            { label: "Missing info", value: supplierStats.missingInfo, key: "missing" },
          ].map((stat) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => {
                setStatFilter(stat.key);
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedStatus("All");
                setSelectedLocation("All");
                setCurrentPage(1);
              }}
              className={`rounded-xl border bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer ${
                statFilter === stat.key
                  ? "border-slate-300 ring-2 ring-slate-900/10"
                  : "border-slate-200"
              }`}
            >
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-lg font-semibold text-slate-900">
                {stat.value}
              </p>
            </button>
          ))}
        </section>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Packaging, Raw materials"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Trial">Trial</option>
                    <option value="On hold">On hold</option>
                  </select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Zip / Postal code
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    placeholder="Zip"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alternative emails
                </label>
                <div className="space-y-2">
                  {altEmails.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                        placeholder="cc@example.com"
                        value={val}
                        onChange={(e) =>
                          handleAltEmailChange(idx, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAltEmails((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Remove
                      </button>
                    </div>
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

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
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
                  {saving ? "Saving..." : "Update supplier"}
                </button>
              </div>
            </form>
          )}

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
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
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="px-5 py-4 space-y-4"
                >
                  {addStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Supplier name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Category
                          </label>
                          <select
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={categoryChoice}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCategoryChoice(next);
                              if (next === "__new__") {
                                setCategory("");
                                setCategoryCustom("");
                              } else {
                                setCategory(next);
                                setCategoryCustom("");
                              }
                            }}
                          >
                            <option value="">Select category</option>
                            {uniqueCategories.map((existing) => (
                              <option key={existing} value={existing}>
                                {existing}
                              </option>
                            ))}
                            <option value="__new__">Add new category...</option>
                          </select>
                          {categoryChoice === "__new__" && (
                            <input
                              type="text"
                              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                              placeholder="New category"
                              value={categoryCustom}
                              onChange={(e) => {
                                setCategoryCustom(e.target.value);
                                setCategory(e.target.value);
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Status
                          </label>
                          <select
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                          >
                            <option value="">Select status</option>
                            <option value="Active">Active</option>
                            <option value="Trial">Trial</option>
                            <option value="On hold">On hold</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            State / Province
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={stateRegion}
                            onChange={(e) => setStateRegion(e.target.value)}
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Zip / Postal code
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                            value={zipcode}
                            onChange={(e) => setZipcode(e.target.value)}
                            placeholder="Zip"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {addStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <div key={idx} className="flex items-center gap-2">
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
                                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddAltEmail}
                              className="text-xs text-indigo-700 hover:text-indigo-800 cursor-pointer"
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
                        className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        Back
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
                        className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      {addStep === 1 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!name.trim()) return;
                            setAddStep(2);
                          }}
                          disabled={!name.trim()}
                          className="inline-flex items-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={handleSubmit}
                          className="inline-flex items-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
                        >
                          {saving ? "Saving..." : "Save supplier"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

        {/* Suppliers table */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible relative z-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-800">All suppliers</p>
          </div>
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search suppliers, POC, email..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 cursor-pointer"
              >
                <option value="All">All categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 cursor-pointer"
              >
                <option value="All">All locations</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 cursor-pointer"
              >
                <option value="All">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-visible">
            <table className="min-w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="text-left px-4 py-2 font-medium w-1/4">
                    Supplier
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-32">
                    Category
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-1/5">
                    POC
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-1/4">
                    Contact
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-1/5">
                    Location
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-24">
                    Status
                  </th>
                  <th className="text-left px-4 py-2 font-medium w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      Loading suppliers...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-4 text-sm text-slate-500"
                    >
                      No suppliers found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  pagedSuppliers.map((s, index) => (
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
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {categoryLabel(s)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-700">
                        {s.pocName ? (
                          <div>
                            <div>{s.pocName}</div>
                            {s.pocPhone && (
                              <div className="text-[11px] text-slate-500">
                                {s.pocPhone}
                              </div>
                            )}
                            {s.website && (
                              <div className="text-[11px] text-slate-500 break-all">
                                {s.website}
                              </div>
                            )}
                          </div>
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
                        {locationLabel(s) || "--"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          {statusLabel(s)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => {
                              const nextId = openMenuId === s.id ? null : s.id;
                              if (!nextId) {
                                setOpenMenuId(null);
                                setOpenMenuPosition(null);
                                return;
                              }
                              const rect = event.currentTarget.getBoundingClientRect();
                              const menuWidth = 160;
                              const menuHeight = 168;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const openUp = spaceBelow < menuHeight;
                              const top = openUp ? rect.top - 8 : rect.bottom + 8;
                              const maxLeft = window.innerWidth - menuWidth - 12;
                              const left = Math.min(
                                maxLeft,
                                Math.max(12, rect.right - menuWidth)
                              );
                              setOpenMenuPosition({ top, left, openUp });
                              setOpenMenuId(nextId);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 cursor-pointer"
                            aria-label="Actions"
                            data-actions-trigger
                          >
                            <svg
                              aria-hidden="true"
                              focusable="false"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <circle cx="5" cy="12" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="19" cy="12" r="1.8" />
                            </svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {filteredSuppliers.length === 0
              ? 0
              : (safePage - 1) * perPage + 1}{" "}
            to {Math.min(safePage * perPage, filteredSuppliers.length)} of{" "}
            {filteredSuppliers.length} suppliers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50 enabled:hover:bg-slate-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700">
              {safePage}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-50 enabled:hover:bg-slate-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
        {openSupplier && openMenuPosition && (
          <div
            className="fixed z-50 w-40 rounded-lg border border-slate-200 bg-white shadow-lg"
            style={{
              top: openMenuPosition.top,
              left: openMenuPosition.left,
              transform: openMenuPosition.openUp
                ? "translateY(-100%)"
                : "translateY(0)",
            }}
            data-actions-menu
          >
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null);
                setOpenMenuPosition(null);
                router.push(`/supplier?id=${openSupplier.id}`);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              View details
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null);
                setOpenMenuPosition(null);
                startEdit(openSupplier);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Edit
            </button>
            {statusLabel(openSupplier) === "Archived" ? (
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setOpenMenuPosition(null);
                  handleUnarchive(openSupplier);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Unarchive
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpenMenuId(null);
                  setOpenMenuPosition(null);
                  handleArchive(openSupplier);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null);
                setOpenMenuPosition(null);
                setDeleteTarget(openSupplier);
              }}
              className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  Permanently delete supplier?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This will permanently delete{" "}
                  <span className="font-semibold text-slate-700">
                    {deleteTarget.name || "this supplier"}
                  </span>{" "}
                  and cannot be undone.
                </p>
              </div>
              <div className="px-5 py-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex items-center rounded-lg bg-rose-600 text-white text-sm font-medium px-4 py-2 hover:bg-rose-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}























