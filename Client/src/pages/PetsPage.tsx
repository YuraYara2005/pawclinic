import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import Modal from "../components/Modal"; 

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface Owner {
  id?: number;
  _id?: string | number;
  name: string;
}

interface Pet {
  id?: number;
  _id?: string | number;
  ownerId?: string | number;
  owner_id?: string | number;
  name: string;
  species: string;
  breed?: string;
  age?: number | string;
  gender?: string;
  weight?: number | string;
  color?: string;
  notes?: string;
}

interface PetFormData {
  ownerId: string | number;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  weight: string;
  color: string;
  notes: string;
}

const speciesIcon: Record<string, string> = { 
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐟", reptile: "🦎", other: "🐾" 
};

const emptyForm: PetFormData = { 
  ownerId: "", name: "", species: "dog", breed: "", age: "", gender: "unknown", weight: "", color: "", notes: "" 
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function PetsPage() {
  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // UI State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [form, setForm] = useState<PetFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const token = localStorage.getItem("clinic_auth_token");

  // ==========================================
  // 3. API FETCH LOGIC
  // ==========================================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch Pets and Owners simultaneously
      const [petsRes, ownersRes] = await Promise.all([
        fetch("http://localhost:5000/api/pets", { headers }),
        fetch("http://localhost:5000/api/owners", { headers })
      ]);

      const petsData = await petsRes.json();
      const ownersData = await ownersRes.json();

      if (petsData.success) setPets(petsData.data);
      if (ownersData.success) setOwners(ownersData.data);

    } catch (error) {
      toast.error("Failed to connect to the database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fast lookups
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id || o._id, o]));
  
  const filtered = pets.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.species.toLowerCase().includes(search.toLowerCase())
  );

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const openCreate = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setShowModal(true); 
  };

  const openEdit = (pet: Pet) => {
    setEditing(pet);
    setForm({ 
      ownerId: pet.ownerId || pet.owner_id || "",
      name: pet.name, 
      species: pet.species, 
      breed: pet.breed || "", 
      age: pet.age?.toString() || "", 
      gender: pet.gender || "unknown", 
      weight: pet.weight?.toString() || "", 
      color: pet.color || "", 
      notes: pet.notes || "" 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.species || !form.ownerId) {
      return toast.error("Name, species, and owner are required");
    }

    setIsSaving(true);

    const payload = {
      owner_id: Number(form.ownerId), 
      name: form.name,
      species: form.species,
      breed: form.breed || undefined,
      age: form.age ? parseFloat(form.age) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      gender: form.gender || undefined,
      color: form.color || undefined,
      notes: form.notes || undefined,
    };

    const targetId = editing?.id || editing?._id;
    const url = editing ? `http://localhost:5000/api/pets/${targetId}` : "http://localhost:5000/api/pets";
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
        toast.success(`Pet ${editing ? "updated" : "added"} successfully!`);
        fetchData();
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save pet");
      }
    } catch (err) { 
      toast.error("Network error"); 
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this pet?")) return;
    
    try { 
      const res = await fetch(`http://localhost:5000/api/pets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Pet deleted"); 
        setPets(pets.filter(p => (p.id || p._id) !== id));
      } else {
        toast.error(data.message || "Failed to delete");
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patients 🐾</h1>
          <p className="text-gray-500 mt-1">{isLoading ? "Loading..." : `${pets.length} registered pets`}</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          + Add Pet
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow shadow-sm"
            placeholder="Search by name or species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4" />
            <p className="font-medium">Fetching furry friends...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-medium">No pets found</p>
          </div>
        ) : filtered.map((pet) => {
          const targetId = pet.id || pet._id;
          
          // 🚨 THE FIX IS HERE: Safely extract the owner using either ID format
          const owner = ownerMap[String(pet.ownerId || pet.owner_id)];

          return (
            <div key={targetId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
                    {speciesIcon[pet.species.toLowerCase()] ?? "🐾"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{pet.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(pet)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition" title="Edit">✏️</button>
                  <button onClick={() => handleDelete(targetId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">🗑️</button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                {pet.age && <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="font-medium text-gray-900">{pet.age} yrs</span></div>}
                {pet.weight && <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-medium text-gray-900">{pet.weight} kg</span></div>}
                {pet.gender && <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="font-medium text-gray-900 capitalize">{pet.gender}</span></div>}
                {pet.color && <div className="flex justify-between"><span className="text-gray-500">Color</span><span className="font-medium text-gray-900">{pet.color}</span></div>}
                <div className="flex justify-between pt-2 mt-2 border-t border-gray-200/60">
                  <span className="text-gray-500">Owner</span>
                  <span className="font-medium text-emerald-600 truncate max-w-[120px]" title={owner?.name}>{owner?.name ?? "Unknown"}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <Modal title={editing ? "Edit Patient" : "Add Patient"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
              <select 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white transition-shadow" 
                value={form.ownerId} 
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="" disabled>Select owner...</option>
                {owners.map((o) => <option key={o.id || o._id} value={o.id || o._id}>{o.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
                <input 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g., Buddy" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white transition-shadow capitalize" 
                  value={form.species} 
                  onChange={(e) => setForm({ ...form, species: e.target.value })}
                >
                  {["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.breed} 
                  onChange={(e) => setForm({ ...form, breed: e.target.value })} 
                  placeholder="Golden Retriever" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white transition-shadow" 
                  value={form.gender} 
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input 
                  type="number" step="0.1" min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.age} 
                  onChange={(e) => setForm({ ...form, age: e.target.value })} 
                  placeholder="3" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input 
                  type="number" step="0.1" min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.weight} 
                  onChange={(e) => setForm({ ...form, weight: e.target.value })} 
                  placeholder="5.2" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color/Markings</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                value={form.color} 
                onChange={(e) => setForm({ ...form, color: e.target.value })} 
                placeholder="Golden brown, white paws..." 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
              <textarea 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-shadow" 
                rows={2} 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="Allergies, special conditions, dietary needs..." 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button disabled={isSaving} type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button disabled={isSaving} type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isSaving ? "Saving..." : (editing ? "Update Patient" : "Add Patient")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}