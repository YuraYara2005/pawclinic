import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

export function SignInForm() {
  // 1. The Toggle State: Are we logging in or signing up?
  const [isSignUp, setIsSignUp] = useState(false);

  // 2. Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    // 3. Dynamically choose the route and the data based on the toggle
    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
    const payload = isSignUp 
      ? { name, email, password, role: "admin" } // Register needs name/role
      : { email, password };                     // Login just needs email/pass

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (data.success) {
        const realToken = data.data?.token || data.token; 
        localStorage.setItem("clinic_auth_token", realToken);
        
        toast.success(isSignUp ? "Account created successfully!" : "Login successful!");
        window.location.reload(); 
      } else {
        toast.error(data.message || "Authentication failed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      toast.error("Could not connect to the secure server.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* Dynamic Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-primary">
          {isSignUp ? "Create an Account" : "Welcome Back"}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {isSignUp ? "Register as a new clinic administrator" : "Enter your credentials to access the clinic"}
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        
        {/* Only show "Name" if they are signing up */}
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
              type="text" 
              placeholder="Dr. Demo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp} 
            />
          </div>
        )}

        {/* Email is used for both */}
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
        
        {/* Password is used for both */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            minLength={6}
          />
        </div>
        
        {/* Dynamic Submit Button */}
        <button 
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition shadow-sm disabled:opacity-70 mt-2" 
          type="submit" 
          disabled={submitting}
        >
          {submitting 
            ? "Processing securely..." 
            : (isSignUp ? "Create Account" : "Sign In")}
        </button>
      </form>

      {/* The Toggle Button */}
      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        <p className="text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-primary font-semibold hover:underline outline-none"
          >
            {isSignUp ? "Sign in instead" : "Sign up now"}
          </button>
        </p>
      </div>

    </div>
  );
}