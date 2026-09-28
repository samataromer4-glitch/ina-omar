import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  BookOpen, 
  Award, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Download, 
  FileText,
  MapPin,
  ShieldCheck,
  Hash,
  Activity,
  Layers,
  Info,
  Edit3
} from 'lucide-react';
import { motion } from 'motion/react';
import { Student, AttendanceRecord, ExamScore, FeeRecord, Guardian } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentFinancialStatementModal } from './finance/StudentFinancialStatementModal';

interface StudentProfileModalProps {
  student: Student;
  guardian?: Guardian;
  classes?: any[];
  attendance?: AttendanceRecord[];
  attendanceRecords?: AttendanceRecord[];
  examScores?: ExamScore[];
  fees?: FeeRecord[];
  feeRecords?: FeeRecord[];
  subjects?: any[];
  currency?: string;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onEditStudent?: (student: Student) => void;
}

export default function StudentProfileModal({
  student,
  guardian,
  attendance,
  attendanceRecords,
  examScores = [],
  fees,
  feeRecords,
  currency = '$',
  onClose,
  onEditStudent
}: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'enrollment' | 'guardian' | 'academic' | 'attendance' | 'fees'>('overview');
  const [showStatementModal, setShowStatementModal] = useState(false);

  const resolvedAttendance = attendance || attendanceRecords || [];
  const resolvedFees = fees || feeRecords || [];

  // Student specific records
  const studentAttendance = resolvedAttendance.filter(a => a.studentId === student.id);
  const studentScores = examScores.filter(e => e.studentId === student.id);
  const studentFees = resolvedFees.filter(f => f.studentId === student.id);

  // Attendance stats
  const totalMarked = studentAttendance.length;
  const presentDays = studentAttendance.filter(a => (a.status || '').toLowerCase() === 'present').length;
  const absentDays = studentAttendance.filter(a => (a.status || '').toLowerCase() === 'absent').length;
  const attendanceRate = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 100;

  // Fee stats
  const totalBilled = studentFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalPaid = studentFees.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
  const balanceDue = Math.max(0, totalBilled - totalPaid);

  // Academic stats
  const totalScoreMarks = studentScores.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0);
  const avgScore = studentScores.length > 0 ? Math.round(totalScoreMarks / studentScores.length) : 0;

  // Print Student Report Card
  const exportReportCardPDF = () => {
    const doc = new jsPDF();
    doc.text(`WARBIXINTA GUUD EE ARDAYGA (STUDENT REPORT CARD)`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Magaca: ${student.fullName} | Fasalka: ${student.class} | ID: ${student.id}`, 14, 22);
    doc.text(`Xiriirka Waalidka: ${student.guardianPhone || guardian?.phone || '-'} | Heerka Joogitaanka: ${attendanceRate}%`, 14, 28);

    doc.text(`Natiijooyinka Imtixaanka:`, 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Exam Name', 'Subject', 'Score', 'Max', 'Grade']],
      body: (studentScores || []).map(s => [
        s.examName || 'Term Exam',
        s.subjectName || 'Subject',
        s.marksObtained,
        s.maxMarks || 100,
        s.grade || (s.marksObtained >= 80 ? 'A' : s.marksObtained >= 65 ? 'B' : s.marksObtained >= 50 ? 'C' : 'F')
      ])
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 80;
    doc.text(`Xaaladda Lacagta: Wadarta: ${currency} ${totalBilled} | La Bixiyey: ${currency} ${totalPaid} | Baaqiga: ${currency} ${balanceDue}`, 14, finalY);

    doc.save(`Warbixinta_${(student.fullName || 'Student').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#141414] to-[#0a0a0a] border-b border-[#ffffff10] relative">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {onEditStudent && (
              <button
                onClick={() => onEditStudent(student)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#ffffff15] bg-[#1a1a1a] hover:bg-[#252525] text-[#e5e5e5] hover:text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Wax ka beddel</span>
              </button>
            )}
            <button
              onClick={onClose}
              title="Xir (Close)"
              className="p-1.5 rounded-sm text-[#737373] hover:text-white hover:bg-[#ffffff10] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Student Photo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#c4b5fd] font-bold text-2xl font-mono shrink-0 shadow-inner">
              {student.photo ? (
                <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
              ) : (
                (student.fullName || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f5f5f5] leading-tight truncate">
                  {student.fullName}
                </h2>
                {/* Status Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase ${
                  student.status === 'active'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    : student.status === 'inactive'
                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                    : 'bg-slate-800/60 text-slate-300 border border-slate-700/40'
                }`}>
                  {student.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>

              <p className="text-xs text-[#888888] font-mono">
                ID: <span className="text-[#cccccc]">{student.id}</span> • Fasal: <span className="text-[#c4b5fd] font-bold">{student.class}</span> • Jinsi: {student.gender || 'Male'}
              </p>

              <div className="flex items-center gap-4 pt-1 text-xs text-[#a3a3a3] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#525252]" />
                  <span className="font-mono">{student.guardianPhone || guardian?.phone || 'Lama helin'}</span>
                </div>
                {(student.guardianPhone || guardian?.phone) && (
                  <a
                    href={`https://wa.me/${(student.guardianPhone || guardian?.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* QUICK ACTION JUMP BUTTONS */}
              <div className="flex items-center gap-1.5 pt-2.5 flex-wrap">
                <button
                  onClick={() => setActiveTab('fees')}
                  className={`px-2.5 py-1 rounded-xs border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'fees'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>Lacagaha (Finance)</span>
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-2.5 py-1 rounded-xs border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'attendance'
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  <Calendar className="w-3 h-3 text-blue-400" />
                  <span>Xaadiriska (Attendance)</span>
                </button>
                <button
                  onClick={() => setActiveTab('academic')}
                  className={`px-2.5 py-1 rounded-xs border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'academic'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                      : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                  }`}
                >
                  <Award className="w-3 h-3 text-purple-400" />
                  <span>Natiijooyinka (Results)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics with Click-to-Jump */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#ffffff05] text-xs">
            <div 
              onClick={() => setActiveTab('attendance')}
              className="bg-[#0a0a0a] p-2.5 rounded-sm border border-[#ffffff08] hover:border-emerald-500/30 cursor-pointer transition-colors"
              title="Guji si aad u aragto faahfaahinta xaadiriska"
            >
              <span className="text-[10px] text-[#888888] block uppercase font-mono">Joogitaanka (Attendance)</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{attendanceRate}%</span>
            </div>
            <div 
              onClick={() => setActiveTab('academic')}
              className="bg-[#0a0a0a] p-2.5 rounded-sm border border-[#ffffff08] hover:border-purple-500/30 cursor-pointer transition-colors"
              title="Guji si aad u aragto imtixaannada"
            >
              <span className="text-[10px] text-[#888888] block uppercase font-mono">Celceliska Imtixaanka</span>
              <span className="text-sm font-bold font-mono text-[#c4b5fd]">{avgScore}%</span>
            </div>
            <div 
              onClick={() => setActiveTab('fees')}
              className="bg-[#0a0a0a] p-2.5 rounded-sm border border-[#ffffff08] hover:border-rose-500/30 cursor-pointer transition-colors"
              title="Guji si aad u aragto xaaladda lacagta"
            >
              <span className="text-[10px] text-[#888888] block uppercase font-mono">Baaqiga Lacagta</span>
              <span className={`text-sm font-bold font-mono ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currency} {balanceDue}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs (Organized Sections) */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 bg-[#0a0a0a] border-b border-[#ffffff10] overflow-x-auto">
          {[
            { id: 'overview', label: 'Guudmar (Overview)' },
            { id: 'personal', label: 'Xogta Shakhsiga' },
            { id: 'enrollment', label: 'Diiwaangelinta' },
            { id: 'guardian', label: 'Waalidka' },
            { id: 'academic', label: 'Natiijada' },
            { id: 'attendance', label: 'Xaadiriska' },
            { id: 'fees', label: 'Lacagaha' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#7c3aed] text-white'
                  : 'border-transparent text-[#737373] hover:text-[#d4d4d4]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto pl-2">
            <button
              onClick={exportReportCardPDF}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ffffff05] border border-[#ffffff10] text-[#c4b5fd] text-[11px] rounded-sm hover:bg-[#ffffff10] transition-colors whitespace-nowrap"
            >
              <Download className="w-3 h-3" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[55vh] text-xs space-y-4">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal summary */}
                <div className="bg-[#0a0a0a] border border-[#ffffff08] p-4 rounded-sm space-y-2.5">
                  <div className="flex items-center gap-2 text-[#f5f5f5] font-bold text-xs uppercase font-mono tracking-wider border-b border-[#ffffff05] pb-2">
                    <User className="w-3.5 h-3.5 text-[#7c3aed]" />
                    <span>Xogta Shakhsiga</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Magaca Buuxa:</span>
                      <span className="text-[#e5e5e5] font-medium">{student.fullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Jinsiga:</span>
                      <span className="text-[#e5e5e5] font-medium">{student.gender || 'Male'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Dhalashada:</span>
                      <span className="text-[#e5e5e5] font-medium">{student.dateOfBirth || 'Lama cayimin'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#737373]">Cinwaanka:</span>
                      <span className="text-[#e5e5e5] font-medium">{student.address || guardian?.address || 'Mogadishu'}</span>
                    </div>
                  </div>
                </div>

                {/* Enrollment summary */}
                <div className="bg-[#0a0a0a] border border-[#ffffff08] p-4 rounded-sm space-y-2.5">
                  <div className="flex items-center gap-2 text-[#f5f5f5] font-bold text-xs uppercase font-mono tracking-wider border-b border-[#ffffff05] pb-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Diiwaangelinta Fasalka</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Fasalka Hadda:</span>
                      <span className="text-[#c4b5fd] font-bold">{student.class}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Qeybta (Section):</span>
                      <span className="text-[#e5e5e5] font-mono">{student.section || 'A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#ffffff03]">
                      <span className="text-[#737373]">Roll Number:</span>
                      <span className="text-[#e5e5e5] font-mono">{student.rollNumber || '01'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#737373]">Taariikhda Bilowga:</span>
                      <span className="text-[#e5e5e5] font-mono">{student.createdAt || 'Lama cayimin'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information Card */}
              <div className="bg-[#0a0a0a] border border-[#ffffff08] p-4 rounded-sm space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#888888] font-bold uppercase font-mono text-[10px] tracking-wider">
                  <Info className="w-3.5 h-3.5 text-[#525252]" />
                  <span>System Information / Xogta Nidaamka</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-[#525252] block text-[10px]">Unique System ID</span>
                    <span className="text-[#a3a3a3] font-mono">{student.id}</span>
                  </div>
                  <div>
                    <span className="text-[#525252] block text-[10px]">Diiwaangelin UTC</span>
                    <span className="text-[#a3a3a3] font-mono">{student.createdAt || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#525252] block text-[10px]">Xaaladda Amniga</span>
                    <span className="text-emerald-400 font-mono">Encrypted & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. PERSONAL INFORMATION TAB */}
          {activeTab === 'personal' && (
            <div className="bg-[#0a0a0a] border border-[#ffffff08] p-5 rounded-sm space-y-4">
              <h4 className="text-xs font-bold text-[#f5f5f5] uppercase font-mono tracking-wider border-b border-[#ffffff08] pb-2">
                Macluumaadka Shakhsiga ee Ardayga (Personal Details)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Magaca Buuxa</span>
                  <span className="text-[#f5f5f5] font-bold text-sm">{student.fullName}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Jinsiga</span>
                  <span className="text-[#d4d4d4] font-medium">{student.gender || 'Male'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Taariikhda Dhalashada</span>
                  <span className="text-[#d4d4d4] font-medium">{student.dateOfBirth || 'Lama hayo'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Cinwaanka Degmada</span>
                  <span className="text-[#d4d4d4] font-medium">{student.address || 'Mogadishu, Somalia'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. ENROLLMENT TAB */}
          {activeTab === 'enrollment' && (
            <div className="bg-[#0a0a0a] border border-[#ffffff08] p-5 rounded-sm space-y-4">
              <h4 className="text-xs font-bold text-[#f5f5f5] uppercase font-mono tracking-wider border-b border-[#ffffff08] pb-2">
                Diiwaangelinta Dugsiga (Enrollment & Academic Info)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Fasalka Hadda</span>
                  <span className="text-[#c4b5fd] font-bold text-sm">{student.class}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Qeybta (Section)</span>
                  <span className="text-[#d4d4d4] font-mono">{student.section || 'A'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Roll Number</span>
                  <span className="text-[#d4d4d4] font-mono">{student.rollNumber || '01'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Xaaladda Waxbarashada</span>
                  <span className="text-emerald-400 font-bold uppercase">{student.status || 'Active'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Taariikhda la diiwaangeliyey</span>
                  <span className="text-[#d4d4d4] font-mono">{student.createdAt || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. GUARDIAN TAB */}
          {activeTab === 'guardian' && (
            <div className="bg-[#0a0a0a] border border-[#ffffff08] p-5 rounded-sm space-y-4">
              <h4 className="text-xs font-bold text-[#f5f5f5] uppercase font-mono tracking-wider border-b border-[#ffffff08] pb-2">
                Macluumaadka Waalidka & Xiriirka Degdegga ah
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Magaca Waalidka</span>
                  <span className="text-[#f5f5f5] font-bold">{student.guardianName || guardian?.name || 'Lama hayo'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Telefoonka Waalidka</span>
                  <span className="text-[#c4b5fd] font-mono font-bold">{student.guardianPhone || guardian?.phone || 'Lama hayo'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Xiriirka (Relationship)</span>
                  <span className="text-[#d4d4d4]">{guardian?.relationship || 'Waalid / Guardian'}</span>
                </div>
                <div>
                  <span className="text-[#737373] block text-[10px] uppercase">Cinwaanka Waalidka</span>
                  <span className="text-[#d4d4d4]">{guardian?.address || 'Mogadishu'}</span>
                </div>
              </div>
              {(student.guardianPhone || guardian?.phone) && (
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${(student.guardianPhone || guardian?.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-semibold text-xs hover:bg-emerald-900/60 transition-colors"
                  >
                    <span>Fariin WhatsApp ah u dir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 5. ACADEMIC EXAMS TAB */}
          {activeTab === 'academic' && (
            <div className="space-y-3">
              {studentScores.length === 0 ? (
                <div className="py-8 text-center text-[#525252] italic bg-[#0a0a0a] rounded-sm border border-[#ffffff05]">
                  Weli imtixaanno lama gelin ardaygan
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-[#ffffff05] rounded-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-[10px] uppercase font-mono text-[#737373] border-b border-[#ffffff05]">
                      <tr>
                        <th className="py-2.5 px-3">Imtixaanka</th>
                        <th className="py-2.5 px-3">Maaddada</th>
                        <th className="py-2.5 px-3">Dhibcaha</th>
                        <th className="py-2.5 px-3">Darajada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffffff05] text-[#d4d4d4]">
                      {(studentScores || []).map(score => {
                        const grade = score.grade || (score.marksObtained >= 80 ? 'A' : score.marksObtained >= 65 ? 'B' : score.marksObtained >= 50 ? 'C' : 'F');
                        return (
                          <tr key={score.id}>
                            <td className="py-2.5 px-3 font-semibold text-[#f5f5f5]">{score.examName || 'Midterm'}</td>
                            <td className="py-2.5 px-3">{score.subjectName}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#c4b5fd]">{score.marksObtained} / {score.maxMarks || 100}</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                                grade === 'A' ? 'bg-emerald-950 text-emerald-400' : grade === 'F' ? 'bg-rose-950 text-rose-400' : 'bg-blue-950 text-blue-400'
                              }`}>
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#ffffff05] rounded-sm">
                <div>
                  <span className="text-[10px] text-[#737373] block">Maalmaha la joogay</span>
                  <span className="text-sm font-bold text-emerald-400">{presentDays} maalmood</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Maalmaha la maqnaa</span>
                  <span className="text-sm font-bold text-rose-400">{absentDays} maalmood</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Wadarta Diiwaanka</span>
                  <span className="text-sm font-bold text-[#f5f5f5]">{totalMarked} xilliyo</span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {(studentAttendance || []).map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#ffffff05] rounded-sm text-xs">
                    <span className="font-mono text-[#a3a3a3]">{att.date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                      att.status.toLowerCase() === 'present' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {att.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. FEES TAB */}
          {activeTab === 'fees' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#ffffff05] rounded-sm">
                <div>
                  <span className="text-[10px] text-[#737373] block">Wadarta Khidmadda</span>
                  <span className="text-sm font-bold text-[#f5f5f5]">{currency} {totalBilled}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">La Bixiyey</span>
                  <span className="text-sm font-bold text-emerald-400">{currency} {totalPaid}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#737373] block">Baaqiga Hadhey</span>
                  <span className={`text-sm font-bold ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currency} {balanceDue}
                  </span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {(studentFees || []).map(fee => (
                  <div key={fee.id} className="flex items-center justify-between p-2.5 bg-[#0a0a0a] border border-[#ffffff05] rounded-sm text-xs">
                    <div>
                      <div className="font-semibold text-[#f5f5f5]">{fee.month} {fee.year} (Fee)</div>
                      <div className="text-[10px] text-[#737373]">{fee.createdAt ? new Date(fee.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#c4b5fd]">{currency} {fee.amount}</div>
                      <span className={`text-[10px] font-semibold ${
                        fee.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {fee.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#ffffff08]">
                <button
                  type="button"
                  onClick={() => setShowStatementModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Baaqa Xisaabeedka Rasmiga Ah (Financial Statement)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {showStatementModal && (
        <StudentFinancialStatementModal
          studentId={student.id}
          currency={currency}
          schoolName="Dugsiga Pro 2026"
          onClose={() => setShowStatementModal(false)}
        />
      )}
    </div>
  );
}
