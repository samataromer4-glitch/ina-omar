import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Phone, 
  Mail, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Command,
  BookOpen,
  Calendar,
  Building,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import { Student, Teacher, StaffMember } from '../types';

interface GlobalHeaderSearchProps {
  students: Student[];
  teachers: Teacher[];
  staff: StaffMember[];
  onSelectStudent: (student: Student) => void;
  onSelectTeacher?: (teacher: Teacher) => void;
  onSelectStaff?: (staff: StaffMember) => void;
  onNavigateTab?: (tab: string) => void;
}

type SearchCategory = 'all' | 'students' | 'teachers' | 'staff';

export const GlobalHeaderSearch: React.FC<GlobalHeaderSearchProps> = ({
  students = [],
  teachers = [],
  staff = [],
  onSelectStudent,
  onSelectTeacher,
  onSelectStaff,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Selected item for quick detail modal
  const [detailItem, setDetailItem] = useState<{
    type: 'teacher' | 'staff';
    data: Teacher | StaffMember;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for Cmd+K or Ctrl+K to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        students: [],
        teachers: [],
        staff: [],
        totalCount: 0
      };
    }

    const tokens = q.split(/\s+/).filter(Boolean);

    const matchTokens = (targetString: string) => {
      const lower = targetString.toLowerCase();
      return tokens.every(token => lower.includes(token));
    };

    // Filter students
    const matchedStudents = (students || []).filter(s => {
      if (!s) return false;
      const searchTarget = `${s.fullName || ''} ${s.rollNumber || ''} ${s.class || ''} ${s.guardianPhone || ''} ${s.guardianName || ''} ${s.gender || ''} ${s.address || ''}`;
      return matchTokens(searchTarget);
    });

    // Filter teachers
    const matchedTeachers = (teachers || []).filter(t => {
      if (!t) return false;
      const classesJoined = (t.assignedClasses || []).join(' ');
      const subjectsJoined = (t.assignedSubjects || []).join(' ');
      const searchTarget = `${t.name || ''} ${t.teacherId || ''} ${t.phone || ''} ${t.email || ''} ${t.specialization || ''} ${t.qualification || ''} ${classesJoined} ${subjectsJoined}`;
      return matchTokens(searchTarget);
    });

    // Filter staff
    const matchedStaff = (staff || []).filter(st => {
      if (!st) return false;
      const searchTarget = `${st.name || ''} ${st.employeeId || ''} ${st.role || ''} ${st.department || ''} ${st.phone || ''} ${st.email || ''}`;
      return matchTokens(searchTarget);
    });

    return {
      students: matchedStudents,
      teachers: matchedTeachers,
      staff: matchedStaff,
      totalCount: matchedStudents.length + matchedTeachers.length + matchedStaff.length
    };
  }, [query, students, teachers, staff]);

  // Flatten active results for keyboard navigation
  const flatResults = useMemo(() => {
    const items: Array<{
      id: string;
      category: 'student' | 'teacher' | 'staff';
      data: any;
    }> = [];

    if (activeCategory === 'all' || activeCategory === 'students') {
      filteredResults.students.slice(0, 10).forEach(s => {
        items.push({ id: `student-${s.id}`, category: 'student', data: s });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'teachers') {
      filteredResults.teachers.slice(0, 10).forEach(t => {
        items.push({ id: `teacher-${t.id}`, category: 'teacher', data: t });
      });
    }

    if (activeCategory === 'all' || activeCategory === 'staff') {
      filteredResults.staff.slice(0, 10).forEach(st => {
        items.push({ id: `staff-${st.id}`, category: 'staff', data: st });
      });
    }

    return items;
  }, [filteredResults, activeCategory]);

  // Reset selectedIndex when results or category change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelectItem = (item: { category: 'student' | 'teacher' | 'staff'; data: any }) => {
    setIsOpen(false);
    if (item.category === 'student') {
      onSelectStudent(item.data);
    } else if (item.category === 'teacher') {
      if (onSelectTeacher) {
        onSelectTeacher(item.data);
      } else {
        setDetailItem({ type: 'teacher', data: item.data });
      }
    } else if (item.category === 'staff') {
      if (onSelectStaff) {
        onSelectStaff(item.data);
      } else {
        setDetailItem({ type: 'staff', data: item.data });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) {
      if (e.key === 'ArrowDown' && query.trim()) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectItem(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search Input Box */}
      <div 
        className={`relative flex items-center w-full rounded-sm transition-all duration-200 ${
          isOpen
            ? 'bg-[#0f0f0f] border border-[#7c3aed] ring-1 ring-[#7c3aed]/40 shadow-lg shadow-[#7c3aed]/5'
            : 'bg-[#0f0f0f]/90 hover:bg-[#141414] border border-[#ffffff15] hover:border-[#ffffff25]'
        }`}
      >
        <div className="pl-3.5 pr-2 flex items-center justify-center text-[#737373] pointer-events-none">
          <Search className="w-4 h-4 text-[#a3a3a3]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Raadi ardayda, macallimiinta, ama shaqaalaha..."
          className="w-full bg-transparent py-2.5 pr-20 text-xs text-[#f5f5f5] placeholder-[#737373] focus:outline-none tracking-wide"
        />

        {/* Right side controls (Clear and Shortcut Badge) */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-sm text-[#737373] hover:text-[#f5f5f5] hover:bg-[#ffffff10] transition-colors"
              title="Nadiifi baaritaanka"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#ffffff08] border border-[#ffffff10] text-[10px] font-mono text-[#737373]">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Results / Command Palette */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#0f0f0f] border border-[#ffffff15] rounded-sm shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in max-h-[80vh] flex flex-col">
          {/* Filter Category Tabs */}
          <div className="flex items-center gap-1 p-2 bg-[#0a0a0a] border-b border-[#ffffff10] overflow-x-auto text-[11px] font-medium shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]'
              }`}
            >
              <span>Dhammaan (All)</span>
              {query.trim() && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                  {filteredResults.totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('students')}
              className={`px-3 py-1 rounded-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'students'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Ardayda ({filteredResults.students.length || students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('teachers')}
              className={`px-3 py-1 rounded-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'teachers'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Macallimiinta ({filteredResults.teachers.length || teachers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('staff')}
              className={`px-3 py-1 rounded-sm transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeCategory === 'staff'
                  ? 'bg-[#7c3aed] text-white font-semibold'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#ffffff05]'
              }`}
            >
              <Briefcase className="w-3 h-3" />
              <span>Shaqaalaha ({filteredResults.staff.length || staff.length})</span>
            </button>
          </div>

          {/* Results List Area */}
          <div className="overflow-y-auto p-2 space-y-3 flex-1 max-h-[420px]">
            {/* When Query is Empty: Quick Guide / Overview */}
            {!query.trim() && (
              <div className="py-6 px-4 text-center">
                <p className="text-xs font-semibold text-[#e5e5e5] mb-1">
                  Qor magac, lambar roll, ID, taleefan, ama fasal
                </p>
                <p className="text-[11px] text-[#737373] max-w-sm mx-auto mb-4">
                  Maamuluhu wuxuu si degdeg ah u dhex baari karaa dhammaan ardayda ({students.length}), macallimiinta ({teachers.length}), iyo shaqaalaha ({staff.length}).
                </p>
                <div className="grid grid-cols-3 gap-2 text-left pt-2 max-w-md mx-auto">
                  <div 
                    onClick={() => {
                      setActiveCategory('students');
                      inputRef.current?.focus();
                    }}
                    className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] hover:border-[#7c3aed]/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c4b5fd] mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Ardayda</span>
                    </div>
                    <span className="text-[10px] text-[#737373] font-mono">{students.length} Arday</span>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveCategory('teachers');
                      inputRef.current?.focus();
                    }}
                    className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] hover:border-[#7c3aed]/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 mb-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Macallimiin</span>
                    </div>
                    <span className="text-[10px] text-[#737373] font-mono">{teachers.length} Macallin</span>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveCategory('staff');
                      inputRef.current?.focus();
                    }}
                    className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] hover:border-[#7c3aed]/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Shaqaale</span>
                    </div>
                    <span className="text-[10px] text-[#737373] font-mono">{staff.length} Shaqaale</span>
                  </div>
                </div>
              </div>
            )}

            {/* When Query is Entered but No Results */}
            {query.trim() && flatResults.length === 0 && (
              <div className="py-8 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-[#737373] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-[#e5e5e5] mb-1">
                  Lama helin wax u dhigma "{query}"
                </p>
                <p className="text-[11px] text-[#737373]">
                  Hubi higgaadda magaca ama isku day inaad raadiso lambarka taleefanka, fasalka, ama aqoonsiga.
                </p>
              </div>
            )}

            {/* Render Category: Students */}
            {(activeCategory === 'all' || activeCategory === 'students') && filteredResults.students.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#a3a3a3]">
                  <span className="flex items-center gap-1.5 text-[#c4b5fd]">
                    <Users className="w-3 h-3" /> Ardayda ({filteredResults.students.length})
                  </span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('students');
                      }}
                      className="text-[10px] lowercase hover:text-white transition-colors flex items-center gap-0.5"
                    >
                      arag dhammaan <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {filteredResults.students.slice(0, activeCategory === 'students' ? 20 : 5).map((student) => {
                    const currentIndex = flatResults.findIndex(r => r.id === `student-${student.id}`);
                    const isSelected = currentIndex === selectedIndex;
                    const initials = (student.fullName || 'Student')
                      .split(' ')
                      .filter(Boolean)
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleSelectItem({ category: 'student', data: student })}
                        className={`p-2.5 rounded-sm flex items-center justify-between cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-[#7c3aed]/15 border-[#7c3aed]/50 text-[#f5f5f5]'
                            : 'bg-[#0a0a0a] hover:bg-[#141414] border-[#ffffff08] text-[#d4d4d4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-sm bg-[#7c3aed]/20 border border-[#7c3aed]/40 flex items-center justify-center text-[#c4b5fd] font-bold text-xs font-mono shrink-0 overflow-hidden">
                            {student.photo ? (
                              <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#f5f5f5] truncate">
                                {student.fullName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-mono bg-[#7c3aed]/20 text-[#c4b5fd] border border-[#7c3aed]/30 shrink-0">
                                {student.class || 'No Class'}
                              </span>
                              {student.status && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-xs uppercase font-mono shrink-0 ${
                                  student.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {student.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#737373] mt-0.5 truncate">
                              {student.rollNumber && <span>Roll: #{student.rollNumber}</span>}
                              {student.guardianPhone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-2.5 h-2.5" /> {student.guardianPhone}
                                </span>
                              )}
                              {student.guardianName && <span>Waalid: {student.guardianName}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-[#737373] shrink-0 pl-2">
                          <span className="hidden sm:inline text-[10px] text-[#a3a3a3]">Profile</span>
                          <ChevronRight className="w-4 h-4 text-[#737373]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Category: Teachers */}
            {(activeCategory === 'all' || activeCategory === 'teachers') && filteredResults.teachers.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#a3a3a3]">
                  <span className="flex items-center gap-1.5 text-indigo-300">
                    <GraduationCap className="w-3 h-3" /> Macallimiinta ({filteredResults.teachers.length})
                  </span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('people');
                      }}
                      className="text-[10px] lowercase hover:text-white transition-colors flex items-center gap-0.5"
                    >
                      arag dhammaan <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {filteredResults.teachers.slice(0, activeCategory === 'teachers' ? 20 : 5).map((teacher) => {
                    const currentIndex = flatResults.findIndex(r => r.id === `teacher-${teacher.id}`);
                    const isSelected = currentIndex === selectedIndex;
                    const initials = (teacher.name || 'Teacher')
                      .split(' ')
                      .filter(Boolean)
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={teacher.id}
                        onClick={() => handleSelectItem({ category: 'teacher', data: teacher })}
                        className={`p-2.5 rounded-sm flex items-center justify-between cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500/50 text-[#f5f5f5]'
                            : 'bg-[#0a0a0a] hover:bg-[#141414] border-[#ffffff08] text-[#d4d4d4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-sm bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs font-mono shrink-0 overflow-hidden">
                            {teacher.photo ? (
                              <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#f5f5f5] truncate">
                                {teacher.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                Macallin
                              </span>
                              {teacher.specialization && (
                                <span className="text-[10px] text-[#a3a3a3] truncate">
                                  • {teacher.specialization}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#737373] mt-0.5 truncate">
                              {teacher.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-2.5 h-2.5" /> {teacher.phone}
                                </span>
                              )}
                              {teacher.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" /> {teacher.email}
                                </span>
                              )}
                              {teacher.assignedClasses && teacher.assignedClasses.length > 0 && (
                                <span>Fasallada: {teacher.assignedClasses.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-[#737373] shrink-0 pl-2">
                          <span className="hidden sm:inline text-[10px] text-indigo-300">Faahfaahin</span>
                          <ChevronRight className="w-4 h-4 text-[#737373]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render Category: Staff */}
            {(activeCategory === 'all' || activeCategory === 'staff') && filteredResults.staff.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-[#a3a3a3]">
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <Briefcase className="w-3 h-3" /> Shaqaalaha ({filteredResults.staff.length})
                  </span>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateTab('people');
                      }}
                      className="text-[10px] lowercase hover:text-white transition-colors flex items-center gap-0.5"
                    >
                      arag dhammaan <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {filteredResults.staff.slice(0, activeCategory === 'staff' ? 20 : 5).map((staffMember) => {
                    const currentIndex = flatResults.findIndex(r => r.id === `staff-${staffMember.id}`);
                    const isSelected = currentIndex === selectedIndex;
                    const initials = (staffMember.name || 'Staff')
                      .split(' ')
                      .filter(Boolean)
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={staffMember.id}
                        onClick={() => handleSelectItem({ category: 'staff', data: staffMember })}
                        className={`p-2.5 rounded-sm flex items-center justify-between cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-[#f5f5f5]'
                            : 'bg-[#0a0a0a] hover:bg-[#141414] border-[#ffffff08] text-[#d4d4d4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-sm bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs font-mono shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#f5f5f5] truncate">
                                {staffMember.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                {staffMember.role || 'Staff'}
                              </span>
                              {staffMember.department && (
                                <span className="text-[10px] text-[#a3a3a3] truncate">
                                  • {staffMember.department}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#737373] mt-0.5 truncate">
                              {staffMember.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-2.5 h-2.5" /> {staffMember.phone}
                                </span>
                              )}
                              {staffMember.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" /> {staffMember.email}
                                </span>
                              )}
                              {staffMember.employeeId && (
                                <span className="font-mono">ID: {staffMember.employeeId}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-[#737373] shrink-0 pl-2">
                          <span className="hidden sm:inline text-[10px] text-emerald-300">Faahfaahin</span>
                          <ChevronRight className="w-4 h-4 text-[#737373]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar with Keyboard Shortcuts */}
          <div className="p-2.5 bg-[#0a0a0a] border-t border-[#ffffff10] flex items-center justify-between text-[10px] text-[#737373] font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-xs bg-[#ffffff10] text-[#a3a3a3]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded-xs bg-[#ffffff10] text-[#a3a3a3]">↓</kbd>
                <span>Dooro</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-xs bg-[#ffffff10] text-[#a3a3a3]">↵</kbd>
                <span>Fur</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded-xs bg-[#ffffff10] text-[#a3a3a3]">esc</kbd>
                <span>Xir</span>
              </span>
            </div>
            <span>Global Admin Search</span>
          </div>
        </div>
      )}

      {/* Quick Preview Detail Modal for Teacher or Staff */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff15] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setDetailItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:text-white hover:bg-[#ffffff08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {detailItem.type === 'teacher' ? (
              // Teacher Detail View
              (() => {
                const t = detailItem.data as Teacher;
                const initials = (t.name || 'Teacher')
                  .split(' ')
                  .filter(Boolean)
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-sm bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-lg font-mono shrink-0 overflow-hidden">
                        {t.photo ? (
                          <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#f5f5f5] truncate">{t.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Macallin
                          </span>
                        </div>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">
                          {t.specialization || 'Takhasus guud'} • {t.qualification || 'Degree'}
                        </p>
                        <p className="text-[11px] font-mono text-[#737373] mt-0.5">
                          ID: {t.teacherId || t.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ffffff10] text-xs">
                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Taleefan</span>
                        <a href={`tel:${t.phone}`} className="text-[#f5f5f5] font-mono flex items-center gap-1.5 hover:text-indigo-300">
                          <Phone className="w-3 h-3 text-indigo-400" />
                          <span>{t.phone || 'Lama hayo'}</span>
                        </a>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Email</span>
                        <a href={`mailto:${t.email}`} className="text-[#f5f5f5] truncate flex items-center gap-1.5 hover:text-indigo-300">
                          <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{t.email || 'Lama hayo'}</span>
                        </a>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Xaaladda Shaqada</span>
                        <span className="text-emerald-400 font-medium">
                          {t.employmentStatus || 'Full-Time'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Xisaabta Portal-ka</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs ${
                          t.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {t.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Assigned classes & subjects */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#a3a3a3] block">
                        Fasallada & Maaddooyinka Loo Igmaday
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.assignedClasses && t.assignedClasses.length > 0 ? (
                          (t.assignedClasses || []).map((cls, idx) => (
                            <span key={idx} className="text-xs px-2.5 py-1 rounded-sm bg-[#ffffff08] border border-[#ffffff15] text-[#e5e5e5]">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#737373] italic">Ma jiraan fasallo gaar ah</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff10]">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailItem(null);
                          if (onNavigateTab) onNavigateTab('people');
                        }}
                        className="px-4 py-2 rounded-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Fur Xafiiska Dadka (People)</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Staff Detail View
              (() => {
                const s = detailItem.data as StaffMember;
                const initials = (s.name || 'Staff')
                  .split(' ')
                  .filter(Boolean)
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-sm bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg font-mono shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#f5f5f5] truncate">{s.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {s.role || 'Staff'}
                          </span>
                        </div>
                        <p className="text-xs text-[#a3a3a3] mt-0.5">
                          Waaxda: {s.department || 'General Administration'}
                        </p>
                        <p className="text-[11px] font-mono text-[#737373] mt-0.5">
                          Employee ID: {s.employeeId || s.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#ffffff10] text-xs">
                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Taleefan</span>
                        <a href={`tel:${s.phone}`} className="text-[#f5f5f5] font-mono flex items-center gap-1.5 hover:text-emerald-300">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{s.phone || 'Lama hayo'}</span>
                        </a>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Email</span>
                        <a href={`mailto:${s.email}`} className="text-[#f5f5f5] truncate flex items-center gap-1.5 hover:text-emerald-300">
                          <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{s.email || 'Lama hayo'}</span>
                        </a>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Xaaladda Shaqada</span>
                        <span className="text-emerald-400 font-medium">
                          {s.employmentStatus || 'Full-Time'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff08] space-y-1">
                        <span className="text-[10px] text-[#737373] uppercase font-mono block">Taariikhda Shaqo-gelidda</span>
                        <span className="text-[#a3a3a3] font-mono">
                          {s.hireDate || 'Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ffffff10]">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailItem(null);
                          if (onNavigateTab) onNavigateTab('people');
                        }}
                        className="px-4 py-2 rounded-sm bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Fur Xafiiska Dadka (People)</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};
