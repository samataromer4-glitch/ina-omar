import React, { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, X, Sparkles, FolderOpen, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolSubject, SchoolClass } from '../types';

interface SubjectsViewProps {
  subjects: SchoolSubject[];
  classes: SchoolClass[];
  onAddSubject: (subjectData: Omit<SchoolSubject, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSubject: (id: string, subjectData: Partial<SchoolSubject>) => Promise<void>;
  onDeleteSubject: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
}

export default function SubjectsView({
  subjects,
  classes,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  theme
}: SubjectsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SchoolSubject | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const [form, setForm] = useState({
    subjectName: '',
    subjectCode: '',
    className: '',
    teacherName: ''
  });

  const openAddModal = () => {
    setEditingSubject(null);
    setForm({
      subjectName: '',
      subjectCode: '',
      className: classes.length > 0 ? classes[0].className : '',
      teacherName: ''
    });
    setShowModal(true);
  };

  const openEditModal = (sub: SchoolSubject) => {
    setEditingSubject(sub);
    setForm({
      subjectName: sub.subjectName,
      subjectCode: sub.subjectCode || '',
      className: sub.className || '',
      teacherName: sub.teacherName || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectName.trim()) return;

    setLoading(true);
    try {
      if (editingSubject) {
        await onUpdateSubject(editingSubject.id, form);
      } else {
        await onAddSubject(form);
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
      await onDeleteSubject(confirmDelete.id);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.subjectCode && s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesClass = classFilter === 'All' || s.className === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div id="subjects-view-root" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5] flex items-center gap-3">
            Maddooyinka <span className="text-[#c4b5fd] font-sans font-normal text-sm bg-[#7c3aed20] px-3 py-1 rounded-full border border-[#7c3aed30]">Subjects</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Maamul maddooyinka iyo manhajka iskuulka ee fasal walba</p>
        </div>

        <button 
          onClick={openAddModal}
          disabled={classes.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs uppercase tracking-widest font-bold shadow-lg hover:shadow-[#7c3aed20] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Maaddo Cusub (Add Subject)</span>
        </button>
      </div>

      {classes.length === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3">
          <span>Horta fadlan soo samee ugu yaraan hal Fasal si aad maddooyinka ugu xiriiriso.</span>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 relative">
          <input 
            type="text"
            placeholder="Raadi maaddo ama macallin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3.5 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
          />
        </div>

        <div>
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]/50"
          >
            <option value="All">Dhamaan Fasallada</option>
            {classes.map(c => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>
        </div>

        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#7c3aed10] text-[#c4b5fd] border border-[#7c3aed20]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Maddooyinka Guud</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{subjects.length}</p>
          </div>
        </div>

        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#10b98110] text-[#34d399] border border-[#10b98120]">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Maddooyinka Filitiran</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{filteredSubjects.length}</p>
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((sub) => (
            <motion.div 
              key={sub.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-[#161616]/60 to-[#0e0e0e]/80 backdrop-blur-lg border border-[#ffffff08] hover:border-[#7c3aed40] p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-all duration-300 group hover:shadow-black/40"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-serif italic text-white group-hover:text-[#c4b5fd] transition-colors">{sub.subjectName}</h3>
                    <p className="text-[9px] uppercase tracking-widest text-[#737373] font-mono mt-0.5">Xeerka: {sub.subjectCode || 'N/A'}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#7c3aed10] border border-[#7c3aed20] text-[#c4b5fd] rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    {sub.className}
                  </span>
                </div>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-[#a3a3a3]">
                    <User className="w-4 h-4 text-[#7c3aed]" />
                    <span className="text-[10px] uppercase font-bold text-[#525252] w-20">Macallinka:</span>
                    <span className="font-medium text-[#e5e5e5]">{sub.teacherName || 'Lama meeleyn'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#ffffff05] flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono text-[#525252]">{sub.createdAt}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(sub)}
                    className="p-2 rounded-xl bg-[#ffffff05] hover:bg-[#7c3aed20] border border-[#ffffff08] hover:border-[#7c3aed30] text-[#a3a3a3] hover:text-[#c4b5fd] transition-all"
                    title="Tafatir"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(sub.id, sub.subjectName)}
                    className="p-2 rounded-xl bg-[#ffffff05] hover:bg-rose-950/30 border border-[#ffffff08] hover:border-rose-500/30 text-[#a3a3a3] hover:text-rose-400 transition-all"
                    title="Tirtir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-[#121212]/40 border border-[#ffffff05] rounded-2xl">
            <BookOpen className="w-12 h-12 text-[#525252] mx-auto mb-3" />
            <h4 className="font-serif italic text-lg text-[#e5e5e5]">Maaddooyin ma jiraan</h4>
            <p className="text-xs text-[#737373] mt-1">Guji 'Maaddo Cusub' si aad u bilowdo manhajka.</p>
          </div>
        )}
      </div>

      {/* Subject Modal */}
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
                {editingSubject ? 'Tafatir Maaddada' : 'Abuur Maaddo Cusub'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Magaca Maaddada (Subject Name) *</label>
                  <input 
                    type="text"
                    value={form.subjectName}
                    onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    placeholder="Tusaale: Somali, Xisaab, Ingiriis"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Xeerka Maaddada (Code)</label>
                    <input 
                      type="text"
                      value={form.subjectCode}
                      onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      placeholder="Tusaale: SOM-101, MATH"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Fasalka (Class) *</label>
                    <select 
                      value={form.className}
                      onChange={(e) => setForm({ ...form, className: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      required
                    >
                      {classes.map(c => (
                        <option key={c.id} value={c.className}>{c.className}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Macallinka Maaddada (Teacher Name)</label>
                  <input 
                    type="text"
                    value={form.teacherName}
                    onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    placeholder="Magaca Macallinka maaddada dhiga"
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
                Tirtir Maaddada
              </h2>
              
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                Ma hubtaa inaad tirtirto maaddada <strong className="text-white">"{confirmDelete.name}"</strong>? Tani dib looma soo celin karo.
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
