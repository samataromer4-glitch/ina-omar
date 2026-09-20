import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  DollarSign, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryItem } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface InventoryViewProps {
  inventory?: InventoryItem[];
  items?: InventoryItem[];
  onAddItem: (data: any) => Promise<void>;
  onUpdateItem: (id: string, data: any) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  currency?: string;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function InventoryView({
  inventory: rawInventory,
  items: rawItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  currency = '$',
  showToast = () => {}
}: InventoryViewProps) {
  const inventory = rawInventory || rawItems || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    itemName: '',
    category: 'Furniture',
    quantity: 1,
    location: 'Building A',
    condition: 'Good' as 'Excellent' | 'Good' | 'Fair' | 'Needs Repair' | 'Damaged',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    assignedTo: '',
    status: 'Available' as 'Available' | 'In Use' | 'Under Maintenance' | 'Disposed',
    notes: ''
  });

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      itemName: '',
      category: 'Furniture',
      quantity: 10,
      location: 'Classroom 1',
      condition: 'Good',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 150,
      assignedTo: '',
      status: 'Available',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      location: item.location || '',
      condition: item.condition || 'Good',
      purchaseDate: item.purchaseDate || '',
      purchaseCost: item.purchaseCost || 0,
      assignedTo: item.assignedTo || '',
      status: item.status || 'Available',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim()) {
      showToast("Magaca alaabta waa khasab", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, form);
        showToast("Alaabta si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddItem(form);
        showToast("Alaab cusub ayaa lagu daray kaydka");
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered
  const filteredItems = inventory.filter(item => {
    const matchQuery = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.assignedTo && item.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchQuery && matchCategory;
  });

  // Analytics
  const totalAssetsCount = inventory.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalAssetValue = inventory.reduce((sum, i) => sum + ((Number(i.purchaseCost) || 0) * (Number(i.quantity) || 1)), 0);
  const damagedCount = inventory.filter(i => i.condition === 'Damaged' || i.condition === 'Needs Repair').length;

  // Export PDF
  const exportPDF = () => {
    if (filteredItems.length === 0) return;
    const doc = new jsPDF();
    doc.text("Dugsiga Pro 2026 - Qalabka & Hantida Iskuulka (Inventory)", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['Item Name', 'Category', 'Qty', 'Location', 'Condition', 'Cost', 'Status']],
      body: filteredItems.map(i => [
        i.itemName,
        i.category,
        i.quantity,
        i.location || '-',
        i.condition,
        `${currency} ${i.purchaseCost}`,
        i.status
      ])
    });
    doc.save(`Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (filteredItems.length === 0) return;
    const data = filteredItems.map(i => ({
      Item: i.itemName,
      Category: i.category,
      Quantity: i.quantity,
      Location: i.location,
      Condition: i.condition,
      Cost: i.purchaseCost,
      Status: i.status,
      AssignedTo: i.assignedTo,
      PurchaseDate: i.purchaseDate,
      Notes: i.notes
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Hantida & Qalabka Iskuulka (Inventory)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Kormeerka kuraasta, qalabka tignoolajiyada, xarumaha tijaabada, iyo dayactirka
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            className="p-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
            title="Dhoofi PDF"
          >
            <Download className="w-4 h-4 text-[#c4b5fd]" />
          </button>
          <button
            onClick={exportExcel}
            className="p-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
            title="Dhoofi Excel"
          >
            <Download className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ku dar Qalab</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Noocyada Qalabka</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{inventory.length}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Shay oo kala duwan</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Wadarta Xabbadaha</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{totalAssetsCount}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Isku-darka tirada qalabka</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">Qiimaha Guud ee Hantida</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {currency} {totalAssetValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Qiimaha lagu soo iibiyey</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-mono">U Baahan Dayactir</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{damagedCount}</div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Waxyeelloobay / Dayactir</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Raadi qalab, qol, ama qofka heysta..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Qeybaha</option>
            <option value="Furniture">Furniture (Kuraas & Miisas)</option>
            <option value="Electronics">Electronics (Kumbuyuutaro & IT)</option>
            <option value="Lab Equipment">Lab Equipment (Shaybaadh)</option>
            <option value="Sports">Sports Equipment (Ciyaaraha)</option>
            <option value="Stationery">Stationery (Agab Xafiis)</option>
            <option value="Other">Kuwo Kale</option>
          </select>
        </div>
      </div>

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
            <Package className="w-10 h-10 text-[#525252] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan qalab la helay</p>
            <p className="text-xs text-[#525252] mt-1">Guji batoonka sare si aad ugu darto qalab cusub</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col justify-between hover:border-[#7c3aed]/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{item.itemName}</h3>
                    <p className="text-[10px] text-[#737373] font-mono mt-0.5">{item.category}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                    item.condition === 'Excellent' || item.condition === 'Good'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : item.condition === 'Fair'
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  }`}>
                    {item.condition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#ffffff05]">
                  <div>
                    <span className="text-[#525252] block text-[10px] uppercase font-mono">Tirada (Qty)</span>
                    <span className="text-[#f5f5f5] font-bold font-mono text-sm">{item.quantity} xabbo</span>
                  </div>
                  <div>
                    <span className="text-[#525252] block text-[10px] uppercase font-mono">Qiimaha/Xabbo</span>
                    <span className="text-[#c4b5fd] font-bold font-mono text-sm">{currency} {item.purchaseCost}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs pt-1 text-[#a3a3a3]">
                  {item.location && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-[#525252]" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  {item.assignedTo && (
                    <div className="text-[11px] text-[#737373]">
                      U xilsaaran: <span className="text-[#d4d4d4]">{item.assignedTo}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#ffffff05] flex items-center justify-between">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                  item.status === 'Available' ? 'bg-[#ffffff05] text-[#a3a3a3]' : 'bg-amber-950/40 text-amber-300'
                }`}>
                  {item.status}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
                    title="Tafatir"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Ma hubtaa inaad tirtirto alaabta "${item.itemName}"?`)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                    title="Tirtir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingItem ? 'Tafatir Alaabta' : 'Ku dar Alaab Kaydka'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Alaabta *</label>
                  <input
                    type="text"
                    required
                    value={form.itemName}
                    onChange={e => setForm({ ...form, itemName: e.target.value })}
                    placeholder="Tusaale: Kursi & Miis Arday (Set)"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Qeybta (Category)</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Furniture">Furniture</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Lab Equipment">Lab Equipment</option>
                      <option value="Sports">Sports</option>
                      <option value="Stationery">Stationery</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Tirada (Quantity) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Qiimaha/Xabbo ({currency})</label>
                    <input
                      type="number"
                      value={form.purchaseCost}
                      onChange={e => setForm({ ...form, purchaseCost: Number(e.target.value) })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Xaaladda (Condition)</label>
                    <select
                      value={form.condition}
                      onChange={e => setForm({ ...form, condition: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Excellent">Aad u Fiican (Excellent)</option>
                      <option value="Good">Fiican (Good)</option>
                      <option value="Fair">Dhexdhexaad (Fair)</option>
                      <option value="Needs Repair">U baahan Dayactir</option>
                      <option value="Damaged">Burbursan (Damaged)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Goobta (Location)</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value })}
                      placeholder="Class 3B, Library, Lab"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">U Xilsaaran (Assigned To)</label>
                    <input
                      type="text"
                      value={form.assignedTo}
                      onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="Macallin / Shaqaale"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : editingItem ? 'Cusbooneysii' : 'Ku dar Kaydka'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
