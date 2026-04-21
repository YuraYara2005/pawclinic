import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "sky" | "mint" | "green" | "accent" | string;
  sub?: string;
}

export default function StatCard({ icon, label, value, color, sub }: StatCardProps) {
  // Map our custom colors to bold, solid backgrounds with high contrast
  const themeStyles: Record<string, { bg: string, iconBg: string, text: string, subText: string }> = {
    sky: { bg: "bg-sky-500 border-sky-600", iconBg: "bg-white/20 text-white", text: "text-white", subText: "text-sky-100" },
    mint: { bg: "bg-emerald-500 border-emerald-600", iconBg: "bg-white/20 text-white", text: "text-white", subText: "text-emerald-100" },
    green: { bg: "bg-teal-500 border-teal-600", iconBg: "bg-white/20 text-white", text: "text-white", subText: "text-teal-100" },
    accent: { bg: "bg-indigo-500 border-indigo-600", iconBg: "bg-white/20 text-white", text: "text-white", subText: "text-indigo-100" },
  };

  const theme = themeStyles[color] || { bg: "bg-slate-800 border-slate-900", iconBg: "bg-white/20 text-white", text: "text-white", subText: "text-slate-300" };

  return (
    <div className={`${theme.bg} rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`${theme.subText} font-bold text-xs uppercase tracking-wider mb-1`}>{label}</h3>
          <p className={`text-3xl font-black ${theme.text} tracking-tight drop-shadow-sm`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shadow-sm backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
      {sub && <p className={`text-sm font-medium ${theme.subText}`}>{sub}</p>}
      
      {/* Sleek background accent for depth */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
    </div>
  );
}