import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function ProfileSetup() {
  const createProfile = useMutation(api.userProfiles.createProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return toast.error("Name is required");
    }

    setLoading(true);

    try {
      await createProfile({
          name,
          phone: phone || undefined,
      });

      toast.success("Profile created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint-100 via-sky-50 to-beige-100 p-8">
      <div className="bg-white rounded-container shadow-card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐾</div>
          <h2 className="text-2xl font-bold text-primary">
            Complete Your Profile
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Your account will be configured by an administrator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (optional)
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
          </div>

          {/* Info message */}
          <div className="text-xs text-gray-400 text-center">
            Your role will be assigned by the clinic administrator
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Get Started 🐾"}
          </button>
        </form>
      </div>
    </div>
  );
}