export interface Student {
  id: string;
  fullName: string;
  class: string;
  gender: string;
  guardianPhone: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  photo?: string;
  dateOfBirth?: string;
  address?: string;
  guardianName?: string;
  section?: string;
  rollNumber?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused' | 'Leave';

export interface AttendanceRecord {
  date: string;
  studentId: string;
  status: AttendanceStatus;
  timestamp: string;
  sessionType?: 'before_break' | 'after_break';
  reason?: string;
  note?: string;
}

export type Attendance = AttendanceRecord;

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName?: string; // dynamically appended for lists
  month: string;
  year: number;
  amount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
  updatedAt: string;
  history: Array<{
    action: string;
    amount: number;
    date: string;
  }>;
}

export interface SchoolClass {
  id: string;
  className: string;
  teacherName: string;
  roomNumber: string;
  description: string;
  createdAt: string;
  section?: string;
  capacity?: number;
  academicYear?: string;
  status?: 'active' | 'inactive';
}

export interface SchoolSubject {
  id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  teacherName: string;
  createdAt: string;
  category?: string;
  description?: string;
  passMarks?: number;
  maxMarks?: number;
  status?: 'active' | 'inactive';
}

export interface ExamScore {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subjectName: string;
  examName: string;
  term: string;
  maxMarks: number;
  marksObtained: number;
  grade: string;
  examDate: string;
  createdAt: string;
}

export interface SystemSettings {
  schoolName: string;
  currency: string;
  feeAmount: number;
  systemTheme: 'light' | 'dark';
  academicYear?: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  passThreshold?: number;
  gradeAThreshold?: number;
  gradeBThreshold?: number;
  gradeCThreshold?: number;
  gradeDThreshold?: number;
}

export interface DbStatus {
  connected: boolean;
  fallbackMode: boolean;
  customSupabaseActive?: boolean;
  customSupabaseConfigured?: boolean;
  supabaseUrl: string;
  sqlScript: string;
}

/* =========================================================
   NEW MODERNIZED TYPES (DUGSI PRO 2026 EXTENSION)
   ========================================================= */

export type StaffRole = 
  | 'Teacher' 
  | 'Principal' 
  | 'Vice Principal' 
  | 'Accountant' 
  | 'Administrator' 
  | 'Receptionist' 
  | 'Librarian' 
  | 'Staff';

export interface Teacher {
  id: string;
  schoolId?: string;
  teacherId: string;
  name: string;
  photo?: string;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
  phone: string;
  email?: string;
  address?: string;
  qualification: string;
  specialization: string;
  hireDate: string;
  employmentStatus: 'Full-Time' | 'Part-Time' | 'Contract' | 'On Leave' | 'Terminated';
  salary: number;
  emergencyContact?: string;
  notes?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  status?: 'INVITED' | 'ACTIVE' | 'DEACTIVATED' | 'INACTIVE';
  invitationToken?: string;
  invitationExpiresAt?: string;
  invitationSentAt?: string;
  activatedAt?: string;
  createdAt: string;
}

export interface AuthUser {
  email: string;
  role: 'admin' | 'teacher' | 'staff';
  schoolId: string;
  name?: string;
  teacherId?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  token?: string;
}

export interface StaffMember {
  id: string;
  schoolId?: string;
  employeeId: string;
  name: string;
  role: StaffRole;
  department: string;
  phone: string;
  email?: string;
  hireDate: string;
  salary: number;
  employmentStatus: 'Full-Time' | 'Part-Time' | 'Contract' | 'On Leave' | 'Terminated';
  notes?: string;
  createdAt: string;
}

export interface Guardian {
  id: string;
  schoolId?: string;
  guardianId: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Uncle' | 'Aunt' | 'Guardian';
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
  studentIds: string[];
  notes?: string;
  createdAt: string;
}

export interface StaffAttendanceRecord {
  id: string;
  schoolId?: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Leave';
  timestamp: string;
  notes?: string;
}

export type StaffAttendance = StaffAttendanceRecord;

