import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"; // 🚨 NEW LIBRARY

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface DashboardProps {
  onNavigate: (page: string) => void;
}

interface Appointment {
  id?: number;
  _id?: string | number;
  date: string;
  time: string;
  reason: string;
  status: string;
}

interface Pet {
  id?: number;
  _id?: string | number;
  name: string;
  species: string;
  breed?: string;
}

interface InventoryItem {
  id?: number;
  _id?: string | number;
  name: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
  category: string;
}

// ==========================================
// 2. ICONS
// ==========================================
const Icons = {
  Calendar: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Paw: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M18 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M12 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M18 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M12 21a6 6 0 0 1-6-6v-1a6 6 0 0 1 12 0v1a6 6 0 0 1-6 6Z"/></svg>,
  Users: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Dollar: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  ChevronLeft: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Sparkles: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  Alert: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function Dashboard({ onNavigate }: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [ownersCount, setOwnersCount] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const token = localStorage.getItem("clinic_auth_token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const [apptRes, petsRes, ownersRes, invRes] = await Promise.all([
          fetch("http://localhost:5000/api/appointments", { headers }),
          fetch("http://localhost:5000/api/pets", { headers }),
          fetch("http://localhost:5000/api/owners", { headers }),
          fetch("http://localhost:5000/api/inventory", { headers })
        ]);

        const apptData = await apptRes.json();
        const petsData = await petsRes.json();
        const ownersData = await ownersRes.json();
        const invData = await invRes.json();

        if (apptData.success) setAppointments(apptData.data);
        if (petsData.success) setPets(petsData.data);
        if (ownersData.success) setOwnersCount(ownersData.data.length);
        if (invData.success) setInventory(invData.data);
      } catch (error) {
        toast.error("Dashboard sync failed. Is the server online?");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [token]);

  // --- Logic Helpers ---
  const getLocalYYYYMMDD = (dateInput: Date | string | number) => {
    const d = new Date(dateInput);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayDate = new Date();
  const todayStr = getLocalYYYYMMDD(todayDate);

  const todayAppts = useMemo(() => {
    return appointments.filter((a) => a.date && getLocalYYYYMMDD(a.date) === todayStr);
  }, [appointments, todayStr]);

  const lowStockItems = useMemo(() => 
    inventory.filter((item) => Number(item.quantity) <= Number(item.lowStockThreshold)), 
  [inventory]);

  const simulatedRevenue = 0; 

  // --- Calendar Logic ---
  const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- Recharts Pie Data ---
  const dogCount = pets.filter(p => p.species.toLowerCase() === 'dog').length;
  const catCount = pets.filter(p => p.species.toLowerCase() === 'cat').length;
  const otherCount = pets.length - dogCount - catCount;
  
  // Only pass data that exists so the chart doesn't render empty slices
  const pieData = [
    { name: 'Dogs', value: dogCount, color: '#0ea5e9' }, // sky-500
    { name: 'Cats', value: catCount, color: '#34d399' }, // emerald-400
    { name: 'Other', value: otherCount, color: '#fbbf24' } // amber-400
  ].filter(d => d.value > 0);

  return (
    <div className="w-full animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {isLoading ? "Syncing data..." : "Real-time metrics and clinic operations."}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 mt-4 md:mt-0 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-200 text-xs font-bold text-slate-700 tracking-wide">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          {todayDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 🚨 VERTICAL LAYOUT SHIFT 🚨 */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* LEFT COLUMN: Vertical KPI Stats */}
        <div className="xl:w-1/4 flex flex-col gap-6">
          <StatCard icon={Icons.Calendar} label="Today's Load" value={todayAppts.length} sub="Appointments" color="sky" />
          <StatCard icon={Icons.Paw} label="Active Patients" value={pets.length} sub="Registered" color="mint" />
          <StatCard icon={Icons.Users} label="Client Base" value={ownersCount} sub="Total Owners" color="green" />
          <StatCard icon={Icons.Dollar} label="Revenue" value={`$${simulatedRevenue}`} sub="Current Month" color="accent" />
        </div>

        {/* RIGHT COLUMN: The Data Grids */}
        <div className="xl:w-3/4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ROW 1: Advanced Line Chart (Span 2) & Calendar (Span 1) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:col-span-2 h-[22rem]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Revenue & Patient Volume</h2>
                <p className="text-xs text-slate-500 font-medium">Weekly trend analysis</p>
              </div>
            </div>
            <div className="w-full h-full relative mt-auto">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 160 C 100 130, 200 170, 300 80 C 400 10, 500 60, 600 20 C 700 10, 800 50, 800 50 L 800 200 L 0 200 Z" fill="url(#chart-gradient)" />
                <path d="M 0 160 C 100 130, 200 170, 300 80 C 400 10, 500 60, 600 20 C 700 10, 800 50, 800 50" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
                <circle cx="300" cy="80" r="5" fill="#fff" stroke="#0ea5e9" strokeWidth="3" />
                <circle cx="600" cy="20" r="5" fill="#fff" stroke="#0ea5e9" strokeWidth="3" />
              </svg>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-2 uppercase tracking-widest">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:col-span-1 h-[22rem]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">{monthNames[todayDate.getMonth()]} {todayDate.getFullYear()}</h2>
              <div className="flex gap-2">
                <button className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100">{Icons.ChevronLeft}</button>
                <button className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100">{Icons.ChevronRight}</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[10px] font-bold text-slate-400 uppercase">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((day, i) => (
                <div 
                  key={i} 
                  className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold transition-colors
                    ${!day ? '' : 
                      day === todayDate.getDate() 
                        ? 'bg-sky-500 text-white shadow-sm' 
                        : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                    }`}
                >
                  {day || ''}
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Today's Schedule</p>
              {todayAppts.length === 0 ? (
                <p className="text-sm font-medium text-slate-400">No appointments today.</p>
              ) : (
                <div className="space-y-2">
                  {todayAppts.slice(0, 2).map(appt => (
                    <div key={appt.id || appt._id} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">{appt.time?.slice(0,5)}</span>
                      <span className="text-slate-600 truncate max-w-[120px]">{appt.reason}</span>
                    </div>
                  ))}
                  {todayAppts.length > 2 && <p className="text-xs text-sky-500 font-bold">+{todayAppts.length - 2} more</p>}
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: MASSIVE INTERACTIVE PIE CHART & STOCK ALERTS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:col-span-2 h-[22rem]">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Patient Demographics</h2>
            <p className="text-xs text-slate-500 font-medium mb-2">Hover over chart for exact metrics</p>
            
            <div className="flex-1 w-full h-full min-h-0">
              {pieData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No patient data available.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={5} 
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* STOCK ALERTS (Swapped in here per your request) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:col-span-1 h-[22rem]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="text-rose-500">{Icons.Alert}</span> Stock Alerts
              </h2>
              <button onClick={() => onNavigate("inventory")} className="text-xs font-bold text-rose-600 hover:text-rose-700">Restock</button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div>
              ) : lowStockItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500 font-medium text-sm">Inventory optimal</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id || item._id} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl border-l-4 border-l-rose-500">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                        <p className="text-sm font-black text-rose-600">{item.quantity}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                        <p className="text-[10px] text-slate-500 font-semibold opacity-70 uppercase">{item.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: Today's Queue & AI Hub */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:col-span-2 h-[20rem]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h2 className="text-lg font-bold text-slate-900">Today's Queue</h2>
              <button onClick={() => onNavigate("appointments")} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                Manage
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {todayAppts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <span className="text-slate-300 mb-2">{Icons.Calendar}</span>
                  <p className="text-slate-500 font-medium text-sm">Schedule clear</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppts.map((appt) => (
                    <div key={appt.id || appt._id} className="flex gap-4 items-start group">
                      <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-xs font-bold text-slate-700">{appt.time ? appt.time.slice(0, 5) : "--:--"}</span>
                      </div>
                      <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 group-hover:border-emerald-200 group-hover:bg-white transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-slate-800 text-sm">{appt.reason}</p>
                          <Badge status={appt.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIGHT MODE AI HUB */}
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/40 p-6 flex flex-col lg:col-span-1 h-[20rem]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-500">{Icons.Sparkles}</span>
              <h2 className="text-lg font-bold text-indigo-950 tracking-tight">Clinic Intelligence</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">Automated workflow modules</p>

            <div className="space-y-3">
              <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Triage Chatbot</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Configuration Setup</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
              </div>
              
              <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">Smart Scheduling</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Active</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            <button className="mt-auto w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs font-bold rounded-xl transition-colors">
              Manage AI Modules
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}