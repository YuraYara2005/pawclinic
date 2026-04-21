import React, { useState, useEffect, useMemo } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import Modal from "../components/Modal";
import Badge from "../components/Badge";

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================
interface Owner {
  id?: number;
  _id?: string | number;
  name: string;
  email?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id?: number;
  _id?: string | number;
  ownerId?: string | number;
  owner_id?: string | number;
  invoiceNumber: string;
  invoice_number?: string;
  date: string;
  dueDate: string;
  due_date?: string;
  items: InvoiceItem[] | string; 
  totalAmount: number;
  total_amount?: number;
  status: "paid" | "pending" | "overdue";
}

interface InvoiceFormData {
  ownerId: string | number;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: "paid" | "pending" | "overdue";
}

// ==========================================
// 2. ICONS (Financial / Professional)
// ==========================================
const Icons = {
  FileInvoice: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Plus: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Dollar: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const token = localStorage.getItem("clinic_auth_token");

  const getLocalYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const emptyForm: InvoiceFormData = {
    ownerId: "",
    date: getLocalYYYYMMDD(new Date()),
    dueDate: getLocalYYYYMMDD(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 14 days from now
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    status: "pending"
  };

  const [form, setForm] = useState<InvoiceFormData>(emptyForm);

  // ==========================================
  // 4. DATA FETCHING
  // ==========================================
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // We expect the backend to eventually have an /api/invoices route
      const [invRes, ownersRes] = await Promise.all([
        fetch("http://localhost:5000/api/invoices", { headers }).catch(() => ({ ok: false, json: () => ({ success: false, data: [] }) })),
        fetch("http://localhost:5000/api/owners", { headers })
      ]);

      const invData = await (invRes as any).json();
      const ownersData = await ownersRes.json();

      if (invData.success) setInvoices(invData.data);
      if (ownersData.success) setOwners(ownersData.data);

    } catch (error) {
      toast.error("Failed to sync billing records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ownerMap = Object.fromEntries(owners.map((o) => [o.id || o._id, o]));

  const filtered = filterStatus === "all" 
    ? invoices 
    : invoices.filter((i) => i.status === filterStatus);

  // Calculate Metrics safely
  const metrics = useMemo(() => {
    let outstanding = 0;
    let collected = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      const amount = Number(inv.totalAmount || inv.total_amount || 0);
      if (inv.status === 'paid') collected += amount;
      if (inv.status === 'pending') outstanding += amount;
      if (inv.status === 'overdue') overdue += amount;
    });

    return { outstanding, collected, overdue };
  }, [invoices]);

  // ==========================================
  // 5. ACTION HANDLERS
  // ==========================================
  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const addLineItem = () => {
    setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unitPrice: 0 }] });
  };

  const removeLineItem = (index: number) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems.length ? newItems : [{ description: "", quantity: 1, unitPrice: 0 }] });
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const calculateSubtotal = () => {
    return form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.ownerId) return toast.error("Client is required");
    
    const validItems = form.items.filter(i => i.description.trim() !== "" && i.unitPrice > 0);
    if (validItems.length === 0) return toast.error("At least one valid line item is required");

    setIsSaving(true);

    const payload = {
      owner_id: Number(form.ownerId),
      date: form.date,
      due_date: form.dueDate,
      items: JSON.stringify(validItems),
      total_amount: calculateSubtotal(),
      status: form.status
    };

    try {
      const res = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice generated successfully");
        fetchData();
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to generate invoice");
      }
    } catch (err) {
      toast.error("Network error. Make sure the backend invoices route exists!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id: string | number | undefined, newStatus: string) => {
    if (!id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/invoices/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("Invoice status updated");
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // ==========================================
  // 6. RENDER UI
  // ==========================================
  return (
    <div className="w-full animate-in fade-in duration-500 pb-12">
      
      {/* Professional Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Manage clinic revenue, outstanding balances, and client billing.
          </p>
        </div>
        <button onClick={openCreate} className="mt-4 md:mt-0 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm active:scale-95">
          {Icons.Plus} Create Invoice
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-3xl font-black text-emerald-600">${metrics.collected.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">Outstanding Balance</p>
          <p className="text-3xl font-black text-amber-500">${metrics.outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">Overdue Accounts</p>
          <p className="text-3xl font-black text-rose-600">${metrics.overdue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex gap-2">
          {["all", "pending", "paid", "overdue"].map((s) => (
            <button 
              key={s} 
              onClick={() => setFilterStatus(s)} 
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize tracking-wide ${filterStatus === s ? "bg-slate-800 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                {["Invoice", "Client", "Issue Date", "Amount", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    <div className="flex justify-center mb-3"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400" /></div>
                    Fetching ledger data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-medium">
                    <div className="flex justify-center mb-3 text-slate-300">{Icons.FileInvoice}</div>
                    No invoices found. (Ensure backend API exists)
                  </td>
                </tr>
              ) : filtered.map((inv) => {
                const targetId = inv.id || inv._id;
                const owner = ownerMap[(inv.ownerId || inv.owner_id) as string];
                const invNum = inv.invoiceNumber || inv.invoice_number || `INV-${String(targetId).padStart(4, '0')}`;
                
                return (
                  <tr key={targetId} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{invNum}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">{owner?.name || "Unknown Client"}</span>
                      <span className="text-xs text-slate-500">{owner?.email || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700 block">{inv.date ? new Date(inv.date).toLocaleDateString() : "—"}</span>
                      <span className="text-xs text-slate-400">Due: {inv.dueDate || inv.due_date ? new Date(inv.dueDate || inv.due_date as string).toLocaleDateString() : "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900">${Number(inv.totalAmount || inv.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-6 py-4">
                       <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(targetId, e.target.value)}
                          className={`text-xs border rounded-lg px-2 py-1.5 focus:outline-none font-bold uppercase tracking-wide cursor-pointer
                            ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                            ${inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                            ${inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                          `}
                        >
                          {["pending", "paid", "overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors">View Details</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL */}
      {showModal && (
        <Modal title="Generate New Invoice" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billed To *</label>
              <select 
                required
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none bg-white font-medium" 
                value={form.ownerId} 
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="" disabled>Select registered client...</option>
                {owners.map((o) => <option key={o.id || o._id} value={o.id || o._id}>{o.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Date *</label>
                <input 
                  required type="date" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none font-medium text-slate-700" 
                  value={form.date} 
                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date *</label>
                <input 
                  required type="date" 
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none font-medium text-slate-700" 
                  value={form.dueDate} 
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                />
              </div>
            </div>

            {/* Line Items Engine */}
            <div>
              <div className="flex justify-between items-end mb-2 border-b border-slate-200 pb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Line Items</label>
                <button type="button" onClick={addLineItem} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                  {Icons.Plus} Add Service
                </button>
              </div>
              
              <div className="space-y-3 mt-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input 
                        required placeholder="Description (e.g., Annual Exam)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-800 outline-none font-medium"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <input 
                        required type="number" min="1" placeholder="Qty"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-800 outline-none font-medium"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-28 relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                      <input 
                        required type="number" min="0" step="0.01"
                        className="w-full pl-6 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-slate-800 outline-none font-medium"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <button type="button" onClick={() => removeLineItem(index)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors mt-0.5">
                      {Icons.Trash}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 text-white p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-sm">Total Due</span>
              <span className="text-2xl font-black">${calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button disabled={isSaving} type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
              <button disabled={isSaving} type="submit" className="px-6 py-2.5 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm">
                {isSaving ? "Generating..." : "Save Invoice"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}