export interface TimetableSlot {
  id: string;
  schoolId?: string;
  academicYear: string;
  term: string;
  className: string;
  teacherName: string;
  subjectName: string;
  roomNumber: string;
  day: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Admission {
  id: string;
  schoolId?: string;
  applicantName: string;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
  desiredClass: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelationship?: string;
  admissionDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Enrolled';
  notes?: string;
  studentId?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  schoolId?: string;
  title: string;
  message: string;
  audience: 'Everyone' | 'Teachers' | 'Students' | 'Parents' | 'Staff' | 'Class';
  targetClass?: string;
  author: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: 'Active' | 'Archived';
  publishDate: string;
  expiryDate?: string;
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  schoolId?: string;
  isbn?: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  createdAt: string;
}

export interface LibraryLoan {
  id: string;
  schoolId?: string;
  bookId: string;
  bookTitle: string;
  borrowerType: 'Student' | 'Teacher' | 'Staff';
  borrowerId: string;
  borrowerName: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Borrowed' | 'Returned' | 'Overdue';
}

export interface InventoryItem {
  id: string;
  schoolId?: string;
  itemName: string;
  category: 'Furniture' | 'Electronics' | 'Lab Equipment' | 'Sports' | 'Books' | 'Other';
  quantity: number;
  location: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Needs Repair' | 'Damaged';
  purchaseDate: string;
  purchaseCost: number;
  assignedTo?: string;
  status: 'Available' | 'In Use' | 'Under Maintenance' | 'Disposed';
  notes?: string;
}

export interface SchoolDocument {
  id: string;
  schoolId?: string;
  title: string;
  category: 'student' | 'teacher' | 'staff' | 'admission' | 'school';
  relatedId?: string;
  relatedName?: string;
  fileType: string;
  fileSize?: string;
  fileUrl?: string;
  uploadDate: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  schoolId?: string;
  title: string;
  message: string;
  channel: 'in_app' | 'whatsapp' | 'email';
  recipient: string;
  recipientName?: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Draft';
  createdAt: string;
}

export interface RolePermission {
  role: StaffRole | 'Super Admin' | 'School Admin';
  permissions: string[];
}

/* =========================================================================
   FINANCE & ACCOUNTING MODULE TYPES
   ========================================================================= */

export type FeeCategory = 
  | 'Monthly Tuition'
  | 'Term Fee'
  | 'Admission Fee'
  | 'Exam Fee'
  | 'Transport Fee'
  | 'Library Fee'
  | 'Other Fee';

export type FeeBillingPeriod = 'Monthly' | 'Term' | 'Academic Year' | 'One-Time';

export interface FeeStructure {
  id: string;
  schoolId?: string;
  name: string;
  category: FeeCategory;
  amount: number;
  className?: string; // or 'All Classes'
  academicYear?: string;
  term?: string;
  billingPeriod?: FeeBillingPeriod;
  dueDate?: string;
  isActive?: boolean;
  description?: string;
  createdAt?: string;
}

export type InvoiceStatus = 'Draft' | 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';

export interface InvoiceItem {
  id: string;
  feeStructureId?: string;
  name: string;
  category: FeeCategory | string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  schoolId?: string;
  studentId: string;
  studentName?: string;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaymentMethod = 'Cash' | 'Bank' | 'EVC Plus' | 'Zaad' | 'Other';

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  schoolId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  studentId?: string;
  studentName?: string;
  className?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  remainingBalance?: number;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface DiscountRecord {
  id: string;
  schoolId?: string;
  invoiceId: string;
  invoiceNumber?: string;
  studentId: string;
  studentName?: string;
  className?: string;
  discountType: 'fixed' | 'percentage';
  value: number;
  amount: number; // Final monetary discount
  reason: string;
  approvedBy: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  schoolId?: string;
  paymentId: string;
  receiptNumber?: string;
  invoiceId: string;
  invoiceNumber?: string;
  studentId: string;
  studentName?: string;
  className?: string;
  refundAmount: number;
  paymentMethod: PaymentMethod;
  reason: string;
  approvedBy: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export type FinanceSubSection = 
  | 'dashboard'
  | 'fee-structures'
  | 'invoices'
  | 'payments'
  | 'outstanding'
  | 'discounts'
  | 'expenses'
  | 'refunds'
  | 'receipts'
  | 'reports';

export type ExpenseCategory = 
  | 'Salaries'
  | 'Rent'
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Office Supplies'
  | 'Books'
  | 'Transportation'
  | 'Maintenance'
  | 'Equipment'
  | 'Cleaning'
  | 'Security'
  | 'Marketing'
  | 'Events'
  | 'Other';

export type ExpenseStatus = 'Draft' | 'Approved' | 'Paid' | 'Cancelled';

export interface ExpenseRecord {
  id: string;
  schoolId?: string;
  expenseId?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  vendorPayee: string;
  referenceNumber?: string;
  receiptDocument?: string;
  createdBy: string;
  notes?: string;
  status: ExpenseStatus;
  payrollId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type IncomeCategory =
  | 'Student Fees'
  | 'Admission Fees'
  | 'Exam Fees'
  | 'Transport Fees'
  | 'Library Fees'
  | 'Donations'
  | 'Grants'
  | 'Other Income';

export interface IncomeRecord {
  id: string;
  schoolId?: string;
  incomeId?: string;
  category: IncomeCategory;
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  payer: string;
  notes?: string;
  createdBy: string;
  paymentId?: string;
  createdAt: string;
}

export interface BudgetRecord {
  id: string;
  schoolId?: string;
  academicYear: string;
  period: string; // e.g. 'Annual', 'Term 1', 'September 2026'
  category: ExpenseCategory | IncomeCategory | string;
  type: 'Expense' | 'Income';
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  variance: number;
  notes?: string;
  createdAt: string;
}

export type PayrollStatus = 'Draft' | 'Approved' | 'Paid' | 'Cancelled';

export interface PayrollRecord {
  id: string;
  schoolId?: string;
  employeeType: 'Teacher' | 'Staff';
  employeeId: string;
  employeeName: string;
  roleOrDepartment?: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  payrollPeriod: string;
  status: PayrollStatus;
  notes?: string;
  paidAt?: string;
  expenseId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfitAndLossReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<string, number>;
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
}

export interface CashFlowReport {
  period: string;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  inflowsByCategory: Record<string, number>;
  outflowsByCategory: Record<string, number>;
  timeline: Array<{ date: string; type: 'inflow' | 'outflow'; amount: number; description: string }>;
}

