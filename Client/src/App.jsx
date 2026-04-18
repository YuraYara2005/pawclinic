import { Toaster } from "sonner";
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import OwnersPage from "./pages/OwnersPage";
import PetsPage from "./pages/PetsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import BillingPage from "./pages/BillingPage";
import InventoryPage from "./pages/InventoryPage";
import StaffPage from "./pages/StaffPage";
import { SignInForm } from "./SignInForm";

export default function App() {
  // 🔐 Check for the specific verification token
  const isAuthenticated = localStorage.getItem("clinic_auth_token") === "verified_admin_session";

  return (
    <div className="min-h-screen bg-mint-50">
      {isAuthenticated ? (
        <AuthenticatedApp />
      ) : (
        <LandingPage />
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}

function AuthenticatedApp() {
  const [page, setPage] = useState("dashboard");

  const profile = {
    _id: "admin_verified",
    name: "Dr. Yara (Admin)",
    role: "admin",
    phone: "555-0192"
  };

  const handleLogout = () => {
    localStorage.removeItem("clinic_auth_token");
    window.location.reload();
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "owners": return <OwnersPage />;
      case "pets": return <PetsPage />;
      case "appointments": return <AppointmentsPage />;
      case "medical": return <MedicalRecordsPage />;
      case "billing": return <BillingPage />;
      case "inventory": return <InventoryPage />;
      case "staff": return <StaffPage />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar remains completely untouched */}
      <Sidebar currentPage={page} onNavigate={setPage} profile={profile} />
      
      {/* ✅ FIXED LOGOUT BUTTON
        Pinned to the bottom-left corner over the sidebar.
        w-64 matches the sidebar width perfectly.
      */}
      <div className="fixed bottom-0 left-0 w-64 p-4 bg-white border-t border-gray-100 z-50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>

      <main className="flex-1 ml-64 p-8 bg-mint-50 min-h-screen">
        {renderPage()}
      </main>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-mint-100 via-sky-50 to-beige-100 p-8">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🐾</div>
        <h1 className="text-5xl font-bold text-emerald-600 mb-3">PawClinic</h1>
        <p className="text-xl text-gray-500 mb-1">Veterinary Clinic Management System</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Secure Login</h2>
        <SignInForm />
      </div>
    </div>
  );
}