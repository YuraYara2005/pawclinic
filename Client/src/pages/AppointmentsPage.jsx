import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Modal from "../components/Modal";
import Badge from "../components/Badge";

const emptyForm = { petId: "", ownerId: "", date: "", time: "", reason: "", status: "scheduled", notes: "" };

export default function AppointmentsPage() {
  const appointments = useQuery(api.appointments.list) ?? [];
  const pets = useQuery(api.pets.list) ?? [];
  const owners = useQuery(api.owners.list) ?? [];
  const createAppt = useMutation(api.appointments.create);
  const updateAppt = useMutation(api.appointments.update);
  const updateStatus = useMutation(api.appointments.updateStatus);
  const removeAppt = useMutation(api.appointments.remove);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filterStatus, setFilterStatus] = useState("all");

  const petMap = Object.fromEntries(pets.map((p) => [p._id, p]));
  const ownerMap = Object.fromEntries(owners.map((o) => [o._id, o]));

  const filtered = filterStatus === "all" ? appointments : appointments.filter((a) => a.status === filterStatus);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, date: new Date().toISOString().split("T")[0] }); setShowModal(true); };
  const openEdit = (appt) => {
    setEditing(appt);
    setForm({ petId: appt.petId, ownerId: appt.ownerId, date: appt.date, time: appt.time, reason: appt.reason, status: appt.status, notes: appt.notes ?? "" });
    setShowModal(true);
  };

  const handlePetChange = (petId) => {
    const pet = pets.find((p) => p._id === petId);
    setForm({ ...form, petId, ownerId: pet?.ownerId ?? "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.petId || !form.date || !form.time || !form.reason) return toast.error("Pet, date, time, and reason are required");
    try {
      if (editing) {
        await updateAppt({ id: editing._id, ...form, notes: form.notes || undefined });
        toast.success("Appointment updated!");
      } else {
        await createAppt({ ...form, notes: form.notes || undefined });
        toast.success("Appointment created!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleStatusChange = async (id, status) => {
    try { await updateStatus({ id, status }); toast.success("Status updated"); }
    catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this appointment?")) return;
    try { await removeAppt({ id }); toast.success("Appointment deleted"); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Appointments 📅</h1>
          <p className="text-gray-400 mt-1">{appointments.length} total appointments</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm">
          + New Appointment
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "scheduled", "completed", "cancelled", "no-show"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filterStatus === s ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-mint-50 border border-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-container shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-medium">No appointments found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-mint-50 border-b border-mint-100">
              <tr>
                {["Pet", "Owner", "Date & Time", "Reason", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((appt) => (
                <tr key={appt._id} className="hover:bg-mint-50/50 transition">
                  <td className="px-5 py-4 font-medium text-gray-800">{petMap[appt.petId]?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{ownerMap[appt.ownerId]?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-sm">
                    <p className="font-medium text-gray-700">{appt.date}</p>
                    <p className="text-gray-400">{appt.time}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate">{appt.reason}</td>
                  <td className="px-5 py-4">
                    <select
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
                    >
                      {["scheduled", "completed", "cancelled", "no-show"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(appt)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                      <button onClick={() => handleDelete(appt._id)} className="px-3 py-1.5 text-xs bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Appointment" : "New Appointment"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pet *</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={form.petId} onChange={(e) => handlePetChange(e.target.value)}>
                <option value="">Select pet...</option>
                {pets.map((p) => <option key={p._id} value={p._id}>{p.name} ({ownerMap[p.ownerId]?.name ?? "?"})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input type="time" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Annual checkup, vaccination..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["scheduled", "completed", "cancelled", "no-show"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition">{editing ? "Update" : "Create"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
