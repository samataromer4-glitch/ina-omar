import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Calendar, 
  GraduationCap, 
  Download, 
  Check, 
  X,
  ArrowRightCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Admission, SchoolClass } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface AdmissionsViewProps {
  admissions: Admission[];
  classes: SchoolClass[];
  onAddAdmission: (data: any) => Promise<void>;
  onUpdateAdmission: (id: string, data: any) => Promise<void>;
  onEnrollApplicant: (id: string) => Promise<void>;
  onDeleteAdmission: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function AdmissionsView({
  admissions,
  classes,
  onAddAdmission,
  onUpdateAdmission,
  onEnrollApplicant,
  onDeleteAdmission,
  showToast = () => {}
}: AdmissionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Enrolled' | 'Rejected'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    applicantName: '',
    gender: 'Male' as 'Male' | 'Female',
    dateOfBirth: '',
    desiredClass: classes[0]?.className || 'Form 1',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: 'Parent',
    status: 'Pending' as 'Pending' | 'Approved' | 'Enrolled' | 'Rejected',
    notes: ''
  });

  const openAddModal = () => {
    setEditingAdmission(null);
    setForm({
      applicantName: '',
      gender: 'Male',
      dateOfBirth: '2010-01-01',
      desiredClass: classes[0]?.className || 'Form 1',
      guardianName: '',
      guardianPhone: '',
      guardianRelationship: 'Parent',
      status: 'Pending',
      notes: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (adm: Admission) => {
    setEditingAdmission(adm);
    setForm({
      applicantName: adm.applicantName,
      gender: adm.gender || 'Male',
      dateOfBirth: adm.dateOfBirth || '',
      desiredClass: adm.desiredClass,
      guardianName: adm.guardianName || '',
      guardianPhone: adm.guardianPhone || '',
      guardianRelationship: adm.guardianRelationship || 'Parent',
      status: adm.status,
      notes: adm.notes || ''
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.applicantName.trim() || !form.desiredClass) {
      showToast("Magaca codsadaha iyo fasalka waa khasab", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingAdmission) {
        await onUpdateAdmission(editingAdmission.id, form);
        showToast("Codsiga waxbarasho si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddAdmission(form);
        showToast("Codsi cusub ayaa la diiwaangeliyey");
      }
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (adm: Admission) => {
    if (adm.status === 'Enrolled') {
      showToast("Ardaygan horey ayaa loo qoray (Already enrolled)", "info");
      return;
    }
    if (!confirm(`Ma hubtaa inaad ${adm.applicantName} si rasmi ah ugu qorto fasalka ${adm.desiredClass}?`)) {
      return;
    }
    setEnrollingId(adm.id);
    try {
      await onEnrollApplicant(adm.id);
      showToast(`Ardayga ${adm.applicantName} waxaa loo beddelay arday rasmi ah!`);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay xilliga qoritaanka ardayga", "error");
    } finally {
      setEnrollingId(null);
    }
  };

  // Filtered list
  const filteredAdmissions = admissions.filter(a => {
    const matchQuery = 
      a.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.guardianPhone && a.guardianPhone.includes(searchQuery)) ||
      (a.desiredClass && a.desiredClass.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Metrics
  const totalCount = admissions.length;
  const pendingCount = admissions.filter(a => a.status === 'Pending').length;
  const approvedCount = admissions.filter(a => a.status === 'Approved').length;
  const enrolledCount = admissions.filter(a => a.status === 'Enrolled').length;

  // Export PDF
  const exportPDF = () => {
    if (filteredAdmissions.length === 0) return;
    const doc = new jsPDF();
    doc.text("Dugsiga Pro 2026 - Codsiyada Waxbarasho (Admissions)", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['Applicant Name', 'Class', 'Guardian', 'Phone', 'Date', 'Status']],
      body: filteredAdmissions.map(a => [
        a.applicantName,
        a.desiredClass,
        a.guardianName || '-',
        a.guardianPhone || '-',
        a.admissionDate || a.createdAt,
        a.status
      ])
    });
    doc.save(`Admissions_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (filteredAdmissions.length === 0) return;
    const data = filteredAdmissions.map(a => ({
      Applicant: a.applicantName,
      Gender: a.gender,
      DOB: a.dateOfBirth,
      DesiredClass: a.desiredClass,
      Guardian: a.guardianName,
      Phone: a.guardianPhone,
      Relationship: a.guardianRelationship,
      Status: a.status,
      Date: a.admissionDate || a.createdAt,
      Notes: a.notes
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admissions");
    XLSX.writeFile(wb, `Admissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Qaabilaadda & Codsiyada (Admissions)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Maamul ardayda cusub ee soo codsatay iyo 1-click loogu beddelo arday rasmi ah
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
            <span>Codsi Cusub</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-[#737373] uppercase tracking-wider block font-mono">Wadarta Codsiyada</span>
          <div className="text-xl font-bold font-mono text-[#f5f5f5] mt-1">{totalCount}</div>
          <div className="text-[10px] text-[#525252] mt-0.5">Dhammaan codsadayaasha</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-mono">Sugaya (Pending)</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">U baahan go'aan</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-blue-400 uppercase tracking-wider block font-mono">La Aqbalay (Approved)</span>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">{approvedCount}</div>
          <div className="text-[10px] text-blue-500/70 mt-0.5">Diyaar u ah qoritaan</div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">La Qoray (Enrolled)</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{enrolledCount}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Arday rasmi ah</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Raadi codsade, fasal ama taleefan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#ffffff10] p-1 rounded-sm w-full sm:w-auto overflow-x-auto">
          {(['All', 'Pending', 'Approved', 'Enrolled', 'Rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-sm whitespace-nowrap transition-colors ${
                statusFilter === st 
                  ? 'bg-[#7c3aed] text-white' 
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAdmissions.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
            <UserPlus className="w-10 h-10 text-[#525252] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan codsiyo la helay</p>
            <p className="text-xs text-[#525252] mt-1">Guji batoonka kore si aad u diiwaangeliso codsi cusub</p>
          </div>
        ) : (
          filteredAdmissions.map(adm => {
            const isEnrolled = adm.status === 'Enrolled';
            return (
              <div
                key={adm.id}
                className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col justify-between hover:border-[#7c3aed]/40 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{adm.applicantName}</h3>
                      <p className="text-[10px] text-[#737373] font-mono mt-0.5">
                        {adm.desiredClass} • {adm.gender}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                      adm.status === 'Enrolled'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : adm.status === 'Approved'
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                          : adm.status === 'Pending'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}>
                      {adm.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs pt-2 border-t border-[#ffffff05] text-[#a3a3a3]">
                    {adm.guardianName && (
                      <div className="text-[11px]">
                        <span className="text-[#525252]">Waalidka: </span>
                        <span className="text-[#d4d4d4] font-medium">{adm.guardianName} ({adm.guardianRelationship})</span>
                      </div>
                    )}
                    {adm.guardianPhone && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-[#525252]" />
                        <span className="font-mono text-[#d4d4d4]">{adm.guardianPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-[#737373]">
                      <Calendar className="w-3.5 h-3.5 text-[#525252]" />
                      <span>Codsaday: {adm.admissionDate || adm.createdAt}</span>
                    </div>
                  </div>

                  {adm.notes && (
                    <div className="text-[11px] bg-[#0a0a0a] p-2 rounded border border-[#ffffff05] text-[#737373] italic">
                      "{adm.notes}"
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#ffffff05] flex items-center justify-between gap-2">
                  <div>
                    {!isEnrolled && (
                      <button
                        onClick={() => handleEnroll(adm)}
                        disabled={enrollingId === adm.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-sm hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        <ArrowRightCircle className="w-3.5 h-3.5" />
                        <span>{enrollingId === adm.id ? 'Qoraya...' : 'U Beddel Arday'}</span>
                      </button>
                    )}
                    {isEnrolled && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Arday Rasmi ah</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(adm)}
                      className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
                      title="Tafatir"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Ma hubtaa inaad tirtirto codsigan (${adm.applicantName})?`)) {
                          onDeleteAdmission(adm.id);
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
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingAdmission ? 'Tafatir Codsiga' : 'Diiwaangeli Codsade Cusub'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Codsadaha *</label>
                  <input
                    type="text"
                    required
                    value={form.applicantName}
                    onChange={e => setForm({ ...form, applicantName: e.target.value })}
                    placeholder="Tusaale: Axmed Cabdi Saalax"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Fasalka la codsanayo *</label>
                    <select
                      value={form.desiredClass}
                      onChange={e => setForm({ ...form, desiredClass: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.className}>{c.className}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Jinsiga</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Male">Lab (Male)</option>
                      <option value="Female">Dheddig (Female)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Waalidka</label>
                    <input
                      type="text"
                      value={form.guardianName}
                      onChange={e => setForm({ ...form, guardianName: e.target.value })}
                      placeholder="Cabdi Saalax"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Taleefanka Waalidka</label>
                    <input
                      type="text"
                      value={form.guardianPhone}
                      onChange={e => setForm({ ...form, guardianPhone: e.target.value })}
                      placeholder="25261..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Xaaladda Codsiga</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Pending">Sugaya (Pending)</option>
                    <option value="Approved">La Aqbalay (Approved)</option>
                    <option value="Enrolled">La Qoray (Enrolled)</option>
                    <option value="Rejected">La Diiday (Rejected)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Faallo / Qoraal</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Xog dheeraad ah..."
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : editingAdmission ? 'Cusbooneysii' : 'Diiwaangeli'}
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
