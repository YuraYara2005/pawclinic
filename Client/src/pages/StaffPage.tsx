import React, { useState, useEffect } from "react";
import type {FormEvent} from "react";
import { toast } from "sonner";

// ==========================================
// 1. TYPESCRIPT INTERFACES (The Blueprints)
// ==========================================
interface Staff {
  _id: number | string;
  name: string;
  email: string;
  role: "admin" | "vet" | "receptionist" | "staff";
}

interface StaffFormData {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "vet" | "receptionist" | "staff";
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function StaffPage() {
  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");

  // Data State
  const [staffList, setStaffList] = useState<Staff[]>([
    { _id: 1, name: "Dr. Yara (Admin)", role: "admin", email: "admin2@clinic.com" },
    { _id: 2, name: "Staff User", role: "staff", email: "staff@clinic.com" }
  ]);

  const [form, setForm] = useState<StaffFormData>({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  // ==========================================
  // 3. API ACTION HANDLERS
  // ==========================================
  
  const handleDelete = async (staff: Staff) => {
    if (!adminPassword) {
      toast.error("Admin password required to delete staff.");
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to remove ${staff.name}?`);
    if (!confirmed) return;

    // TODO: Wire to backend -> DELETE /api/users/:id
    toast.info(`Simulated: Deleting ${staff.name}... Ready for MySQL connection!`);
  };

  const handleRoleChange = async (staff: Staff, newRole: string) => {
    if (!adminPassword) {
      toast.error("Admin password required to change roles.");
      return;
    }

    // TODO: Wire to backend -> PUT /api/users/:id
    toast.success(`Simulated: Updated ${staff.name}'s role to ${newRole}`);
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!adminPassword) throw new Error("Admin password required");
      if (!form.name || !form.email || !form.password) throw new Error("All fields are required");

      // TODO: Wire to backend -> POST /api/auth/register
      
      // Simulating a fast network request
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast.success(`${form.name} added successfully!`);
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "staff" }); // Reset form
    } catch (error: any) {
      toast.error(error.message || "Failed to create staff");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 4. RENDER UI
  // ==========================================
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage clinic access and staff roles</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-emerald-700 transition-all font-medium flex items-center gap-2 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Add Staff
        </button>
      </div>

      {/* Security Verification Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <div className="flex-1 max-w-sm">
          <input
            type="password"
            placeholder="Enter Admin Password to enable edits..."
            className="w-full border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role / Access Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((staff) => (
                <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{staff.name}</td>
                  <td className="px-6 py-4 text-gray-500">{staff.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={staff.role}
                      onChange={(e) => handleRoleChange(staff, e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 transition-all"
                    >
                      <option value="admin">Administrator</option>
                      <option value="vet">Veterinarian</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="staff">General Staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(staff)}
                      className="text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <form 
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-5 animate-in zoom-in-95 duration-200" 
            onSubmit={handleCreate}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Staff</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new account for your clinic.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="e.g. Dr. Sarah Connor"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="sarah@clinic.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input
                  required
                  type="password"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-shadow"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}