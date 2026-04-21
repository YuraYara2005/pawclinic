import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import Modal from "../components/Modal"; 

// ==========================================
// 1. ROBUST TYPESCRIPT INTERFACES
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
}

interface Appointment {
  id?: number;
  _id?: string | number;
  petId?: string | number;
  pet_id?: string | number; 
  ownerId?: string | number;
  owner_id?: string | number; 
  date?: string;
  time?: string;
  reason?: string;
  status?: string;
  notes?: string;
}

interface ApptFormData {
  petId: string | number;
  ownerId: string | number;
  date: string;
  time: string;
  reason: string;
  status: string;
  notes: string;
}

const emptyForm: ApptFormData = { 
  petId: "", 
  ownerId: "", 
  date: "", 
  time: "", 
  reason: "", 
  status: "scheduled", 
  notes: "" 
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState<ApptFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const token = localStorage.getItem("clinic_auth_token");

  // ==========================================
  // 3. API FETCH LOGIC
  // ==========================================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [apptRes, petsRes, ownersRes] = await Promise.all([
        fetch("http://localhost:5000/api/appointments", { headers }),
        fetch("http://localhost:5000/api/pets", { headers }),
        fetch("http://localhost:5000/api/owners", { headers })
      ]);

      const apptData = await apptRes.json();
      const petsData = await petsRes.json();
      const ownersData = await ownersRes.json();

      if (apptData.success) setAppointments(apptData.data);
      if (petsData.success) setPets(petsData.data);
      if (ownersData.success) setOwners(ownersData.data);

    } catch (error) {
      toast.error("Failed to fetch clinic data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const petMap = Object.fromEntries(pets.map((p) => [p.id || p._id, p]));
  const ownerMap = Object.fromEntries(owners.map((o) => [o.id || o._id, o]));

  const filtered = filterStatus === "all" 
    ? appointments 
    : appointments.filter((a) => (a.status || "scheduled") === filterStatus);

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const openCreate = () => { 
    setEditing(null); 
    
    // Safely get TODAY in local timezone for the default input
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    setForm({ ...emptyForm, date: todayStr }); 
    setShowModal(true); 
  };

  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    
    const actualPetId = appt.petId || appt.pet_id || "";
    const actualOwnerId = appt.ownerId || appt.owner_id || "";
    
    let dateStr = "";
    let timeStr = "";

    // 🚨 THE FIX: Let Javascript translate the UTC string to Local Time
    if (appt.date) {
      const d = new Date(appt.date);
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (appt.time) {
      timeStr = appt.time.slice(0, 5); // Forces "HH:MM:SS" into standard "HH:MM"
    }

    setForm({ 
      petId: actualPetId, 
      ownerId: actualOwnerId, 
      date: dateStr, 
      time: timeStr, 
      reason: appt.reason || "", 
      status: appt.status || "scheduled", 
      notes: appt.notes || "" 
    });
    setShowModal(true);
  };

  const handlePetChange = (selectedPetId: string) => {
    const pet = pets.find((p) => String(p.id || p._id) === selectedPetId);
    setForm({ ...form, petId: selectedPetId, ownerId: pet?.ownerId || pet?.owner_id || "" });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.petId || !form.date || !form.time || !form.reason) {
      return toast.error("Pet, date, time, and reason are required");
    }

    setIsSaving(true);
    
    const payload = {
      pet_id: Number(form.petId),
      owner_id: Number(form.ownerId),
      date: form.date,
      time: form.time,
      reason: form.reason,
      status: form.status,
      notes: form.notes || null
    };

    const targetId = editing?.id || editing?._id;
    const url = editing ? `http://localhost:5000/api/appointments/${targetId}` : "http://localhost:5000/api/appointments";
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
        toast.success(`Appointment ${editing ? "updated" : "created"}!`);
        fetchData();
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save appointment");
      }
    } catch (err) { 
      toast.error("Network error."); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string | number | undefined, newStatus: string) => {
    if (!id) return;
    
    setAppointments(appointments.map(a => (a.id || a._id) === id ? { ...a, status: newStatus } : a));

    try {
      const appt = appointments.find(a => (a.id || a._id) === id);
      if (!appt) return;

      const payload = {
        pet_id: Number(appt.petId || appt.pet_id),
        owner_id: Number(appt.ownerId || appt.owner_id),
        date: appt.date,
        time: appt.time,
        reason: appt.reason,
        status: newStatus,
        notes: appt.notes
      };

      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Update failed");
      toast.success("Status updated"); 
    } catch (err) { 
      fetchData(); 
      toast.error("Failed to update status"); 
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    
    try { 
      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Appointment deleted"); 
        setAppointments(appointments.filter(a => (a.id || a._id) !== id));
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Appointments 📅</h1>
          <p className="text-gray-500 mt-1">{isLoading ? "Loading schedule..." : `${appointments.length} total appointments`}</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          + New Appointment
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "scheduled", "completed", "cancelled", "no-show"].map((s) => (
          <button 
            key={s} 
            onClick={() => setFilterStatus(s)} 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filterStatus === s ? "bg-emerald-600 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4" />
             <p className="font-medium">Syncing with database...</p>
           </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  {["Patient / Owner", "Date & Time", "Reason", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((appt) => {
                  const targetId = appt.id || appt._id;
                  
                  const actualPetId = appt.petId || appt.pet_id || "";
                  const actualOwnerId = appt.ownerId || appt.owner_id || "";
                  
                  const pet = petMap[actualPetId as string];
                  const owner = ownerMap[actualOwnerId as string];

                  return (
                    <tr key={targetId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 block">{pet?.name || "Unknown Pet"}</span>
                        <span className="text-xs text-gray-500">Owner: {owner?.name || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        {/* 🚨 THE FIX: Display local date securely */}
                        <span className="font-medium text-gray-800 block">
                          {appt.date ? new Date(appt.date).toLocaleDateString() : "No Date"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {appt.time ? appt.time.slice(0, 5) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={appt.reason}>
                        {appt.reason}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={appt.status || "scheduled"}
                          onChange={(e) => handleStatusChange(targetId, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium capitalize
                            ${appt.status === 'scheduled' || !appt.status ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${appt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            ${appt.status === 'no-show' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                          `}
                        >
                          {["scheduled", "completed", "cancelled", "no-show"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(appt)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
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

      {showModal && (
        <Modal title={editing ? "Edit Appointment" : "New Appointment"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
              <select 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white transition-shadow" 
                value={form.petId} 
                onChange={(e) => handlePetChange(e.target.value)}
              >
                <option value="" disabled>Select pet...</option>
                {pets.map((p) => {
                  const o = ownerMap[(p.ownerId || p.owner_id) as string];
                  return <option key={p.id || p._id} value={p.id || p._id}>{p.name} {o ? `(Owner: ${o.name})` : ""}</option>
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input 
                  required
                  type="time" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                  value={form.time} 
                  onChange={(e) => setForm({ ...form, time: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit *</label>
              <input 
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow" 
                value={form.reason} 
                onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                placeholder="e.g., Annual checkup, vaccination..." 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white transition-shadow capitalize" 
                  value={form.status} 
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {["scheduled", "completed", "cancelled", "no-show"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-shadow" 
                rows={2} 
                value={form.notes} 
                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                placeholder="Doctor's notes..." 
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button disabled={isSaving} type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button disabled={isSaving} type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {isSaving ? "Saving..." : (editing ? "Update Appointment" : "Create Appointment")}
              </button>
            </div>

          </form>
        </Modal>
      )}
    </div>
  );
}