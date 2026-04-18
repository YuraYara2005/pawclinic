import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function StaffPage() {
  const profile = useQuery(api.userProfiles.getMyProfile);
  const currentUser = useQuery(api.auth.loggedInUser);

  const staffList = useQuery(api.userProfiles.listAll);
  const updateRole = useMutation(api.userProfiles.updateRole);
  const createProfile = useMutation(api.userProfiles.createProfile);

  const { signIn } = useAuthActions();

  const [showModal, setShowModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "vet",
  });

  const verifyAdmin = async () => {
    if (!adminPassword) {
      toast.error("Admin password required");
      return false;
    }

    try {
      await signIn("password", {
        email: currentUser?.email,
        password: adminPassword,
      });
      return true;
    } catch {
      toast.error("Invalid admin password");
      return false;
    }
  };

  // 🗑 DELETE
  const handleDelete = async (staff) => {
    if (staff.userId === profile.userId) {
      return toast.error("You cannot delete yourself");
    }

    const confirmed = confirm("Delete this staff member?");
    if (!confirmed) return;

    const valid = await verifyAdmin();
    if (!valid) return;

    try {
      await updateRole({ id: staff._id, role: "receptionist" }); // soft fallback
      toast.success("User removed (role downgraded)");
    } catch {
      toast.error("Delete failed");
    }
  };

  // 🔄 UPDATE ROLE
  const handleRoleChange = async (staff, role) => {
    const valid = await verifyAdmin();
    if (!valid) return;

    try {
      await updateRole({ id: staff._id, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed");
    }
  };

  // ➕ CREATE
  const handleCreate = async (e) => {
    e.preventDefault();

    const valid = await verifyAdmin();
    if (!valid) return;

    try {
      await signIn("password", {
        email: form.email,
        password: form.password,
        flow: "signUp",
      });

      await createProfile({
        name: form.name,
      });

      await signIn("password", {
        email: currentUser.email,
        password: adminPassword,
      });

      toast.success("Staff created");
      setShowModal(false);
    } catch {
      toast.error("Failed");
    }
  };

  if (!profile || profile.role !== "admin") {
    return <div className="text-red-500">Unauthorized</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Staff Management</h1>

      <button
        onClick={() => setShowModal(true)}
        className="bg-primary text-white px-4 py-2 rounded"
      >
        + Add Staff
      </button>

      {/* 🔐 Admin password input */}
      <input
        type="password"
        placeholder="Admin password (required for actions)"
        className="border p-2 rounded w-full max-w-md"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
      />

      {/* Table */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {staffList?.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>
                <select
                  value={s.role}
                  onChange={(e) =>
                    handleRoleChange(s, e.target.value)
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="vet">Vet</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => handleDelete(s)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <form className="bg-white p-6 rounded" onSubmit={handleCreate}>
            <input
              placeholder="Name"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <input
              placeholder="Email"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <button>Create</button>
          </form>
        </div>
      )}
    </div>
  );
}