import React, { useState, useMemo, useEffect } from "react";
import type {FormEvent} from "react";
import { toast } from "sonner";
import Modal from "../components/Modal"; // Assumes you have this component

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
export interface InventoryItem {
  id?: number; // MySQL uses 'id'
  _id?: string | number; // Fallback for old Convex data
  name: string;
  category: string;
  quantity: number | string;
  unit: string;
  lowStockThreshold: number | string;
  unitPrice: number | string;
  supplier?: string;
  description?: string;
  expiryDate?: string;
}

const CATEGORIES = ["all", "medications", "vaccines", "supplies", "medical supplies", "food", "equipment"];

const emptyForm: InventoryItem = {
  name: "",
  category: "supplies",
  quantity: 0,
  unit: "pcs",
  lowStockThreshold: 5,
  unitPrice: 0,
  supplier: "",
  description: "",
  expiryDate: ""
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function InventoryPage() {
  // Data State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // UI State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryItem>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Helper to get Auth Token
  const token = localStorage.getItem("clinic_auth_token"); // Wait, Postman uses 'token', ensure you save it this way in login!
  // If your token is stored differently, adjust the key above.

  // ==========================================
  // 3. API FETCH LOGIC (Connected to MySQL!)
  // ==========================================
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      toast.error("Failed to connect to the database");
    } finally {
      setIsLoading(false);
    }
  };

  // Run once when the page loads
  useEffect(() => {
    fetchInventory();
  }, []);

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const openCreate = () => { 
    setEditing(null); 
    setForm({ ...emptyForm }); 
    setShowModal(true); 
  };
  
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || form.quantity === "" || form.lowStockThreshold === "") {
      return toast.error("Name, Quantity, and Minimum Stock are required");
    }

    setIsSaving(true);
    
    // Format payload for MySQL
    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      quantity: Number(form.quantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      unitPrice: Number(form.unitPrice),
      supplier: form.supplier || undefined,
      description: form.description || undefined,
      expiryDate: form.expiryDate || undefined,
    };

    const itemId = editing?.id || editing?._id;
    const url = editing ? `http://localhost:5000/api/inventory/${itemId}` : "http://localhost:5000/api/inventory";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Item ${editing ? "updated" : "added"} successfully!`);
        fetchInventory(); // Refresh the table
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save item");
      }
    } catch (err: any) { 
      toast.error("Network error. Is the server running?"); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try { 
      const res = await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Item deleted"); 
        fetchInventory(); // Refresh the table
      } else {
        toast.error(data.message || "Failed to delete item");
      }
    } catch (err: any) { 
      toast.error("Network error."); 
    }
  };

  // ==========================================
  // 5. FILTERING & PAGINATION
  // ==========================================
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Handle slight category mismatches between frontend and backend
      const matchesCategory = filterCategory === "all" || item.category.toLowerCase().includes(filterCategory.toLowerCase());
      
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, filterCategory]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when searching/filtering
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterCategory]);

  // ==========================================
  // 6. RENDER UI
  // ==========================================
  return (
    <div className="pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Inventory 📦</h1>
          <p className="text-gray-500 mt-1">{isLoading ? "Loading items..." : `${inventory.length} total items in stock`}</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm whitespace-nowrap active:scale-95">
          + Add New Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setFilterCategory(cat)} 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filterCategory === cat ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search items or suppliers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
             <p className="font-medium">Connecting to Database...</p>
          </div>
        ) : paginatedInventory.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗄️</div>
            <p className="font-medium">No inventory items found</p>
          </div>
        ) : (
          <>
            {/* 💻 DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    {["Item Name", "Category", "Stock", "Unit Price", "Supplier", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-4 text-sm font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedInventory.map((item) => {
                    const stock = Number(item.quantity);
                    const threshold = Number(item.lowStockThreshold);
                    const isLowStock = stock <= threshold;
                    const itemId = item.id || item._id; // Handle both ID formats

                    return (
                      <tr key={itemId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {isLowStock && <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100 uppercase tracking-wider">Low Stock</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 capitalize">{item.category}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className={`font-medium ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                            {item.quantity}
                          </span>
                          <span className="text-gray-500 ml-1">{item.unit}</span>
                          <p className="text-xs text-gray-400 mt-0.5">Min: {item.lowStockThreshold}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">
                          ${Number(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.supplier || "—"}
                          {item.expiryDate && <p className="text-xs text-orange-500 mt-0.5">Exp: {new Date(item.expiryDate).toLocaleDateString()}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(item)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                            <button onClick={() => handleDelete(itemId)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* 📱 MOBILE VIEW (Included for responsiveness) */}
            <div className="block md:hidden divide-y divide-gray-100">
              {paginatedInventory.map((item) => {
                const isLowStock = Number(item.quantity) <= Number(item.lowStockThreshold);
                const itemId = item.id || item._id;
                
                return (
                  <div key={itemId} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                      </div>
                      {isLowStock && (
                        <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100">Low Stock</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <span className="block text-xs text-gray-400">Stock</span>
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity} {item.unit}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400">Price</span>
                        <span className="font-semibold">${Number(item.unitPrice).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="flex-1 py-2 text-sm bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 font-medium">Edit</button>
                      <button onClick={() => handleDelete(itemId)} className="flex-1 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-medium text-gray-900">{filteredInventory.length}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 📝 Modal Form */}
      {showModal && (
        <Modal title={editing ? "Edit Inventory Item" : "New Inventory Item"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input 
                autoFocus
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g., Rabies Vaccine" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white capitalize transition-shadow" 
                  value={form.category} 
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.filter(c => c !== "all").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                <input 
                  type="number" 
                  step="0.01" min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.unitPrice} 
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.quantity} 
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.unit} 
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} 
                  placeholder="pcs, btl..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock *</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.lowStockThreshold} 
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.supplier} 
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })} 
                  placeholder="Supplier name..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (Opt)</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow text-sm" 
                  value={form.expiryDate ? form.expiryDate.split('T')[0] : ""} 
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-shadow" 
                rows={2} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Item details..." 
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button disabled={isSaving} type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium">Cancel</button>
              <button disabled={isSaving} type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-70">
                {isSaving ? "Saving..." : (editing ? "Update Item" : "Save Item")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}