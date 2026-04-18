import { SignOutButton } from "../SignOutButton";

const baseNavItems = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "owners", label: "Owners", icon: "👤" },
  { id: "pets", label: "Pets", icon: "🐾" },
  { id: "appointments", label: "Appointments", icon: "📅" },
  { id: "medical", label: "Medical Records", icon: "🩺" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "inventory", label: "Inventory", icon: "📦" },
];

const roleColors = {
  admin: "bg-rose-100 text-rose-500",
  vet: "bg-mint-100 text-primary",
  receptionist: "bg-beige-100 text-accent",
};

export default function Sidebar({ currentPage, onNavigate, profile }) {
  // ✅ ONLY ADD THIS — nothing else changed
  const navItems = [
    ...baseNavItems,
    ...(profile?.role === "admin"
      ? [{ id: "staff", label: "Staff Management", icon: "👩‍⚕️" }]
      : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-card flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-mint-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐾</span>
          <div>
            <h1 className="text-xl font-bold text-primary">PawClinic</h1>
            <p className="text-xs text-gray-400">Vet Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-medium text-sm ${
              currentPage === item.id
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-mint-50 hover:text-primary"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Profile */}
      <div className="p-4 border-t border-mint-100">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm">
            {profile?.name?.[0]?.toUpperCase() ?? "?"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">
              {profile?.name}
            </p>

            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                roleColors[profile?.role] ??
                "bg-gray-100 text-gray-500"
              }`}
            >
              {profile?.role}
            </span>
          </div>
        </div>

        <SignOutButton />
      </div>
    </aside>
  );
}