-- ============================================================================
-- DUGSI PRO 2026 - MIGRATION 02: ACADEMIC & HR TABLES (9-20)
-- ============================================================================

-- 9. Teachers Table
CREATE TABLE IF NOT EXISTS dugsiga_teachers (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  teacher_id TEXT,
  name TEXT NOT NULL,
  photo TEXT,
  gender TEXT DEFAULT 'Male',
  date_of_birth TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  qualification TEXT,
  specialization TEXT,
  hire_date TEXT,
  employment_status TEXT DEFAULT 'Full-Time',
  salary NUMERIC DEFAULT 0,
  emergency_contact TEXT,
  notes TEXT,
  assigned_classes JSONB DEFAULT '[]'::jsonb,
  assigned_subjects JSONB DEFAULT '[]'::jsonb,
  created_at TEXT
);

-- 10. Staff Members Table
CREATE TABLE IF NOT EXISTS dugsiga_staff (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  employee_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  email TEXT,
  hire_date TEXT,
  salary NUMERIC DEFAULT 0,
  employment_status TEXT DEFAULT 'Full-Time',
  notes TEXT,
  created_at TEXT
);

-- 11. Guardians Table
CREATE TABLE IF NOT EXISTS dugsiga_guardians (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  guardian_id TEXT,
  name TEXT NOT NULL,
  relationship TEXT DEFAULT 'Father',
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  emergency_contact TEXT,
  student_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TEXT
);

-- 12. Staff Attendance Table
CREATE TABLE IF NOT EXISTS dugsiga_staff_attendance (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT,
  role TEXT,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT,
  notes TEXT
);

-- 13. Timetable Table
CREATE TABLE IF NOT EXISTS dugsiga_timetable (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  academic_year TEXT DEFAULT '2026-2027',
  term TEXT DEFAULT 'Term 1',
  class_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  room_number TEXT,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

-- 14. Admissions Table
CREATE TABLE IF NOT EXISTS dugsiga_admissions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  gender TEXT DEFAULT 'Male',
  date_of_birth TEXT,
  desired_class TEXT NOT NULL,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_relationship TEXT,
  admission_date TEXT,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  student_id TEXT,
  created_at TEXT
);

-- 15. Announcements Table
CREATE TABLE IF NOT EXISTS dugsiga_announcements (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT DEFAULT 'Everyone',
  target_class TEXT,
  author TEXT,
  priority TEXT DEFAULT 'Normal',
  status TEXT DEFAULT 'Active',
  publish_date TEXT,
  expiry_date TEXT,
  created_at TEXT
);

-- 16. Library Books Table
CREATE TABLE IF NOT EXISTS dugsiga_library_books (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT,
  total_copies INTEGER DEFAULT 1,
  available_copies INTEGER DEFAULT 1,
  location TEXT,
  created_at TEXT
);

-- 17. Library Loans Table
CREATE TABLE IF NOT EXISTS dugsiga_library_loans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  book_title TEXT,
  borrower_type TEXT NOT NULL DEFAULT 'Student',
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT DEFAULT 'Borrowed'
);

-- 18. Inventory Table
CREATE TABLE IF NOT EXISTS dugsiga_inventory (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'Furniture',
  quantity INTEGER DEFAULT 1,
  location TEXT,
  condition TEXT DEFAULT 'Good',
  purchase_date TEXT,
  purchase_cost NUMERIC DEFAULT 0,
  assigned_to TEXT,
  status TEXT DEFAULT 'Available',
  notes TEXT
);

-- 19. Documents Table
CREATE TABLE IF NOT EXISTS dugsiga_documents (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  related_id TEXT,
  related_name TEXT,
  file_type TEXT,
  file_size TEXT,
  file_url TEXT,
  upload_date TEXT,
  notes TEXT
);

-- 20. Notifications Table
CREATE TABLE IF NOT EXISTS dugsiga_notifications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'in_app',
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'Sent',
  created_at TEXT
);
