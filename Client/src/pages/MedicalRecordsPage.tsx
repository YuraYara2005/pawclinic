import { useState, useEffect } from "react";
import type { FormEvent } from "react"; 
import { toast } from "sonner";
import Modal from "../components/Modal";

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface Pet {
  id?: number;
  _id?: string | number;
  name: string;
  species?: string;
  breed?: string;
}

interface MedicalRecord {
  id?: number;
  _id?: string | number;
  petId?: string | number;
  pet_id?: string | number;
  vetId?: string | number;
  vet_id?: string | number;
  chiefComplaint?: string;
  chief_complaint?: string;
  diagnosis: string;
  treatment: string;
  visitDate?: string;
  visit_date?: string;
  notes?: string;
}

interface RecordFormData {
  petId: string | number;
  customPet: string;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  visitDate: string;
  notes: string;
}

const emptyForm: RecordFormData = {
  petId: "",
  customPet: "",
  chiefComplaint: "",
  diagnosis: "",
  treatment: "",
  visitDate: new Date().toISOString().split("T")[0],
  notes: "",
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function MedicalRecordsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeletingId, setIsDeletingId] = useState<string | number | null>(null);
  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<RecordFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const token = localStorage.getItem("clinic_auth_token");

  const petMap = Object.fromEntries(pets.map((p) => [p.id || p._id, p]));

  // ==========================================
  // 3. API FETCH LOGIC
  // ==========================================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch both Pets (for the dropdown/names) and the actual Medical Records
      const [petsRes, recordsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/pets`, { headers }),
        // Assuming you created a medical-records route in your backend!
        fetch(`${import.meta.env.VITE_API_URL}/api/medical-records`, { headers }).catch(() => null) 
      ]);

      const petsData = await petsRes.json();
      if (petsData.success) {
        setPets(petsData.data);
      }

      // If the backend route doesn't exist yet, it won't crash the page
      if (recordsRes) {
        const recordsData = await recordsRes.json();
        if (recordsData.success) setRecords(recordsData.data);
      } else {
        setRecords([]); // Fallback if backend route isn't built yet
      }

    } catch (error) {
      toast.error("Failed to connect to the database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, visitDate: new Date().toISOString().split("T")[0] });
    setShowModal(true);
  };

  const openEdit = (rec: MedicalRecord) => {
    setEditing(rec);
    setForm({
      petId: rec.petId || rec.pet_id || "",
      customPet: "",
      chiefComplaint: rec.chiefComplaint || rec.chief_complaint || "",
      diagnosis: rec.diagnosis,
      treatment: rec.treatment,
      visitDate: rec.visitDate || rec.visit_date ? new Date(rec.visitDate || rec.visit_date as string).toISOString().split('T')[0] : "",
      notes: rec.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.petId) return toast.error("Please select a pet");
    if (!form.chiefComplaint || !form.diagnosis || !form.treatment) {
      return toast.error("Please fill all required medical fields");
    }

    setIsSaving(true);

    // 🚨 Translating React state to exact MySQL snake_case payload
    const payload = {
      pet_id: Number(form.petId),
      chief_complaint: form.chiefComplaint,
      diagnosis: form.diagnosis,
      treatment: form.treatment,
      visit_date: form.visitDate,
      notes: form.notes || undefined,
    };

    const recordId = editing?.id || editing?._id;
    const url = editing ? `${import.meta.env.VITE_API_URL}/api/medical-records/${recordId}` : `${import.meta.env.VITE_API_URL}/api/medical-records`;
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
        toast.success(`Record ${editing ? "updated" : "added"} successfully!`);
        fetchData();
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save record");
      }
    } catch (err: any) {
      toast.error("Network error. Is the server running?");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/medical-records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Record deleted"); 
        fetchData(); 
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (err: any) {
      toast.error("Network error.");
    } finally {
      setIsDeletingId(null);
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Medical Records 🏥</h1>
          <p className="text-gray-500 mt-1">
            {isLoading ? "Syncing archives..." : `${records.length} clinical records found`}
          </p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          + New Record
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          // 🚀 ENTERPRISE SKELETON LOADER
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-1/5"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/5"></div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🩺</div>
            <p className="font-medium">No medical records found in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Patient (Pet)</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Diagnosis</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Treatment</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Visit Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec) => {
                  const recordId = rec.id || rec._id;
                  const petId = String(rec.petId || rec.pet_id);
                  const pet = petMap[petId];

                  return (
                    <tr key={recordId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{pet?.name || "Unknown Pet"}</span>
                        {pet?.species && <span className="block text-xs text-gray-500 mt-0.5">{pet.species}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{rec.diagnosis}</span>
                        <span className="block text-xs text-gray-500 truncate max-w-xs mt-0.5" title={rec.chiefComplaint || rec.chief_complaint}>
                          Issue: {rec.chiefComplaint || rec.chief_complaint}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={rec.treatment}>
                        {rec.treatment}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rec.visitDate || rec.visit_date ? new Date((rec.visitDate || rec.visit_date) as string).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(rec)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                          <button disabled={isDeletingId === recordId} onClick={() => handleDelete(recordId)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50">
                            {isDeletingId === recordId ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <Modal title={editing ? "Edit Medical Record" : "New Medical Record"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
              <select
                required
                value={form.petId}
                onChange={(e) => setForm({ ...form, petId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow bg-white"
              >
                <option value="" disabled>-- Choose a Pet --</option>
                {pets.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} {p.species ? `(${p.species})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
                <input 
                  required
                  placeholder="e.g., Limping, Vomiting" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                  value={form.visitDate}
                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
              <input 
                required
                placeholder="Medical diagnosis..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-shadow"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan *</label>
              <textarea 
                required
                placeholder="Prescribed treatments, medications..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-shadow"
                rows={2}
                value={form.treatment}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea 
                placeholder="Dietary instructions, follow-up..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none transition-shadow"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                disabled={isSaving}
                onClick={() => setShowModal(false)} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}