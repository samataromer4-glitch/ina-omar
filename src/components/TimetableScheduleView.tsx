import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  BookOpen, 
  User, 
  MapPin, 
  Download, 
  AlertTriangle,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimetableSlot, SchoolClass, Teacher, SchoolSubject } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TimetableScheduleViewProps {
  timetable?: TimetableSlot[];
  classes?: SchoolClass[];
  teachers?: Teacher[];
  subjects?: SchoolSubject[];
  onAddSlot: (slotData: any) => Promise<void>;
  onDeleteSlot: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const DAYS_OF_WEEK = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function TimetableScheduleView({
  timetable = [],
  classes = [],
  teachers = [],
  subjects = [],
  onAddSlot,
  onDeleteSlot,
  showToast = () => {}
}: TimetableScheduleViewProps) {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    day: 'Saturday' as any,
    className: classes?.[0]?.className || '',
    teacherName: teachers?.[0]?.name || '',
    subjectName: subjects?.[0]?.subjectName || '',
    roomNumber: classes?.[0]?.roomNumber || 'Room 1',
    startTime: '08:00',
    endTime: '08:45',
    academicYear: '2025/2026',
    term: 'Term 1'
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.className || !form.teacherName || !form.subjectName) {
      showToast("Fadlan buuxi dhammaan macluumaadka jadwalka", "error");
      return;
    }

    if (form.startTime >= form.endTime) {
      showToast("Waqtiga bilowgu waa inuu ka horeeyaa kan dhammaadka", "error");
      return;
    }

    setLoading(true);
    try {
      await onAddSlot(form);
      showToast("Casharka jadwalka si guul leh ayaa loogu daray");
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ama isku dhac ayaa ka jira jadwalka", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter slots
  const filteredSlots = timetable.filter(s => {
    const matchClass = selectedClass === 'All' || s.className === selectedClass;
    const matchTeacher = selectedTeacher === 'All' || s.teacherName === selectedTeacher;
    return matchClass && matchTeacher;
  });

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = selectedClass !== 'All' 
      ? `Jadwalka Fasalka: ${selectedClass}` 
      : selectedTeacher !== 'All' 
        ? `Jadwalka Macallinka: ${selectedTeacher}` 
        : 'Jadwalka Guud ee Iskuulka';
    
    doc.text(`Dugsiga Pro 2026 - ${title}`, 14, 15);

    const rows = filteredSlots.map(s => [
      s.day,
      `${s.startTime} - ${s.endTime}`,
      s.className,
      s.subjectName,
      s.teacherName,
      s.roomNumber || '-'
    ]);

    autoTable(doc, {
      startY: 22,
      head: [['Maalinta (Day)', 'Waqtiga (Time)', 'Fasalka (Class)', 'Maaddada (Subject)', 'Macallinka (Teacher)', 'Qolka (Room)']],
      body: rows
    });

    doc.save(`Jadwalka_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Jadwalka Casharrada (Timetable & Schedule)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Qorshaha saacadaha fasallada, macallimiinta, iyo qolalka oo ka hortaga isku-dhaca
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[#ffffff10] text-xs font-semibold text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
          >
            <Download className="w-4 h-4 text-[#c4b5fd]" />
            <span>Dhoofi PDF</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ku dar Xilli (Slot)</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#737373]" />
          <span className="text-xs font-semibold text-[#a3a3a3]">Shaandhee:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#737373] font-mono uppercase">Fasalka:</label>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#f5f5f5] rounded-sm px-3 py-1.5 focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Fasallada</option>
            {(classes || []).map(c => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#737373] font-mono uppercase">Macallinka:</label>
          <select
            value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}
            className="bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#f5f5f5] rounded-sm px-3 py-1.5 focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="All">Dhammaan Macallimiinta</option>
            {(teachers || []).map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-[#737373] font-mono">
          Wadarta: <span className="text-[#f5f5f5] font-bold">{filteredSlots.length}</span> xilliyo
        </div>
      </div>

      {/* Weekly Grid (Columns for each day) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {DAYS_OF_WEEK.map(day => {
          const daySlots = filteredSlots
            .filter(s => s.day === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div key={day} className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-2 mb-3">
                <span className="text-xs font-bold text-[#f5f5f5] uppercase tracking-wider font-mono">{day}</span>
                <span className="text-[10px] bg-[#ffffff05] border border-[#ffffff10] px-1.5 py-0.5 rounded text-[#737373] font-mono">
                  {daySlots.length}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {daySlots.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-[#525252] italic">
                    Cashar kuma jiro
                  </div>
                ) : (
                  daySlots.map(slot => (
                    <div 
                      key={slot.id}
                      className="group relative bg-[#0a0a0a] border border-[#ffffff10] hover:border-[#7c3aed] p-2.5 rounded-sm transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#c4b5fd] font-mono font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#7c3aed]" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Ma hubtaa inaad tirtirto xilligan (${slot.subjectName})?`)) {
                              onDeleteSlot(slot.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 p-0.5"
                          title="Tirtir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-[#f5f5f5] truncate">
                        {slot.subjectName}
                      </div>

                      <div className="mt-1 space-y-0.5 text-[10px] text-[#a3a3a3]">
                        <div className="flex items-center gap-1 truncate">
                          <BookOpen className="w-3 h-3 text-[#525252]" />
                          <span>{slot.className}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-[#525252]" />
                          <span className="truncate">{slot.teacherName}</span>
                        </div>
                        {slot.roomNumber && (
                          <div className="flex items-center gap-1 text-[#737373]">
                            <MapPin className="w-3 h-3 text-[#525252]" />
                            <span>{slot.roomNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
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
                  Ku dar Xilli Jadwal (Add Slot)
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Maalinta (Day) *</label>
                    <select
                      value={form.day}
                      onChange={e => setForm({ ...form, day: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Fasalka *</label>
                    <select
                      value={form.className}
                      onChange={e => setForm({ ...form, className: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      {(classes || []).map(c => (
                        <option key={c.id} value={c.className}>{c.className}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Maaddada *</label>
                    <select
                      value={form.subjectName}
                      onChange={e => setForm({ ...form, subjectName: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      {(subjects || []).map(s => (
                        <option key={s.id} value={s.subjectName}>{s.subjectName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Macallinka *</label>
                    <select
                      value={form.teacherName}
                      onChange={e => setForm({ ...form, teacherName: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      {(teachers || []).map(t => (
                        <option key={t.id} value={t.name}>{t.name} ({t.specialization || 'Teacher'})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Waqtiga Bilowga *</label>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Waqtiga Dhammaadka *</label>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={e => setForm({ ...form, endTime: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Qolka (Room)</label>
                    <input
                      type="text"
                      value={form.roomNumber}
                      onChange={e => setForm({ ...form, roomNumber: e.target.value })}
                      placeholder="Room 101, Lab B, etc."
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <div className="bg-[#7c3aed]/10 border border-[#7c3aed]/30 p-2.5 rounded-sm flex items-start gap-2 text-[11px] text-[#c4b5fd]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#c4b5fd] mt-0.5" />
                  <span>
                    Nidaamku wuxuu si toos ah u baari doonaa in macallinka, fasalka, ama qolku aysan horay u lahayn cashar kale waqtigan.
                  </span>
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
                    {loading ? 'Hubinaya...' : 'Ku dar Jadwalka'}
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
