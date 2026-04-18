import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Modal from "../components/Modal";

const emptyForm = {
  petId: "",
  customPet: "",
  chiefComplaint: "",
  diagnosis: "",
  treatment: "",
  visitDate: "",
  notes: "",
};

export default function MedicalRecordsPage() {
  const records = useQuery(api.medicalRecords.list);
  const pets = useQuery(api.pets.list);
  const currentUser = useQuery(api.auth.loggedInUser); // ✅ FIX

  const createRecord = useMutation(api.medicalRecords.create);
  const updateRecord = useMutation(api.medicalRecords.update);
  const deleteRecord = useMutation(api.medicalRecords.remove);
  const createPet = useMutation(api.pets.create); // ✅ NEW

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const petMap = Object.fromEntries((pets ?? []).map((p) => [p._id, p]));

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      visitDate: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    setForm({
      petId: rec.petId ?? "",
      customPet: "",
      chiefComplaint: rec.chiefComplaint,
      diagnosis: rec.diagnosis,
      treatment: rec.treatment,
      visitDate: rec.visitDate,
      notes: rec.notes ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      return toast.error("User not loaded yet");
    }

    let petIdToSend = form.petId;

    try {
      // ✅ OPTION B: create pet automatically
      if (form.petId === "other") {
        if (!form.customPet) {
          return toast.error("Enter pet name");
        }

        // ⚠️ pick first pet owner (temporary solution)
        const firstPet = pets?.[0];
        if (!firstPet) {
          return toast.error("Create at least one pet first");
        }

        const newPetId = await createPet({
          ownerId: firstPet.ownerId,
          name: form.customPet,
          species: "unknown",
        });

        petIdToSend = newPetId;
      }

      if (!petIdToSend) return toast.error("Pet is required");

      if (!form.chiefComplaint || !form.diagnosis || !form.treatment) {
        return toast.error("Fill all required fields");
      }

      const payload = {
        petId: petIdToSend,
        vetId: currentUser._id, // ✅ FIXED
        chiefComplaint: form.chiefComplaint,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        visitDate: form.visitDate,
        notes: form.notes || undefined,
      };

      if (editing) {
        await updateRecord({ id: editing._id, ...payload });
        toast.success("Record updated");
      } else {
        await createRecord(payload);
        toast.success("Record created");
      }

      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;

    try {
      await deleteRecord({ id });
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (records === undefined || pets === undefined || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Medical Records 🏥</h1>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg">
          + New
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Pet</th>
              <th className="p-3 text-left">Diagnosis</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec._id} className="border-t">
                <td className="p-3">{petMap[rec.petId]?.name ?? "—"}</td>
                <td className="p-3">{rec.diagnosis}</td>
                <td className="p-3">{rec.visitDate}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => openEdit(rec)}>Edit</button>
                  <button onClick={() => handleDelete(rec._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Medical Record" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <select
              value={form.petId}
              onChange={(e) =>
                setForm({ ...form, petId: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Select pet</option>
              {pets.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
              <option value="other">Other</option>
            </select>

            {form.petId === "other" && (
              <input
                placeholder="Enter pet name"
                value={form.customPet}
                onChange={(e) =>
                  setForm({ ...form, customPet: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
            )}

            <input placeholder="Complaint" className="w-full p-2 border rounded"
              value={form.chiefComplaint}
              onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
            />

            <input placeholder="Diagnosis" className="w-full p-2 border rounded"
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            />

            <input placeholder="Treatment" className="w-full p-2 border rounded"
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
            />

            <input type="date" className="w-full p-2 border rounded"
              value={form.visitDate}
              onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
            />

            <button className="w-full bg-primary text-white py-2 rounded">
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}