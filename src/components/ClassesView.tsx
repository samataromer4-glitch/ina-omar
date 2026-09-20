import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, X, Users, BookOpen, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolClass, Student } from '../types';

interface ClassesViewProps {
  classes: SchoolClass[];
  students: Student[];
  onAddClass: (classData: Omit<SchoolClass, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateClass: (id: string, classData: Partial<SchoolClass>) => Promise<void>;
  onDeleteClass: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
}

export default function ClassesView({
  classes,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  theme
}: ClassesViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const [form, setForm] = useState({
    className: '',
    teacherName: '',
    roomNumber: '',
    description: ''
  });

  const openAddModal = () => {
    setEditingClass(null);
    setForm({
      className: '',
      teacherName: '',
      roomNumber: '',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (cls: SchoolClass) => {
    setEditingClass(cls);
    setForm({
      className: cls.className,
      teacherName: cls.teacherName || '',
      roomNumber: cls.roomNumber || '',
      description: cls.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.className.trim()) return;

    setLoading(true);
    try {
      if (editingClass) {
        await onUpdateClass(editingClass.id, form);
      } else {
        await onAddClass(form);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete({ id, name });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await onDeleteClass(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.teacherName && c.teacherName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="classes-view-root" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5] flex items-center gap-3">
            Fasallada <span className="text-[#c4b5fd] font-sans font-normal text-sm bg-[#7c3aed20] px-3 py-1 rounded-full border border-[#7c3aed30]">Classes</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Maamul fasallada dugsiga iyo macallimiinta mas'uulka ka ah</p>
        </div>

        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs uppercase tracking-widest font-bold shadow-lg hover:shadow-[#7c3aed20] transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Fasal Cusub (Add Class)</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <input 
            type="text"
            placeholder="Raadi fasal ama macallin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
          />
        </div>
        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#7c3aed10] text-[#c4b5fd] border border-[#7c3aed20]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Fasallo Guud</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{classes.length}</p>
          </div>
        </div>
        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#10b98110] text-[#34d399] border border-[#10b98120]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Celcelis Arday</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">
              {classes.length ? Math.round(students.length / classes.length) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls) => {
            const classStudents = students.filter(s => s.class.toLowerCase() === cls.className.toLowerCase());
            return (
              <motion.div 
                key={cls.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-[#161616]/60 to-[#0e0e0e]/80 backdrop-blur-lg border border-[#ffffff08] hover:border-[#7c3aed40] p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-all duration-300 group hover:shadow-black/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-serif italic text-white group-hover:text-[#c4b5fd] transition-colors">{cls.className}</h3>
                      <p className="text-[9px] uppercase tracking-widest text-[#737373] font-mono mt-0.5">ID: {cls.id}</p>
                    </div>
                    <div className="px-3 py-1 bg-[#ffffff05] border border-[#ffffff10] rounded-full text-[10px] font-mono text-[#a3a3a3] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>{classStudents.length} Arday</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-xs">
                    <div className="flex items-center gap-2.5 text-[#a3a3a3]">
                      <span className="text-[10px] uppercase font-bold text-[#525252] w-20">Macallinka:</span>
                      <span className="font-medium text-[#e5e5e5]">{cls.teacherName || 'Lama meeleyn'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#a3a3a3]">
                      <span className="text-[10px] uppercase font-bold text-[#525252] w-20">Qolka (Room):</span>
                      <span className="font-mono text-[#e5e5e5] bg-[#ffffff05] px-2 py-0.5 rounded border border-[#ffffff08]">{cls.roomNumber || 'N/A'}</span>
                    </div>
                    {cls.description && (
                      <div className="pt-2 border-t border-[#ffffff05] mt-2">
                        <p className="text-[10px] text-[#737373] italic line-clamp-2 leading-relaxed">{cls.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#ffffff05] flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono text-[#525252]">{cls.createdAt}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(cls)}
                      className="p-2 rounded-xl bg-[#ffffff05] hover:bg-[#7c3aed20] border border-[#ffffff08] hover:border-[#7c3aed30] text-[#a3a3a3] hover:text-[#c4b5fd] transition-all"
                      title="Tafatir"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cls.id, cls.className)}
                      className="p-2 rounded-xl bg-[#ffffff05] hover:bg-rose-950/30 border border-[#ffffff08] hover:border-rose-500/30 text-[#a3a3a3] hover:text-rose-400 transition-all"
                      title="Tirtir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-[#121212]/40 border border-[#ffffff05] rounded-2xl">
            <ShieldCheck className="w-12 h-12 text-[#525252] mx-auto mb-3" />
            <h4 className="font-serif italic text-lg text-[#e5e5e5]">Fasallo ma jiraan</h4>
            <p className="text-xs text-[#737373] mt-1">Guji 'Fasal Cusub' si aad u bilowdo maamulka.</p>
          </div>
        )}
      </div>

      {/* Class Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gradient-to-b from-[#181818] to-[#101010] border border-[#ffffff10] rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]"></div>
              
              <button 
                className="absolute right-4 top-4 p-1.5 rounded-lg text-[#737373] hover:bg-[#ffffff05] hover:text-white transition-all" 
                onClick={() => setShowModal(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif italic text-[#f5f5f5] mb-6 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#c4b5fd]" />
                {editingClass ? 'Tafatir Fasalka' : 'Abuur Fasal Cusub'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Magaca Fasalka (Class Name) *</label>
                  <input 
                    type="text"
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    placeholder="Tusaale: Grade 1, Form 4A"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Macallinka (Teacher)</label>
                    <input 
                      type="text"
                      value={form.teacherName}
                      onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      placeholder="Magaca Macallinka"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Qolka (Room)</label>
                    <input 
                      type="text"
                      value={form.roomNumber}
                      onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      placeholder="Room 101"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Faahfaahin (Description)</label>
                  <textarea 
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors h-24 resize-none"
                    placeholder="Qor faahfaahin kooban oo ku saabsan fasalka..."
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-3 rounded-xl border border-[#ffffff10] hover:bg-[#ffffff05] text-[#737373] hover:text-[#e5e5e5] uppercase tracking-widest font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white uppercase tracking-widest font-bold shadow-lg hover:shadow-[#7c3aed20] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : 'Kaydi (Save)'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0e111a] border border-[#ffffff10] rounded-2xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>
              
              <h2 className="text-xl font-serif italic text-white mb-2 flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-400" />
                Tirtir Fasalka
              </h2>
              
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                Ma hubtaa inaad tirtirto fasalka <strong className="text-white">"{confirmDelete.name}"</strong>? Tani dib looma soo celin karo.
              </p>

              <div className="flex items-center justify-end gap-3 text-[10px] font-bold uppercase tracking-widest">
                <button 
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#ffffff10] hover:bg-[#ffffff05] text-[#737373] hover:text-[#e5e5e5] transition-all"
                >
                  Huri (No)
                </button>
                <button 
                  type="button"
                  onClick={executeDelete}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Tirtiraya...' : 'Tirtir (Yes)'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
