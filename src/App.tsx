import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  Save, 
  CheckCircle, 
  Info, 
  Search, 
  X, 
  Download, 
  Upload,
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  Database, 
  Sun, 
  Moon, 
  FileText, 
  Calendar, 
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Archive,
  List,
  Sparkles,
  Mail,
  Lock,
  Copy,
  Terminal,
  Activity,
  BookOpen,
  Award,
  Camera,
  GraduationCap,
  Briefcase,
  UserPlus,
  Package,
  Bell,
  ClipboardList,
  Receipt,
  CreditCard,
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Percent,
  AlertTriangle,
  ClipboardCheck,
  History,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { 
  Student, 
  AttendanceRecord, 
  FeeRecord, 
  SystemSettings, 
  DbStatus, 
  SchoolClass, 
  SchoolSubject, 
  ExamScore,
  Teacher,
  StaffMember,
  Guardian,
  StaffAttendance,
  TimetableSlot,
  Admission,
  LibraryBook,
  LibraryLoan,
  InventoryItem,
  Announcement,
  FinanceSubSection
} from './types';
import ClassesView from './components/ClassesView';
import SubjectsView from './components/SubjectsView';
import ExamsView from './components/ExamsView';
import ReportsView from './components/ReportsView';
import LandingPage from './components/LandingPage';
import PeopleView from './components/PeopleView';
import StaffAttendanceView from './components/StaffAttendanceView';
import TimetableScheduleView from './components/TimetableScheduleView';
import AdmissionsView from './components/AdmissionsView';
import LibraryView from './components/LibraryView';
import InventoryView from './components/InventoryView';
import AnnouncementsView from './components/AnnouncementsView';
import StudentProfileModal from './components/StudentProfileModal';
import StudentsView, { StudentSubSection } from './components/StudentsView';
import { FinanceView } from './components/FinanceView';
import { AttendanceView, AttendanceSubTab } from './components/AttendanceView';
import { TeacherActivationView } from './components/TeacherActivationView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { PWAInstallButton } from './components/PWAInstallButton';
import { GlobalHeaderSearch } from './components/GlobalHeaderSearch';
import { enqueueOfflineAction } from './utils/offlineSync';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Intercept all fetch calls to automatically inject X-School-Email and Authorization token from authenticated user
const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const userStr = localStorage.getItem('dugsiga_auth');
  let schoolEmail = '';
  let token = '';
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      if (u && u.email) schoolEmail = u.email;
      if (u && u.token) token = u.token;
    } catch (e) {}
  }
  
  const headers = new Headers(init?.headers);
  if (schoolEmail) {
    headers.set('X-School-Email', schoolEmail);
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return window.fetch(input, {
    ...init,
    headers,
  });
};

