import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Modal from "../components/Modal";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "" };

export default function OwnersPage() {
  const owners = useQuery(api.owners.list) ?? [];
  const createOwner = useMutation(api.owners.create);
  const updateOwner = useMutation(api.owners.update);
  const removeOwner = useMutation(api.owners.remove);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = owners.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search)
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (owner) => { setEditing(owner); setForm({ name: owner.name, phone: owner.phone, email: owner.email ?? "", address: owner.address ?? "", notes: owner.notes ?? "" }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error("Name and phone are required");
    try {
      if (editing) {
        await updateOwner({ id: editing._id, ...form, email: form.email || undefined, address: form.address || undefined, notes: form.notes || undefined });
        toast.success("Owner updated!");
      } else {
        await createOwner({ ...form, email: form.email || undefined, address: form.address || undefined, notes: form.notes || undefined });
        toast.success("Owner added!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this owner?")) return;
    try { await removeOwner({ id }); toast.success("Owner deleted"); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Owners 👤</h1>
          <p className="text-gray-400 mt-1">{owners.length} registered owners</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm">
          + Add Owner
        </button>
      </div>

      <div className="mb-4">
        <input
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          placeholder="🔍 Search owners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-container shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">👤</div>
            <p className="font-medium">No owners found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-mint-50 border-b border-mint-100">
              <tr>
                {["Name", "Phone", "Email", "Address", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-sm font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((owner) => (
                <tr key={owner._id} className="hover:bg-mint-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
                        {owner.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{owner.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{owner.phone}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm">{owner.email ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate">{owner.address ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(owner)} className="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition font-medium">Edit</button>
                      <button onClick={() => handleDelete(owner._id)} className="px-3 py-1.5 text-xs bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Owner" : "Add Owner"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Full Name *", key: "name", placeholder: "John Doe" },
              { label: "Phone *", key: "phone", placeholder: "+1 555 000 0000" },
              { label: "Email", key: "email", placeholder: "john@example.com" },
              { label: "Address", key: "address", placeholder: "123 Main St" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition">
                {editing ? "Update" : "Add Owner"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
