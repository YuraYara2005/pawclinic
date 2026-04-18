import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Modal from "../components/Modal";

const speciesIcon = { dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", fish: "🐟", reptile: "🦎" };
const emptyForm = { ownerId: "", name: "", species: "dog", breed: "", age: "", gender: "unknown", weight: "", color: "", notes: "" };

export default function PetsPage() {
  const pets = useQuery(api.pets.list) ?? [];
  const owners = useQuery(api.owners.list) ?? [];
  const createPet = useMutation(api.pets.create);
  const updatePet = useMutation(api.pets.update);
  const removePet = useMutation(api.pets.remove);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const ownerMap = Object.fromEntries(owners.map((o) => [o._id, o]));
  const filtered = pets.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.species.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (pet) => {
    setEditing(pet);
    setForm({ ownerId: pet.ownerId, name: pet.name, species: pet.species, breed: pet.breed ?? "", age: pet.age?.toString() ?? "", gender: pet.gender ?? "unknown", weight: pet.weight?.toString() ?? "", color: pet.color ?? "", notes: pet.notes ?? "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.species || !form.ownerId) return toast.error("Name, species, and owner are required");
    const payload = {
      ownerId: form.ownerId,
      name: form.name,
      species: form.species,
      breed: form.breed || undefined,
      age: form.age ? parseFloat(form.age) : undefined,
      gender: form.gender || undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      color: form.color || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await updatePet({ id: editing._id, ...payload });
        toast.success("Pet updated!");
      } else {
        await createPet(payload);
        toast.success("Pet added!");
      }
      setShowModal(false);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this pet?")) return;
    try { await removePet({ id }); toast.success("Pet deleted"); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pets 🐾</h1>
          <p className="text-gray-400 mt-1">{pets.length} registered patients</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm">
          + Add Pet
        </button>
      </div>

      <div className="mb-4">
        <input
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          placeholder="🔍 Search pets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-gray-400 bg-white rounded-container shadow-card">
            <div className="text-5xl mb-3">🐾</div>
            <p className="font-medium">No pets found</p>
          </div>
        ) : filtered.map((pet) => (
          <div key={pet._id} className="bg-white rounded-container shadow-card p-5 hover:shadow-hover transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-2xl">
                  {speciesIcon[pet.species] ?? "🐾"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{pet.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(pet)} className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg transition text-sm">✏️</button>
                <button onClick={() => handleDelete(pet._id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition text-sm">🗑️</button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {pet.age && <div className="flex justify-between"><span className="text-gray-400">Age</span><span className="font-medium">{pet.age} yrs</span></div>}
              {pet.weight && <div className="flex justify-between"><span className="text-gray-400">Weight</span><span className="font-medium">{pet.weight} kg</span></div>}
              {pet.gender && <div className="flex justify-between"><span className="text-gray-400">Gender</span><span className="font-medium capitalize">{pet.gender}</span></div>}
              {pet.color && <div className="flex justify-between"><span className="text-gray-400">Color</span><span className="font-medium">{pet.color}</span></div>}
              <div className="flex justify-between pt-1 border-t border-gray-50">
                <span className="text-gray-400">Owner</span>
                <span className="font-medium text-primary">{ownerMap[pet.ownerId]?.name ?? "Unknown"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Pet" : "Add Pet"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Select owner...</option>
                {owners.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Name *</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Buddy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                  {["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Golden Retriever" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="5.2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Golden brown" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Allergies, special conditions..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition font-medium">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition">{editing ? "Update" : "Add Pet"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
