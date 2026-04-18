import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Modal from "../components/Modal";

// ✅ FIXED: Variable names perfectly match convex/inventory.ts
const emptyForm = { 
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

const CATEGORIES = ["all", "medication", "food", "equipment", "supplies"];

export default function InventoryPage() {
  const inventory = useQuery(api.inventory.list) ?? [];
  const createItem = useMutation(api.inventory.create);
  const updateItem = useMutation(api.inventory.update);
  const removeItem = useMutation(api.inventory.remove);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const openCreate = () => { 
    setEditing(null); 
    setForm({ ...emptyForm }); 
    setShowModal(true); 
  };
  
  const openEdit = (item) => {
    setEditing(item);
    setForm({ 
      name: item.name, 
      category: item.category, 
      quantity: item.quantity, 
      unit: item.unit, 
      lowStockThreshold: item.lowStockThreshold, 
      unitPrice: item.unitPrice, 
      supplier: item.supplier ?? "",
      description: item.description ?? "",
      expiryDate: item.expiryDate ?? ""
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || form.quantity === "" || form.lowStockThreshold === "") {
      return toast.error("Name, Quantity, and Minimum Stock are required");
    }

    // ✅ FIXED: Safely format numbers and handle optional fields for Convex
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

    try {
      if (editing) {
        await updateItem({ id: editing._id, ...payload });
        toast.success("Item updated successfully!");
      } else {
        await createItem(payload);
        toast.success("Item added to inventory!");
      }
      setShowModal(false);
    } catch (err) { 
      toast.error(err.message || "Failed to save item"); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try { 
      await removeItem({ id }); 
      toast.success("Item deleted"); 
    } catch (err) { 
      toast.error(err.message || "Failed to delete item"); 
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, filterCategory]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useMemo(() => { setCurrentPage(1); }, [searchQuery, filterCategory]);

  return (
    <div className="pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory 📦</h1>
          <p className="text-gray-400 mt-1">{inventory.length} total items in stock</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm whitespace-nowrap">
          + Add New Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setFilterCategory(cat)} 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filterCategory === cat ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-mint-50 border border-gray-200"}`}
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
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
          />
        </div>
      </div>

      <div className="bg-white rounded-container shadow-card overflow-hidden">
        {paginatedInventory.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗄️</div>
            <p className="font-medium">No inventory items found</p>
          </div>
        ) : (
          <>
            {/* 📱 MOBILE VIEW */}
            <div className="block md:hidden divide-y divide-gray-100">
              {paginatedInventory.map((item) => (
                <div key={item._id} className="p-4 hover:bg-mint-50/30 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{item.category}</p>
                    </div>
                    {item.quantity <= item.lowStockThreshold && (
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-md border border-red-100">Low Stock</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="block text-xs text-gray-400">Stock Level</span>
                      <span className={`font-semibold ${item.quantity <= item.lowStockThreshold ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Unit Price</span>
                      <span className="font-semibold">${item.unitPrice?.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="block text-xs text-gray-400">Supplier</span>
                      <span>{item.supplier || "—"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="flex-1 py-2 text-sm bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                    <button onClick={() => handleDelete(item._id)} className="flex-1 py-2 text-sm bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition font-medium">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 💻 DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-mint-50 border-b border-mint-100">
                  <tr>
                    {["Item Name", "Category", "Stock", "Unit Price", "Supplier", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-sm font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedInventory.map((item) => {
                    const isLowStock = item.quantity <= item.lowStockThreshold;
                    return (
                      <tr key={item._id} className="hover:bg-mint-50/50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          {isLowStock && <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100 uppercase">Low Stock</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 capitalize">{item.category}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className={`font-medium ${isLowStock ? "text-red-600" : "text-gray-800"}`}>
                            {item.quantity}
                          </span>
                          <span className="text-gray-400 ml-1">{item.unit}</span>
                          <p className="text-xs text-gray-400 mt-0.5">Min: {item.lowStockThreshold}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-700">${item.unitPrice?.toFixed(2) || "0.00"}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {item.supplier || "—"}
                          {item.expiryDate && <p className="text-xs text-orange-500 mt-0.5">Exp: {item.expiryDate}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                            <button onClick={() => handleDelete(item._id)} className="px-3 py-1.5 text-xs bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition font-medium">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="font-medium">{filteredInventory.length}</span> results
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g., Rabies Vaccine" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white capitalize transition" 
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
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.unitPrice} 
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.quantity} 
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.unit} 
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} 
                  placeholder="pcs, btl, box..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock *</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.lowStockThreshold} 
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} 
                  title="Alert when stock falls below this number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Brand</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.supplier} 
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })} 
                  placeholder="Supplier name..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={form.expiryDate} 
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition" 
                rows={2} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Item details..." 
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm">{editing ? "Update Item" : "Save Item"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}