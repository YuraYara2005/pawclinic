import React, { useState, useEffect } from "react";
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
  petId: string | number;
  vetId: string | number;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  visitDate: string;
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
  // Data State
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // UI State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<RecordFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const token = localStorage.getItem("clinic_auth_token");

  // Create a map for quick pet name lookups
  const petMap = Object.fromEntries(pets.map((p) => [p.id || p._id, p]));

  // ==========================================
  // 3. API FETCH LOGIC
  // ==========================================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Real Pets from MySQL
      const petsRes = await fetch("http://localhost:5000/api/pets", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const petsData = await petsRes.json();
      if (petsData.success) {
        setPets(petsData.data);
      }

      // 2. Mock Medical Records (Until we build the backend route!)
      setRecords([
        { _id: 1, petId: petsData.data[0]?.id || 1, vetId: 1, chiefComplaint: "Limping", diagnosis: "Sprained paw", treatment: "Rest, pain meds", visitDate: "2026-04-10" }
      ]);

    } catch (error) {
      toast.error("Failed to connect to the database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      petId: rec.petId,
      customPet: "",
      chiefComplaint: rec.chiefComplaint,
      diagnosis: rec.diagnosis,
      treatment: rec.treatment,
      visitDate: rec.visitDate,
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

    try {
      // Simulating network request for now
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success(editing ? "Record updated!" : "New medical record created!");
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;

    try {
      toast.success("Record deleted (Simulated)");
      setRecords(records.filter(r => (r.id || r._id) !== id));
    } catch (err: any) {
      toast.error(err.message);
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
            {isLoading ? "Loading records..." : `${records.length} clinical records found`}
          </p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          + New Record
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4" />
            <p className="font-medium">Loading patient data...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🩺</div>
            <p className="font-medium">No medical records found</p>
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
                  const pet = petMap[rec.petId];

                  return (
                    <tr key={recordId} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{pet?.name || "Unknown Pet"}</span>
                        {pet?.species && <span className="block text-xs text-gray-500 mt-0.5">{pet.species}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{rec.diagnosis}</span>
                        <span className="block text-xs text-gray-500 truncate max-w-xs mt-0.5" title={rec.chiefComplaint}>
                          Issue: {rec.chiefComplaint}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={rec.treatment}>
                        {rec.treatment}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(rec.visitDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(rec)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                          <button onClick={() => handleDelete(recordId)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">Delete</button>
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