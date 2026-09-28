import React, { useState } from 'react';
import { 
  Bell as BellIcon, 
  Search as SearchIcon, 
  Plus as PlusIcon, 
  Edit2 as Edit2Icon, 
  Trash2 as Trash2Icon, 
  Calendar as CalendarIcon, 
  AlertCircle as AlertCircleIcon, 
  Share2 as Share2Icon, 
  Users as UsersIcon, 
  X as XIcon, 
  ExternalLink as ExternalLinkIcon,
  Flame as FlameIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Announcement, SchoolClass } from '../types';

interface AnnouncementsViewProps {
  announcements?: Announcement[];
  classes?: SchoolClass[];
  onAddAnnouncement: (data: any) => Promise<void>;
  onUpdateAnnouncement: (id: string, data: any) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function AnnouncementsView({
  announcements = [],
  classes = [],
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  showToast
}: AnnouncementsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'Everyone' as 'Everyone' | 'Teachers' | 'Students' | 'Parents' | 'Staff' | 'Class',
    targetClass: '',
    priority: 'Normal' as 'Normal' | 'High' | 'Urgent',
    status: 'Active' as 'Active' | 'Archived',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const openAddModal = () => {
    setEditingAnn(null);
    setForm({
      title: '',
      message: '',
      audience: 'Everyone',
      targetClass: '',
      priority: 'Normal',
      status: 'Active',
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    });
    setShowModal(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingAnn(ann);
    setForm({
      title: ann.title,
      message: ann.message,
      audience: ann.audience,
      targetClass: ann.targetClass || '',
      priority: ann.priority || 'Normal',
      status: ann.status || 'Active',
      publishDate: ann.publishDate || '',
      expiryDate: ann.expiryDate || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Cinwaanka iyo fariinta ogeysiiska waa khasab", "error");
      return;
    }

    setLoading(true);
    try {
      if (editingAnn) {
        await onUpdateAnnouncement(editingAnn.id, form);
        showToast("Ogeysiiska si guul leh ayaa loo cusbooneysiiyey");
      } else {
        await onAddAnnouncement(form);
        showToast("Ogeysiis cusub ayaa la daabacay");
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err?.message || "Khalad ayaa dhacay", "error");
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp share
  const shareWhatsApp = (ann: Announcement) => {
    const text = `📢 *OGEYSIIS KU SOCODA: ${ann.audience.toUpperCase()}*\n\n*${ann.title}*\n\n${ann.message}\n\n🗓️ Taariikhda: ${ann.publishDate}\n🏫 Dugsiga Pro Management System`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchQuery = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAudience = audienceFilter === 'All' || ann.audience === audienceFilter;
    return matchQuery && matchAudience;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif italic text-[#f5f5f5]">
            Ogeysiisyada & Fariimaha (Notice Board)
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">
            Daabacaadda ogeysiisyada iskuulka, xiriirka waalidiinta, iyo la wadaagidda WhatsApp
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3aed] text-white rounded-sm text-xs font-semibold hover:bg-[#6d28d9] transition-colors shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Daabac Ogeysiis</span>
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0f0f0f] border border-[#ffffff10] p-4 rounded-sm">
        <div className="relative flex-1 max-w-sm w-full">
          <SearchIcon className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Raadi ogeysiis cinwaankiisa ama nuxurka..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm pl-9 pr-3 py-2 text-xs text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#ffffff10] p-1 rounded-sm overflow-x-auto w-full sm:w-auto">
          {['All', 'Everyone', 'Parents', 'Teachers', 'Students', 'Staff'].map(aud => (
            <button
              key={aud}
              onClick={() => setAudienceFilter(aud)}
              className={`px-3 py-1 text-xs font-semibold rounded-sm whitespace-nowrap transition-colors ${
                audienceFilter === aud ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-white'
              }`}
            >
              {aud}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-[#ffffff10] rounded-sm">
            <BellIcon className="w-10 h-10 text-[#525252] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#a3a3a3]">Ma jiraan ogeysiisyada la helay</p>
            <p className="text-xs text-[#525252] mt-1">Guji batoonka kore si aad u daabacdo ogeysiis cusub</p>
          </div>
        ) : (
          (filteredAnnouncements || []).map(ann => {
            const isUrgent = ann.priority === 'Urgent';
            const isHigh = ann.priority === 'High';

            return (
              <div
                key={ann.id}
                className={`bg-[#0f0f0f] border rounded-sm p-5 flex flex-col justify-between transition-colors ${
                  isUrgent 
                    ? 'border-rose-900/60 hover:border-rose-700' 
                    : isHigh 
                      ? 'border-amber-900/60 hover:border-amber-700' 
                      : 'border-[#ffffff10] hover:border-[#7c3aed]/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-sm font-bold">
                            <FlameIcon className="w-3 h-3" />
                            <span>DEG DEG (URGENT)</span>
                          </span>
                        )}
                        <span className="text-[10px] bg-[#7c3aed]/10 text-[#c4b5fd] border border-[#7c3aed]/30 px-2 py-0.5 rounded-sm font-semibold">
                          Loo diray: {ann.audience}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#f5f5f5] leading-snug">{ann.title}</h3>
                    </div>

                    <div className="text-[10px] text-[#737373] font-mono whitespace-nowrap flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{ann.publishDate}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#d4d4d4] whitespace-pre-line leading-relaxed">
                    {ann.message}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#ffffff05] flex items-center justify-between">
                  <button
                    onClick={() => shareWhatsApp(ann)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50 text-xs font-semibold rounded-sm transition-colors"
                  >
                    <Share2Icon className="w-3.5 h-3.5" />
                    <span>WhatsApp ku dir</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]"
                      title="Tafatir"
                    >
                      <Edit2Icon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Ma hubtaa inaad tirtirto ogeysiiska "${ann.title}"?`)) {
                          onDeleteAnnouncement(ann.id);
                        }
                      }}
                      className="p-1.5 rounded-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                      title="Tirtir"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm max-w-lg w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
                <h2 className="text-lg font-bold font-serif italic text-[#f5f5f5]">
                  {editingAnn ? 'Tafatir Ogeysiiska' : 'Daabac Ogeysiis Cusub'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-[#737373] hover:text-white">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Cinwaanka Ogeysiiska *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Tusaale: Fasaxa Ciidul Fidriga ama Xiritaanka Dugsiga"
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Loo Dirayo (Audience) *</label>
                    <select
                      value={form.audience}
                      onChange={e => setForm({ ...form, audience: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Everyone">Dhammaan (Everyone)</option>
                      <option value="Parents">Waalidiinta (Parents)</option>
                      <option value="Teachers">Macallimiinta (Teachers)</option>
                      <option value="Students">Ardayda (Students)</option>
                      <option value="Staff">Shaqaalaha (Staff)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#a3a3a3] font-semibold">Heerka Deg-degga (Priority)</label>
                    <select
                      value={form.priority}
                      onChange={e => setForm({ ...form, priority: e.target.value as any })}
                      className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                    >
                      <option value="Normal">Caadi (Normal)</option>
                      <option value="High">Muhiim (High)</option>
                      <option value="Urgent">Deg-deg (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#a3a3a3] font-semibold">Qoraalka / Fariinta *</label>
                  <textarea
                    rows={5}
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Qor nuxurka ogeysiiska halkan..."
                    className="w-full bg-[#0a0a0a] border border-[#ffffff10] rounded-sm px-3 py-2 text-[#f5f5f5] focus:outline-none focus:border-[#7c3aed]"
                  />
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
                    {loading ? 'Daabacaya...' : editingAnn ? 'Cusbooneysii' : 'Daabac Ogeysiiska'}
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
