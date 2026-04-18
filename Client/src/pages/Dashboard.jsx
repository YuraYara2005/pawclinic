import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";

export default function Dashboard({ onNavigate }) {
  const appointments = useQuery(api.appointments.list) ?? [];
  const pets = useQuery(api.pets.list) ?? [];
  const owners = useQuery(api.owners.list) ?? [];
  const lowStock = useQuery(api.inventory.lowStock) ?? [];
  const revenue = useQuery(api.invoices.totalRevenue) ?? 0;
  const invoices = useQuery(api.invoices.list) ?? [];

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === today);
  const pendingInvoices = invoices.filter((i) => i.paymentStatus === "pending");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard 🏠</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📅" label="Today's Appointments" value={todayAppts.length} color="sky" />
        <StatCard icon="🐾" label="Total Pets" value={pets.length} color="mint" />
        <StatCard icon="👤" label="Total Owners" value={owners.length} color="green" />
        <StatCard icon="💰" label="Total Revenue" value={`$${revenue.toFixed(2)}`} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-container shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">📅 Today's Appointments</h2>
            <button onClick={() => onNavigate("appointments")} className="text-sm text-primary hover:underline">View all</button>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🐶</div>
              <p>No appointments today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppts.slice(0, 5).map((appt) => (
                <div key={appt._id} className="flex items-center justify-between p-3 bg-mint-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{appt.reason}</p>
                    <p className="text-xs text-gray-400">{appt.time}</p>
                  </div>
                  <Badge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-container shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">⚠️ Low Stock Alerts</h2>
            <button onClick={() => onNavigate("inventory")} className="text-sm text-primary hover:underline">View all</button>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p>All stock levels are good!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-rose-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-500">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-gray-400">min: {item.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invoices */}
        <div className="bg-white rounded-container shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">💳 Pending Payments</h2>
            <button onClick={() => onNavigate("billing")} className="text-sm text-primary hover:underline">View all</button>
          </div>
          {pendingInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🎉</div>
              <p>No pending payments!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvoices.slice(0, 5).map((inv) => (
                <div key={inv._id} className="flex items-center justify-between p-3 bg-beige-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-700 text-sm">Invoice #{inv._id.slice(-6)}</p>
                    <p className="text-xs text-gray-400">{inv.invoiceDate}</p>
                  </div>
                  <p className="font-bold text-accent">${inv.total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Pets */}
        <div className="bg-white rounded-container shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">🐾 Recent Patients</h2>
            <button onClick={() => onNavigate("pets")} className="text-sm text-primary hover:underline">View all</button>
          </div>
          {pets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🐱</div>
              <p>No pets registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pets.slice(0, 5).map((pet) => (
                <div key={pet._id} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-lg">
                    {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : pet.species === "bird" ? "🐦" : "🐾"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{pet.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{pet.species} {pet.breed ? `· ${pet.breed}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
