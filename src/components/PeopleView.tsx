import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Phone, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Download, 
  ExternalLink, 
  CheckCircle,
  AlertCircle,
  Send,
  Copy,
  Check,
  KeyRound,
  Lock,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Teacher, StaffMember, Guardian, SchoolClass, SchoolSubject } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PeopleViewProps {
  teachers?: Teacher[];
  staff?: StaffMember[];
  guardians?: Guardian[];
  classes?: SchoolClass[];
  subjects?: SchoolSubject[];
  students?: any[];
  onAddTeacher: (data: any) => Promise<void>;
  onUpdateTeacher: (id: string, data: any) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onAddStaff: (data: any) => Promise<void>;
  onUpdateStaff: (id: string, data: any) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  onAddGuardian: (data: any) => Promise<void>;
  onUpdateGuardian: (id: string, data: any) => Promise<void>;
  onDeleteGuardian: (id: string) => Promise<void>;
  currency?: string;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function PeopleView({
  teachers = [],
  staff = [],
  guardians = [],
  classes = [],
  subjects = [],
  students = [],
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAddGuardian,
  onUpdateGuardian,
  onDeleteGuardian,
  currency = '$',
  showToast = () => {}
}: PeopleViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'staff' | 'guardians'>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleResendInvitation = async (teacher: Teacher) => {
    if (!teacher.email || !teacher.email.includes('@')) {
      showToast("Macallinkani ma laha email sax ah.", "error");
      return;
    }
    setResendingId(teacher.id);
    try {
      const res = await fetch(`/api/teachers/${teacher.id}/resend-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Casuumaadda dib looma diri karin.", "error");
      } else {
        showToast(data.message || `Casuumaad cusub waxaa loo diray ${teacher.email}`);
        if (data.activationLink && navigator.clipboard) {
          navigator.clipboard.writeText(data.activationLink).catch(() => {});
        }
      }
    } catch (err: any) {
      showToast("Cilad farsamo ayaa dhacday casuumaadda.", "error");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyActivationLink = async (teacher: Teacher) => {
    try {
      const baseUrl = window.location.origin;
      let link = "";
      if (teacher.invitationToken) {
        link = `${baseUrl}/activate-teacher?token=${teacher.invitationToken}`;
      } else {
        // Generate or get new link via resend
        const res = await fetch(`/api/teachers/${teacher.id}/resend-invitation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        link = data.activationLink || `${baseUrl}/activate-teacher`;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        showToast("Link-ga casuumaadda waxaa lagu koobiyeeyay clipboard-kaaga!");
      } else {
        prompt("Koobi garee link-gan casuumaadda:", link);
      }
    } catch (e) {
      showToast("Ma suurtogalin in link-ga la koobiyeeyo.", "error");
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    const newStatus = teacher.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    const actionLabel = newStatus === 'ACTIVE' ? 'Dib u howlgeli' : 'Haki (Deactivate)';
    if (!confirm(`Ma hubtaa inaad ${actionLabel} akoonka macallinka ${teacher.name}?`)) return;

    try {
      const res = await fetch(`/api/teachers/${teacher.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        teacher.status = newStatus;
        showToast(`Akoonka macallinka ${teacher.name} waxaa laga dhigay: ${newStatus}`);
      } else {
        showToast("Cilad ayaa dhacday beddelidda xaaladda.", "error");
      }
    } catch (e) {
      showToast("Cilad farsamo ayaa dhacday.", "error");
    }
  };

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male' as 'Male' | 'Female',
    qualification: '',
    specialization: '',
    employmentStatus: 'Full-Time' as 'Full-Time' | 'Part-Time' | 'Contract' | 'On Leave' | 'Terminated',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: '',
    notes: '',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[]
  });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Staff' as any,
    department: 'Administration',
    phone: '',
    email: '',
    salary: 0,
    employmentStatus: 'Full-Time' as 'Full-Time' | 'Part-Time' | 'Contract' | 'On Leave' | 'Terminated',
    hireDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [guardianForm, setGuardianForm] = useState({
    name: '',
    relationship: 'Father' as any,
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    occupation: '',
    emergencyContact: '',
    notes: ''
  });

  // Open Teacher Modal
  const openAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherForm({
      name: '',
      phone: '',
      email: '',
      gender: 'Male',
      qualification: 'Bachelor in Education',
      specialization: 'General',
      employmentStatus: 'Full-Time',
      salary: 350,
      hireDate: new Date().toISOString().split('T')[0],
      address: '',
      emergencyContact: '',
      notes: '',
      assignedClasses: [],
      assignedSubjects: []
    });
    setShowTeacherModal(true);
  };

  const openEditTeacher = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherForm({
      name: t.name,
      phone: t.phone,
      email: t.email || '',
      gender: t.gender || 'Male',
      qualification: t.qualification || '',
      specialization: t.specialization || '',
      employmentStatus: t.employmentStatus || 'Full-Time',
      salary: t.salary || 0,
      hireDate: t.hireDate || '',
      address: t.address || '',
      emergencyContact: t.emergencyContact || '',
      notes: t.notes || '',
      assignedClasses: t.assignedClasses || [],
      assignedSubjects: t.assignedSubjects || []
    });
    setShowTeacherModal(true);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.name.trim() || !teacherForm.phone.trim()) {
      showToast("Magaca iyo taleefanka macallinka waa khasab", "error");
      return;
    }
    setLoading(true);
    try {
      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher.id, teacherForm);
        showToast("Macallinka si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddTeacher(teacherForm);
        showToast("Macallin cusub ayaa si guul leh loogu daray");
      }
      setShowTeacherModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open Staff Modal
  const openAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      role: 'Staff',
      department: 'Administration',
      phone: '',
      email: '',
      salary: 250,
      employmentStatus: 'Full-Time',
      hireDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowStaffModal(true);
  };

  const openEditStaff = (s: StaffMember) => {
    setEditingStaff(s);
    setStaffForm({
      name: s.name,
      role: s.role,
      department: s.department || '',
      phone: s.phone || '',
      email: s.email || '',
      salary: s.salary || 0,
      employmentStatus: s.employmentStatus || 'Full-Time',
      hireDate: s.hireDate || '',
      notes: s.notes || ''
    });
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.phone.trim()) {
      showToast("Magaca iyo taleefanka shaqaalaha waa khasab", "error");
      return;
    }
    setLoading(true);
    try {
      if (editingStaff) {
        await onUpdateStaff(editingStaff.id, staffForm);
        showToast("Shaqaalaha si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddStaff(staffForm);
        showToast("Shaqaale cusub ayaa si guul leh loogu daray");
      }
      setShowStaffModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  // Open Guardian Modal
  const openAddGuardian = () => {
    setEditingGuardian(null);
    setGuardianForm({
      name: '',
      relationship: 'Father',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      occupation: '',
      emergencyContact: '',
      notes: ''
    });
    setShowGuardianModal(true);
  };

  const openEditGuardian = (g: Guardian) => {
    setEditingGuardian(g);
    setGuardianForm({
      name: g.name,
      relationship: g.relationship,
      phone: g.phone,
      whatsapp: g.whatsapp || g.phone,
      email: g.email || '',
      address: g.address || '',
      occupation: g.occupation || '',
      emergencyContact: g.emergencyContact || '',
      notes: g.notes || ''
    });
    setShowGuardianModal(true);
  };

  const handleGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianForm.name.trim() || !guardianForm.phone.trim()) {
      showToast("Magaca iyo taleefanka waalidka waa khasab", "error");
      return;
    }
    setLoading(true);
    try {
      if (editingGuardian) {
        await onUpdateGuardian(editingGuardian.id, guardianForm);
        showToast("Waalidka si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddGuardian(guardianForm);
        showToast("Waalid cusub ayaa si guul leh loogu daray");
      }
      setShowGuardianModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery) ||
    (t.specialization && t.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStaff = staff.filter(s => {
    const matchQuery = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone.includes(searchQuery);
    const matchRole = filterRole === 'All' || s.role === filterRole;
    return matchQuery && matchRole;
  });

  const filteredGuardians = guardians.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.phone.includes(searchQuery) ||
    (g.whatsapp && g.whatsapp.includes(searchQuery))
  );

  // PDF Export
  const exportTeachersPDF = () => {
    if (filteredTeachers.length === 0) return;
    const doc = new jsPDF();
    doc.text("Dugsiga Pro 2026 - Liiska Macallimiinta (Teachers Directory)", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['ID', 'Name', 'Phone', 'Qualification', 'Specialization', 'Status', 'Salary']],
      body: filteredTeachers.map(t => [
        t.teacherId,
        t.name,
        t.phone,
        t.qualification,
        t.specialization,
        t.employmentStatus,
        `${currency} ${t.salary}`
      ])
    });
    doc.save(`Macallimiinta_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportTeachersExcel = () => {
    if (filteredTeachers.length === 0) return;
    const data = filteredTeachers.map(t => ({
      ID: t.teacherId,
      Name: t.name,
      Phone: t.phone,
      Email: t.email || '',
      Gender: t.gender,
      Qualification: t.qualification,
      Specialization: t.specialization,
      Status: t.employmentStatus,
      Salary: t.salary,
      HireDate: t.hireDate
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, `Teachers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Maamulka Shaqaalaha & Waalidiinta (People)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Macallimiinta, shaqaalaha maamulka, iyo xogta waalidiinta iskuulka
          </p>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center gap-1 bg-[#0f0f0f] border border-[#ffffff10] p-1 rounded-sm">
          <button
            onClick={() => { setActiveSubTab('teachers'); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              activeSubTab === 'teachers' 
                ? 'bg-[#7c3aed] text-white' 
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Macallimiinta ({teachers.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('staff'); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              activeSubTab === 'staff' 
                ? 'bg-[#7c3aed] text-white' 
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Shaqaalaha ({staff.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('guardians'); setSearchQuery(''); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              activeSubTab === 'guardians' 
                ? 'bg-[#7c3aed] text-white' 
                : 'text-[#a3a3a3] hover:text-white'
            }`}
          >
            Waalidiinta ({guardians.length})
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add Button, Exports */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'teachers' 
                  ? "Raadi macallin magaciisa ama taleefanka..." 
                  : activeSubTab === 'staff' 
                    ? "Raadi shaqaale..." 
                    : "Raadi waalid..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
            />
          </div>

          {activeSubTab === 'staff' && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-xs text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="All">All Roles</option>
              <option value="Principal">Principal</option>
              <option value="Vice Principal">Vice Principal</option>
              <option value="Accountant">Accountant</option>
              <option value="Administrator">Administrator</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Librarian">Librarian</option>
              <option value="Staff">Staff</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeSubTab === 'teachers' && (
            <>
              <button
                onClick={exportTeachersPDF}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] text-xs font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
                title="Dhoofi PDF"
              >
                <Download className="w-3.5 h-3.5 text-[#c4b5fd]" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={exportTeachersExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] text-xs font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
                title="Dhoofi Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={openAddTeacher}
                className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ku dar Macallin</span>
              </button>
            </>
          )}

          {activeSubTab === 'staff' && (
            <button
              onClick={openAddStaff}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ku dar Shaqaale</span>
            </button>
          )}

          {activeSubTab === 'guardians' && (
            <button
              onClick={openAddGuardian}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ku dar Waalid</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Displays */}
      {activeSubTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
              <GraduationCap className="w-10 h-10 text-[#525252] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan macallimiin la helay</p>
              <p className="text-xs text-[#525252] mt-1">Guji batoonka kore si aad ugu darto macallin cusub</p>
            </div>
          ) : (
            filteredTeachers.map(t => (
              <div 
                key={t.id} 
                className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col justify-between hover:border-[#7c3aed]/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#c4b5fd] font-bold text-sm font-mono">
                        {(t.name || 'Teacher').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{t.name}</h3>
                        <p className="text-[10px] text-[#737373] font-mono mt-0.5">{t.teacherId} • {t.gender}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase ${
                        t.status === 'INVITED' 
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60' 
                          : t.status === 'DEACTIVATED'
                          ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        {t.status === 'INVITED' ? 'Casuuman' : t.status === 'DEACTIVATED' ? 'Hakiyey' : 'Firfircoon'}
                      </span>
                      <span className="text-[9px] text-[#737373] font-mono">{t.employmentStatus}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#ffffff05]">
                    <div>
                      <span className="text-[#525252] block text-[10px] uppercase font-mono">Takhasus</span>
                      <span className="text-[#d4d4d4] font-medium truncate block">{t.specialization || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-[#525252] block text-[10px] uppercase font-mono">Mushahar</span>
                      <span className="text-[#c4b5fd] font-bold font-mono">{currency} {t.salary}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs pt-2 text-[#a3a3a3]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#525252]" />
                      <span className="font-mono text-[11px]">{t.phone}</span>
                    </div>
                    {t.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#525252]" />
                        <span className="truncate text-[11px]">{t.email}</span>
                      </div>
                    )}
                  </div>

                  {t.assignedClasses && t.assignedClasses.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] text-[#525252] uppercase tracking-wider block mb-1">Fasallada</span>
                      <div className="flex flex-wrap gap-1">
                        {(t.assignedClasses || []).map((cls, idx) => (
                          <span key={idx} className="text-[10px] bg-[#ffffff05] border border-[#ffffff10] px-2 py-0.5 rounded-sm text-[#d4d4d4]">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#ffffff05]">
                  <div className="flex items-center gap-1.5">
                    {t.email && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleResendInvitation(t)}
                          disabled={resendingId === t.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium bg-[#7c3aed]/20 text-[#c4b5fd] border border-[#7c3aed]/40 hover:bg-[#7c3aed]/30 transition disabled:opacity-50"
                          title="Dib ugu dir casuumaadda email-ka macallinka"
                        >
                          {resendingId === t.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Casuumaad</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyActivationLink(t)}
                          className="flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] font-medium bg-[#ffffff05] text-[#d4d4d4] border border-[#ffffff10] hover:bg-[#ffffff10] transition"
                          title="Koobi garee Link-ga casuumaadda"
                        >
                          <Copy className="w-3 h-3 text-[#a3a3a3]" />
                          <span className="hidden sm:inline">Link</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t)}
                      className={`p-1.5 rounded-sm transition-colors ${
                        t.status === 'DEACTIVATED'
                          ? 'text-emerald-400 hover:bg-emerald-950/30'
                          : 'text-amber-400 hover:bg-amber-950/30'
                      }`}
                      title={t.status === 'DEACTIVATED' ? 'Dib u howlgeli macallinka' : 'Haki akoonka macallinka'}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditTeacher(t)}
                      className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
                      title="Tafatir"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Ma hubtaa inaad tirtirto macallinka ${t.name}?`)) {
                          onDeleteTeacher(t.id);
                        }
                      }}
                      className="p-1.5 rounded-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
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
      )}

      {activeSubTab === 'staff' && (
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0a0a] text-[10px] uppercase font-mono tracking-wider text-[#737373] border-b border-[#ffffff10]">
              <tr>
                <th className="py-3 px-4">ID / Magaca</th>
                <th className="py-3 px-4">Doorka (Role)</th>
                <th className="py-3 px-4">Waaxda (Dept)</th>
                <th className="py-3 px-4">Xiriirka (Contact)</th>
                <th className="py-3 px-4">Mushahar</th>
                <th className="py-3 px-4">Xaaladda</th>
                <th className="py-3 px-4 text-right">Hawlaha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05] text-[#d4d4d4]">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#525252]">
                    Ma jiraan shaqaale la helay
                  </td>
                </tr>
              ) : (
                filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-[#ffffff02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#f5f5f5]">{s.name}</div>
                      <div className="text-[10px] text-[#525252] font-mono">{s.employeeId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#c4b5fd] rounded-sm text-[10px] font-semibold">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#a3a3a3]">{s.department || '-'}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{s.phone}</div>
                      {s.email && <div className="text-[10px] text-[#525252]">{s.email}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#f5f5f5]">
                      {currency} {s.salary}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                        s.employmentStatus === 'Full-Time' 
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                          : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                      }`}>
                        {s.employmentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditStaff(s)}
                          className="p-1 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Ma hubtaa inaad tirtirto shaqaalaha ${s.name}?`)) {
                              onDeleteStaff(s.id);
                            }
                          }}
                          className="p-1 rounded-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'guardians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuardians.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
              <Users className="w-10 h-10 text-[#525252] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan waalidiin diiwaangashan</p>
              <p className="text-xs text-[#525252] mt-1">Guji batoonka sare si aad ugu darto waalid</p>
            </div>
          ) : (
            filteredGuardians.map(g => (
              <div 
                key={g.id} 
                className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex flex-col justify-between hover:border-[#7c3aed]/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#f5f5f5] leading-tight">{g.name}</h3>
                      <p className="text-[10px] text-[#737373] font-mono mt-0.5">{g.guardianId} • {g.relationship}</p>
                    </div>
                    {g.whatsapp && (
                      <a
                        href={`https://wa.me/${g.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 px-2 py-1 rounded-sm hover:bg-emerald-900/50 transition-colors"
                        title="Ku fur WhatsApp"
                      >
                        <span>WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-1 text-xs pt-2 border-t border-[#ffffff05] text-[#a3a3a3]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#525252]" />
                      <span className="font-mono text-[11px]">{g.phone}</span>
                    </div>
                    {g.address && (
                      <p className="text-[11px] text-[#737373] mt-1">
                        📍 {g.address}
                      </p>
                    )}
                    {g.occupation && (
                      <p className="text-[11px] text-[#737373]">
                        💼 {g.occupation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#ffffff05]">
                  <button
                    onClick={() => openEditGuardian(g)}
                    className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
                    title="Tafatir"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Ma hubtaa inaad tirtirto waalidka ${g.name}?`)) {
                        onDeleteGuardian(g.id);
                      }
                    }}
                    className="p-1.5 rounded-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
                    title="Tirtir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Teacher Form Modal */}
      <AnimatePresence>
        {showTeacherModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingTeacher ? 'Tafatir Macallinka' : 'Diiwaangeli Macallin Cusub'}
                </h2>
                <button 
                  onClick={() => setShowTeacherModal(false)}
                  className="p-1 text-[#737373] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-sm text-purple-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Amniga Akoonka Macallinka (Zero Trust Security)</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80 leading-relaxed">
                    Maamuluhu ma maamulo mana ogaan karo password-ka macallinka. Email-ka aad halkan ku qorto waxaa toos loogu diri doonaa casuumaad ammaan ah oo macallinku ku samaysanayo password-kiisa sirta ah.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Buuxa *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.name}
                      onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      placeholder="Tusaale: Macallin Cali Xuseen"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Taleefanka *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.phone}
                      onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      placeholder="25261..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Email</label>
                    <input
                      type="email"
                      value={teacherForm.email}
                      onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder="macallin@school.edu"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Jinsiga</label>
                    <select
                      value={teacherForm.gender}
                      onChange={e => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Male">Lab (Male)</option>
                      <option value="Female">Dheddig (Female)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Shahaadada (Qualification)</label>
                    <input
                      type="text"
                      value={teacherForm.qualification}
                      onChange={e => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                      placeholder="Bachelor of Science"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Takhasuska (Specialization)</label>
                    <input
                      type="text"
                      value={teacherForm.specialization}
                      onChange={e => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                      placeholder="Mathematics & Physics"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Mushaharka Bilihii ({currency})</label>
                    <input
                      type="number"
                      value={teacherForm.salary}
                      onChange={e => setTeacherForm({ ...teacherForm, salary: Number(e.target.value) })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Xaaladda Shaqada</label>
                    <select
                      value={teacherForm.employmentStatus}
                      onChange={e => setTeacherForm({ ...teacherForm, employmentStatus: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Full-Time">Full-Time (Joogto)</option>
                      <option value="Part-Time">Part-Time (Qayb-maalmeed)</option>
                      <option value="Contract">Qandaraas (Contract)</option>
                      <option value="On Leave">Fasax (On Leave)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Fasallada loo xilsaaray (Class Assignments)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-[#0a0a0a] border border-[#ffffff10] rounded-sm max-h-32 overflow-y-auto">
                    {(classes || []).map(cls => {
                      const isChecked = (teacherForm.assignedClasses || []).includes(cls.className);
                      return (
                        <label key={cls.id} className="flex items-center gap-2 text-xs text-[#d4d4d4] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setTeacherForm({
                                  ...teacherForm,
                                  assignedClasses: teacherForm.assignedClasses.filter(c => c !== cls.className)
                                });
                              } else {
                                setTeacherForm({
                                  ...teacherForm,
                                  assignedClasses: [...teacherForm.assignedClasses, cls.className]
                                });
                              }
                            }}
                            className="rounded accent-[#7c3aed]"
                          />
                          <span className="truncate">{cls.className}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowTeacherModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : editingTeacher ? 'Cusbooneysii' : 'Diiwaangeli'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Form Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingStaff ? 'Tafatir Shaqaalaha' : 'Ku dar Shaqaale Cusub'}
                </h2>
                <button onClick={() => setShowStaffModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Buuxa *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                      placeholder="Cabdullaahi Maxamed"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Doorka (Role) *</label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm({ ...staffForm, role: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Principal">Principal (Maamule)</option>
                      <option value="Vice Principal">Vice Principal (Kuxigeen)</option>
                      <option value="Accountant">Accountant (Xisaabiye)</option>
                      <option value="Administrator">Administrator (Maamulaha Guud)</option>
                      <option value="Receptionist">Receptionist (Soodhaweeye)</option>
                      <option value="Librarian">Librarian (Khadamka Maktabadda)</option>
                      <option value="Staff">Staff (Shaqaale Kale)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Taleefanka *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.phone}
                      onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                      placeholder="25261..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Waaxda (Department)</label>
                    <input
                      type="text"
                      value={staffForm.department}
                      onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}
                      placeholder="Finance, IT, Reception"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Mushaharka ({currency})</label>
                    <input
                      type="number"
                      value={staffForm.salary}
                      onChange={e => setStaffForm({ ...staffForm, salary: Number(e.target.value) })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Xaaladda</label>
                    <select
                      value={staffForm.employmentStatus}
                      onChange={e => setStaffForm({ ...staffForm, employmentStatus: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : editingStaff ? 'Cusbooneysii' : 'Diiwaangeli'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guardian Form Modal */}
      <AnimatePresence>
        {showGuardianModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingGuardian ? 'Tafatir Waalidka' : 'Diiwaangeli Waalid Cusub'}
                </h2>
                <button onClick={() => setShowGuardianModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGuardianSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Magaca Waalidka *</label>
                    <input
                      type="text"
                      required
                      value={guardianForm.name}
                      onChange={e => setGuardianForm({ ...guardianForm, name: e.target.value })}
                      placeholder="Axmed Jaamac Cali"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Xiriirka (Relationship)</label>
                    <select
                      value={guardianForm.relationship}
                      onChange={e => setGuardianForm({ ...guardianForm, relationship: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Father">Aabbe (Father)</option>
                      <option value="Mother">Hooyo (Mother)</option>
                      <option value="Brother">Walaal (Brother)</option>
                      <option value="Sister">Walaal (Sister)</option>
                      <option value="Uncle">Adeer / Eedo</option>
                      <option value="Guardian">Mas'uul Kale</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Taleefanka *</label>
                    <input
                      type="text"
                      required
                      value={guardianForm.phone}
                      onChange={e => setGuardianForm({ ...guardianForm, phone: e.target.value })}
                      placeholder="25261..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">WhatsApp Number</label>
                    <input
                      type="text"
                      value={guardianForm.whatsapp}
                      onChange={e => setGuardianForm({ ...guardianForm, whatsapp: e.target.value })}
                      placeholder="25261..."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Email</label>
                    <input
                      type="email"
                      value={guardianForm.email}
                      onChange={e => setGuardianForm({ ...guardianForm, email: e.target.value })}
                      placeholder="waalid@gmail.com"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Shaqada (Occupation)</label>
                    <input
                      type="text"
                      value={guardianForm.occupation}
                      onChange={e => setGuardianForm({ ...guardianForm, occupation: e.target.value })}
                      placeholder="Ganacsade / Macallin"
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Cinwaanka (Address)</label>
                  <input
                    type="text"
                    value={guardianForm.address}
                    onChange={e => setGuardianForm({ ...guardianForm, address: e.target.value })}
                    placeholder="Mogadishu, Hodan, Somalia"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#ffffff10]">
                  <button
                    type="button"
                    onClick={() => setShowGuardianModal(false)}
                    className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#a3a3a3] hover:text-white"
                  >
                    Ka noqo
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-sm bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : editingGuardian ? 'Cusbooneysii' : 'Diiwaangeli'}
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
