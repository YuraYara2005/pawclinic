import React, { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 🔒 SECURE: Send credentials to your Node.js backend.
      // React never knows the real password, it just asks Node to verify it.
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();

      if (data.success) {
        // 🔒 SECURE: Save the cryptographic JWT token to the browser.
        const realToken = data.data?.token || data.token; 
        localStorage.setItem("clinic_auth_token", realToken);
        
        toast.success("Login successful!");
        window.location.reload(); 
      } else {
        toast.error(data.message || "Invalid credentials. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      toast.error("Could not connect to the secure server.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
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
          {submitting ? "Authenticating securely..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}