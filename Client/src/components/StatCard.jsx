export default function StatCard({ icon, label, value, color = "mint", sub }) {
  const colors = {
    mint: "bg-mint-50 text-primary border-mint-200",
    sky: "bg-sky-50 text-sky-500 border-sky-200",
    accent: "bg-accent-light text-accent border-orange-200",
    rose: "bg-rose-50 text-rose-400 border-rose-200",
    green: "bg-secondary-light text-secondary border-green-200",
  };
  return (
    <div className={`rounded-container border p-5 flex items-center gap-4 bg-white shadow-card`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
