import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit2, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Phone, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Calendar, 
  RotateCcw,
  LayoutGrid,
  List,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, SchoolClass, FeeRecord, AttendanceRecord, ExamScore } from '../../types';
import { StudentSubSection } from '../StudentsView';
import { PageHeader } from '../ui/PageHeader';
import { MetricCard } from '../ui/MetricCard';
import { FilterBar, FilterChip } from '../ui/FilterBar';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface StudentListViewProps {
  mode: 'all' | 'active' | 'inactive' | 'archived';
  students: Student[];
  classes: SchoolClass[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  examScores: ExamScore[];
  subjects?: any[];
  settings: {
    schoolName: string;
    currency: string;
    academicYear?: string;
    [key: string]: any;
  };
  onAddStudent: (student: any) => Promise<boolean>;
  onUpdateStudent: (id: string, updates: any) => Promise<boolean>;
  onDeleteStudent: (id: string) => Promise<boolean>;
  onBulkUpdate?: (action: string, studentIds: string[], targetValue?: string) => Promise<boolean>;
  onRefreshData?: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
  onNavigateSubSection: (sub: StudentSubSection) => void;
  onSelectStudentProfile: (student: Student) => void;
  initialEditingStudentId?: string | null;
  onClearEditingStudentId?: () => void;
}

export default function StudentListView({
  mode,
  students,
  classes,
  fees,
  settings,
  onUpdateStudent,
  onDeleteStudent,
  onBulkUpdate,
  onRefreshData,
  showToast,
  onNavigateSubSection,
  onSelectStudentProfile,
  initialEditingStudentId,
  onClearEditingStudentId
}: StudentListViewProps) {
  // Layout states
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(() => {
    if (mode === 'active') return 'active';
    if (mode === 'inactive') return 'inactive';
    if (mode === 'archived') return 'archived';
    return 'all';
  });
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc' | 'class'>('name_asc');

  // Sync status filter if mode prop changes
  useEffect(() => {
    if (mode === 'active') setSelectedStatusFilter('active');
    else if (mode === 'inactive') setSelectedStatusFilter('inactive');
    else if (mode === 'archived') setSelectedStatusFilter('archived');
    else setSelectedStatusFilter('all');
  }, [mode]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Column Visibility Controls
  const [visibleColumns, setVisibleColumns] = useState({
    avatar: true,
    id: true,
    name: true,
    gender: true,
    class: true,
    guardian: true,
    status: true,
    regDate: true,
    actions: true
  });
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Selection & Bulk Actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState<{
    isOpen: boolean;
    action: 'change_class' | 'change_status' | 'archive' | 'delete' | null;
  }>({ isOpen: false, action: null });
  const [bulkTargetClass, setBulkTargetClass] = useState<string>('');
  const [bulkTargetStatus, setBulkTargetStatus] = useState<'active' | 'inactive' | 'archived'>('active');
  const [bulkOperating, setBulkOperating] = useState(false);

  // Quick Edit Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    class: '',
    gender: 'Male',
    guardianPhone: '',
    guardianName: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
    section: '',
    rollNumber: '',
    address: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Filter computation
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // 1. Mode status constraint
      if (mode === 'active' && student.status !== 'active') return false;
      if (mode === 'inactive' && student.status !== 'inactive') return false;
      if (mode === 'archived' && student.status !== 'archived') return false;

      // 2. Status dropdown constraint in 'all' mode
      if (mode === 'all' && selectedStatusFilter !== 'all' && student.status !== selectedStatusFilter) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (student.fullName || '').toLowerCase().includes(q);
        const matchesId = (student.id || '').toLowerCase().includes(q);
        const matchesClass = (student.class || '').toLowerCase().includes(q);
        const matchesPhone = (student.guardianPhone || '').includes(q);
        const matchesGuardian = (student.guardianName || '').toLowerCase().includes(q);
        const matchesRoll = (student.rollNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesClass && !matchesPhone && !matchesGuardian && !matchesRoll) {
          return false;
        }
      }

      // 4. Class filter
      if (selectedClassFilter !== 'all' && student.class !== selectedClassFilter) {
        return false;
      }

      // 5. Gender filter
      if (selectedGenderFilter !== 'all' && student.gender !== selectedGenderFilter) {
        return false;
      }

      // 6. Registration Date filter
      if (dateFilterPreset !== 'all' && student.createdAt) {
        const studentDate = new Date(student.createdAt);
        const now = new Date();
        if (dateFilterPreset === 'today') {
          const isToday = studentDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (dateFilterPreset === 'month') {
          const isSameMonth = studentDate.getMonth() === now.getMonth() && studentDate.getFullYear() === now.getFullYear();
          if (!isSameMonth) return false;
        } else if (dateFilterPreset === 'year') {
          const isSameYear = studentDate.getFullYear() === now.getFullYear();
          if (!isSameYear) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortBy === 'name_desc') return (b.fullName || '').localeCompare(a.fullName || '');
      if (sortBy === 'date_desc') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'date_asc') return (a.createdAt || '').localeCompare(b.createdAt || '');
      if (sortBy === 'class') return (a.class || '').localeCompare(b.class || '');
      return 0;
    });
  }, [students, mode, selectedStatusFilter, searchQuery, selectedClassFilter, selectedGenderFilter, dateFilterPreset, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedStudentIds([]);
  }, [searchQuery, selectedClassFilter, selectedGenderFilter, selectedStatusFilter, dateFilterPreset, pageSize, mode]);

  // Selection state
  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !paginatedStudents.some(s => s.id === id)));
    } else {
      const pageIds = paginatedStudents.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Quick Status change
  const handleQuickStatusChange = async (student: Student, targetStatus: 'active' | 'inactive' | 'archived') => {
    try {
      const ok = await onUpdateStudent(student.id, { status: targetStatus });
      if (ok) {
        showToast(`Xaaladda ${student.fullName} waxaa laga dhigay ${targetStatus.toUpperCase()}`, 'success');
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast('Khalad ayaa dhacay beddelidda xaaladda', 'error');
    }
  };

  // Quick Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      fullName: student.fullName,
      class: student.class,
      gender: student.gender || 'Male',
      guardianPhone: student.guardianPhone || '',
      guardianName: student.guardianName || '',
      status: student.status || 'active',
      section: student.section || '',
      rollNumber: student.rollNumber || '',
      address: student.address || ''
    });
  };

  // Sync external request to edit student (e.g. from StudentProfileModal)
  useEffect(() => {
    if (initialEditingStudentId) {
      const match = students.find(s => s.id === initialEditingStudentId);
      if (match) {
        handleOpenEdit(match);
        if (onClearEditingStudentId) onClearEditingStudentId();
      }
    }
  }, [initialEditingStudentId, students]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editFormData.fullName.trim() || !editFormData.class) {
      showToast('Magaca iyo Fasalka waa qasab', 'warning');
      return;
    }

    setEditSubmitting(true);
    try {
      const ok = await onUpdateStudent(editingStudent.id, editFormData);
      if (ok) {
        showToast('Xogta ardayga waa la cusbooneysiiyey', 'success');
        setEditingStudent(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast('Khalad ayaa dhacay cusbooneysiinta', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteConfirmStudent) return;
    setDeleteSubmitting(true);
    try {
      const ok = await onDeleteStudent(deleteConfirmStudent.id);
      if (ok) {
        showToast(`Ardayga ${deleteConfirmStudent.fullName} waa la tirtiray`, 'success');
        setDeleteConfirmStudent(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast('Khalad ayaa dhacay tirtirista', 'error');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Execute Bulk Action
  const handleExecuteBulkAction = async () => {
    if (selectedStudentIds.length === 0 || !bulkActionModal.action) return;
    if (!onBulkUpdate) {
      showToast('Bulk action ma taageersana nidaamka', 'warning');
      return;
    }

    setBulkOperating(true);
    try {
      let targetValue: string | undefined;
      if (bulkActionModal.action === 'change_class') {
        if (!bulkTargetClass) {
          showToast('Fadlan dooro fasalka cusub', 'warning');
          setBulkOperating(false);
          return;
        }
        targetValue = bulkTargetClass;
      } else if (bulkActionModal.action === 'change_status') {
        targetValue = bulkTargetStatus;
      }

      const ok = await onBulkUpdate(bulkActionModal.action, selectedStudentIds, targetValue);
      if (ok) {
        showToast(`Hawlgalka wadajirka ah waa la fuliyey (${selectedStudentIds.length} arday)`, 'success');
        setSelectedStudentIds([]);
        setBulkActionModal({ isOpen: false, action: null });
        if (onRefreshData) onRefreshData();
      }
    } catch (e) {
      showToast('Khalad ayaa dhacay fulinta hawlgalka', 'error');
    } finally {
      setBulkOperating(false);
    }
  };

  // Stats for current mode
  const counts = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const inactive = students.filter(s => s.status === 'inactive').length;
    const archived = students.filter(s => s.status === 'archived').length;
    return { total, active, inactive, archived };
  }, [students]);

  // Section titles and descriptions
  const sectionMeta = {
    all: {
      title: 'All Students / Diiwaanka Guud ee Ardayda',
      desc: 'Maamul guud ee dhammaan ardayda dugsiga diiwaangashan, raadinta sare, iyo xog-falanqaynta.',
      badge: `${counts.total} Students`,
      badgeColor: 'text-[#c4b5fd] bg-[#7c3aed]/15 border-[#7c3aed]/30'
    },
    active: {
      title: 'Active Students / Ardayda Firfircoon',
      desc: 'Ardayda sida rasmiga ah hadda fasallada u xaadira oo waxbarashada firfircoon ugu jira.',
      badge: `${counts.active} Active`,
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
    },
    inactive: {
      title: 'Inactive Students / Ardayda Joojiyey / Fasaxa ah',
      desc: 'Ardayda fasaxa ku maqan ama waxbarashada si kumeelgaar ah u hakiyey. Hal gujin dib ugu hawlgeli.',
      badge: `${counts.inactive} Inactive`,
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/40'
    },
    archived: {
      title: 'Archived Students / Ardayda Kaydsan (History)',
      desc: 'Xogta ardaydii hore ee qalin-jabisay ama baxday. Natiijooyinkooda iyo biilashooda waa ammaan.',
      badge: `${counts.archived} Archived`,
      badgeColor: 'text-slate-300 bg-slate-800/40 border-slate-700/40'
    }
  }[mode];

  // Active filter chips
  const activeFilterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (selectedClassFilter !== 'all') {
      chips.push({
        id: 'class',
        label: 'Fasalka',
        value: selectedClassFilter,
        onRemove: () => setSelectedClassFilter('all')
      });
    }
    if (selectedGenderFilter !== 'all') {
      chips.push({
        id: 'gender',
        label: 'Jinsiga',
        value: selectedGenderFilter === 'Male' ? 'Lab (Male)' : 'Dhedig (Female)',
        onRemove: () => setSelectedGenderFilter('all')
      });
    }
    if (mode === 'all' && selectedStatusFilter !== 'all') {
      chips.push({
        id: 'status',
        label: 'Xaaladda',
        value: selectedStatusFilter,
        onRemove: () => setSelectedStatusFilter('all')
      });
    }
    if (dateFilterPreset !== 'all') {
      chips.push({
        id: 'date',
        label: 'Taariikhda',
        value: dateFilterPreset === 'today' ? 'Maanta' : dateFilterPreset === 'month' ? 'Bishan' : 'Sannadkan',
        onRemove: () => setDateFilterPreset('all')
      });
    }
    return chips;
  }, [selectedClassFilter, selectedGenderFilter, selectedStatusFilter, dateFilterPreset, mode]);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedClassFilter('all');
    setSelectedGenderFilter('all');
    if (mode === 'all') setSelectedStatusFilter('all');
    setDateFilterPreset('all');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. UNIFIED PAGE HEADER */}
      <PageHeader
        title={sectionMeta.title}
        subtitle={sectionMeta.desc}
        badge={sectionMeta.badge}
        badgeColor={sectionMeta.badgeColor}
        breadcrumbs={[
          { label: 'Maamulka', onClick: () => onNavigateSubSection('all') },
          { label: 'Ardayda', onClick: () => onNavigateSubSection('all') },
          { label: sectionMeta.badge }
        ]}
        primaryAction={{
          label: 'Ku dar Arday',
          icon: UserPlus,
          onClick: () => onNavigateSubSection('add')
        }}
        secondaryActions={[
          {
            label: 'Import Excel',
            icon: Upload,
            onClick: () => onNavigateSubSection('import')
          },
          {
            label: 'Export Records',
            icon: Download,
            onClick: () => onNavigateSubSection('export')
          }
        ]}
      >
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-[#0f0f0f] border border-[#ffffff15] p-0.5 rounded-sm flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xs text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-[#7c3aed] text-white font-bold' : 'text-[#888888] hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xs text-xs flex items-center gap-1.5 transition-colors ${
                viewMode === 'cards' ? 'bg-[#7c3aed] text-white font-bold' : 'text-[#888888] hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">Cards</span>
            </button>
          </div>

          {/* Columns Visibility Button */}
          <div className="relative">
            <button
              onClick={() => setShowColumnConfig(!showColumnConfig)}
              className="px-3 py-2 rounded-sm bg-[#0f0f0f] border border-[#ffffff15] hover:bg-[#ffffff10] text-[#cccccc] text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors"
              title="Configure Visible Columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#c4b5fd]" />
              <span className="hidden md:inline">Columns</span>
            </button>

            {showColumnConfig && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#141414] border border-[#ffffff15] rounded-sm shadow-2xl p-3 z-40 space-y-2">
                <div className="flex items-center justify-between border-b border-[#ffffff10] pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Visible Columns</span>
                  <button onClick={() => setShowColumnConfig(false)} className="text-[#888888] hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs max-h-52 overflow-y-auto">
                  {[
                    { key: 'avatar', label: 'Photo / Sawirka' },
                    { key: 'id', label: 'Student ID' },
                    { key: 'name', label: 'Full Name / Magaca' },
                    { key: 'gender', label: 'Gender / Jinsiga' },
                    { key: 'class', label: 'Class / Fasalka' },
                    { key: 'guardian', label: 'Guardian / Waalidka' },
                    { key: 'status', label: 'Status / Xaaladda' },
                    { key: 'regDate', label: 'Registration Date' },
                    { key: 'actions', label: 'Quick Actions' }
                  ].map(col => (
                    <label key={col.key} className="flex items-center gap-2 text-[#cccccc] hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={(visibleColumns as any)[col.key]}
                        onChange={(e) => setVisibleColumns({ ...visibleColumns, [col.key]: e.target.checked })}
                        className="rounded border-[#ffffff20] text-[#7c3aed] focus:ring-0"
                      />
                      <span className="text-[11px]">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageHeader>

      {/* 2. STANDARDIZED METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Guud ahaan Ardayda"
          value={counts.total}
          subtitle="Diiwaanka Guud ee Dugsiga"
          icon={Users}
          variant="default"
          onClick={() => onNavigateSubSection('all')}
        />
        <MetricCard
          title="Ardayda Firfircoon"
          value={counts.active}
          subtitle={`${counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 100}% ee ardayda guud`}
          icon={UserCheck}
          variant="success"
          onClick={() => onNavigateSubSection('active')}
        />
        <MetricCard
          title="Joojiyey / Fasax"
          value={counts.inactive}
          subtitle="Waxbarasho kumeelgaar hakad"
          icon={AlertCircle}
          variant="warning"
          onClick={() => onNavigateSubSection('inactive')}
        />
        <MetricCard
          title="Ardayda Kaydsan"
          value={counts.archived}
          subtitle="Qalin-jabisay ama wareegay"
          icon={Archive}
          variant="default"
          onClick={() => onNavigateSubSection('archived')}
        />
      </div>

      {/* 3. SEARCH & FILTER BAR WITH CHIPS */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Raadi magac, ID, fasal, waalid, ama telefoon..."
        activeFilterChips={activeFilterChips}
        onClearAllFilters={handleClearAllFilters}
        filteredResultsCount={filteredStudents.length}
        totalResultsCount={students.length}
        resultLabel="arday"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dedicated Filter Drawer Trigger */}
          <button
            onClick={() => setShowFiltersDrawer(true)}
            className={`px-3 py-1.5 rounded-sm border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeFilterChips.length > 0
                ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white'
                : 'bg-[#0a0a0a] border-[#ffffff15] text-[#a3a3a3] hover:text-white hover:border-[#ffffff30]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#c4b5fd]" />
            <span>Shaandhada (Filters)</span>
            {activeFilterChips.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#7c3aed] text-white text-[10px] flex items-center justify-center font-mono font-bold">
                {activeFilterChips.length}
              </span>
            )}
          </button>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="name_asc">Magaca: A - Z</option>
            <option value="name_desc">Magaca: Z - A</option>
            <option value="date_desc">Taariikhda: Cusub</option>
            <option value="date_asc">Taariikhda: Hore</option>
            <option value="class">Fasalka (Class)</option>
          </select>
        </div>
      </FilterBar>

      {/* FILTER DRAWER SLIDE-OVER */}
      {showFiltersDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setShowFiltersDrawer(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#0f0f0f] border-l border-[#ffffff15] shadow-2xl flex flex-col justify-between">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#ffffff10] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#f5f5f5] flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#c4b5fd]" />
                    <span>Shaandhada Ardayda (Filter Students)</span>
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Hagaaji shuruudaha si aad u hesho arday gaar ah.
                  </p>
                </div>
                <button
                  onClick={() => setShowFiltersDrawer(false)}
                  className="p-1.5 rounded-sm text-[#737373] hover:text-white hover:bg-[#ffffff10]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Filter Controls */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* 1. Class Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                    Fasalka (Academic Class)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedClassFilter('all')}
                      className={`px-3 py-2 rounded-sm text-xs text-left transition-colors border ${
                        selectedClassFilter === 'all'
                          ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                          : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                      }`}
                    >
                      Dhammaan Fasallada
                    </button>
                    {classes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassFilter(c.className)}
                        className={`px-3 py-2 rounded-sm text-xs text-left transition-colors border truncate ${
                          selectedClassFilter === c.className
                            ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                            : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                        }`}
                      >
                        {c.className}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Status Filter (Only in 'all' mode) */}
                {mode === 'all' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                      Xaaladda Waxbarasho (Status)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'active', label: 'Firfircoon' },
                        { id: 'inactive', label: 'Joojiyey' },
                        { id: 'archived', label: 'Kaydsan' },
                      ].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setSelectedStatusFilter(st.id)}
                          className={`px-3 py-2 rounded-sm text-xs text-center border transition-colors ${
                            selectedStatusFilter === st.id
                              ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                              : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Gender Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                    Jinsiga (Gender)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'Dhammaan' },
                      { id: 'Male', label: 'Lab (Male)' },
                      { id: 'Female', label: 'Dhedig (Female)' },
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGenderFilter(g.id)}
                        className={`px-3 py-2 rounded-sm text-xs text-center border transition-colors ${
                          selectedGenderFilter === g.id
                            ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                            : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Registration Date Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider block">
                    Wakhtiga Diiwaangelinta (Date Preset)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Dhammaan Wakhtiga' },
                      { id: 'today', label: 'Maanta Kaliya' },
                      { id: 'month', label: 'Bishan (This Month)' },
                      { id: 'year', label: 'Sannadkan (This Year)' }
                    ].map(dp => (
                      <button
                        key={dp.id}
                        onClick={() => setDateFilterPreset(dp.id as any)}
                        className={`px-3 py-2 rounded-sm text-xs text-center border transition-colors ${
                          dateFilterPreset === dp.id
                            ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-white font-bold'
                            : 'bg-[#0a0a0a] border-[#ffffff10] text-[#a3a3a3] hover:text-white'
                        }`}
                      >
                        {dp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-[#ffffff10] bg-[#0a0a0a] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2.5 rounded-sm border border-[#ffffff10] hover:bg-[#ffffff05] text-xs font-semibold text-[#a3a3a3] hover:text-white cursor-pointer"
                >
                  Dib u celi (Reset All)
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersDrawer(false)}
                  className="px-6 py-2.5 rounded-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Dhaqangeli ({filteredStudents.length} Arday)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BULK ACTIONS BAR (When selected) */}
      {selectedStudentIds.length > 0 && (
        <div className="p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-sm flex items-center justify-between flex-wrap gap-2 animate-slide-in">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-mono font-bold text-xs">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs font-semibold text-[#e5e5e5]">
              Arday ayaa la xushay (Selected students)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkTargetClass(classes[0]?.className || '');
                setBulkActionModal({ isOpen: true, action: 'change_class' });
              }}
              className="px-2.5 py-1.5 bg-[#0a0a0a] border border-[#ffffff15] hover:border-[#7c3aed] text-xs rounded-sm text-[#e5e5e5] transition-colors"
            >
              Beddel Fasalka (Change Class)
            </button>

            <button
              onClick={() => {
                setBulkTargetStatus('active');
                setBulkActionModal({ isOpen: true, action: 'change_status' });
              }}
              className="px-2.5 py-1.5 bg-[#0a0a0a] border border-[#ffffff15] hover:border-[#7c3aed] text-xs rounded-sm text-[#e5e5e5] transition-colors"
            >
              Beddel Xaaladda (Status)
            </button>

            {mode !== 'archived' && (
              <button
                onClick={() => setBulkActionModal({ isOpen: true, action: 'archive' })}
                className="px-2.5 py-1.5 bg-[#0a0a0a] border border-[#ffffff15] hover:border-slate-400 text-xs rounded-sm text-slate-300 transition-colors"
              >
                Kaydi (Archive)
              </button>
            )}

            <button
              onClick={() => setBulkActionModal({ isOpen: true, action: 'delete' })}
              className="px-2.5 py-1.5 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/40 text-xs rounded-sm text-rose-300 transition-colors"
            >
              Tirtir (Delete)
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="p-1 text-[#888888] hover:text-white"
              title="Dami xulashada"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. STUDENTS LISTING (TABLE OR CARDS) */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Wax arday ah lama helin (No Students Found)"
          description={
            searchQuery || selectedClassFilter !== 'all' || selectedGenderFilter !== 'all' || (mode === 'all' && selectedStatusFilter !== 'all')
              ? 'Wax xog ah kuma haboona shaandhayntaada. Isku day inaad bedesho ama nadiifiso shaandhada.'
              : mode === 'archived'
              ? 'Weli ma jiraan arday kaydsan.'
              : mode === 'inactive'
              ? 'Ma jiraan arday hadda hakiyey waxbarashada.'
              : 'Weli ma aadan diiwaangelin wax arday ah. Guji badhanka hoose si aad arday ugu darto.'
          }
          action={
            searchQuery || selectedClassFilter !== 'all' || selectedGenderFilter !== 'all' || (mode === 'all' && selectedStatusFilter !== 'all')
              ? {
                  label: 'Nadiifi Shaandhada (Clear Filters)',
                  icon: RotateCcw,
                  onClick: handleClearAllFilters
                }
              : {
                  label: 'Ku dar Arday Cusub',
                  icon: UserPlus,
                  onClick: () => onNavigateSubSection('add')
                }
          }
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0a0a0a] border-b border-[#ffffff10] text-[10px] uppercase font-mono tracking-wider text-[#888888]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-[#ffffff20] text-[#7c3aed] focus:ring-0"
                    />
                  </th>
                  {(visibleColumns.name || (visibleColumns as any).identity) && (
                    <th className="py-3 px-4 min-w-[220px]">Ardayga (Student Identity)</th>
                  )}
                  {visibleColumns.gender && <th className="py-3 px-3">Jinsiga</th>}
                  {visibleColumns.class && <th className="py-3 px-3">Fasalka</th>}
                  {visibleColumns.guardian && <th className="py-3 px-3">Xiriirka Waalidka</th>}
                  {visibleColumns.status && <th className="py-3 px-3">Xaaladda</th>}
                  {visibleColumns.regDate && <th className="py-3 px-3">Diiwaangelin</th>}
                  {visibleColumns.actions && <th className="py-3 px-3 text-right">Hawlaha</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff08] text-[#cccccc]">
                {paginatedStudents.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-[#ffffff03] transition-colors ${
                        isSelected ? 'bg-[#7c3aed]/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(student.id)}
                          className="rounded border-[#ffffff20] text-[#7c3aed] focus:ring-0"
                        />
                      </td>

                      {/* UNIFIED STUDENT IDENTITY BLOCK */}
                      {(visibleColumns.name || (visibleColumns as any).identity) && (
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => onSelectStudentProfile(student)}
                              className="w-10 h-10 rounded-sm overflow-hidden bg-[#7c3aed]/10 border border-[#7c3aed]/25 flex items-center justify-center font-bold text-xs font-mono text-[#c4b5fd] shrink-0 hover:border-[#7c3aed] transition-colors"
                              title="Arag Profile-ka"
                            >
                              {student.photo ? (
                                <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                              ) : (
                                (student.fullName || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                              )}
                            </button>
                            <div className="min-w-0">
                              <button
                                onClick={() => onSelectStudentProfile(student)}
                                className="font-bold text-xs sm:text-sm text-[#f5f5f5] hover:text-[#c4b5fd] transition-colors text-left truncate block leading-tight max-w-[200px] sm:max-w-xs"
                              >
                                {student.fullName}
                              </button>
                              <div className="text-[11px] text-[#737373] font-mono flex items-center gap-1.5 mt-0.5">
                                <span>{student.id}</span>
                                <span>•</span>
                                <span className="text-[#a3a3a3] font-sans font-medium">{student.class}</span>
                                {student.section && <span>({student.section})</span>}
                                {student.rollNumber && <span className="text-[#888888]">#{student.rollNumber}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Gender */}
                      {visibleColumns.gender && (
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase ${
                            student.gender === 'Female'
                              ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                              : 'bg-blue-950/40 text-blue-400 border border-blue-800/30'
                          }`}>
                            {student.gender || 'Male'}
                          </span>
                        </td>
                      )}

                      {/* Class */}
                      {visibleColumns.class && (
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#e5e5e5] px-2 py-0.5 rounded-sm bg-[#ffffff05] border border-[#ffffff10] text-[11px]">
                            {student.class}
                          </span>
                          {student.section && (
                            <span className="ml-1 text-[10px] text-[#888888] font-mono">Sec: {student.section}</span>
                          )}
                        </td>
                      )}

                      {/* Guardian */}
                      {visibleColumns.guardian && (
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {student.guardianName && (
                              <p className="text-[#d4d4d4] text-[11px] font-medium truncate max-w-[140px]">{student.guardianName}</p>
                            )}
                            {student.guardianPhone ? (
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#a3a3a3]">
                                <span>{student.guardianPhone}</span>
                                <a
                                  href={`https://wa.me/${student.guardianPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300"
                                  title="Fariin WhatsApp u dir"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[#525252] text-[10px]">-</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="py-3 px-3">
                          <StatusBadge status={student.status || 'active'} size="sm" />
                        </td>
                      )}

                      {/* Registration Date */}
                      {visibleColumns.regDate && (
                        <td className="py-3 px-3 font-mono text-[11px] text-[#888888]">
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </td>
                      )}

                      {/* Quick Actions */}
                      {visibleColumns.actions && (
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* View Profile */}
                            <button
                              onClick={() => onSelectStudentProfile(student)}
                              className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-[#c4b5fd] hover:bg-[#ffffff05] transition-colors"
                              title="Arag Profile-ka (View Profile)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Student */}
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 rounded-sm text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05] transition-colors"
                              title="Wax ka beddel (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Status actions based on current status */}
                            {student.status === 'active' ? (
                              <>
                                <button
                                  onClick={() => handleQuickStatusChange(student, 'inactive')}
                                  className="p-1.5 rounded-sm text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40 transition-colors"
                                  title="Jooji (Mark Inactive)"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(student, 'archived')}
                                  className="p-1.5 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                                  title="Kaydi (Archive Student)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : student.status === 'inactive' ? (
                              <>
                                <button
                                  onClick={() => handleQuickStatusChange(student, 'active')}
                                  className="p-1.5 rounded-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                                  title="Dib u hawlgeli (Reactivate)"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(student, 'archived')}
                                  className="p-1.5 rounded-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                                  title="Kaydi (Archive)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              /* Archived: 1-click restore */
                              <button
                                onClick={() => handleQuickStatusChange(student, 'active')}
                                className="p-1.5 rounded-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                                title="Ka soo celi kaydka (Restore to Active)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Student */}
                            <button
                              onClick={() => setDeleteConfirmStudent(student)}
                              className="p-1.5 rounded-sm text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                              title="Tirtir (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW (Great for mobile & tablets) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={`bg-[#0f0f0f] border rounded-sm p-4 space-y-3 transition-all ${
                  isSelected ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-[#ffffff10] hover:border-[#ffffff20]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(student.id)}
                      className="rounded border-[#ffffff20] text-[#7c3aed] focus:ring-0 shrink-0"
                    />
                    <div className="w-10 h-10 rounded-sm overflow-hidden bg-[#7c3aed]/10 border border-[#7c3aed]/25 flex items-center justify-center font-bold text-xs font-mono text-[#c4b5fd] shrink-0">
                      {student.photo ? (
                        <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                      ) : (
                        (student.fullName || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => onSelectStudentProfile(student)}
                        className="font-bold text-sm text-[#f5f5f5] hover:text-[#c4b5fd] text-left truncate block leading-tight"
                      >
                        {student.fullName}
                      </button>
                      <div className="text-[11px] font-mono text-[#737373] flex items-center gap-1.5 mt-0.5">
                        <span>{student.id}</span>
                        <span>•</span>
                        <span className="text-[#a3a3a3] font-sans font-medium">{student.class}</span>
                        {student.rollNumber && <span className="text-[#888888]">#{student.rollNumber}</span>}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={student.status || 'active'} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-[#ffffff08]">
                  <div>
                    <span className="text-[9px] text-[#737373] block uppercase tracking-wider">Jinsiga</span>
                    <span className="text-xs text-[#d4d4d4] font-medium">{student.gender || 'Male'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#737373] block uppercase tracking-wider">Waalidka</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#a3a3a3]">
                      <span className="truncate">{student.guardianPhone || '-'}</span>
                      {student.guardianPhone && (
                        <a
                          href={`https://wa.me/${student.guardianPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 shrink-0"
                          title="WhatsApp"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick actions on card footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#ffffff05]">
                  <button
                    onClick={() => onSelectStudentProfile(student)}
                    className="text-[11px] font-bold text-[#c4b5fd] hover:underline flex items-center gap-1"
                  >
                    <span>Arag Profile</span>
                    <Eye className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="p-1 rounded-sm text-[#a3a3a3] hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {student.status === 'inactive' || student.status === 'archived' ? (
                      <button
                        onClick={() => handleQuickStatusChange(student, 'active')}
                        className="p-1 rounded-sm text-emerald-400 hover:text-emerald-300"
                        title="Reactivate"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatusChange(student, 'inactive')}
                        className="p-1 rounded-sm text-amber-400 hover:text-amber-300"
                        title="Mark Inactive"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmStudent(student)}
                      className="p-1 rounded-sm text-rose-400 hover:text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION CONTROLS */}
      {filteredStudents.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-[#888888]">
            <span>
              Muujinaya <strong className="text-[#e5e5e5] font-mono">{Math.min(filteredStudents.length, (currentPage - 1) * pageSize + 1)}</strong> - <strong className="text-[#e5e5e5] font-mono">{Math.min(filteredStudents.length, currentPage * pageSize)}</strong> ee <strong className="text-[#e5e5e5] font-mono">{filteredStudents.length}</strong> arday
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px]">Boggii:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] text-xs font-mono"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-[#cccccc] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Hore</span>
            </button>

            <span className="px-3 py-1.5 font-mono text-[#c4b5fd] font-bold">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-[#cccccc] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Xiga</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: QUICK EDIT STUDENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#f5f5f5]">Wax ka beddel Ardayga</h3>
                <p className="text-[11px] text-[#737373] font-mono">ID: {editingStudent.id}</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Magaca Buuxa *</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Fasalka *</label>
                  <select
                    value={editFormData.class}
                    onChange={(e) => setEditFormData({ ...editFormData, class: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.className}>{c.className}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Jinsiga</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Male">Lab (Male)</option>
                    <option value="Female">Dhedig (Female)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Telefoonka Waalidka</label>
                  <input
                    type="text"
                    value={editFormData.guardianPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Magaca Waalidka</label>
                  <input
                    type="text"
                    value={editFormData.guardianName}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Xaaladda (Status)</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="active">Firfircoon (Active)</option>
                  <option value="inactive">Joojiyey (Inactive)</option>
                  <option value="archived">Kaydsan (Archived)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ffffff10]">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3 py-2 rounded-sm border border-[#ffffff10] text-[#888888] hover:text-white"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold tracking-wider uppercase text-[11px] disabled:opacity-50"
                >
                  {editSubmitting ? 'Kaydinaya...' : 'Kaydi Isbeddelka'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmStudent)}
        title="Xaqiiji Tirtirista Ardayga"
        subtitle="Permanently Delete Student"
        message={
          deleteConfirmStudent
            ? `Ma hubtaa inaad tirtirto ardayga ${deleteConfirmStudent.fullName} (ID: ${deleteConfirmStudent.id})? Tani waxay tirtiri doontaa dhammaan xogtiisa la xiriirta (biilasha, xaadirinta, iyo imtixaannada).`
            : ''
        }
        confirmLabel="Haa, Tirtir"
        cancelLabel="Ka Noqo (Cancel)"
        variant="danger"
        isLoading={deleteSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmStudent(null)}
      />

      {/* MODAL 3: BULK ACTION MODAL */}
      {bulkActionModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#ffffff10] pb-3">
              <h3 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider">
                Hawlgal Wadajir ah ({selectedStudentIds.length} Arday)
              </h3>
              <button onClick={() => setBulkActionModal({ isOpen: false, action: null })} className="text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkActionModal.action === 'change_class' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#a3a3a3]">
                  Dooro fasalka aad u wareejinayso dhammaan {selectedStudentIds.length} arday ee la xushay:
                </p>
                <select
                  value={bulkTargetClass}
                  onChange={(e) => setBulkTargetClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5]"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkActionModal.action === 'change_status' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#a3a3a3]">
                  Dooro xaaladda cusub ee aad u yeelayso {selectedStudentIds.length} arday ee la xushay:
                </p>
                <select
                  value={bulkTargetStatus}
                  onChange={(e) => setBulkTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-[#e5e5e5]"
                >
                  <option value="active">Firfircoon (Active)</option>
                  <option value="inactive">Joojiyey (Inactive)</option>
                  <option value="archived">Kaydsan (Archived)</option>
                </select>
              </div>
            )}

            {bulkActionModal.action === 'archive' && (
              <div className="space-y-2 text-xs text-[#cccccc]">
                <p>
                  Ma hubtaa inaad kaydiso {selectedStudentIds.length} arday ee la xushay?
                </p>
                <p className="text-[#888888] text-[11px]">
                  Ardayda kaydsan kuma muuqan doonaan liiska maalinlaha ah laakiin xogtooda waa la xafidayaa.
                </p>
              </div>
            )}

            {bulkActionModal.action === 'delete' && (
              <div className="space-y-2 text-xs text-rose-300">
                <p className="font-bold">
                  Digniin: Waxaad tirtiraysaa {selectedStudentIds.length} arday!
                </p>
                <p className="text-[#888888] text-[11px]">
                  Hawlgalkaan dib looma celin karo.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ffffff10] text-xs">
              <button
                type="button"
                onClick={() => setBulkActionModal({ isOpen: false, action: null })}
                className="px-3 py-2 rounded-sm border border-[#ffffff10] text-[#888888] hover:text-white"
              >
                Ka Noqo
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkAction}
                disabled={bulkOperating}
                className="px-4 py-2 rounded-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold uppercase text-[10px] tracking-wider disabled:opacity-50"
              >
                {bulkOperating ? 'Fulinaya...' : 'Xaqiiji Hawlgalka'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
