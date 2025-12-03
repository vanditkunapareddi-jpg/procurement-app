// pages/items.js
import { useEffect, useState, useRef } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import AppLayout from "../components/AppLayout";

export default function Items() {
  // Data
  const [folders, setFolders] = useState([]);
  const [allItems, setAllItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [menuFolderId, setMenuFolderId] = useState(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const menuRef = useRef(null);

  // Which folder are we in? null = top-level (folder list)
  const [activeFolderId, setActiveFolderId] = useState(null);

  // Add folder popup
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const newFolderInputRef = useRef(null);

  // Rename folder popup
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState("");

  // Add/Edit item popup
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Item form fields
  const [itemName, setItemName] = useState("");
  const [itemUnits, setItemUnits] = useState("");
  const [itemReorderQty, setItemReorderQty] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  // Order instructions: custom rows {label, value}
  const [orderRows, setOrderRows] = useState([]);

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemName("");
    setItemUnits("");
    setItemReorderQty("");
    setItemNotes("");
    setOrderRows([]);
  };

  const folderGradients = [
    "from-indigo-500 to-blue-500",
    "from-teal-400 to-emerald-500",
    "from-amber-400 to-orange-500",
    "from-purple-500 to-indigo-500",
    "from-pink-500 to-rose-500",
  ];

  const openAddItemModal = () => {
    resetItemForm();
    setMessage("");
    setShowItemModal(true);
  };

  // Close folder menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowFolderMenu(false);
        setMenuFolderId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-clear messages after 10s
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 10000);
    return () => clearTimeout(timer);
  }, [message]);

  // Load folders + items
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [folderSnap, itemSnap] = await Promise.all([
          getDocs(collection(db, "itemFolders")),
          getDocs(collection(db, "items")),
        ]);

        const folderData = folderSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        folderData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setFolders(folderData);

        const itemData = itemSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        itemData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setAllItems(itemData);
      } catch (err) {
        console.error("Error loading items page data:", err);
        setMessage("Error loading items. Check console.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // current active folder and its items
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) : null;
  const parentFolder = activeFolder?.parentId ? folders.find((f) => f.id === activeFolder.parentId) : null;
  const itemsInActiveFolder = activeFolderId ? allItems.filter((it) => it.folderId === activeFolderId) : [];

  // ---------------------- Folder Actions ------------------------

  const openAddFolderModal = (parentId = null) => {
    const resolvedParent =
      typeof parentId === "string" && parentId.trim().length > 0
        ? parentId
        : null;
    setNewFolderName("");
    setNewFolderParentId(resolvedParent);
    setShowAddFolderModal(true);
  };

  const handleDeleteFolder = async (folderId) => {
    if (!folderId) return;
    try {
      await deleteDoc(doc(db, "itemFolders", folderId));
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setAllItems((prev) => prev.filter((it) => it.folderId !== folderId));
      setMessage("Folder deleted.");
      setShowFolderMenu(false);
      setMenuFolderId(null);
    } catch (err) {
      console.error("Error deleting folder:", err);
      setMessage("Error deleting folder.");
    }
  };

  const handleSaveNewFolder = async () => {
    if (!newFolderName.trim()) {
      setMessage("Folder name is required.");
      return;
    }
    try {
      const payload = {
        name: newFolderName.trim(),
        parentId: newFolderParentId || null,
        createdAt: new Date(),
      };
      const ref = await addDoc(collection(db, "itemFolders"), payload);
      const newFolder = { id: ref.id, ...payload };
      setFolders((prev) =>
        [...prev, newFolder].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      );
      setShowAddFolderModal(false);
      setNewFolderName("");
      setNewFolderParentId(null);
      setMessage("Folder created.");
    } catch (err) {
      console.error("Error creating folder:", err);
      setMessage("Error creating folder. Check console.");
    }
  };

  const openRenameFolderModal = (folder) => {
    setRenameFolderId(folder.id);
    setRenameFolderName(folder.name || "");
    setShowRenameFolderModal(true);
  };

  const handleSaveRenameFolder = async () => {
    if (!renameFolderName.trim()) {
      setMessage("Folder name cannot be empty.");
      return;
    }
    try {
      const ref = doc(db, "itemFolders", renameFolderId);
      await updateDoc(ref, { name: renameFolderName.trim() });

      setFolders((prev) =>
        prev
          .map((f) => (f.id === renameFolderId ? { ...f, name: renameFolderName.trim() } : f))
          .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      );

      // Also update folderName on any items in that folder
      setAllItems((prev) =>
        prev.map((it) => (it.folderId === renameFolderId ? { ...it, folderName: renameFolderName.trim() } : it))
      );

      setShowRenameFolderModal(false);
      setRenameFolderId(null);
      setRenameFolderName("");
      setMessage("Folder renamed.");
    } catch (err) {
      console.error("Error renaming folder:", err);
      setMessage("Error renaming folder. Check console.");
    }
  };

  const openEditItemModal = (item) => {
    setEditingItemId(item.id);
    setItemName(item.name || "");
    setItemUnits(item.units !== undefined && item.units !== null ? String(item.units) : "");
    setItemReorderQty(
      item.reorderQty !== undefined && item.reorderQty !== null ? String(item.reorderQty) : ""
    );
    setItemNotes(item.notes || "");
    const rows = item.orderInstructions?.rows || [];
    setOrderRows(rows);
    setShowItemModal(true);
  };

  const handleAddOrderRow = () => {
    setOrderRows((prev) => [...prev, { label: "", value: "" }]);
  };

  const handleOrderRowChange = (index, field, value) => {
    setOrderRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleSaveItem = async () => {
    if (!activeFolderId) {
      setMessage("You must be inside a folder to add an item.");
      return;
    }
    if (!itemName.trim()) {
      setMessage("Item name is required.");
      return;
    }

    const unitsNum = itemUnits ? parseFloat(itemUnits) : 0;
    const reorderNum = itemReorderQty ? parseFloat(itemReorderQty) : 0;

    const cleanedRows = orderRows
      .map((r) => ({
        label: r.label?.trim() || "",
        value: r.value?.trim() || "",
      }))
      .filter((r) => r.label || r.value);

    const orderInstructions = cleanedRows.length > 0 ? { rows: cleanedRows } : null;

    const folderName = activeFolder?.name || "";

    const payload = {
      name: itemName.trim(),
      folderId: activeFolderId,
      folderName,
      units: isNaN(unitsNum) ? 0 : unitsNum,
      reorderQty: isNaN(reorderNum) ? 0 : reorderNum,
      notes: itemNotes.trim(),
      orderInstructions,
    };

    try {
      if (editingItemId) {
        const ref = doc(db, "items", editingItemId);
        await updateDoc(ref, payload);
        setAllItems((prev) => prev.map((it) => (it.id === editingItemId ? { ...it, ...payload } : it)));
        setMessage("Item updated.");
      } else {
        const ref = await addDoc(collection(db, "items"), {
          ...payload,
          createdAt: new Date(),
        });
        const newItem = { id: ref.id, ...payload };
        setAllItems((prev) =>
          [...prev, newItem].sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
        setMessage("Item added.");
      }

      resetItemForm();
      setShowItemModal(false);
    } catch (err) {
      console.error("Error saving item:", err);
      setMessage("Error saving item. Check console.");
    }
  };

  // ---------------------- Rendering Helpers ------------------------

  const renderFolderGrid = () => {
    if (loading) {
      return <p className="text-sm text-slate-500">Loading folders and items...</p>;
    }

    const topLevelFolders = folders.filter((f) => !f.parentId);

    if (topLevelFolders.length === 0) {
      return (
        <p className="text-sm text-slate-500">
          No folders yet. Use &quot;Add folder&quot; to create one.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
        {topLevelFolders.map((folder, idx) => {
          const itemsInFolder = allItems.filter((it) => it.folderId === folder.id);
          const itemCount = itemsInFolder.length;
          const totalUnits = itemsInFolder.reduce((sum, it) => sum + (it.units || 0), 0);
          const gradient = folderGradients[idx % folderGradients.length];

          return (
            <div
              key={folder.id}
              className="relative rounded-xl shadow-md border border-slate-200 overflow-hidden cursor-pointer h-full min-h-[180px] bg-white"
              onClick={() => setActiveFolderId(folder.id)}
            >
              <div className={`relative bg-gradient-to-r ${gradient} text-white px-4 py-3`}>
                <button
                  type="button"
                  className="absolute top-2 right-2 text-white/90 hover:text-white text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuFolderId(folder.id);
                    setShowFolderMenu((prev) => (prev && menuFolderId === folder.id ? false : true));
                  }}
                >
                  ...
                </button>
                {showFolderMenu && menuFolderId === folder.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-2 top-8 bg-white text-slate-800 rounded-lg shadow-lg border border-slate-200 w-36 z-10"
                  >
                    <button
                      type="button"
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderMenu(false);
                        openRenameFolderModal(folder);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="block w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFolderMenu(false);
                        handleDeleteFolder(folder.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
                <h3 className="text-sm font-semibold mb-1">
                  {folder.name || "Untitled folder"}
                </h3>
                <p className="text-xs text-white/90">
                  {itemCount} item{itemCount === 1 ? "" : "s"} inside
                </p>
              </div>
              <div className="px-4 py-3 bg-white text-slate-800">
                <p className="text-xs">
                  Total quantity: <span className="font-semibold">{totalUnits} units</span>
                </p>
              </div>
            </div>
        );
      })}
      </div>
    );
  };

  const renderFolderItems = () => {
    if (!activeFolderId) return null;

    const childFolders = folders.filter((f) => f.parentId === activeFolderId);

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setActiveFolderId(activeFolder?.parentId || null)}
            className="text-sm text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1"
          >
            &lt; Back to {activeFolder?.parentId ? "parent folder" : "folders"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openAddFolderModal(activeFolderId)}
              className="inline-flex items-center rounded-xl bg-amber-400 text-slate-900 text-xs font-semibold px-3 py-1.5 hover:bg-amber-300 border border-amber-300"
            >
              + Add folder
            </button>
            <button
              type="button"
              onClick={openAddItemModal}
              className="inline-flex items-center rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800"
            >
              + Add item
            </button>
          </div>
        </div>

        {childFolders.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-700 mb-2">Subfolders</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {childFolders.map((folder, idx) => {
                const itemsInFolder = allItems.filter((it) => it.folderId === folder.id);
                const itemCount = itemsInFolder.length;
                const totalUnits = itemsInFolder.reduce((sum, it) => sum + (it.units || 0), 0);
                const gradient = folderGradients[idx % folderGradients.length];

                return (
                  <div
                    key={folder.id}
                    className="relative rounded-xl shadow-md border border-slate-200 overflow-hidden cursor-pointer h-full min-h-[180px] bg-white"
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    <div className={`relative bg-gradient-to-r ${gradient} text-white px-4 py-3`}>
                <button
                  type="button"
                  className="absolute top-2 right-2 text-white/90 hover:text-white text-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuFolderId(folder.id);
                    setShowFolderMenu((prev) => (prev && menuFolderId === folder.id ? false : true));
                  }}
                >
                  ...
                </button>
                      <h3 className="text-sm font-semibold mb-1">
                        {folder.name || "Untitled folder"}
                      </h3>
                      <p className="text-xs text-white/90">
                        {itemCount} item{itemCount === 1 ? "" : "s"} inside
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-white text-slate-800">
                      <p className="text-xs">
                        Total quantity: <span className="font-semibold">{totalUnits} units</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {itemsInActiveFolder.length === 0 && childFolders.length === 0 ? (
          <p className="text-sm text-slate-500">
            No subfolders or items yet. Use &quot;Add folder&quot; or &quot;Add item&quot; to get started.
          </p>
        ) : (
          <>
            {itemsInActiveFolder.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {itemsInActiveFolder.map((item) => {
                  const rows = item.orderInstructions?.rows || [];

                  return (
                    <div
                      key={item.id}
                      className="relative bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col gap-3 h-full min-h-[180px]"
                    >
                      <button
                        type="button"
                        onClick={() => openEditItemModal(item)}
                        className="absolute top-3 right-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        Edit
                      </button>

                      <div className="pr-10">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {item.name || "Untitled item"}
                        </h4>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <p>
                          <span className="font-medium text-slate-700">Units:</span> {item.units ?? 0}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Reorder qty:</span> {item.reorderQty ?? 0}
                        </p>
                        {item.notes && (
                          <p>
                            <span className="font-medium text-slate-700">Notes:</span> {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Item Specifications Preview */}
                      {rows.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-700 mb-1">Item specifications</p>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-700 space-y-1">
                            {rows.map((r, idx) => (
                              <div key={idx}>
                                {r.label && <span className="font-medium">{r.label}: </span>}
                                <span>{r.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </>
    );
  };

  // ---------------------- Main Render ------------------------

  return (
    <AppLayout active="items">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Items</h2>
            <p className="text-sm text-slate-500 mt-1">
              Organize inventory into folders and manage item-level details.
            </p>
          </div>

          {!activeFolderId && (
            <button
              type="button"
              onClick={openAddFolderModal}
              className="inline-flex items-center rounded-xl bg-amber-400 text-slate-900 text-xs font-semibold px-3 py-1.5 hover:bg-amber-300 shadow-sm"
            >
              + Add folder
            </button>
          )}
        </header>

        {message && (
          <div className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {!activeFolderId && renderFolderGrid()}
        {activeFolderId && renderFolderItems()}
      </main>

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">New folder</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolderParentId(null);
                }}
              >
                ×
              </button>
            </div>
            {newFolderParentId && (
              <p className="text-[11px] text-slate-500 mb-2">
                This folder will live inside{" "}
                <span className="font-semibold text-slate-700">
                  {folders.find((f) => f.id === newFolderParentId)?.name || "this folder"}
                </span>
                .
              </p>
            )}
            <label className="block text-xs font-medium text-slate-700 mb-1">Folder name</label>
            <input
              type="text"
              ref={newFolderInputRef}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-4"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolderParentId(null);
                }}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewFolder}
                className="text-xs font-medium rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Rename folder</h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => {
                  setShowRenameFolderModal(false);
                  setRenameFolderId(null);
                  setRenameFolderName("");
                }}
              >
                ×
              </button>
            </div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Folder name</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 mb-4"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRenameFolderModal(false);
                  setRenameFolderId(null);
                  setRenameFolderName("");
                }}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRenameFolder}
                className="text-xs font-medium rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingItemId ? "Edit item" : "New item"}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                onClick={() => {
                  resetItemForm();
                  setShowItemModal(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Units (current inventory)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={itemUnits}
                    onChange={(e) => setItemUnits(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Reorder quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    value={itemReorderQty}
                    onChange={(e) => setItemReorderQty(e.target.value)}
                  />
                </div>
              </div>

              {/* Item Specifications editor */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-800">Item specifications</p>
                  <button
                    type="button"
                    onClick={handleAddOrderRow}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700"
                  >
                    + Add row
                  </button>
                </div>

                {orderRows.length === 0 ? (
                  <p className="text-[11px] text-slate-500">Add rows for things like size, printing, packing, etc.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {orderRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Label (e.g. Size)"
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          value={row.label}
                          onChange={(e) => handleOrderRowChange(idx, "label", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 25 x 25 cm)"
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                          value={row.value}
                          onChange={(e) => handleOrderRowChange(idx, "value", e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview */}
                {orderRows.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 mb-1">Preview (copy & paste)</p>
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[11px] text-slate-700 space-y-1">
                      {orderRows.map((r, idx) => (
                        <div key={idx}>
                          {r.label && <span className="font-medium">{r.label}: </span>}
                          <span>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-20 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetItemForm();
                  setShowItemModal(false);
                }}
                className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="text-xs font-medium rounded-lg px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800"
              >
                Save item
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