export default function App() {
  // Public Routing State: 'landing' | 'login' | 'signup' | 'dashboard' | 'activate-teacher'
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'signup' | 'dashboard' | 'activate-teacher'>(() => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search;
    if (path.startsWith('/activate-teacher') || search.includes('token=')) return 'activate-teacher';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/dashboard' || path.startsWith('/students')) return 'dashboard';
    return 'landing';
  });

  // Authentication State
  const [user, setUser] = useState<{
    email: string;
    role?: 'admin' | 'teacher' | 'staff';
    schoolId?: string;
    name?: string;
    teacherId?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
    token?: string;
  } | null>(() => {
    const saved = localStorage.getItem('dugsiga_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [authView, setAuthView] = useState<'login' | 'signup'>(() => {
    if (typeof window === 'undefined') return 'login';
    const path = window.location.pathname.toLowerCase();
    return path === '/signup' ? 'signup' : 'login';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Navigation router handler
  const navigate = (route: 'landing' | 'login' | 'signup' | 'dashboard' | 'activate-teacher') => {
    setCurrentRoute(route);
    if (route === 'login') {
      setAuthView('login');
      window.history.pushState({}, '', '/login');
    } else if (route === 'signup') {
      setAuthView('signup');
      window.history.pushState({}, '', '/signup');
    } else if (route === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (route === 'activate-teacher') {
      // Keep search params if present
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  // App Layout & Tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'students' | 'attendance' | 'fees' | 'reports' | 'settings' | 'classes' | 'subjects' | 'exams' |
    'people' | 'staff_attendance' | 'timetable' | 'admissions' | 'library' | 'inventory' | 'announcements'
  >(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/students')) return 'students';
      const match = [
        'attendance', 'fees', 'reports', 'settings', 'classes', 'subjects', 'exams',
        'people', 'staff_attendance', 'timetable', 'admissions', 'library', 'inventory', 'announcements'
      ].find(t => path === `/${t}` || path === `/${t.replace('_', '-')}`);
      if (match) return match as any;
    }
    return 'dashboard';
  });

  // Student Management Subsection state
  const [studentSubSection, setStudentSubSection] = useState<StudentSubSection>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/students/add')) return 'add';
      if (path.startsWith('/students/active')) return 'active';
      if (path.startsWith('/students/inactive')) return 'inactive';
      if (path.startsWith('/students/archived')) return 'archived';
      if (path.startsWith('/students/import')) return 'import';
      if (path.startsWith('/students/export')) return 'export';
    }
    return 'all';
  });

  const [studentsMenuExpanded, setStudentsMenuExpanded] = useState<boolean>(true);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/students/')) {
        const seg = path.split('/')[2];
        if (seg && !['add', 'active', 'inactive', 'archived', 'import', 'export', 'all'].includes(seg.toLowerCase())) {
          return seg;
        }
      }
    }
    return null;
  });

  const navigateStudentSubSection = (sub: StudentSubSection) => {
    setActiveTab('students');
    setStudentSubSection(sub);
    setSelectedStudentProfileId(null);
    setStudentsMenuExpanded(true);
    const targetUrl = sub === 'all' ? '/students' : `/students/${sub}`;
    window.history.pushState({}, '', targetUrl);
  };

  const [financeSubSection, setFinanceSubSection] = useState<FinanceSubSection>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/finance/fee-structures')) return 'fee-structures';
      if (path.startsWith('/finance/invoices')) return 'invoices';
      if (path.startsWith('/finance/payments')) return 'payments';
      if (path.startsWith('/finance/outstanding')) return 'outstanding';
      if (path.startsWith('/finance/discounts')) return 'discounts';
      if (path.startsWith('/finance/expenses')) return 'expenses';
      if (path.startsWith('/finance/refunds')) return 'refunds';
      if (path.startsWith('/finance/receipts')) return 'receipts';
      if (path.startsWith('/finance/reports')) return 'reports';
      if (path.startsWith('/finance')) return 'dashboard';
    }
    return 'dashboard';
  });
  const [financeMenuExpanded, setFinanceMenuExpanded] = useState<boolean>(true);

  const navigateFinanceSubSection = (sub: FinanceSubSection) => {
    setActiveTab('fees');
    setFinanceSubSection(sub);
    setFinanceMenuExpanded(true);
    const targetUrl = sub === 'dashboard' ? '/finance' : `/finance/${sub}`;
    window.history.pushState({}, '', targetUrl);
  };

  const [attendanceSubSection, setAttendanceSubSection] = useState<AttendanceSubTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/attendance/take')) return 'take';
      if (path.startsWith('/attendance/records/today')) return 'records/today';
      if (path.startsWith('/attendance/records/history')) return 'records/history';
      if (path.startsWith('/attendance/records/corrections')) return 'records/corrections';
      if (path.startsWith('/attendance/records') || path.startsWith('/attendance/history')) return 'records';
      if (path.startsWith('/attendance/students/alerts')) return 'students/alerts';
      if (path.startsWith('/attendance/students') || path.startsWith('/attendance/student')) return 'students';
      if (path.startsWith('/attendance/classes/trends')) return 'classes/class_trends';
      if (path.startsWith('/attendance/classes') || path.startsWith('/attendance/class')) return 'classes';
      if (path.startsWith('/attendance/insights/absence')) return 'insights/absence';
      if (path.startsWith('/attendance/insights/late')) return 'insights/late';
      if (path.startsWith('/attendance/insights') || path.startsWith('/attendance/analytics') || path.startsWith('/attendance/late')) return 'insights';
      if (path.startsWith('/attendance/reports/daily')) return 'reports/daily';
      if (path.startsWith('/attendance/reports/student')) return 'reports/student';
      if (path.startsWith('/attendance/reports/class')) return 'reports/class';
      if (path.startsWith('/attendance/reports/monthly')) return 'reports/monthly';
      if (path.startsWith('/attendance/reports')) return 'reports';
      if (path.startsWith('/attendance')) return 'overview';
    }
    return 'overview';
  });
  const [attendanceMenuExpanded, setAttendanceMenuExpanded] = useState<boolean>(true);

  const navigateAttendanceSubSection = (sub: AttendanceSubTab) => {
    setActiveTab('attendance');
    setAttendanceSubSection(sub);
    setAttendanceMenuExpanded(true);
    const targetUrl = sub === 'overview' || sub === 'dashboard' ? '/attendance' : `/attendance/${sub}`;
    window.history.pushState({}, '', targetUrl);
  };

  const handleOpenStudentProfile = (student: Student) => {
    setSelectedStudentProfileId(student.id);
    window.history.pushState({}, '', `/students/${student.id}`);
  };

  const handleCloseStudentProfile = () => {
    setSelectedStudentProfileId(null);
    const targetUrl = studentSubSection === 'all' ? '/students' : `/students/${studentSubSection}`;
    window.history.pushState({}, '', targetUrl);
  };

  const handleNavigateTab = (tabId: any) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (tabId === 'students') {
      setStudentsMenuExpanded(true);
      const targetUrl = studentSubSection === 'all' ? '/students' : `/students/${studentSubSection}`;
      window.history.pushState({}, '', targetUrl);
    } else if (tabId === 'fees') {
      setFinanceMenuExpanded(true);
      const targetUrl = financeSubSection === 'dashboard' ? '/finance' : `/finance/${financeSubSection}`;
      window.history.pushState({}, '', targetUrl);
    } else if (tabId === 'attendance') {
      setAttendanceMenuExpanded(true);
      const targetUrl = attendanceSubSection === 'dashboard' ? '/attendance' : `/attendance/${attendanceSubSection}`;
      window.history.pushState({}, '', targetUrl);
    } else if (tabId === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else {
      window.history.pushState({}, '', `/${tabId.replace('_', '-')}`);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const rawPath = window.location.pathname;
      const search = window.location.search;
      if (path.startsWith('/activate-teacher') || search.includes('token=')) {
        setCurrentRoute('activate-teacher');
      } else if (path === '/login') {
        setCurrentRoute('login');
        setAuthView('login');
      } else if (path === '/signup') {
        setCurrentRoute('signup');
        setAuthView('signup');
      } else if (path.startsWith('/students')) {
        setCurrentRoute('dashboard');
        setActiveTab('students');
        setStudentsMenuExpanded(true);
        if (path === '/students' || path === '/students/' || path === '/students/all') {
          setStudentSubSection('all');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/add') {
          setStudentSubSection('add');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/active') {
          setStudentSubSection('active');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/inactive') {
          setStudentSubSection('inactive');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/archived') {
          setStudentSubSection('archived');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/import') {
          setStudentSubSection('import');
          setSelectedStudentProfileId(null);
        } else if (path === '/students/export') {
          setStudentSubSection('export');
          setSelectedStudentProfileId(null);
        } else {
          const seg = rawPath.split('/')[2];
          if (seg) {
            setStudentSubSection('all');
            setSelectedStudentProfileId(seg);
          }
        }
      } else if (path.startsWith('/finance')) {
        setCurrentRoute('dashboard');
        setActiveTab('fees');
        setFinanceMenuExpanded(true);
        if (path === '/finance' || path === '/finance/' || path === '/finance/dashboard') {
          setFinanceSubSection('dashboard');
        } else if (path === '/finance/fee-structures') {
          setFinanceSubSection('fee-structures');
        } else if (path === '/finance/invoices') {
          setFinanceSubSection('invoices');
        } else if (path === '/finance/payments') {
          setFinanceSubSection('payments');
        } else if (path === '/finance/outstanding') {
          setFinanceSubSection('outstanding');
        } else if (path === '/finance/discounts') {
          setFinanceSubSection('discounts');
        } else if (path === '/finance/expenses') {
          setFinanceSubSection('expenses');
        } else if (path === '/finance/refunds') {
          setFinanceSubSection('refunds');
        } else if (path === '/finance/receipts') {
          setFinanceSubSection('receipts');
        } else if (path === '/finance/reports') {
          setFinanceSubSection('reports');
        } else {
          setFinanceSubSection('dashboard');
        }
      } else if (path.startsWith('/attendance')) {
        setCurrentRoute('dashboard');
        setActiveTab('attendance');
        setAttendanceMenuExpanded(true);
        if (path === '/attendance/take') {
          setAttendanceSubSection('take');
        } else if (path === '/attendance/history') {
          setAttendanceSubSection('history');
        } else if (path === '/attendance/student') {
          setAttendanceSubSection('student');
        } else if (path === '/attendance/class') {
          setAttendanceSubSection('class');
        } else if (path === '/attendance/late' || path === '/attendance/absence') {
          setAttendanceSubSection('late_absence');
        } else if (path === '/attendance/reports' || path === '/attendance/analytics') {
          setAttendanceSubSection('reports');
        } else if (path === '/attendance/settings') {
          setAttendanceSubSection('settings');
        } else {
          setAttendanceSubSection('dashboard');
        }
      } else if (path === '/dashboard') {
        setCurrentRoute('dashboard');
        setActiveTab('dashboard');
      } else {
        const matchingTab = [
          'attendance', 'fees', 'reports', 'settings', 'classes', 'subjects', 'exams',
          'people', 'staff_attendance', 'timetable', 'admissions', 'library', 'inventory', 'announcements'
        ].find(t => path === `/${t}` || path === `/${t.replace('_', '-')}`);

        if (matchingTab) {
          setCurrentRoute('dashboard');
          setActiveTab(matchingTab as any);
        } else if (localStorage.getItem('dugsiga_auth')) {
          setCurrentRoute('dashboard');
        } else {
          setCurrentRoute('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('dugsiga_theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });

  // Core App Data
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [examScores, setExamScores] = useState<ExamScore[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSession, setAttendanceSession] = useState<'before_break' | 'after_break'>('before_break');
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>('All');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'sheet' | 'history'>('sheet');
  const [historyStudentId, setHistoryStudentId] = useState<string>('All');
  const [fees, setFees] = useState<FeeRecord[]>([]);

  // Modernized Module Datasets
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [libraryLoans, setLibraryLoans] = useState<LibraryLoan[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: "Dugsiga Pro 2026",
    currency: "USD",
    feeAmount: 50,
    systemTheme: "light",
    academicYear: "2025/2026",
    schoolEmail: "admin@dugsigapro.edu",
    schoolPhone: "252615000000",
    schoolAddress: "Mogadishu, Somalia",
    passThreshold: 60,
    gradeAThreshold: 90,
    gradeBThreshold: 80,
    gradeCThreshold: 70,
    gradeDThreshold: 60
  });
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Search and Filters
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modals & Forms State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    class: '',
    gender: 'Male',
    guardianPhone: '',
    status: 'active' as 'active' | 'inactive',
    photo: ''
  });

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [feeForm, setFeeForm] = useState({
    studentId: '',
    month: 'January',
    year: new Date().getFullYear(),
    amount: 50,
    paidAmount: 0
  });

  const [showHistoryModal, setShowHistoryModal] = useState<FeeRecord | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const exportStudentsToPDF = () => {
    try {
      const filtered = students.filter(s => 
        s.fullName.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        s.class.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        (s.guardianPhone && s.guardianPhone.includes(searchStudentQuery))
      );

      if (filtered.length === 0) {
        showToast("Ma jiraan arday la dhoofiyo (No students to export)", "warning");
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Bar
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 6, 'F');

      // School info
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(settings.schoolName, 15, 20);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Xafiiska Maamulka & Diiwaangelinta Ardayda', 15, 25);

      // Title
      doc.setTextColor(124, 58, 237);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('LIISKA ARDAYDA', 195, 20, { align: 'right' });
      doc.text('(STUDENT DIRECTORY)', 195, 24, { align: 'right' });

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Taariikhda: ${new Date().toLocaleDateString()}`, 195, 30, { align: 'right' });
      doc.text(`Tirada: ${filtered.length} Arday`, 195, 34, { align: 'right' });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 38, 195, 38);

      // Table
      const tableBody = filtered.map((s, idx) => [
        (idx + 1).toString(),
        s.id,
        s.fullName.toUpperCase(),
        s.class.toUpperCase(),
        s.gender.toUpperCase(),
        s.guardianPhone || 'N/A',
        s.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 43,
        head: [['#', 'Arday ID', 'Magaca Ardayga (Name)', 'Fasalka (Class)', 'Gender', 'Phone', 'Status']],
        body: tableBody,
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'left', fontStyle: 'bold' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' }
        }
      });

      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`${settings.schoolName} - System Generated Official Record`, 105, 282, { align: 'center' });

      doc.save(`Liiska_Ardayda_${settings.schoolName.replace(/\s+/g, '_')}.pdf`);
      showToast("Liiska ardayda waa la dhoofiyey! (Student list exported successfully!)", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Dhoofinta PDF-ka way fashilantay (Failed to export PDF)", "error");
    }
  };

  const exportFeesToPDF = () => {
    try {
      if (fees.length === 0) {
        showToast("Ma jiraan biilal la dhoofiyo (No invoice records to export)", "warning");
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Bar
      doc.setFillColor(16, 185, 129); // emerald Green accent for finance
      doc.rect(0, 0, 210, 6, 'F');

      // School info
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(settings.schoolName, 15, 20);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Xafiiska Maaliyadda & Biilasha', 15, 25);

      // Title
      doc.setTextColor(16, 185, 129);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('LIISKA MAALIYADDA', 195, 20, { align: 'right' });
      doc.text('(FINANCE STATEMENT)', 195, 24, { align: 'right' });

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Taariikhda: ${new Date().toLocaleDateString()}`, 195, 30, { align: 'right' });
      doc.text(`Diiwaanada: ${fees.length} Biilal`, 195, 34, { align: 'right' });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 38, 195, 38);

      // Totals
      const totalInvoiced = fees.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalPaid = fees.reduce((acc, curr) => acc + Number(curr.paidAmount), 0);
      const totalOutstanding = totalInvoiced - totalPaid;

      doc.setFillColor(249, 250, 251);
      doc.rect(15, 43, 180, 16, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.rect(15, 43, 180, 16, 'S');

      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.text('Total Invoiced', 20, 49);
      doc.text('Total Collected', 80, 49);
      doc.text('Outstanding Balance', 140, 49);

      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${settings.currency} ${totalInvoiced.toLocaleString()}`, 20, 55);
      doc.text(`${settings.currency} ${totalPaid.toLocaleString()}`, 80, 55);
      doc.text(`${settings.currency} ${totalOutstanding.toLocaleString()}`, 140, 55);

      // Table
      const tableBody = fees.map((f, idx) => {
        const studentName = students.find(s => s.id === f.studentId)?.fullName || 'Unknown Student';
        const balance = Math.max(0, f.amount - f.paidAmount);
        return [
          (idx + 1).toString(),
          studentName.toUpperCase(),
          `${f.month} ${f.year}`,
          `${settings.currency} ${f.amount}`,
          `${settings.currency} ${f.paidAmount}`,
          `${settings.currency} ${balance}`,
          f.status.toUpperCase()
        ];
      });

      autoTable(doc, {
        startY: 65,
        head: [['#', 'Ardayga (Student Name)', 'Month/Year', 'Invoice', 'Paid', 'Balance', 'Status']],
        body: tableBody,
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'center' }
        }
      });

      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`${settings.schoolName} - System Generated Official Finance Statement`, 105, 282, { align: 'center' });

      doc.save(`Warbixinta_Lacagaha_${settings.schoolName.replace(/\s+/g, '_')}.pdf`);
      showToast("Warbixinta maaliyadda waa la dhoofiyey! (Finance report exported successfully!)", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Dhoofinta PDF-ka way fashilantay (Failed to export PDF)", "error");
    }
  };

  // Setup Theme class on document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dugsiga_theme', theme);
  }, [theme]);

  // Refresh DB diagnostics and fetch system configurations
  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch database status:", e);
    }
  };

  // Fetch all core datasets from server
  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        resStudents, resFees, resSettings, resClasses, resSubjects, resExams,
        resTeachers, resStaff, resGuardians, resTimetable, resAdmissions,
        resBooks, resLoans, resInventory, resAnnouncements, resAttendance
      ] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/fees'),
        fetch('/api/settings'),
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/exams'),
        fetch('/api/teachers'),
        fetch('/api/staff'),
        fetch('/api/guardians'),
        fetch('/api/timetable'),
        fetch('/api/admissions'),
        fetch('/api/library/books'),
        fetch('/api/library/loans'),
        fetch('/api/inventory'),
        fetch('/api/announcements'),
        fetch('/api/attendance')
      ]);

      if (resStudents.ok) setStudents(await resStudents.json());
      if (resFees.ok) setFees(await resFees.json());
      if (resClasses.ok) setClasses(await resClasses.json());
      if (resSubjects.ok) setSubjects(await resSubjects.json());
      if (resExams.ok) setExamScores(await resExams.json());
      if (resTeachers?.ok) setTeachers(await resTeachers.json());
      if (resStaff?.ok) setStaff(await resStaff.json());
      if (resGuardians?.ok) setGuardians(await resGuardians.json());
      if (resTimetable?.ok) setTimetable(await resTimetable.json());
      if (resAdmissions?.ok) setAdmissions(await resAdmissions.json());
      if (resBooks?.ok) setLibraryBooks(await resBooks.json());
      if (resLoans?.ok) setLibraryLoans(await resLoans.json());
      if (resInventory?.ok) setInventory(await resInventory.json());
      if (resAnnouncements?.ok) setAnnouncements(await resAnnouncements.json());
      if (resAttendance?.ok) setAttendance(await resAttendance.json());

      if (resSettings.ok) {
        const s = await resSettings.json();
        setSettings(s);
        // Sync layout theme with saved settings if configured
        if (s.systemTheme) setTheme(s.systemTheme);
      }
    } catch (e) {
      showToast("Xogta laguma soo rari karo serverka", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDateAndSession = async (date: string, session: 'before_break' | 'after_break') => {
    if (!user) return;
    try {
      const res = await fetch(`/api/attendance?date=${date}&session_type=${session}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (e) {
      console.error("Failing to load attendance:", e);
    }
  };

  // Reactively load attendance when date or session type changes
  useEffect(() => {
    if (user) {
      fetchAttendanceForDateAndSession(attendanceDate, attendanceSession);
    }
  }, [user, attendanceDate, attendanceSession]);

  // Fetch data on authentication or refresh
  useEffect(() => {
    fetchDbStatus();
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Fadlan geli email sax ah iyo password.');
      return;
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authView === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          const userWithToken = { ...data.user, token: data.token || data.user?.token };
          localStorage.setItem('dugsiga_auth', JSON.stringify(userWithToken));
          setUser(userWithToken);
          setCurrentRoute('dashboard');
          window.history.pushState({}, '', '/dashboard');
          showToast("Ku soo dhowow Dugsiga Pro!", "success");
        } else {
          setAuthError(data.error || "Login-ku waa fashilmay.");
        }
      } else if (authView === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
          // Auto-login after successful signup with server-generated token
          const userWithToken = { ...data.user, token: data.token || data.user?.token };
          localStorage.setItem('dugsiga_auth', JSON.stringify(userWithToken));
          setUser(userWithToken);
          setCurrentRoute('dashboard');
          window.history.pushState({}, '', '/dashboard');
          showToast("Diiwaangelintu way guuleysatay! Ku soo dhowow Dugsiga Pro!", "success");
        } else {
          setAuthError(data.error || "Signup-ku waa fashilmay.");
        }
      }
    } catch (err) {
      setAuthError("Xiriirka serverka ayaa go'an.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dugsiga_auth');
    setUser(null);
    setAuthView('login');
    setCurrentRoute('landing');
    window.history.pushState({}, '', '/');
    setEmail('');
    setPassword('');
    showToast("Si guul leh ayaad uga baxday (Logged Out)");
  };

  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setStudentForm(prev => ({ ...prev, photo: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Student Operations
  const handleStudentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (classes.length === 0) {
      showToast("Fadlan marka hore samee fasal inta aadan arday ku darin! (Please create a class first!)", "error");
      return;
    }
    if (!studentForm.fullName || !studentForm.class) {
      showToast("Fadlan qor Magaca iyo Class-ka", "warning");
      return;
    }

    setSubmitting(true);
    const payload = editingStudent 
      ? { ...studentForm, id: editingStudent.id, createdAt: editingStudent.createdAt }
      : { 
          ...studentForm, 
          id: 'std-' + Math.random().toString(36).substr(2, 9), 
          createdAt: new Date().toISOString().split('T')[0] 
        };

    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingStudent ? "Xogta ardayga waa la cusbooneysiiyey" : "Arday cusub ayaa lagu daray", "success");
        setShowStudentModal(false);
        setEditingStudent(null);
        setStudentForm({ fullName: '', class: '', gender: 'Male', guardianPhone: '', status: 'active', photo: '' });
        fetchAllData();
      } else {
        const err = await res.json();
        showToast(err.error || "Hawshu way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad ayaa dhacay inta hawshu socotay", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApiAddStudent = async (studentData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Hawshu way fashilantay", "error");
        return false;
      }
    } catch (e: any) {
      enqueueOfflineAction('student', '/api/students', 'POST', studentData);
      setStudents(prev => [studentData, ...prev]);
      showToast("Ardayga waxaa lagu keydiyey Offline Sync Queue", "info");
      return true;
    }
  };

  const handleApiUpdateStudent = async (id: string, updates: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Cusbooneysiintu way fashilantay", "error");
        return false;
      }
    } catch (e: any) {
      enqueueOfflineAction('student', `/api/students/${id}`, 'PUT', updates);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      showToast("Isbeddelka ardayga waxaa lagu keydiyey Offline Queue", "info");
      return true;
    }
  };

  const handleApiDeleteStudent = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllData();
        return true;
      } else {
        showToast("Tirtiriddu way fashilantay", "error");
        return false;
      }
    } catch (e) {
      enqueueOfflineAction('student', `/api/students/${id}`, 'DELETE', { id });
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast("Tirtiridda waxaa lagu keydiyey Offline Queue", "info");
      return true;
    }
  };

  const handleApiBulkUpdate = async (action: string, studentIds: string[], targetValue?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          studentIds,
          targetClass: action === 'change_class' ? targetValue : undefined,
          targetStatus: action === 'change_status' ? targetValue : undefined
        })
      });
      if (res.ok) {
        fetchAllData();
        return true;
      } else {
        const err = await res.json();
        showToast(err.error || "Hawsha bulk way fashilantay", "error");
        return false;
      }
    } catch (e) {
      showToast("Khalad ayaa dhacay fulinta hawsha guud", "error");
      return false;
    }
  };

  const downloadStudentExcelTemplate = () => {
    const sampleRows = [
      {
        "Magaca Ardayga (Full Name)": "Maxamed Cali Jaamac",
        "Fasalka (Class)": classes[0]?.className || "Fasalka 1aad",
        "Lab/Dhedig (Gender - Male/Female)": "Male",
        "Telefoonka Waalidka (Guardian Phone)": "252615123456",
        "Status (active/inactive)": "active"
      },
      {
        "Magaca Ardayga (Full Name)": "Caasho Axmed Nuur",
        "Fasalka (Class)": classes[0]?.className || "Fasalka 1aad",
        "Lab/Dhedig (Gender - Male/Female)": "Female",
        "Telefoonka Waalidka (Guardian Phone)": "252615654321",
        "Status (active/inactive)": "active"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students_Template");
    XLSX.writeFile(wb, "Ardayda_Template.xlsx");
  };

  const handleStudentExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let importedCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          const fullName = row["Magaca Ardayga (Full Name)"] || row["fullName"];
          const className = row["Fasalka (Class)"] || row["class"];
          const gender = row["Lab/Dhedig (Gender - Male/Female)"] || row["gender"] || "Male";
          const guardianPhone = String(row["Telefoonka Waalidka (Guardian Phone)"] || row["guardianPhone"] || "");
          const status = row["Status (active/inactive)"] || row["status"] || "active";

          if (!fullName || !className) {
            errorCount++;
            continue;
          }

          const payload = {
            id: 'std-' + Math.random().toString(36).substr(2, 9),
            fullName,
            class: className,
            gender: gender.toLowerCase().startsWith('f') ? 'Female' : 'Male',
            guardianPhone,
            status: status.toLowerCase() === 'inactive' ? 'inactive' : 'active',
            createdAt: new Date().toISOString().split('T')[0]
          };

          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            importedCount++;
          } else {
            errorCount++;
          }
        }

        showToast(`Soo gelinta waa dhammaatay! ${importedCount} arday ayaa la soo geliyey. ${errorCount} khaladaad.`, "success");
        fetchAllData();
      } catch (err) {
        console.error("Failing to parse student excel:", err);
        showToast("Faylka Excel lama akhrin karo.", "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteStudent = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Tirtir Ardayga",
      message: "Ma hubtaa inaad tirtirto ardaygan iyo dhammaan macluumaadkiisa (lacagaha, xaadirinta)? Tani dib looma soo celin karo.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast("Ardaygii si guul leh ayaa loo tirtiray", "success");
            fetchAllData();
          } else {
            showToast("Tirtiriddu way fashilantay", "error");
          }
        } catch (e) {
          showToast("Khalad ayaa ka dhacay isku xirka", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Attendance Operations
  const handleAttendanceChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    const existingIdx = attendance.findIndex(a => a.date === attendanceDate && a.studentId === studentId && (a.sessionType || 'before_break') === attendanceSession);
    let updatedAttendance = [...attendance];

    if (existingIdx > -1) {
      updatedAttendance[existingIdx] = {
        ...updatedAttendance[existingIdx],
        status,
        timestamp: new Date().toISOString()
      };
    } else {
      updatedAttendance.push({
        date: attendanceDate,
        studentId,
        status,
        timestamp: new Date().toISOString(),
        sessionType: attendanceSession
      });
    }
    setAttendance(updatedAttendance);
  };

  const handleMarkAllAttendance = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    let updatedAttendance = [...attendance];
    const targetStudents = selectedAttendanceClass === 'All' 
      ? activeStudents 
      : activeStudents.filter(s => s.class === selectedAttendanceClass);

    targetStudents.forEach(s => {
      const idx = updatedAttendance.findIndex(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
      if (idx > -1) {
        updatedAttendance[idx] = { ...updatedAttendance[idx], status, timestamp: new Date().toISOString() };
      } else {
        updatedAttendance.push({ 
          date: attendanceDate, 
          studentId: s.id, 
          status, 
          timestamp: new Date().toISOString(),
          sessionType: attendanceSession
        });
      }
    });

    setAttendance(updatedAttendance);
    showToast(`Dhammaan ardayda ${selectedAttendanceClass === 'All' ? 'firfircoon' : 'fasalka ' + selectedAttendanceClass} waxaa loo calaamadeeyey: ${status}`, "info");
  };

  const handleSaveAttendanceSheet = async () => {
    if (submitting) return;
    const activeStudents = students.filter(s => s.status === 'active');
    const recordsToSave = activeStudents.map(s => {
      const record = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
      return {
        studentId: s.id,
        status: record ? record.status : 'Present',
        timestamp: record ? record.timestamp : new Date().toISOString(),
        sessionType: attendanceSession
      };
    });

    if (!navigator.onLine) {
      enqueueOfflineAction('attendance', '/api/attendance', 'POST', { 
        date: attendanceDate, 
        session_type: attendanceSession, 
        records: recordsToSave 
      });
      showToast(`Waxaad ku jirtaa habka Offline-ka! Xaadirinta waxaa lagu keydiyey qalabkaaga, waxaana si toos ah loo sync-gareyn doonaa marka aad online noqoto.`, "info");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date: attendanceDate, 
          session_type: attendanceSession, 
          records: recordsToSave 
        })
      });
      if (res.ok) {
        showToast(`Xaadirinta taariikhda ${attendanceDate} (${attendanceSession === 'before_break' ? 'Break-ka ka Hor' : 'Break-ka ka Dib'}) si guul leh ayaa loo kaydiyey!`, "success");
        fetchAttendanceForDateAndSession(attendanceDate, attendanceSession);
      } else {
        showToast("Xaadirinta la kaydin kari waayey", "error");
      }
    } catch (e) {
      enqueueOfflineAction('attendance', '/api/attendance', 'POST', { 
        date: attendanceDate, 
        session_type: attendanceSession, 
        records: recordsToSave 
      });
      showToast("Xiriirka server-ka ayaa go'an. Xaadirinta waxaa lagu keydiyey Offline Sync Queue si loogu diro marka xiriirku soo laabto.", "info");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAttendanceSheetModern = async (
    date: string,
    sessionType: string,
    records: { studentId: string; status: any }[]
  ) => {
    const sType = sessionType || 'before_break';
    const recordsToSave = records.map(r => ({
      studentId: r.studentId,
      status: r.status,
      timestamp: new Date().toISOString(),
      sessionType: sType
    }));

    // Optimistic update of local attendance state
    setAttendance(prev => {
      const filtered = prev.filter(
        a => !(a.date === date && (a.sessionType || 'before_break') === sType)
      );
      return [
        ...filtered,
        ...recordsToSave.map(r => ({
          date,
          studentId: r.studentId,
          status: r.status,
          timestamp: r.timestamp,
          sessionType: sType
        }))
      ];
    });

    if (!navigator.onLine) {
      enqueueOfflineAction('attendance', '/api/attendance', 'POST', {
        date,
        session_type: sType,
        records: recordsToSave
      });
      showToast("Waxaad ku jirtaa habka Offline-ka! Xaadirinta waxaa lagu keydiyey qalabkaaga.", "info");
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          session_type: sType,
          records: recordsToSave
        })
      });
      if (res.ok) {
        showToast(`Xaadirinta taariikhda ${date} si guul leh ayaa loo kaydiyey!`, "success");
        fetchAttendanceForDateAndSession(date, sType as any);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Xaadirinta la kaydin kari waayey", "error");
      }
    } catch (e) {
      enqueueOfflineAction('attendance', '/api/attendance', 'POST', {
        date,
        session_type: sType,
        records: recordsToSave
      });
      showToast("Xiriirka server-ka ayaa go'an. Xaadirinta waxaa lagu keydiyey Offline Sync Queue.", "info");
    }
  };

  const handleUpdateSingleAttendanceRecord = async (
    date: string,
    studentId: string,
    newStatus: any,
    sessionType?: string,
    reason?: string
  ) => {
    const sType = sessionType || 'before_break';
    const now = new Date().toISOString();

    // Optimistic local update
    setAttendance(prev => {
      const filtered = prev.filter(
        a => !(a.date === date && a.studentId === studentId && (a.sessionType || 'before_break') === sType)
      );
      return [
        ...filtered,
        {
          date,
          studentId,
          status: newStatus,
          sessionType: sType,
          timestamp: now
        }
      ];
    });

    if (!navigator.onLine) {
      enqueueOfflineAction('attendance', '/api/attendance/record', 'PUT', {
        date,
        studentId,
        status: newStatus,
        session_type: sType,
        reason
      });
      showToast("Isbeddelka waxaa lagu kaydiyey offline sync queue.", "info");
      return;
    }

    try {
      const res = await fetch('/api/attendance/record', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          studentId,
          status: newStatus,
          session_type: sType,
          reason
        })
      });
      if (res.ok) {
        showToast("Xaaladda ardayga si guul leh ayaa loo cusboonaysiiyey!", "success");
      } else {
        showToast("Lama beddeli karin xogta ardayga", "error");
      }
    } catch (e) {
      enqueueOfflineAction('attendance', '/api/attendance/record', 'PUT', {
        date,
        studentId,
        status: newStatus,
        session_type: sType,
        reason
      });
      showToast("Cusboonaysiinta waxaa lagu keydiyey offline sync queue.", "info");
    }
  };

  const exportAttendanceToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Top border accent bar
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 6, 'F');

      // School info
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(settings.schoolName || 'Dugsiga Portal', 15, 20);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Diiwaanka Xaadiriska Ardayda / Attendance Statement', 15, 25);

      // Title
      doc.setTextColor(124, 58, 237);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('WARBIXINTA XAADIRISKA', 195, 20, { align: 'right' });
      doc.text(`(ATTENDANCE REPORT - ${selectedAttendanceClass.toUpperCase()})`, 195, 24, { align: 'right' });

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Taariikhda: ${attendanceDate}`, 195, 30, { align: 'right' });
      doc.text(`Session: ${attendanceSession === 'before_break' ? 'Break-ka ka Hor' : 'Break-ka ka Dib'}`, 195, 34, { align: 'right' });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 38, 195, 38);

      const targetStudents = selectedAttendanceClass === 'All' 
        ? activeStudents 
        : activeStudents.filter(s => s.class === selectedAttendanceClass);

      const presentCount = targetStudents.filter(s => {
        const r = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
        return !r || r.status === 'Present';
      }).length;

      const absentCount = targetStudents.filter(s => {
        const r = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
        return r && r.status === 'Absent';
      }).length;

      const lateCount = targetStudents.filter(s => {
        const r = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
        return r && r.status === 'Late';
      }).length;

      const excusedCount = targetStudents.filter(s => {
        const r = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
        return r && r.status === 'Excused';
      }).length;

      // Metrics grid box (X = 15, Y = 43)
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 43, 180, 22, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.rect(15, 43, 180, 22, 'S');

      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.text('Present (Jooga)', 20, 49);
      doc.text('Absent (Ma Joogo)', 65, 49);
      doc.text('Late (Dahabsaday)', 110, 49);
      doc.text('Excused (Idan qaba)', 155, 49);

      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${presentCount}`, 20, 55);
      doc.text(`${absentCount}`, 65, 55);
      doc.text(`${lateCount}`, 110, 55);
      doc.text(`${excusedCount}`, 155, 55);

      // Table
      const tableBody = targetStudents.map((s, idx) => {
        const r = attendance.find(a => a.date === attendanceDate && a.studentId === s.id && (a.sessionType || 'before_break') === attendanceSession);
        const status = r ? r.status : 'Present';
        return [
          (idx + 1).toString(),
          s.id,
          s.fullName.toUpperCase(),
          s.class.toUpperCase(),
          s.gender.toUpperCase(),
          status.toUpperCase()
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [['#', 'Arday ID', 'Magaca Ardayga (Student Name)', 'Fasalka', 'Gender', 'Status']],
        body: tableBody.length > 0 ? tableBody : [['-', '-', 'No students found.', '-', '-', '-']],
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'left', fontStyle: 'bold' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`System Generated Official Attendance Sheet - ${settings.schoolName || 'Dugsiga Portal'}`, 105, 282, { align: 'center' });

      doc.save(`Xaadiriska_${attendanceDate}_${selectedAttendanceClass.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to export attendance to PDF:", err);
    }
  };

  // Classes Operations
  const handleAddClass = async (classData: Omit<SchoolClass, 'id' | 'createdAt'>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
      });
      if (res.ok) {
        showToast("Fasalka si guul leh ayaa loo abuuray!", "success");
        fetchAllData();
      } else {
        showToast("Abuurista fasalka way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClass = async (id: string, classData: Partial<SchoolClass>) => {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData)
      });
      if (res.ok) {
        showToast("Fasalka waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta fasalka way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Fasalka waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista fasalka way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // Subjects Operations
  const handleAddSubject = async (subjectData: Omit<SchoolSubject, 'id' | 'createdAt'>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectData)
      });
      if (res.ok) {
        showToast("Maaddada si guul leh ayaa loo abuuray!", "success");
        fetchAllData();
      } else {
        showToast("Abuurista maaddada way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubject = async (id: string, subjectData: Partial<SchoolSubject>) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectData)
      });
      if (res.ok) {
        showToast("Maaddada waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta maaddada way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Maaddada waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista maaddada way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // Exam Scores Operations
  const handleAddExamScore = async (examData: Omit<ExamScore, 'id' | 'createdAt'>) => {
    if (submitting) return;
    setSubmitting(true);

    if (!navigator.onLine) {
      enqueueOfflineAction('exam_score', '/api/exams', 'POST', examData);
      const optimisticExam: ExamScore = {
        id: 'offline-' + Date.now(),
        ...examData,
        createdAt: new Date().toISOString()
      };
      setExamScores(prev => [optimisticExam, ...prev]);
      showToast("Offline: Natiijada imtixaanka waxaa lagu kaydiyey qalabkaaga (will sync)", "info");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });
      if (res.ok) {
        showToast("Natiijada imtixaanka waa la kaydiyey!", "success");
        fetchAllData();
      } else {
        showToast("Kaydinta natiijada way fashilantay", "error");
      }
    } catch (e) {
      enqueueOfflineAction('exam_score', '/api/exams', 'POST', examData);
      const optimisticExam: ExamScore = {
        id: 'offline-' + Date.now(),
        ...examData,
        createdAt: new Date().toISOString()
      };
      setExamScores(prev => [optimisticExam, ...prev]);
      showToast("Offline: Natiijada imtixaanka waxaa lagu kaydiyey qalabkaaga (will sync)", "info");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExamScore = async (id: string, examData: Partial<ExamScore>) => {
    if (!navigator.onLine) {
      enqueueOfflineAction('exam_score', `/api/exams/${id}`, 'PUT', examData);
      setExamScores(prev => prev.map(ex => ex.id === id ? { ...ex, ...examData } : ex));
      showToast("Offline: Natiijada waa la cusbooneysiiyey qalabkaaga (will sync)", "info");
      return;
    }

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });
      if (res.ok) {
        showToast("Natiijada waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta natiijada way fashilantay", "error");
      }
    } catch (e) {
      enqueueOfflineAction('exam_score', `/api/exams/${id}`, 'PUT', examData);
      setExamScores(prev => prev.map(ex => ex.id === id ? { ...ex, ...examData } : ex));
      showToast("Offline: Natiijada waa la cusbooneysiiyey qalabkaaga (will sync)", "info");
    }
  };

  const handleDeleteExamScore = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Natiijada waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista natiijada way fashilantay", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // Fee Invoice Operations
  const handleFeeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!feeForm.studentId) {
      showToast("Fadlan dooro ardayga", "warning");
      return;
    }

    setSubmitting(true);
    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (feeForm.paidAmount >= feeForm.amount) status = 'paid';
    else if (feeForm.paidAmount > 0) status = 'partial';

    const timestamp = new Date().toISOString();
    const payload = editingFee 
      ? {
          ...editingFee,
          month: feeForm.month,
          year: Number(feeForm.year),
          amount: Number(feeForm.amount),
          paidAmount: Number(feeForm.paidAmount),
          status,
          updatedAt: timestamp,
          history: [
            ...editingFee.history,
            { action: `Cusbooneysiin / Lacag bixin: ${settings.currency} ${feeForm.paidAmount}`, amount: Number(feeForm.paidAmount), date: timestamp }
          ]
        }
      : {
          id: 'fee-' + Math.random().toString(36).substr(2, 9),
          studentId: feeForm.studentId,
          month: feeForm.month,
          year: Number(feeForm.year),
          amount: Number(feeForm.amount),
          paidAmount: Number(feeForm.paidAmount),
          status,
          createdAt: timestamp,
          updatedAt: timestamp,
          history: [{ action: "Invoice la abuuray", amount: Number(feeForm.amount), date: timestamp }]
        };

    try {
      const url = editingFee ? `/api/fees/${editingFee.id}` : '/api/fees';
      const method = editingFee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingFee ? "Invoice-ka waa la cusbooneysiiyey" : "Invoice lacageed cusub ayaa la abuuray", "success");
        setShowFeeModal(false);
        setEditingFee(null);
        setFeeForm({ studentId: '', month: 'January', year: new Date().getFullYear(), amount: settings.feeAmount, paidAmount: 0 });
        fetchAllData();
      } else {
        showToast("Invoice la abuurikari waayey", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFee = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Tirtir Biilka",
      message: "Ma hubtaa inaad tirtirto biilkan lacageed? Tani dib looma soo celin karo.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/fees/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast("Biilkii si guul leh ayaa loo tirtiray", "success");
            fetchAllData();
          } else {
            showToast("Biilka tirtiridiisa waa fashilantay", "error");
          }
        } catch (e) {
          showToast("Isku xirka waa fashilmay", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Settings & Reset
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast("Nidaamka iyo qaabaynta si guul leh ayaa loo kaydiyey", "success");
        fetchDbStatus();
      } else {
        showToast("Qaabaynta waa la kaydin kari waayey", "error");
      }
    } catch (e) {
      showToast("Khalad isku xirka", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportAllData = () => {
    const backupData = {
      students,
      classes,
      subjects,
      examScores,
      attendance,
      fees,
      settings,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.schoolName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast("Dhammaan macluumaadka si guul leh ayaa loo dhoofiyey!", "success");
  };

  const handleImportAllData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const backup = JSON.parse(content);
        
        setConfirmModal({
          isOpen: true,
          title: "Miyaad Hubtaa?",
          message: "Soo gelinta xogtani waxay ku dari doontaa dhammaan diiwaanada ku jira backup-ka. Fadlan hubi in faylkani yahay kii saxda ahaa.",
          onConfirm: async () => {
            setSubmitting(true);
            try {
              if (Array.isArray(backup.students)) {
                for (const s of backup.students) {
                  await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(s)
                  });
                }
              }

              if (Array.isArray(backup.classes)) {
                for (const c of backup.classes) {
                  await fetch('/api/classes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(c)
                  });
                }
              }

              if (Array.isArray(backup.subjects)) {
                for (const sub of backup.subjects) {
                  await fetch('/api/subjects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sub)
                  });
                }
              }

              if (Array.isArray(backup.examScores)) {
                for (const exam of backup.examScores) {
                  await fetch('/api/exams', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exam)
                  });
                }
              }

              if (backup.settings) {
                await fetch('/api/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backup.settings)
                });
              }

              showToast("Xogtii si guul leh ayaa loo soo celiyey!", "success");
              fetchAllData();
            } catch (err) {
              showToast("Khalad ayaa ka dhacay soo celinta", "error");
            } finally {
              setSubmitting(false);
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
          }
        });

      } catch (err) {
        showToast("Faylka backup-ka ah ma ahan mid sax ah", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    setConfirmModal({
      isOpen: true,
      title: "DIGNIIN: Factory Reset",
      message: "Tani waxay gabi ahaanba tirtiri doontaa dhammaan ardayda, lacagaha, xaadirinta, iyo qaabaynta! Ma hubtaa?",
      onConfirm: async () => {
        try {
          const res = await fetch('/api/reset', { method: 'POST' });
          if (res.ok) {
            showToast("Nidaamka gabi ahaanba waa la nadiifiyey!", "success");
            handleLogout();
          } else {
            showToast("Nadiifintu waa fashilantay", "error");
          }
        } catch (e) {
          showToast("Khalad isku xirka", "error");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Modern Modules Operations
  // 1. Teachers
  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
      });
      if (res.ok) {
        showToast("Macallinka si guul leh ayaa loo diiwaangeliyey!", "success");
        fetchAllData();
      } else {
        showToast("Diiwaangelinta macallinka way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateTeacher = async (id: string, teacherData: Partial<Teacher>) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
      });
      if (res.ok) {
        showToast("Xogta macallinka waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta macallinka way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Macallinka waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista macallinka way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 2. Staff
  const handleAddStaff = async (staffData: Omit<StaffMember, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      if (res.ok) {
        showToast("Shaqaalaha si guul leh ayaa loo qoray!", "success");
        fetchAllData();
      } else {
        showToast("Diiwaangelinta shaqaalaha way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateStaff = async (id: string, staffData: Partial<StaffMember>) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData)
      });
      if (res.ok) {
        showToast("Xogta shaqaalaha waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Shaqaalaha waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 3. Guardians
  const handleAddGuardian = async (guardianData: Omit<Guardian, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/guardians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardianData)
      });
      if (res.ok) {
        showToast("Waalidka waa la diiwaangeliyey!", "success");
        fetchAllData();
      } else {
        showToast("Diiwaangelinta waalidka way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateGuardian = async (id: string, guardianData: Partial<Guardian>) => {
    try {
      const res = await fetch(`/api/guardians/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardianData)
      });
      if (res.ok) {
        showToast("Xogta waalidka waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteGuardian = async (id: string) => {
    try {
      const res = await fetch(`/api/guardians/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Waalidka waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 4. Staff Attendance
  const handleSaveStaffAttendance = async (recordsOrDate: any, maybeRecords?: any) => {
    const records = Array.isArray(recordsOrDate) ? recordsOrDate : (maybeRecords || []);
    try {
      const res = await fetch('/api/staff-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records)
      });
      if (res.ok) {
        showToast("Xaadirinta shaqaalaha waa la kaydiyey!", "success");
        const fetchStaffAtt = await fetch(`/api/staff-attendance?date=${new Date().toISOString().split('T')[0]}`);
        if (fetchStaffAtt.ok) {
          setStaffAttendance(await fetchStaffAtt.json());
        }
      } else {
        showToast("Kaydinta xaadiriska shaqaalaha way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 5. Timetable
  const handleAddTimetableSlot = async (slotData: Omit<TimetableSlot, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData)
      });
      if (res.ok) {
        showToast("Jadwalka xiisadda si guul leh ayaa loo daray!", "success");
        fetchAllData();
      } else {
        showToast("Ku darista jadwalka way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteTimetableSlot = async (id: string) => {
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Xiisadda jadwalka waa la tiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 6. Admissions
  const handleAddAdmission = async (admissionData: Omit<Admission, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admissionData)
      });
      if (res.ok) {
        showToast("Codsiga ardayga cusub waa la diiwaangeliyey!", "success");
        fetchAllData();
      } else {
        showToast("Diiwaangelinta codsiga way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateAdmission = async (id: string, admissionData: Partial<Admission>) => {
    try {
      const res = await fetch(`/api/admissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admissionData)
      });
      if (res.ok) {
        showToast("Codsiga waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleEnrollApplicant = async (id: string) => {
    try {
      const res = await fetch(`/api/admissions/${id}/enroll`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast("Ardayga waxaa si toos ah loogu gudbiyey Diiwaanka Guud!", "success");
        fetchAllData();
      } else {
        showToast("Gudbinta ardaygu way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteAdmission = async (id: string) => {
    try {
      const res = await fetch(`/api/admissions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Codsiga waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 7. Library
  const handleAddBook = async (bookData: Omit<LibraryBook, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (res.ok) {
        showToast("Buugga cusub waa la kaydiyey!", "success");
        fetchAllData();
      } else {
        showToast("Kaydinta buugga way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateBook = async (id: string, bookData: Partial<LibraryBook>) => {
    try {
      const res = await fetch(`/api/library/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (res.ok) {
        showToast("Xogta buugga waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      const res = await fetch(`/api/library/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Buugga waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleIssueLoan = async (loanData: Omit<LibraryLoan, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      });
      if (res.ok) {
        showToast("Buugga waxaa loo dhiibay ardayga!", "success");
        fetchAllData();
      } else {
        showToast("Dhiibista buugga way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleReturnLoan = async (loanId: string) => {
    try {
      const res = await fetch(`/api/library/loans/${loanId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast("Buugga dib ayaa loogu celiyey maktabadda!", "success");
        fetchAllData();
      } else {
        showToast("Celinta buugga way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 8. Inventory
  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        showToast("Qalabka/hantida waa la diiwaangeliyey!", "success");
        fetchAllData();
      } else {
        showToast("Diiwaangelintu way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateItem = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        showToast("Qalabka waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Qalabka waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // 9. Announcements
  const handleAddAnnouncement = async (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      });
      if (res.ok) {
        showToast("Ogeysiiska waa la daabacay!", "success");
        fetchAllData();
      } else {
        showToast("Daabacaadda ogeysiiska way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleUpdateAnnouncement = async (id: string, announcementData: Partial<Announcement>) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      });
      if (res.ok) {
        showToast("Ogeysiiska waa la cusbooneysiiyey!", "success");
        fetchAllData();
      } else {
        showToast("Cusbooneysiinta way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Ogeysiiska waa la tirtiray!", "info");
        fetchAllData();
      } else {
        showToast("Tirtirista way fashilantay", "error");
      }
    } catch {
      showToast("Khalad isku xirka ah", "error");
    }
  };

  // Local Helpers for Analytics
  const activeStudents = students.filter(s => s.status === 'active');
  const totalStudentsCount = students.length;
  const activeStudentsCount = activeStudents.length;

  let totalCollectedFees = 0;
  let totalPendingFees = 0;
  (fees || []).forEach(f => {
    totalCollectedFees += Number(f.paidAmount || 0);
    totalPendingFees += Math.max(0, Number(f.amount || 0) - Number(f.paidAmount || 0));
  });

  // Prepare chart datasets
  const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const barChartData = monthsList.slice(0, 6).map(monthName => {
    const monthFees = (fees || []).filter(f => f && f.month === monthName);
    let collected = 0;
    let pending = 0;
    monthFees.forEach(f => {
      collected += Number(f.paidAmount || 0);
      pending += Math.max(0, Number(f.amount || 0) - Number(f.paidAmount || 0));
    });
    return {
      name: monthName.substring(0, 3),
      Collected: collected,
      Pending: pending
    };
  });

  const getTodayAttendanceStats = () => {
    const todayRecords = (attendance || []).filter(a => a && a.date === attendanceDate);
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    todayRecords.forEach(r => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'Late') late++;
      else if (r.status === 'Excused') excused++;
    });

    const unrecorded = Math.max(0, activeStudentsCount - todayRecords.length);

    return [
      { name: 'Present', value: present, color: '#10b981' },
      { name: 'Absent', value: absent, color: '#ef4444' },
      { name: 'Late', value: late, color: '#f59e0b' },
      { name: 'Excused', value: excused, color: '#3b82f6' },
      { name: 'Unrecorded', value: unrecorded, color: '#94a3b8' }
    ].filter(v => v.value > 0);
  };

  const attendanceChartData = getTodayAttendanceStats() || [];

  // Export File Generators
  const downloadJSON = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${filename} si guul leh ayaa loo soo degsaday!`, "success");
  };

  /* ==============================================
     TEACHER ACTIVATION ROUTE (/activate-teacher)
     ============================================== */
  if (currentRoute === 'activate-teacher') {
    const tokenParam = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('token') || '') : '';
    return (
      <TeacherActivationView
        token={tokenParam}
        onActivatedSuccess={(activatedEmail) => {
          setEmail(activatedEmail);
          navigate('login');
          showToast("Akoonkaaga si guul leh ayaa loo dhaqaajiyey! Fadlan hadda gal.", "success");
        }}
        onGoToLogin={() => navigate('login')}
      />
    );
  }

  /* ==============================================
     PUBLIC LANDING PAGE ROUTE (HOME /)
     ============================================== */
  if (currentRoute === 'landing') {
    return (
      <LandingPage
        onNavigate={navigate}
        isAuthenticated={!!user}
        userEmail={user?.email}
      />
    );
  }

  /* ==============================================
     UNAUTHENTICATED GATE (LOGIN / SIGNUP / VERIFY)
     ============================================== */
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] text-[#e5e5e5] flex flex-col font-sans overflow-x-hidden relative">
        {/* Background glow violet blur */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7c3aed] blur-[120px] rounded-full"></div>
        </div>

        {/* Toast List */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map(t => (
            <div key={t.id} className={`p-4 rounded-sm shadow-2xl flex items-center gap-3 border text-xs font-medium bg-[#0f0f0f] border-[#ffffff10] ${
              t.type === 'success' ? 'text-emerald-400' :
              t.type === 'error' ? 'text-rose-400' :
              t.type === 'warning' ? 'text-amber-400' :
              'text-[#c4b5fd]'
            }`}>
              {t.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[#c4b5fd] shrink-0" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        {/* Header/Nav */}
        <nav className="flex justify-between items-center px-6 md:px-12 py-8 border-b border-[#ffffff10] z-10 bg-[#0a0a0a]/80 backdrop-blur-md">
          <div 
            onClick={() => navigate('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-[#c4b5fd] to-[#7c3aed] rounded-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0a0a0a]" />
            </div>
            <span className="text-xl tracking-[0.2em] font-light uppercase">Atlas Auth</span>
          </div>

          <button
            onClick={() => navigate('landing')}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8] hover:text-white transition-colors"
          >
            <span>← Back to Homepage</span>
          </button>
        </nav>

        {/* Main Content split column layout */}
        <main className="flex-1 flex flex-col lg:flex-row z-10">
          {/* Left Column (7/12 width equivalent) */}
          <div className="w-full lg:w-7/12 p-8 md:p-16 lg:p-20 flex flex-col justify-center relative border-b lg:border-b-0 lg:border-r border-[#ffffff10]">
            <h1 className="text-[52px] md:text-[72px] lg:text-[80px] leading-[0.9] font-serif italic mb-6 text-[#f5f5f5]">
              Dugsiga<br />Maamulka.
            </h1>
            <p className="text-sm md:text-lg text-[#a3a3a3] leading-relaxed max-w-md">
              Nidaam casri ah oo fududeynaya maamulka guud ee dugsiga, diiwaanka ardayda, xaadirinta, imtixaanaadka iyo xisaabaadka lacagaha.
            </p>
            
            <div className="mt-12 md:mt-16 grid grid-cols-2 gap-6 md:gap-8">
              <div className="border-l border-[#ffffff20] pl-6">
                <span className="block text-[11px] uppercase tracking-widest text-[#737373] mb-1">Nidaamka</span>
                <span className="text-base md:text-lg font-medium text-[#e5e5e5]">
                  Aamin & Sugan
                </span>
              </div>
              <div className="border-l border-[#ffffff20] pl-6">
                <span className="block text-[11px] uppercase tracking-widest text-[#737373] mb-1">Xaaladda</span>
                <span className="text-base md:text-lg font-medium text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (5/12 width equivalent) */}
          <div className="w-full lg:w-5/12 bg-[#0f0f0f] flex flex-col justify-center px-6 md:px-16 py-12 md:py-16">
            <div className="w-full max-w-sm mx-auto">
              <>
                <div className="flex gap-8 mb-12 border-b border-[#ffffff10]">
                  <button 
                    onClick={() => { setAuthView('login'); setAuthError(''); setCurrentRoute('login'); window.history.replaceState({}, '', '/login'); }}
                    className={`text-sm uppercase tracking-widest font-semibold pb-2 transition-all ${
                      authView === 'login' 
                        ? 'border-b-2 border-[#7c3aed] text-[#e5e5e5]' 
                        : 'text-[#737373] hover:text-[#e5e5e5]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { setAuthView('signup'); setAuthError(''); setCurrentRoute('signup'); window.history.replaceState({}, '', '/signup'); }}
                    className={`text-sm uppercase tracking-widest font-semibold pb-2 transition-all ${
                      authView === 'signup' 
                        ? 'border-b-2 border-[#7c3aed] text-[#e5e5e5]' 
                        : 'text-[#737373] hover:text-[#e5e5e5]'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  {authError && (
                    <div className="p-3 rounded-sm bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#737373]">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@atlas.com" 
                      className="w-full bg-transparent border-b border-[#ffffff20] py-3 text-lg text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#737373]">Security Password</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-transparent border-b border-[#ffffff20] py-3 text-lg text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    />
                  </div>

                  <div className="mt-12 flex items-center justify-between">
                    <a href="#" onClick={(e) => { e.preventDefault(); showToast("Maamulka kala xiriir password-kaaga.", "info"); }} className="text-xs text-[#737373] hover:text-[#e5e5e5] underline underline-offset-4 transition-colors">
                      Forgot Key?
                    </a>
                    <button 
                      type="submit"
                      disabled={authLoading}
                      className="bg-[#e5e5e5] text-[#0a0a0a] px-8 py-3 rounded-sm font-semibold uppercase text-xs tracking-widest hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {authLoading ? 'Authenticating...' : 'Authenticate'}
                    </button>
                  </div>
                </form>
              </>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-6 border-t border-[#ffffff10] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#525252] uppercase tracking-[0.2em] bg-[#0a0a0a]">
          <div>&copy; 2026 Nidaamka Maamulka Dugsiga</div>
          <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
            <span>Diiwaanka Ardayda</span>
            <span>Xisaabaadka</span>
            <span>Imtixaanaadka</span>
          </div>
        </footer>
      </div>
    );
  }

  /* ==============================================
     AUTHENTICATED APPLICATION LAYOUT
     ============================================== */
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0a0a0a] text-[#e5e5e5]">
      
      {/* Toast List */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded-sm shadow-2xl flex items-center gap-3 border text-xs font-medium animate-slide-in bg-[#0f0f0f] border-[#ffffff10] ${
            t.type === 'success' ? 'text-emerald-400' :
            t.type === 'error' ? 'text-rose-400' :
            t.type === 'warning' ? 'text-amber-400' :
            'text-[#c4b5fd]'
          }`}>
            {t.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-[#c4b5fd] shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar - Desktop & Mobile styled with Sophisticated Dark */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r border-[#ffffff10] bg-[#0a0a0a] flex flex-col transition-transform duration-300 shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#ffffff10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-[#c4b5fd] to-[#7c3aed] rounded-sm flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#0a0a0a]" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-widest uppercase font-display text-[#f5f5f5] truncate max-w-[140px]">
                {settings.schoolName}
              </h2>
              <span className="text-[10px] text-[#737373] font-medium tracking-wider uppercase font-mono">Dugsiga Portal</span>
            </div>
          </div>
          <button className="md:hidden p-1 rounded-sm hover:bg-[#ffffff05]" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-[#737373]" />
          </button>
        </div>

        {/* Sidebar Navigation with sleek indicators */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {(() => {
            const isTeacher = user.role === 'teacher';
            const navItems = isTeacher ? [
              { id: 'dashboard', label: 'Dashboard / Xafiiska', icon: Activity },
              { id: 'students', label: 'Ardayda / Students', icon: Users },
              { id: 'attendance', label: 'Xaadirinta / Attendance', icon: Calendar },
              { id: 'exams', label: 'Natiijooyinka / Exams', icon: Award },
              { id: 'timetable', label: 'Jadwalka / Timetable', icon: Clock },
              { id: 'announcements', label: 'Ogeysiisyada / Notices', icon: Bell },
              { id: 'settings', label: 'Profile / Settings', icon: SettingsIcon },
            ] : [
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'students', label: 'Ardayda / Students', icon: Users },
              { id: 'fees', label: 'Finance / Maaliyadda', icon: DollarSign },
              { id: 'attendance', label: 'Xaadirinta / Attendance', icon: Calendar },
              { id: 'classes', label: 'Fasallada / Classes', icon: ShieldCheck },
              { id: 'subjects', label: 'Maddooyinka / Subjects', icon: BookOpen },
              { id: 'exams', label: 'Natiijooyinka / Exams', icon: Award },
              { id: 'reports', label: 'Warbixino / Reports', icon: FileText },
              { id: 'settings', label: 'Qaabaynta / Settings', icon: SettingsIcon },
              { id: 'people', label: 'Macallimiinta & Shaqaalaha', icon: GraduationCap },
              { id: 'staff_attendance', label: 'Xaadirinta Shaqaalaha', icon: ClipboardList },
              { id: 'timetable', label: 'Jadwalka / Timetable', icon: Clock },
              { id: 'admissions', label: 'Codsiyada / Admissions', icon: UserPlus },
              { id: 'library', label: 'Maktabadda / Library', icon: BookOpen },
              { id: 'inventory', label: 'Hantida & Qalabka', icon: Package },
              { id: 'announcements', label: 'Ogeysiisyada / Notices', icon: Bell },
            ];

            return navItems.map(tab => {
              const IconComponent = tab.icon;
              const isSelected = activeTab === tab.id;

              if (tab.id === 'students') {
                return (
                  <div key="students-parent-menu" className="space-y-1">
                    <div
                      onClick={() => {
                        if (activeTab !== 'students') {
                          navigateStudentSubSection('all');
                          setStudentsMenuExpanded(true);
                        } else {
                          setStudentsMenuExpanded(!studentsMenuExpanded);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#ffffff05] border-l-2 border-[#7c3aed] text-[#e5e5e5]' 
                          : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                        <span>Ardayda / Students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#ffffff08] font-mono text-[#a3a3a3]">
                          {students.length}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudentsMenuExpanded(!studentsMenuExpanded);
                          }}
                          className="p-0.5 text-[#737373] hover:text-white transition-colors"
                          title={studentsMenuExpanded ? "Collapse sub-menu" : "Expand sub-menu"}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${studentsMenuExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Children Submenu */}
                    {studentsMenuExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 ml-4 border-l border-[#ffffff10]">
                        {[
                          { id: 'all', label: 'All Students', icon: List, badge: students.length },
                          { id: 'add', label: 'Add Student', icon: UserPlus },
                          { id: 'active', label: 'Active Students', icon: UserCheck, badge: students.filter(s => s.status === 'active').length, badgeColor: 'text-emerald-400' },
                          { id: 'inactive', label: 'Inactive Students', icon: AlertCircle, badge: students.filter(s => s.status === 'inactive').length, badgeColor: 'text-amber-400' },
                          { id: 'archived', label: 'Archived Students', icon: Archive, badge: students.filter(s => s.status === 'archived').length, badgeColor: 'text-slate-400' },
                          { id: 'import', label: 'Import Students', icon: Upload },
                          { id: 'export', label: 'Export Students', icon: Download },
                        ].map(child => {
                          const isChildActive = activeTab === 'students' && studentSubSection === child.id && !selectedStudentProfileId;
                          const ChildIcon = child.icon;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                navigateStudentSubSection(child.id as StudentSubSection);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-[11px] font-medium transition-all ${
                                isChildActive
                                  ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                  : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                                <span className="truncate">{child.label}</span>
                              </div>
                              {child.badge !== undefined && (
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-[#ffffff05] ${child.badgeColor || 'text-[#737373]'}`}>
                                  {child.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (tab.id === 'fees') {
                return (
                  <div key="finance-parent-menu" className="space-y-1">
                    <div
                      onClick={() => {
                        if (activeTab !== 'fees') {
                          navigateFinanceSubSection('dashboard');
                          setFinanceMenuExpanded(true);
                        } else {
                          setFinanceMenuExpanded(!financeMenuExpanded);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#ffffff05] border-l-2 border-emerald-500 text-[#e5e5e5]' 
                          : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-[#737373]'}`} />
                        <span>Finance / Maaliyadda</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFinanceMenuExpanded(!financeMenuExpanded);
                          }}
                          className="p-0.5 text-[#737373] hover:text-white transition-colors"
                          title={financeMenuExpanded ? "Collapse sub-menu" : "Expand sub-menu"}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${financeMenuExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Children Submenu */}
                    {financeMenuExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 ml-4 border-l border-[#ffffff10]">
                        {[
                          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                          { id: 'fee-structures', label: 'Fee Structures', icon: Layers },
                          { id: 'invoices', label: 'Invoices', icon: FileText },
                          { id: 'payments', label: 'Payments', icon: CreditCard },
                          { id: 'outstanding', label: 'Outstanding', icon: AlertTriangle },
                          { id: 'discounts', label: 'Discounts & Waivers', icon: Percent },
                          { id: 'expenses', label: 'Expenses', icon: CreditCard },
                          { id: 'refunds', label: 'Refunds', icon: RotateCcw },
                          { id: 'receipts', label: 'Receipts', icon: Receipt },
                          { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
                        ].map(child => {
                          const isChildActive = activeTab === 'fees' && financeSubSection === child.id;
                          const ChildIcon = child.icon;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                navigateFinanceSubSection(child.id as FinanceSubSection);
                                setSidebarOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                                isChildActive
                                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-500 -ml-[1px]'
                                  : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <ChildIcon className={`w-3.5 h-3.5 shrink-0 ${isChildActive ? 'text-emerald-400' : 'text-[#737373]'}`} />
                                <span className="truncate">{child.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (tab.id === 'attendance') {
                return (
                  <div key="attendance-parent-menu" className="space-y-1">
                    <div
                      onClick={() => {
                        if (activeTab !== 'attendance') {
                          navigateAttendanceSubSection('overview');
                          setAttendanceMenuExpanded(true);
                        } else {
                          setAttendanceMenuExpanded(!attendanceMenuExpanded);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#ffffff05] border-l-2 border-[#7c3aed] text-[#e5e5e5]' 
                          : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                        <span>Attendance</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttendanceMenuExpanded(!attendanceMenuExpanded);
                          }}
                          className="p-0.5 text-[#737373] hover:text-white transition-colors"
                          title={attendanceMenuExpanded ? "Collapse sub-menu" : "Expand sub-menu"}
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${attendanceMenuExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Children Submenu (Quiet, Premium, Exact Spec) */}
                    {attendanceMenuExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 ml-4 border-l border-[#ffffff10]">
                        {/* 1. Overview */}
                        <button
                          onClick={() => {
                            navigateAttendanceSubSection('overview');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                            activeTab === 'attendance' && (attendanceSubSection === 'overview' || attendanceSubSection === 'dashboard')
                              ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                              : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                          }`}
                        >
                          <LayoutDashboard className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && (attendanceSubSection === 'overview' || attendanceSubSection === 'dashboard') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                          <span>Overview</span>
                        </button>

                        {/* 2. Take Attendance */}
                        <button
                          onClick={() => {
                            navigateAttendanceSubSection('take');
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                            activeTab === 'attendance' && attendanceSubSection === 'take'
                              ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                              : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                          }`}
                        >
                          <ClipboardCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection === 'take' ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                          <span>Take Attendance</span>
                        </button>

                        {/* 3. Records (Parent + Nested: Today, History, Corrections) */}
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              navigateAttendanceSubSection('records/today');
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                              activeTab === 'attendance' && (attendanceSubSection === 'records' || attendanceSubSection.startsWith('records/'))
                                ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                            }`}
                          >
                            <FileSpreadsheet className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection.startsWith('records') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                            <span>Records</span>
                          </button>
                          {activeTab === 'attendance' && (attendanceSubSection === 'records' || attendanceSubSection.startsWith('records/')) && (
                            <div className="pl-4 ml-3 border-l border-[#ffffff10] space-y-0.5">
                              {[
                                { id: 'records/today', label: 'Today' },
                                { id: 'records/history', label: 'History' },
                                { id: 'records/corrections', label: 'Corrections' }
                              ].map(nested => (
                                <button
                                  key={nested.id}
                                  onClick={() => {
                                    navigateAttendanceSubSection(nested.id);
                                    setSidebarOpen(false);
                                  }}
                                  className={`w-full text-left py-1 px-2 rounded-xs text-[10px] transition-colors cursor-pointer ${
                                    attendanceSubSection === nested.id
                                      ? 'text-white font-semibold'
                                      : 'text-[#737373] hover:text-[#e5e5e5]'
                                  }`}
                                >
                                  {nested.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Students (Parent + Nested: Student Attendance, Attendance Alerts) */}
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              navigateAttendanceSubSection('students/student_attendance');
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                              activeTab === 'attendance' && (attendanceSubSection === 'students' || attendanceSubSection.startsWith('students/'))
                                ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                            }`}
                          >
                            <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection.startsWith('students') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                            <span>Students</span>
                          </button>
                          {activeTab === 'attendance' && (attendanceSubSection === 'students' || attendanceSubSection.startsWith('students/')) && (
                            <div className="pl-4 ml-3 border-l border-[#ffffff10] space-y-0.5">
                              {[
                                { id: 'students/student_attendance', label: 'Student Attendance' },
                                { id: 'students/alerts', label: 'Attendance Alerts' }
                              ].map(nested => (
                                <button
                                  key={nested.id}
                                  onClick={() => {
                                    navigateAttendanceSubSection(nested.id);
                                    setSidebarOpen(false);
                                  }}
                                  className={`w-full text-left py-1 px-2 rounded-xs text-[10px] transition-colors cursor-pointer ${
                                    attendanceSubSection === nested.id
                                      ? 'text-white font-semibold'
                                      : 'text-[#737373] hover:text-[#e5e5e5]'
                                  }`}
                                >
                                  {nested.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 5. Classes (Parent + Nested: Class Overview, Class Trends) */}
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              navigateAttendanceSubSection('classes/class_overview');
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                              activeTab === 'attendance' && (attendanceSubSection === 'classes' || attendanceSubSection.startsWith('classes/'))
                                ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                            }`}
                          >
                            <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection.startsWith('classes') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                            <span>Classes</span>
                          </button>
                          {activeTab === 'attendance' && (attendanceSubSection === 'classes' || attendanceSubSection.startsWith('classes/')) && (
                            <div className="pl-4 ml-3 border-l border-[#ffffff10] space-y-0.5">
                              {[
                                { id: 'classes/class_overview', label: 'Class Overview' },
                                { id: 'classes/class_trends', label: 'Class Trends' }
                              ].map(nested => (
                                <button
                                  key={nested.id}
                                  onClick={() => {
                                    navigateAttendanceSubSection(nested.id);
                                    setSidebarOpen(false);
                                  }}
                                  className={`w-full text-left py-1 px-2 rounded-xs text-[10px] transition-colors cursor-pointer ${
                                    attendanceSubSection === nested.id
                                      ? 'text-white font-semibold'
                                      : 'text-[#737373] hover:text-[#e5e5e5]'
                                  }`}
                                >
                                  {nested.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 6. Insights (Parent + Nested: Attendance Trends, Absence Analysis, Late Analysis) */}
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              navigateAttendanceSubSection('insights/trends');
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                              activeTab === 'attendance' && (attendanceSubSection === 'insights' || attendanceSubSection.startsWith('insights/'))
                                ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                            }`}
                          >
                            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection.startsWith('insights') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                            <span>Insights</span>
                          </button>
                          {activeTab === 'attendance' && (attendanceSubSection === 'insights' || attendanceSubSection.startsWith('insights/')) && (
                            <div className="pl-4 ml-3 border-l border-[#ffffff10] space-y-0.5">
                              {[
                                { id: 'insights/trends', label: 'Attendance Trends' },
                                { id: 'insights/absence', label: 'Absence Analysis' },
                                { id: 'insights/late', label: 'Late Analysis' }
                              ].map(nested => (
                                <button
                                  key={nested.id}
                                  onClick={() => {
                                    navigateAttendanceSubSection(nested.id);
                                    setSidebarOpen(false);
                                  }}
                                  className={`w-full text-left py-1 px-2 rounded-xs text-[10px] transition-colors cursor-pointer ${
                                    attendanceSubSection === nested.id
                                      ? 'text-white font-semibold'
                                      : 'text-[#737373] hover:text-[#e5e5e5]'
                                  }`}
                                >
                                  {nested.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 7. Reports (Parent + Nested: Daily, Student, Class, Monthly) */}
                        <div className="space-y-0.5">
                          <button
                            onClick={() => {
                              navigateAttendanceSubSection('reports/daily');
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-sm text-[11px] font-medium transition-all cursor-pointer ${
                              activeTab === 'attendance' && (attendanceSubSection === 'reports' || attendanceSubSection.startsWith('reports/'))
                                ? 'bg-[#7c3aed]/15 text-white font-bold border-l-2 border-[#7c3aed] -ml-[1px]'
                                : 'text-[#888888] hover:text-[#e5e5e5] hover:bg-[#ffffff03]'
                            }`}
                          >
                            <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'attendance' && attendanceSubSection.startsWith('reports') ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                            <span>Reports</span>
                          </button>
                          {activeTab === 'attendance' && (attendanceSubSection === 'reports' || attendanceSubSection.startsWith('reports/')) && (
                            <div className="pl-4 ml-3 border-l border-[#ffffff10] space-y-0.5">
                              {[
                                { id: 'reports/daily', label: 'Daily' },
                                { id: 'reports/student', label: 'Student' },
                                { id: 'reports/class', label: 'Class' },
                                { id: 'reports/monthly', label: 'Monthly' }
                              ].map(nested => (
                                <button
                                  key={nested.id}
                                  onClick={() => {
                                    navigateAttendanceSubSection(nested.id);
                                    setSidebarOpen(false);
                                  }}
                                  className={`w-full text-left py-1 px-2 rounded-xs text-[10px] transition-colors cursor-pointer ${
                                    attendanceSubSection === nested.id
                                      ? 'text-white font-semibold'
                                      : 'text-[#737373] hover:text-[#e5e5e5]'
                                  }`}
                                >
                                  {nested.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigateTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-xs uppercase tracking-wider font-semibold transition-all duration-150 ${
                    isSelected 
                      ? 'bg-[#ffffff05] border-l-2 border-[#7c3aed] text-[#e5e5e5]' 
                      : 'text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff02]'
                  }`}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#c4b5fd]' : 'text-[#737373]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            });
          })()}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#ffffff10] bg-[#0f0f0f]">
          <div className="flex items-center gap-3 mb-4 truncate">
            <div className="w-9 h-9 rounded-sm bg-[#ffffff05] border border-[#ffffff10] flex items-center justify-center text-[#e5e5e5] font-bold text-xs font-mono uppercase">
              {user.email.substring(0, 2)}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-[#e5e5e5] truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-[#737373] font-medium uppercase font-mono">
                {user.role === 'teacher' ? 'Macallin (Teacher)' : 'Admin'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm border border-[#ffffff10] text-[10px] uppercase tracking-wider font-bold text-rose-400 hover:bg-[#ef444410] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ka Bax (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Header Bar with Global Search */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#ffffff10] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <button className="md:hidden p-2 rounded-sm border border-[#ffffff10] text-[#e5e5e5] hover:bg-[#ffffff05]" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Global Header Search across students, teachers, and staff */}
          {user.role === 'admin' ? (
            <div className="flex-1 max-w-xl mx-2 sm:mx-4">
              <GlobalHeaderSearch
                students={students}
                teachers={teachers}
                staff={staff}
                onSelectStudent={(student) => {
                  setSelectedStudentForProfile(student);
                }}
                onNavigateTab={(tab) => handleNavigateTab(tab)}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PWAInstallButton />
            <OfflineSyncBadge />
            <button
              onClick={() => navigate('landing')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#ffffff10] text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#ffffff05] transition-colors"
              title="View Public Website"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
              <span className="hidden sm:inline">Public Website</span>
            </button>
            <div className="hidden sm:block text-[10px] font-mono tracking-widest uppercase text-[#737373] bg-[#ffffff02] px-3 py-1.5 rounded-sm border border-[#ffffff05]">
              UTC: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Dashboard Pages */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <Database className="w-10 h-10 text-[#7c3aed] animate-bounce" />
              <p className="text-xs text-[#737373] uppercase tracking-wider font-medium">Soo raraya xogta iskuulka...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                user.role === 'teacher' ? (
                  <TeacherDashboardView
                    user={user as any}
                    students={students}
                    classes={classes}
                    subjects={subjects}
                    onNavigate={(tab) => setActiveTab(tab as any)}
                  />
                ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Greeting Head */}
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5]">Dashboard Overview</h1>
                    <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Nidaamka falanqaynta iyo macluumaadka guud ee {settings.schoolName}</p>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Total Students", val: totalStudentsCount, icon: Users, colorClass: "text-[#c4b5fd]" },
                      { label: "Active Students", val: activeStudentsCount, icon: UserCheck, colorClass: "text-[#7c3aed]" },
                      { label: "Collected Fees", val: `${settings.currency} ${totalCollectedFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: DollarSign, colorClass: "text-[#c4b5fd]" },
                      { label: "Pending Invoices", val: `${settings.currency} ${totalPendingFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, icon: AlertCircle, colorClass: "text-[#ef4444]" },
                    ].map((m, i) => {
                      const Icon = m.icon;
                      return (
                        <div key={i} className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">{m.label}</span>
                            <div className="text-2xl font-bold text-[#f5f5f5] font-mono">
                              {m.val}
                            </div>
                          </div>
                          <div className={`p-3 rounded-sm bg-[#ffffff05] border border-[#ffffff10] ${m.colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Institutional Overview Quick Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div 
                      onClick={() => setActiveTab('people')}
                      className="bg-[#0f0f0f] border border-[#ffffff08] hover:border-[#7c3aed]/40 p-4 rounded-sm flex items-center gap-3 cursor-pointer transition-all hover:bg-[#ffffff02]"
                    >
                      <div className="p-2.5 rounded-sm bg-[#7c3aed]/10 text-[#c4b5fd]">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#737373] block">Macallimiinta</span>
                        <span className="text-lg font-bold font-mono text-[#e5e5e5]">{teachers.length} Active</span>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveTab('people')}
                      className="bg-[#0f0f0f] border border-[#ffffff08] hover:border-[#3b82f6]/40 p-4 rounded-sm flex items-center gap-3 cursor-pointer transition-all hover:bg-[#ffffff02]"
                    >
                      <div className="p-2.5 rounded-sm bg-[#3b82f6]/10 text-[#60a5fa]">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#737373] block">Shaqaalaha</span>
                        <span className="text-lg font-bold font-mono text-[#e5e5e5]">{staff.length} Staff</span>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveTab('admissions')}
                      className="bg-[#0f0f0f] border border-[#ffffff08] hover:border-amber-500/40 p-4 rounded-sm flex items-center gap-3 cursor-pointer transition-all hover:bg-[#ffffff02]"
                    >
                      <div className="p-2.5 rounded-sm bg-amber-500/10 text-amber-400">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#737373] block">Codsiyada Cusub</span>
                        <span className="text-lg font-bold font-mono text-[#e5e5e5]">{admissions.filter(a => a.status === 'pending').length} Sugaya</span>
                      </div>
                    </div>
                    <div 
                      onClick={() => setActiveTab('library')}
                      className="bg-[#0f0f0f] border border-[#ffffff08] hover:border-emerald-500/40 p-4 rounded-sm flex items-center gap-3 cursor-pointer transition-all hover:bg-[#ffffff02]"
                    >
                      <div className="p-2.5 rounded-sm bg-emerald-500/10 text-emerald-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#737373] block">Maktabadda</span>
                        <span className="text-lg font-bold font-mono text-[#e5e5e5]">{libraryBooks.length} Buug</span>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Bar Chart Financial */}
                    <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 lg:col-span-2">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-serif italic text-lg text-[#f5f5f5]">Revenue & Invoicing Trend</h3>
                          <p className="text-[10px] uppercase tracking-widest text-[#737373] mt-0.5">Barbardhiga dakhliga la ururiyey iyo kan dhiman (6 Month)</p>
                        </div>
                      </div>
                      <div className="h-72 w-full text-xs font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                            <XAxis dataKey="name" stroke="#525252" />
                            <YAxis stroke="#525252" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff10', color: '#e5e5e5' }} />
                            <Legend />
                            <Bar dataKey="Collected" fill="#7c3aed" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Pending" fill="#c4b5fd" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Attendance Pie Chart */}
                    <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6">
                      <div>
                        <h3 className="font-serif italic text-lg text-[#f5f5f5]">Xaadirinta Maanta (Attendance)</h3>
                        <p className="text-[10px] uppercase tracking-widest text-[#737373] mt-0.5">Xaaraanta ardayda firfircoon ee maanta ({attendanceDate})</p>
                      </div>
                      <div className="h-56 relative mt-4">
                        {attendanceChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={attendanceChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {attendanceChartData.map((entry, index) => {
                                  // Map colors to Sophisticated Dark Palette
                                  let color = entry.color;
                                  if (entry.name === 'Present') color = '#7c3aed';
                                  else if (entry.name === 'Absent') color = '#ef4444';
                                  else if (entry.name === 'Late') color = '#c4b5fd';
                                  else if (entry.name === 'Excused') color = '#3b82f6';
                                  else color = '#262626';
                                  return (
                                    <Cell key={`cell-${index}`} fill={color} />
                                  );
                                })}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f0f0f', borderColor: '#ffffff10' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <Calendar className="w-10 h-10 text-[#525252] mb-2" />
                            <span className="text-[10px] uppercase tracking-widest text-[#737373]">Weligaa xaadirin maanta ma kaydin</span>
                          </div>
                        )}
                        {attendanceChartData.length > 0 && (
                          <div className="absolute top-[41%] left-0 right-0 text-center pointer-events-none">
                            <span className="text-2xl font-bold font-mono tracking-tight text-[#f5f5f5]">
                              {attendance.filter(a => a.date === attendanceDate && a.status === 'Present').length}
                            </span>
                            <p className="text-[9px] uppercase font-semibold text-[#737373]">Present Today</p>
                          </div>
                        )}
                      </div>

                      {/* Legend detail list */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'Present', color: 'bg-[#7c3aed]' },
                          { key: 'Absent', color: 'bg-[#ef4444]' },
                          { key: 'Late', color: 'bg-[#c4b5fd]' },
                          { key: 'Excused', color: 'bg-[#3b82f6]' },
                          { key: 'Unrecorded', color: 'bg-[#262626]' }
                        ].map((stat, i) => {
                          const records = attendance.filter(a => a.date === attendanceDate);
                          let count = 0;
                          if (stat.key === 'Unrecorded') {
                            count = Math.max(0, activeStudentsCount - records.length);
                          } else {
                            count = records.filter(r => r.status === stat.key).length;
                          }
                          return (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-[#ffffff02] border border-[#ffffff05]">
                              <span className={`w-2 h-2 rounded-full ${stat.color} shrink-0`}></span>
                              <span className="text-[10px] text-[#737373] truncate flex-1 uppercase font-semibold">{stat.key}</span>
                              <span className="font-mono font-bold text-[#e5e5e5]">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Latest Invoices */}
                    <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6">
                      <h3 className="font-serif italic text-lg text-[#f5f5f5]">Latest Fee Payments</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#737373] mt-0.5">Biilasha ugu dambeeyey ee la cusbooneysiiyey</p>
                      <div className="mt-4 divide-y divide-[#ffffff10] max-h-80 overflow-y-auto pr-1">
                        {(fees || []).length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#737373]">Wax biilal ah oo diiwaangashan ma jiraan</div>
                        ) : (
                          (fees || []).slice(0, 5).map(f => {
                            const sName = (students || []).find(s => s && s.id === f.studentId)?.fullName || 'Unknown Student';
                            return (
                              <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-[#e5e5e5]">{sName}</p>
                                  <p className="text-[#737373] mt-0.5 font-mono">{f.month} {f.year}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold font-mono text-[#f5f5f5]">{settings.currency} {f.paidAmount}</p>
                                  <span className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                    f.status === 'paid' ? 'bg-[#7c3aed]/10 text-[#c4b5fd] border border-[#7c3aed]/20' :
                                    f.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>{f.status}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Active Inactive Student roster counts */}
                    <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6">
                      <h3 className="font-serif italic text-lg text-[#f5f5f5]">Ardayda dhawaan la diiwaangeliyey</h3>
                      <p className="text-[10px] uppercase tracking-widest text-[#737373] mt-0.5">Ardaydii u dambaysay ee lagu daray nidaamka</p>
                      <div className="mt-4 divide-y divide-[#ffffff10] max-h-80 overflow-y-auto pr-1">
                        {(students || []).length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#737373]">Wax arday ah oo diiwaangashan ma jiraan</div>
                        ) : (
                          (students || []).slice(0, 5).map(s => (
                            <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-[#e5e5e5]">{s.fullName}</p>
                                <p className="text-[#737373] mt-0.5 uppercase tracking-wider text-[9px]">Class: {s.class} | Guardian: {s.guardianPhone || '-'}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                                s.status === 'active' ? 'bg-[#7c3aed]/10 text-[#c4b5fd] border border-[#7c3aed]/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>{s.status}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                )
              )}

              {/* Students Management Directory (Upgraded Dugsi Pro 2026 Engine) */}
              {activeTab === 'students' && (
                <StudentsView
                  students={students}
                  classes={classes}
                  fees={fees}
                  attendance={attendance}
                  examScores={examScores}
                  subjects={subjects}
                  guardians={guardians}
                  settings={settings}
                  onAddStudent={handleApiAddStudent}
                  onUpdateStudent={handleApiUpdateStudent}
                  onDeleteStudent={handleApiDeleteStudent}
                  onBulkUpdate={handleApiBulkUpdate}
                  onRefreshData={fetchAllData}
                  showToast={showToast}
                  theme={theme}
                  subSection={studentSubSection}
                  onNavigateSubSection={navigateStudentSubSection}
                  selectedStudentProfileId={selectedStudentProfileId}
                  onCloseStudentProfile={handleCloseStudentProfile}
                  onOpenStudentProfile={handleOpenStudentProfile}
                />
              )}

              {/* Modern State-of-the-Art Attendance Suite */}
              {activeTab === "attendance" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <AttendanceView
                    user={user}
                    students={students}
                    classes={classes}
                    attendance={attendance}
                    initialSubTab={attendanceSubSection}
                    onSubTabChange={(sub) => {
                      const validSub = sub;
                      setAttendanceSubSection(validSub);
                      const targetUrl = validSub === "dashboard" ? "/attendance" : `/attendance/${validSub}`;
                      window.history.replaceState({}, "", targetUrl);
                    }}
                    onSaveAttendanceSheet={handleSaveAttendanceSheetModern}
                    onUpdateRecord={handleUpdateSingleAttendanceRecord}
                    onRefreshData={fetchAllData}
                  />
                </motion.div>
              )}

              {/* Fees & Complete Finance Suite */}
              {activeTab === 'fees' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <FinanceView
                    students={students}
                    classes={classes}
                    teachers={teachers}
                    staff={staff}
                    currency={settings.currency}
                    schoolName={settings.schoolName}
                    initialSubTab={financeSubSection}
                    onSubTabChange={(sub) => {
                      const validSub = sub as FinanceSubSection;
                      setFinanceSubSection(validSub);
                      const targetUrl = validSub === 'dashboard' ? '/finance' : `/finance/${validSub}`;
                      window.history.replaceState({}, '', targetUrl);
                    }}
                  />
                </motion.div>
              )}

              {/* Reports Center */}
              {activeTab === 'reports' && (
                <ReportsView
                  students={students}
                  classes={classes}
                  subjects={subjects}
                  examScores={examScores}
                  attendance={attendance}
                  fees={fees}
                  theme={theme}
                />
              )}

              {/* Classes Management */}
              {activeTab === 'classes' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ClassesView
                    classes={classes}
                    students={students}
                    onAddClass={handleAddClass}
                    onUpdateClass={handleUpdateClass}
                    onDeleteClass={handleDeleteClass}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Subjects Management */}
              {activeTab === 'subjects' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <SubjectsView
                    subjects={subjects}
                    classes={classes}
                    onAddSubject={handleAddSubject}
                    onUpdateSubject={handleUpdateSubject}
                    onDeleteSubject={handleDeleteSubject}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Exams tracking */}
              {activeTab === 'exams' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <ExamsView
                    examScores={examScores}
                    students={students}
                    subjects={subjects}
                    classes={classes}
                    onAddExamScore={handleAddExamScore}
                    onUpdateExamScore={handleUpdateExamScore}
                    onDeleteExamScore={handleDeleteExamScore}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* People Management: Teachers, Staff, Guardians */}
              {activeTab === 'people' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <PeopleView
                    teachers={teachers}
                    staff={staff}
                    guardians={guardians}
                    classes={classes}
                    subjects={subjects}
                    students={students}
                    onAddTeacher={handleAddTeacher}
                    onUpdateTeacher={handleUpdateTeacher}
                    onDeleteTeacher={handleDeleteTeacher}
                    onAddStaff={handleAddStaff}
                    onUpdateStaff={handleUpdateStaff}
                    onDeleteStaff={handleDeleteStaff}
                    onAddGuardian={handleAddGuardian}
                    onUpdateGuardian={handleUpdateGuardian}
                    onDeleteGuardian={handleDeleteGuardian}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Staff Attendance */}
              {activeTab === 'staff_attendance' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <StaffAttendanceView
                    staff={staff}
                    teachers={teachers}
                    records={staffAttendance}
                    onSaveAttendance={handleSaveStaffAttendance}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Timetable Schedule */}
              {activeTab === 'timetable' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <TimetableScheduleView
                    timetable={timetable}
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    onAddSlot={handleAddTimetableSlot}
                    onDeleteSlot={handleDeleteTimetableSlot}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Admissions & Student Intake */}
              {activeTab === 'admissions' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AdmissionsView
                    admissions={admissions}
                    classes={classes}
                    onAddAdmission={handleAddAdmission}
                    onUpdateAdmission={handleUpdateAdmission}
                    onEnrollApplicant={handleEnrollApplicant}
                    onDeleteAdmission={handleDeleteAdmission}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Library & Book Borrowing */}
              {activeTab === 'library' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <LibraryView
                    books={libraryBooks}
                    loans={libraryLoans}
                    students={students}
                    onAddBook={handleAddBook}
                    onUpdateBook={handleUpdateBook}
                    onDeleteBook={handleDeleteBook}
                    onIssueLoan={handleIssueLoan}
                    onReturnLoan={handleReturnLoan}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Inventory & Asset Management */}
              {activeTab === 'inventory' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <InventoryView
                    items={inventory}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    theme={theme}
                  />
                </motion.div>
              )}

              {/* Notice Board & Announcements */}
              {activeTab === 'announcements' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AnnouncementsView
                    announcements={announcements}
                    classes={classes}
                    onAddAnnouncement={handleAddAnnouncement}
                    onUpdateAnnouncement={handleUpdateAnnouncement}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    theme={theme}
                    showToast={showToast}
                  />
                </motion.div>
              )}

              {/* Settings Configuration Panel */}
              {/* Settings Configuration Panel */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5]">Qaabaynta / Configuration</h1>
                    <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Habee nidaamka iskuulkaaga, lacagaha aasaasiga ah iyo dashboard-ka</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Form */}
                    <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 lg:col-span-2 space-y-6">
                      <h3 className="font-serif italic text-lg text-[#f5f5f5] flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-[#c4b5fd]" /> System Settings
                      </h3>
                      <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Section 1: School Info */}
                        <div className="space-y-4 border-b border-[#ffffff08] pb-6">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#7c3aed] font-bold">1. Macluumaadka Dugsiga (School Information)</h4>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">School Name</label>
                            <input 
                              type="text"
                              value={settings.schoolName}
                              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Academic Year</label>
                              <input 
                                type="text"
                                value={settings.academicYear || '2025/2026'}
                                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">School Email</label>
                              <input 
                                type="email"
                                value={settings.schoolEmail || 'admin@dugsigapro.edu'}
                                onChange={(e) => setSettings({ ...settings, schoolEmail: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">School Phone</label>
                              <input 
                                type="text"
                                value={settings.schoolPhone || '252615000000'}
                                onChange={(e) => setSettings({ ...settings, schoolPhone: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">School Address</label>
                              <input 
                                type="text"
                                value={settings.schoolAddress || 'Mogadishu, Somalia'}
                                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Finances */}
                        <div className="space-y-4 border-b border-[#ffffff08] pb-6">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#7c3aed] font-bold">2. Lacagaha & Naqshada (Finance & Theme)</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Currency Symbol</label>
                              <input 
                                type="text"
                                value={settings.currency}
                                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Default Monthly Fee Amount</label>
                              <input 
                                type="number"
                                value={settings.feeAmount}
                                onChange={(e) => setSettings({ ...settings, feeAmount: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">System Visual Theme</label>
                            <select 
                              value={settings.systemTheme}
                              onChange={(e) => setSettings({ ...settings, systemTheme: e.target.value as any })}
                              className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                            >
                              <option value="light">Light Theme Mode</option>
                              <option value="dark">Dark Theme Mode</option>
                            </select>
                          </div>
                        </div>

                        {/* Section 3: Grade Thresholds */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#7c3aed] font-bold">3. Xadka Gudbista & Darajooyinka (Pass & Grade Thresholds)</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Grade Pass Percentage (%)</label>
                              <input 
                                type="number"
                                value={settings.passThreshold || 60}
                                onChange={(e) => setSettings({ ...settings, passThreshold: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Grade A Threshold (%)</label>
                              <input 
                                type="number"
                                value={settings.gradeAThreshold || 90}
                                onChange={(e) => setSettings({ ...settings, gradeAThreshold: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Grade B Threshold (%)</label>
                              <input 
                                type="number"
                                value={settings.gradeBThreshold || 80}
                                onChange={(e) => setSettings({ ...settings, gradeBThreshold: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Grade C Threshold (%)</label>
                              <input 
                                type="number"
                                value={settings.gradeCThreshold || 70}
                                onChange={(e) => setSettings({ ...settings, gradeCThreshold: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-widest text-[#737373] font-semibold">Grade D Threshold (%)</label>
                              <input 
                                type="number"
                                value={settings.gradeDThreshold || 60}
                                onChange={(e) => setSettings({ ...settings, gradeDThreshold: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                              />
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="px-5 py-2.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] uppercase tracking-widest text-[10px] font-bold transition-colors shadow-md"
                        >
                          Kaydi Qaabaynta (Save Settings)
                        </button>
                      </form>
                    </div>

                    <div className="space-y-6">
                      {/* Database Backup Tool */}
                      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 space-y-4">
                        <h3 className="font-serif italic text-lg text-[#f5f5f5] flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" /> Database Backup
                        </h3>
                        <p className="text-xs text-[#a3a3a3] leading-relaxed">
                          La soco xogtaada guud ahaan. Halkan waxaad kala soo bixi kartaa dhammaan xogta iskuulka, ama aad ku soo celin kartaa backup hore.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 text-center text-[10px] uppercase tracking-wider text-gray-400 bg-black/40 p-3 rounded border border-white/5 font-mono">
                          <div>
                            <p className="text-white font-bold">{students.length}</p>
                            <p className="text-gray-500">Students</p>
                          </div>
                          <div>
                            <p className="text-white font-bold">{classes.length}</p>
                            <p className="text-gray-500">Classes</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-white font-bold">{subjects.length}</p>
                            <p className="text-gray-500">Subjects</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-white font-bold">{examScores.length}</p>
                            <p className="text-gray-500">Exams</p>
                          </div>
                        </div>

                        <button 
                          onClick={handleExportAllData}
                          className="w-full py-2.5 px-4 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-[10px] font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Dhoofi Xogta (Export JSON)</span>
                        </button>

                        <label className="w-full py-2.5 px-4 rounded-sm bg-amber-600 hover:bg-amber-700 text-white uppercase tracking-widest text-[10px] font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Soo Celi Xogta (Import JSON)</span>
                          <input 
                            type="file"
                            accept=".json"
                            onChange={handleImportAllData}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Danger zone panel */}
                      <div className="bg-[#0f0f0f] border border-rose-500/20 rounded-sm p-6 space-y-4">
                        <h3 className="font-serif italic text-lg text-rose-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Danger Zone
                        </h3>
                        <p className="text-xs text-[#a3a3a3] leading-relaxed">
                          Tirtir dhammaan macluumaadka iskuulka ee online-ka iyo backup-ka labadaba. Tani dib uma noqonayso!
                        </p>
                        <button 
                          onClick={handleFactoryReset}
                          className="w-full py-2.5 px-4 rounded-sm bg-rose-500 hover:bg-rose-600 text-white uppercase tracking-widest text-[10px] font-bold transition-colors shadow-md focus:outline-none"
                        >
                          Factory Reset System
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* ==============================================
         MODALS (STUDENT / FEE INVOICE / AUDIT TRAILS)
         ============================================== */}

      {/* 0. STUDENT 360° PROFILE MODAL */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          classes={classes}
          fees={fees}
          attendance={attendance}
          examScores={examScores}
          subjects={subjects}
          onClose={() => setSelectedStudentForProfile(null)}
          theme={theme}
        />
      )}

      {/* 1. STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-md shadow-2xl p-6 relative">
            <button className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]" onClick={() => setShowStudentModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-serif italic text-[#f5f5f5] mb-6">
              {editingStudent ? 'Tafatir Ardayga (Edit Student)' : 'Arday Cusub (Add New Student)'}
            </h2>
            <form onSubmit={handleStudentFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Magaca oo Buuxa (Full Name) *</label>
                <input 
                  type="text"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Class / Grade *</label>
                  <select 
                    value={studentForm.class}
                    onChange={(e) => setStudentForm({ ...studentForm, class: e.target.value })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  >
                    <option value="">-- Dooro Fasal --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.className}>{c.className}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Lab/Dhedig (Gender)</label>
                  <select 
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Taleefanka Waalidka (Guardian Phone)</label>
                <input 
                  type="text"
                  value={studentForm.guardianPhone}
                  onChange={(e) => setStudentForm({ ...studentForm, guardianPhone: e.target.value })}
                  className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                  placeholder="+25261xxxxxx"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Dooro Status-ka</label>
                <select 
                  value={studentForm.status}
                  onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as any })}
                  className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="active">Active (Firfircoon)</option>
                  <option value="inactive">Inactive (Aan firfircoonayn)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Sawirka Ardayga (Student Photo)</label>
                <div 
                  className="border border-dashed border-[#ffffff20] rounded-sm p-4 text-center cursor-pointer hover:border-[#7c3aed] transition-colors bg-[#0a0a0a] flex flex-col items-center justify-center gap-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      handlePhotoUpload(file);
                    }
                  }}
                  onClick={() => document.getElementById('student-photo-file')?.click()}
                >
                  {studentForm.photo ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={studentForm.photo} alt="Student preview" className="w-16 h-16 rounded-full object-cover border border-[#7c3aed]" />
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sawirka waa diyaar (Photo ready)</span>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setStudentForm(prev => ({ ...prev, photo: '' }));
                        }}
                        className="text-[9px] text-rose-400 hover:underline uppercase font-bold mt-1"
                      >
                        Ka saar (Remove)
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-[#737373]">
                      <Camera className="w-5 h-5 mx-auto text-[#737373]" />
                      <p className="text-[10px] uppercase tracking-wider font-bold">Giri ama ku rid sawir (Drag or Click to Upload)</p>
                      <p className="text-[9px] text-[#525252]">PNG, JPG up to 1MB</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="student-photo-file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff05] text-[10px] uppercase tracking-widest font-bold"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Kaydinaya...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. FEE MODAL */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-md shadow-2xl p-6 relative">
            <button className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]" onClick={() => setShowFeeModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-serif italic text-[#f5f5f5] mb-6">
              {editingFee ? 'Qaab Lacag bixin / Tafatir Invoice' : 'Abuur Biil Cusub (New Fee Invoice)'}
            </h2>
            <form onSubmit={handleFeeFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Dooro Ardayga (Select Student) *</label>
                <select 
                  value={feeForm.studentId}
                  onChange={(e) => setFeeForm({ ...feeForm, studentId: e.target.value })}
                  className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] disabled:opacity-50"
                  required
                  disabled={!!editingFee}
                >
                  <option value="">-- Dooro Ardayga --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Month *</label>
                  <select 
                    value={feeForm.month}
                    onChange={(e) => setFeeForm({ ...feeForm, month: e.target.value })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  >
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Year *</label>
                  <input 
                    type="number"
                    value={feeForm.year}
                    onChange={(e) => setFeeForm({ ...feeForm, year: Number(e.target.value) })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Biilka oo dhan ({settings.currency}) *</label>
                  <input 
                    type="number"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#737373] uppercase tracking-wider text-[9px]">Lacagta La Bixiyey ({settings.currency}) *</label>
                  <input 
                    type="number"
                    value={feeForm.paidAmount}
                    onChange={(e) => setFeeForm({ ...feeForm, paidAmount: Number(e.target.value) })}
                    className="w-full px-4.5 py-2.5 rounded-sm border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowFeeModal(false)}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff05] text-[10px] uppercase tracking-widest font-bold"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] text-[10px] uppercase tracking-widest font-bold disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Kaydinaya...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TRANSACTION AUDIT trail HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm w-full max-w-lg shadow-2xl p-6 relative">
            <button className="absolute right-4 top-4 p-1.5 rounded-sm text-[#737373] hover:bg-[#ffffff05]" onClick={() => setShowHistoryModal(null)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-serif italic text-[#f5f5f5] mb-2">
              Audit Logs & Payments
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-[#737373] mb-6">Taariikhda lacag bixinta iyo dhaqdhaqaaqa biilka: #{showHistoryModal.id.substring(0,8)}</p>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {(showHistoryModal.history || []).length > 0 ? (
                <div className="relative border-l border-[#ffffff10] pl-4 space-y-4 text-xs font-mono ml-2">
                  {(showHistoryModal.history || []).map((hist, index) => (
                    <div key={index} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7c3aed] border-2 border-[#0a0a0a]"></span>
                      <div className="p-3.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] space-y-1">
                        <div className="flex items-center justify-between font-bold text-[#e5e5e5]">
                          <span>{hist.action}</span>
                        </div>
                        <span className="text-[10px] text-[#737373] block">{new Date(hist.date).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#737373]">Wax dhaqdhaqaaq ah laguma qorin biilkan</div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-[#ffffff10]">
              <button 
                type="button" 
                onClick={() => setShowHistoryModal(null)}
                className="px-5 py-2 rounded-sm bg-[#ffffff05] border border-[#ffffff10] text-[#e5e5e5] text-[10px] uppercase tracking-widest font-bold hover:bg-[#ffffff10] transition-colors"
              >
                Xir (Close Logs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL REUSABLE CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0e111a] border border-[#ffffff10] rounded-xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>
              
              <h3 className="text-xl font-serif italic text-white mb-2 flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-400" />
                {confirmModal.title || 'Ma hubtaa?'}
              </h3>
              
              <p className="text-xs text-[#94a3b8] leading-relaxed mb-6">
                {confirmModal.message}
              </p>

              <div className="flex items-center justify-end gap-3 font-bold text-[10px] uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-sm border border-[#ffffff10] text-[#737373] hover:text-[#e5e5e5] hover:bg-[#ffffff05] uppercase tracking-widest font-bold"
                >
                  No (Huri)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="px-5 py-2 rounded-sm bg-rose-500 hover:bg-rose-600 text-white uppercase tracking-widest font-bold shadow-lg shadow-rose-950/20"
                >
                  Yes (Hubaal)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
