import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🔐 Define your Master Credentials here
  const MASTER_EMAIL = "admin@clinic.com";
  const MASTER_PASSWORD = "admin123";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate network delay to make it look like a real database check
    setTimeout(() => {
      if (email === MASTER_EMAIL && password === MASTER_PASSWORD) {
        // ✅ Verification Passed
        localStorage.setItem("clinic_auth_token", "verified_admin_session");
        toast.success("Welcome back, Dr. Yara!");
        window.location.reload(); 
      } else {
        // ❌ Verification Failed
        toast.error("Invalid email or password. Please try again.");
        setSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
            type="email" 
            placeholder="admin@clinic.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        
        <button 
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm disabled:opacity-70 mt-2" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? "Verifying Credentials..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}