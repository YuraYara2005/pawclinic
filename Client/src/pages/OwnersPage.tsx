import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import Modal from "../components/Modal"; // Assumes you have this component

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
export interface Owner {
  id?: number;
  _id?: string | number; // Fallback for old Convex data
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

interface OwnerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: OwnerFormData = { 
  name: "", 
  phone: "", 
  email: "", 
  address: "", 
  notes: "" 
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function OwnersPage() {
  // Data State
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [form, setForm] = useState<OwnerFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const token = localStorage.getItem("clinic_auth_token");

  // ==========================================
  // 3. API FETCH LOGIC
  // ==========================================
  const fetchOwners = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/owners", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOwners(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch owners from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const filtered = owners.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search)
  );

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const openCreate = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setShowModal(true); 
  };

  const openEdit = (owner: Owner) => { 
    setEditing(owner); 
    setForm({ 
      name: owner.name, 
      phone: owner.phone, 
      email: owner.email || "", 
      address: owner.address || "", 
      notes: owner.notes || "" 
    }); 
    setShowModal(true); 
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    
    setIsSaving(true);
    
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address || undefined,
      notes: form.notes || undefined
    };

    const targetId = editing?.id || editing?._id;
    const url = editing ? `http://localhost:5000/api/owners/${targetId}` : "http://localhost:5000/api/owners";
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
        toast.success(`Owner ${editing ? "updated" : "added"} successfully!`);
        fetchOwners();
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save owner");
      }
    } catch (err) { 
      toast.error("Network error"); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this owner? This may fail if they have registered pets.")) return;
    
    try { 
      const res = await fetch(`http://localhost:5000/api/owners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Owner deleted"); 
        setOwners(owners.filter(o => (o.id || o._id) !== id));
      } else {
        toast.error(data.message || "Failed to delete owner. They may have active pets.");
      }
    } catch (err) { 
      toast.error("Network error"); 
    }
  };

  // ==========================================
  // 5. RENDER UI
  // ==========================================
  return (
    <div className="pb-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Owners 👤</h1>
          <p className="text-gray-500 mt-1">{isLoading ? "Loading..." : `${owners.length} registered owners`}</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          + Add Owner
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow shadow-sm"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4" />
            <p className="font-medium">Fetching client list...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">👤</div>
            <p className="font-medium">No owners found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  {["Name", "Phone", "Email", "Address", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((owner) => {
                  const targetId = owner.id || owner._id;
                  
                  return (
                    <tr key={targetId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm shadow-sm">
                            {owner.name[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{owner.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{owner.phone}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{owner.email || "—"}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate" title={owner.address}>{owner.address || "—"}</td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(owner)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                          <button onClick={() => handleDelete(targetId)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <Modal title={editing ? "Edit Owner" : "Add Owner"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes or preferences..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button disabled={isSaving} type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button disabled={isSaving} type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isSaving ? "Saving..." : (editing ? "Update Owner" : "Add Owner")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}