import "express-async-errors";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { withSupabase, createSupabaseContext } from "@supabase/server";
import { registerModernRoutes } from "./server/modernRoutes";
import { registerFinanceRoutes } from "./server/financeRoutes";
import { 
  getAuthenticatedUser, 
  createSessionToken, 
  hashPassword, 
  verifyPassword, 
  legacySimpleHash,
  initializeSessionStore,
  revokeSession,
  revokeAllUserSessions,
  hashToken
} from "./server/authSession";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTeacherInvitationEmail
} from "./server/emailService";
import {
  validateBody,
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  studentSchema
} from "./server/validators";
import { createRateLimiter } from "./server/securityRateLimiter";

// Load environment variables
dotenv.config({ override: true });

// Also inspect /app/.dev.env.json if available in AI Studio environment
if (fs.existsSync("/app/.dev.env.json")) {
  try {
    const devEnv = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf-8"));
    for (const [k, v] of Object.entries(devEnv)) {
      if (!process.env[k] && typeof v === "string") {
        process.env[k] = v;
      }
    }
  } catch (e) {}
}

// Normalize/Clean all Supabase-related environment variables for both SDKs
const envKeysToClean = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_JWKS_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM"
];
for (const key of envKeysToClean) {
  if (process.env[key]) {
    let val = process.env[key]!.trim();
    while ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim();
    }
    process.env[key] = val;
  }
}

// Normalize short/bare project IDs for SUPABASE_URL if necessary (e.g. "mdvfcqujqjnvfpzowayo")
if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith("http")) {
  if (!process.env.SUPABASE_URL.includes(".") && !process.env.SUPABASE_URL.includes("/")) {
    process.env.SUPABASE_URL = `https://${process.env.SUPABASE_URL}.supabase.co`;
  } else {
    process.env.SUPABASE_URL = `https://${process.env.SUPABASE_URL}`;
  }
}

// Resilient key mapping:
// 1. If user pasted sb_publishable_ key into SUPABASE_SECRET_KEY, map to SUPABASE_PUBLISHABLE_KEY
if (process.env.SUPABASE_SECRET_KEY?.startsWith("sb_publishable_")) {
  if (!process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY.length < 30) {
    process.env.SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_SECRET_KEY;
  }
}

// 2. If SUPABASE_PUBLISHABLE_KEY was set to bare project ID or is too short, use SUPABASE_ANON_KEY
if (process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY.length < 30) {
  if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.startsWith("ey")) {
    process.env.SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY;
  }
}

// 3. If SUPABASE_JWKS_URL is a raw JWT Secret string instead of a URL, preserve it and set standard JWKS URL
if (process.env.SUPABASE_JWKS_URL && !process.env.SUPABASE_JWKS_URL.startsWith("http")) {
  process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWKS_URL;
  if (process.env.SUPABASE_URL) {
    process.env.SUPABASE_JWKS_URL = `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  }
}

// 4. Auto-complete SMTP_FROM if user only entered username without @gmail.com
if (process.env.SMTP_FROM && !process.env.SMTP_FROM.includes("@")) {
  if (process.env.SMTP_USER && process.env.SMTP_USER.includes("@")) {
    process.env.SMTP_FROM = process.env.SMTP_USER;
  } else {
    process.env.SMTP_FROM = `${process.env.SMTP_FROM}@gmail.com`;
  }
}

function sanitizeEnvValue(val: string | undefined): string {
  if (!val) return "";
  let clean = val.trim();
  while ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

function parseSupabaseUrl(url: string | undefined): string {
  let clean = sanitizeEnvValue(url);
  if (!clean) return "";
  let isSecure = true;
  if (clean.toLowerCase().startsWith("https://")) {
    clean = clean.slice(8);
  } else if (clean.toLowerCase().startsWith("http://")) {
    clean = clean.slice(7);
    isSecure = false;
  }
  const slashIdx = clean.indexOf("/");
  if (slashIdx !== -1) {
    clean = clean.slice(0, slashIdx);
  }
  if (clean && !clean.includes(".")) {
    clean = clean + ".supabase.co";
  }
  return (isSecure ? "https://" : "http://") + clean;
}

const app = express();
const PORT = 3000;

// Security & tracing: Request ID, permissive CORS for AI Studio preview iframe, and strict body limits
app.use((req, res, next) => {
  const reqId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("X-Request-Id", reqId);
  (req as any).requestId = reqId;
  next();
});

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-School-Email, X-Session-Token, X-Auth-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Initialize Supabase Client with resilient key resolution
function deriveSupabaseKey(): string {
  const secretKey = sanitizeEnvValue(process.env.SUPABASE_SECRET_KEY || "");
  const anonKey = sanitizeEnvValue(process.env.SUPABASE_ANON_KEY || "");
  const jwtSecret = sanitizeEnvValue(process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_JWKS_URL || "");

  // 1. If secretKey is already a valid JWT service_role key
  if (secretKey.startsWith("ey")) {
    try {
      const parts = secretKey.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
        if (payload.role === "service_role") {
          return secretKey;
        }
      }
    } catch {}
  }

  // 2. If JWT secret is provided and anonKey is available,
  // derive the authenticated service_role key for full direct cloud access:
  if (jwtSecret && !jwtSecret.startsWith("http") && anonKey.startsWith("ey")) {
    try {
      const parts = anonKey.split(".");
      if (parts.length === 3) {
        const anonPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
        const servicePayload = { ...anonPayload, role: "service_role" };
        const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
        const p = Buffer.from(JSON.stringify(servicePayload)).toString("base64url");
        const s = crypto.createHmac("sha256", jwtSecret).update(`${h}.${p}`).digest("base64url");
        return `${h}.${p}.${s}`;
      }
    } catch (e) {
      console.warn("Could not derive service_role token from JWT secret:", e);
    }
  }

  // 3. If secretKey is provided and not a publishable key
  if (secretKey && !secretKey.startsWith("sb_publish")) {
    return secretKey;
  }

  return anonKey || secretKey;
}

const supabaseUrl = parseSupabaseUrl(process.env.SUPABASE_URL || "https://mdvfcqujqjnvfpzowayo.supabase.co");
const supabaseAnonKey = sanitizeEnvValue(process.env.SUPABASE_ANON_KEY || "");
const supabaseSecretKey = sanitizeEnvValue(process.env.SUPABASE_SECRET_KEY || "");
const supabaseActiveKey = deriveSupabaseKey();

let supabase: any = null;
try {
  if (supabaseUrl && supabaseActiveKey) {
    supabase = createClient(supabaseUrl, supabaseActiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
} catch (err) {
  console.error("Failed to initialize Supabase client:", err);
}

// ✅ NO EMAIL VERIFICATION - Auto verified

// Local database fallback
const LOCAL_DB_PATH = path.join(process.cwd(), "database.json");

interface LocalDB {
  users: Array<{ email: string; password_hash: string; verified: boolean; verification_code?: string; role?: string }>;
  students: Array<any>;
  attendance: Array<{ schoolId?: string; date: string; studentId: string; status: string; timestamp: string; sessionType?: string }>;
  fees: Array<any>;
  classes: Array<{ id: string; schoolId?: string; className: string; teacherName: string; roomNumber: string; description: string; createdAt: string; section?: string; capacity?: number; academicYear?: string; status?: string }>;
  subjects: Array<{ id: string; schoolId?: string; subjectName: string; subjectCode: string; className: string; teacherName: string; createdAt: string; category?: string; description?: string; passMarks?: number; maxMarks?: number; status?: string }>;
  examScores: Array<{ id: string; schoolId?: string; studentId: string; studentName: string; className: string; subjectName: string; examName: string; term: string; maxMarks: number; marksObtained: number; grade: string; examDate: string; createdAt: string }>;
  settings: any;
  teachers?: Array<any>;
  staff?: Array<any>;
  guardians?: Array<any>;
  staffAttendance?: Array<any>;
  timetable?: Array<any>;
  admissions?: Array<any>;
  announcements?: Array<any>;
  libraryBooks?: Array<any>;
  libraryLoans?: Array<any>;
  inventory?: Array<any>;
  documents?: Array<any>;
  notifications?: Array<any>;
  feeStructures?: Array<any>;
  invoices?: Array<any>;
  payments?: Array<any>;
  expenses?: Array<any>;
  income?: Array<any>;
  budgets?: Array<any>;
  payroll?: Array<any>;
}

const defaultSettings = {
  schoolName: "Dugsiga Pro 2026",
  currency: "USD",
  feeAmount: 50,
  systemTheme: "light"
};

function loadLocalDB(): LocalDB {
  const ensureArrays = (db: any): LocalDB => {
    if (!db.users) db.users = [];
    if (!db.students) db.students = [];
    if (!db.attendance) db.attendance = [];
    if (!db.fees) db.fees = [];
    if (!db.classes) db.classes = [];
    if (!db.subjects) db.subjects = [];
    if (!db.examScores) db.examScores = [];
    if (!db.settings) db.settings = defaultSettings;
    if (!db.teachers) db.teachers = [];
    if (!db.staff) db.staff = [];
    if (!db.guardians) db.guardians = [];
    if (!db.staffAttendance) db.staffAttendance = [];
    if (!db.timetable) db.timetable = [];
    if (!db.admissions) db.admissions = [];
    if (!db.announcements) db.announcements = [];
    if (!db.libraryBooks) db.libraryBooks = [];
    if (!db.libraryLoans) db.libraryLoans = [];
    if (!db.inventory) db.inventory = [];
    if (!db.documents) db.documents = [];
    if (!db.notifications) db.notifications = [];
    if (!db.feeStructures) db.feeStructures = [];
    if (!db.invoices) db.invoices = [];
    if (!db.payments) db.payments = [];
    if (!db.expenses) db.expenses = [];
    if (!db.income) db.income = [];
    if (!db.budgets) db.budgets = [];
    if (!db.payroll) db.payroll = [];
    if (!db.discounts) db.discounts = [];
    if (!db.refunds) db.refunds = [];
    return db;
  };

  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const seedPath = path.join(process.cwd(), "database.seed.json");
    if (fs.existsSync(seedPath)) {
      try {
        const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
        const initial = ensureArrays(seedData);
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
        return initial;
      } catch (err) {}
    }
    const initial = ensureArrays({ settings: defaultSettings });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    const parsed = JSON.parse(content);
    return ensureArrays(parsed);
  } catch (e) {
    console.error("Failed to parse local DB, recreating...", e);
    const initial = ensureArrays({ settings: defaultSettings });
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function saveLocalDB(data: LocalDB) {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize persistent session store
initializeSessionStore({
  supabase,
  loadLocalDB,
  saveLocalDB
});

function getSchoolId(req: express.Request): string {
  // ZERO TRUST CLIENT: Validate tenant strictly from authenticated session token
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  if (authUser && authUser.schoolId) {
    return authUser.schoolId;
  }
  throw new Error("UNAUTHENTICATED");
}

function buildAuthResponse(cleanEmail: string, db: any) {
  // Check if user is a teacher
  const teacher = (db.teachers || []).find((t: any) => (t.email || "").toLowerCase() === cleanEmail);
  if (teacher) {
    if (teacher.status === "DEACTIVATED") {
      return { error: "Akoonkaaga macallinka waa la hakiyey (Account deactivated). Fadlan la xiriir maamulka iskuulka." };
    }
    if (teacher.status === "INVITED") {
      return { error: "Akoonkan weli lama dhaqaajin. Fadlan isticmaal link-gii casuumaadda ee email-kaaga laguugu soo diray si aad u samaysato password." };
    }
    teacher.lastLoginAt = new Date().toISOString();
    const userPayload: any = {
      email: cleanEmail,
      role: "teacher",
      name: teacher.name,
      teacherId: teacher.id,
      schoolId: teacher.schoolId || cleanEmail,
      assignedClasses: teacher.assignedClasses || [],
      assignedSubjects: teacher.assignedSubjects || []
    };
    const token = createSessionToken(userPayload);
    userPayload.token = token;
    return {
      success: true,
      token,
      user: userPayload
    };
  }

  // Otherwise school administrator
  const userRecord = (db.users || []).find((u: any) => (u.email || "").toLowerCase() === cleanEmail);
  const userPayload: any = {
    email: cleanEmail,
    role: userRecord?.role || "admin",
    schoolId: userRecord?.school_id || cleanEmail
  };
  const token = createSessionToken(userPayload);
  userPayload.token = token;
  return {
    success: true,
    token,
    user: userPayload
  };
}

async function testSupabaseTable(tableName: string, checkColumn?: string): Promise<boolean> {
  if (!supabaseActiveKey || !supabase) return false;
  try {
    const selectStr = checkColumn ? checkColumn : "*";
    const { error } = await supabase.from(tableName).select(selectStr).limit(1);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

let useLocalFallback = false;
let customSupabaseActive = false;

function handleSupabaseError(res: any, error: any, context: string) {
  console.warn(`Backend database notice during "${context}":`, error?.message || error);
  return res.status(500).json({
    error: error?.message || "Khalad ayaa dhacay inta hawsha lagu jiray. Fadlan dib iskugu day."
  });
}

async function syncLocalToSupabase() {
  if (!supabase || useLocalFallback) return;
  try {
    const db = loadLocalDB();
    // 1. Sync any local users missing from Supabase
    if (db.users && db.users.length > 0) {
      const { data: sbUsers } = await supabase.from("dugsiga_users").select("email");
      const existingEmails = new Set((sbUsers || []).map((u: any) => u.email.toLowerCase()));
      for (const u of db.users) {
        if (!existingEmails.has(u.email.toLowerCase())) {
          console.log("Syncing local user to Supabase:", u.email);
          await supabase.from("dugsiga_users").insert([{
            email: u.email.toLowerCase(),
            password: u.password_hash,
            verified: true
          }]);
        }
      }
    }

    // 2. Sync any local classes missing from Supabase
    if (db.classes && db.classes.length > 0) {
      const { data: sbClasses } = await supabase.from("dugsiga_classes").select("school_id, class_name");
      const existingClasses = new Set((sbClasses || []).map((c: any) => `${c.school_id}::${c.class_name.toLowerCase()}`));
      for (const c of db.classes) {
        const key = `${c.schoolId || "default-school"}::${c.className.toLowerCase()}`;
        if (!existingClasses.has(key)) {
          console.log("Syncing local class to Supabase:", c.className);
          await supabase.from("dugsiga_classes").insert([{
            id: c.id || 'cls-' + Math.random().toString(36).substring(2, 11),
            school_id: c.schoolId || "default-school",
            class_name: c.className,
            teacher_name: c.teacherName || "",
            room_number: c.roomNumber || "",
            description: c.description || "",
            created_at: c.createdAt || new Date().toISOString().split("T")[0]
          }]);
        }
      }
    }
  } catch (syncErr) {
    console.warn("Notice during local DB to Supabase sync:", syncErr);
  }
}

async function checkSupabaseStatus() {
  if (!supabaseUrl || !supabaseActiveKey || !supabase) {
    useLocalFallback = true;
    customSupabaseActive = false;
    console.log("Supabase not fully configured. Using local database fallback.");
    return;
  }
  try {
    const studentsExist = await testSupabaseTable("dugsiga_students", "school_id");
    const attendanceExists = await testSupabaseTable("dugsiga_attendance", "school_id");
    const classesExist = await testSupabaseTable("dugsiga_classes", "school_id");
    const subjectsExist = await testSupabaseTable("dugsiga_subjects", "school_id");
    const examsExist = await testSupabaseTable("dugsiga_exam_scores", "school_id");
    const feesExist = await testSupabaseTable("dugsiga_fees", "school_id");
    const settingsExist = await testSupabaseTable("dugsiga_settings", "school_id");
    const usersExist = await testSupabaseTable("dugsiga_users", "email");
    
    if (!studentsExist || !attendanceExists || !classesExist || !subjectsExist || !examsExist || !feesExist || !settingsExist || !usersExist) {
      useLocalFallback = true;
      customSupabaseActive = false;
      console.log("Supabase tables missing, outdated, or incomplete. Operating in local database mode.");
      return;
    }

    // Ping check: verify read and write capability
    const pingKey = `_ping_${Date.now()}`;
    const { error: writeError } = await supabase
      .from("dugsiga_settings")
      .upsert({ school_id: "__health_check__", key: pingKey, value: { ping: true } });

    if (writeError) {
      useLocalFallback = true;
      customSupabaseActive = false;
      console.warn(`Supabase RLS or write permission issue (${writeError.code}: ${writeError.message}). Operating in resilient local database mode.`);
      return;
    }

    // Clean up ping record
    await supabase.from("dugsiga_settings").delete().eq("school_id", "__health_check__").eq("key", pingKey);

    useLocalFallback = false;
    customSupabaseActive = true;
    console.log("✅ Supabase si buuxda ayuu ugu xiran yahay (Direct Supabase Cloud Mode Active).");

    // Perform background data sync so no local changes are lost
    await syncLocalToSupabase();
  } catch (err: any) {
    useLocalFallback = true;
    customSupabaseActive = false;
    console.log("Error checking Supabase, operating in resilient local database mode:", err?.message || err);
  }
}

checkSupabaseStatus();

const SQL_SETUP_SCRIPT = `
-- =========================================================================
-- DUGSI PRO 2026 — PRODUCTION SAFE NON-DESTRUCTIVE DATABASE SETUP
-- Safely creates all core and modernized tables without dropping any data
-- =========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS dugsiga_users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'School Admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS dugsiga_students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL,
  gender TEXT,
  guardian_phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  photo TEXT,
  date_of_birth TEXT,
  address TEXT,
  guardian_name TEXT,
  section TEXT,
  roll_number TEXT
);

-- 3. Classes Table
CREATE TABLE IF NOT EXISTS dugsiga_classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  teacher_name TEXT,
  room_number TEXT,
  description TEXT,
  section TEXT,
  capacity INTEGER,
  academic_year TEXT,
  created_at TEXT
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS dugsiga_subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_code TEXT,
  class_name TEXT,
  teacher_name TEXT,
  category TEXT,
  description TEXT,
  pass_marks NUMERIC DEFAULT 50,
  max_marks NUMERIC DEFAULT 100,
  created_at TEXT
);

-- 5. Exam Scores Table
CREATE TABLE IF NOT EXISTS dugsiga_exam_scores (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  class_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  term TEXT,
  max_marks NUMERIC DEFAULT 100,
  marks_obtained NUMERIC NOT NULL,
  grade TEXT,
  exam_date TEXT,
  created_at TEXT
);

-- 6. Student Attendance Table
CREATE TABLE IF NOT EXISTS dugsiga_attendance (
  school_id TEXT NOT NULL,
  date TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT,
  session_type TEXT DEFAULT 'before_break',
  PRIMARY KEY (school_id, date, student_id, session_type)
);

-- 7. Fees Table
CREATE TABLE IF NOT EXISTS dugsiga_fees (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  history JSONB
);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS dugsiga_settings (
  school_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  PRIMARY KEY (school_id, key)
);

-- 9. Teachers Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_teachers (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  teacher_id TEXT,
  name TEXT NOT NULL,
  photo TEXT,
  gender TEXT,
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
  assigned_classes JSONB,
  assigned_subjects JSONB,
  created_at TEXT
);

-- 10. Staff Members Table (Extension)
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

-- 11. Guardians Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_guardians (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  guardian_id TEXT,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  emergency_contact TEXT,
  student_ids JSONB,
  notes TEXT,
  created_at TEXT
);

-- 12. Staff Attendance Table (Extension)
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

-- 13. Timetable Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_timetable (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  academic_year TEXT,
  term TEXT,
  class_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  room_number TEXT,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

-- 14. Admissions Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_admissions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  gender TEXT,
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

-- 15. Announcements Table (Extension)
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

-- 16. Library Books Table (Extension)
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

-- 17. Library Loans Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_library_loans (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  book_title TEXT,
  borrower_type TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT DEFAULT 'Borrowed'
);

-- 18. Inventory Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_inventory (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  location TEXT,
  condition TEXT DEFAULT 'Good',
  purchase_date TEXT,
  purchase_cost NUMERIC DEFAULT 0,
  assigned_to TEXT,
  status TEXT DEFAULT 'Available',
  notes TEXT
);

-- 19. Documents Table (Extension)
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

-- 20. Notifications Table (Extension)
CREATE TABLE IF NOT EXISTS dugsiga_notifications (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'Sent',
  created_at TEXT
);

-- Enable RLS and establish secure tenant isolation
DO $$
BEGIN
  EXECUTE 'ALTER TABLE dugsiga_users ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_students ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_classes ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_subjects ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_exam_scores ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_attendance ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_fees ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE dugsiga_settings ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

// RBAC Permissions Mapping
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ['*'],
  'School Admin': ['*'],
  'Principal': [
    'students.*', 'teachers.*', 'staff.*', 'guardians.*',
    'attendance.*', 'exams.*', 'classes.*', 'subjects.*',
    'timetable.*', 'admissions.*', 'announcements.*', 'reports.*',
    'communication.*', 'library.*', 'inventory.*', 'finance.view'
  ],
  'Teacher': [
    'students.view', 'attendance.view', 'attendance.manage',
    'exams.view', 'exams.manage', 'classes.view', 'subjects.view',
    'timetable.view', 'reports.view', 'announcements.view'
  ],
  'Accountant': [
    'finance.*', 'students.view', 'reports.view', 'inventory.view', 'announcements.view'
  ],
  'Receptionist': [
    'students.view', 'students.create', 'students.update',
    'admissions.*', 'attendance.view', 'announcements.view', 'communication.*'
  ],
  'Librarian': [
    'library.*', 'students.view', 'staff.view', 'announcements.view'
  ],
  'Staff': [
    'timetable.view', 'announcements.view', 'attendance.view'
  ]
};

function hasPermission(role: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['School Admin'];
  if (permissions.includes('*')) return true;
  if (permissions.includes(requiredPermission)) return true;
  const [domain] = requiredPermission.split('.');
  if (permissions.includes(`${domain}.*`)) return true;
  return false;
}

const simpleHash = legacySimpleHash;

function expressWithSupabase(config: any, handler: any) {
  let webHandler: any = null;
  try {
    webHandler = withSupabase(config, handler);
  } catch (err) {
    console.error("expressWithSupabase initialization failed, will retry lazily:", err);
  }
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      if (!webHandler) {
        try {
          webHandler = withSupabase(config, handler);
        } catch (innerErr: any) {
          return res.status(500).json({
            error: "Failed to initialize Supabase server adapter.",
            message: innerErr?.message || String(innerErr)
          });
        }
      }
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.get("host") || "localhost:3000";
      const fullUrl = `${protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          if (Array.isArray(val)) {
            val.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, val);
          }
        }
      }
      if (process.env.SUPABASE_PUBLISHABLE_KEY) {
        if (!headers.has("apikey")) {
          headers.set("apikey", process.env.SUPABASE_PUBLISHABLE_KEY);
        }
        if (!headers.has("authorization") && req.headers.authorization) {
          headers.set("authorization", req.headers.authorization);
        } else if (!headers.has("authorization")) {
          headers.set("authorization", `Bearer ${process.env.SUPABASE_PUBLISHABLE_KEY}`);
        }
      }
      let body: string | undefined;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.body) {
        body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      }
      const webRequest = new Request(fullUrl, {
        method: req.method,
        headers,
        body,
        duplex: body ? "half" : undefined
      } as any);
      const webResponse = await webHandler(webRequest);
      res.status(webResponse.status);
      webResponse.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const responseText = await webResponse.text();
      res.send(responseText);
    } catch (error) {
      console.error("expressWithSupabase Adapter Error:", error);
      next(error);
    }
  };
}

/* ==============================================
   API ROUTES
   ============================================== */

app.get("/api/db/status", async (req, res) => {
  try {
    await checkSupabaseStatus();
    res.json({
      connected: !useLocalFallback && customSupabaseActive,
      fallbackMode: useLocalFallback,
      customSupabaseActive: customSupabaseActive,
      customSupabaseConfigured: true,
      supabaseUrl: supabaseUrl,
      sqlScript: SQL_SETUP_SCRIPT
    });
  } catch (err: any) {
    console.error("Error in /api/db/status:", err);
    res.status(500).json({
      connected: false,
      fallbackMode: true,
      customSupabaseActive: false,
      customSupabaseConfigured: false,
      supabaseUrl: "",
      error: err.message
    });
  }
});

app.get("/api/docs/download/pdf", (req, res) => {
  const filePath = path.join(process.cwd(), "DUGSI_PRO_2026_FULL_DOCUMENTATION.pdf");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="DUGSI_PRO_2026_FULL_DOCUMENTATION.pdf"');
    res.setHeader("Content-Type", "application/pdf");
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: "PDF documentation not found" });
});

app.get("/api/docs/download/word", (req, res) => {
  const filePath = path.join(process.cwd(), "DUGSI_PRO_2026_FULL_DOCUMENTATION.doc");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="DUGSI_PRO_2026_FULL_DOCUMENTATION.doc"');
    res.setHeader("Content-Type", "application/msword");
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: "Word documentation not found" });
});

app.get("/api/supabase-server-test", expressWithSupabase({ auth: "none" }, async (_req: any, ctx: any) => {
  try {
    const { data: usersData, error: usersError } = await ctx.supabaseAdmin.from("dugsiga_users").select("email").limit(5);
    const { data: studentsData, error: studentsError } = await ctx.supabaseAdmin.from("dugsiga_students").select("id, full_name").limit(5);
    return Response.json({
      status: "success",
      message: "Supabase server SDK successfully configured!",
      env_variables_verified: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY: !!process.env.SUPABASE_PUBLISHABLE_KEY,
        SUPABASE_SECRET_KEY: !!process.env.SUPABASE_SECRET_KEY,
        SUPABASE_JWKS_URL: !!process.env.SUPABASE_JWKS_URL
      },
      has_supabase_client: !!ctx.supabase,
      has_supabase_admin_client: !!ctx.supabaseAdmin,
      test_query_admin_users: usersError ? { error: usersError.message } : usersData,
      test_query_admin_students: studentsError ? { error: studentsError.message } : studentsData
    });
  } catch (err: any) {
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}));

const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Isku dayo badan oo galid/diiwaangelin ah. Fadlan sug wax yar (Too many auth attempts. Please wait a moment)."
});

app.post("/api/auth/signup", authRateLimiter, validateBody(signupSchema), async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = hashPassword(password);

  const db = loadLocalDB();
  const existingLocalUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  // If Supabase is connected, attempt check & sync to Supabase
  if (!useLocalFallback && supabase) {
    try {
      const { data: existingUser } = await supabase
        .from("dugsiga_users")
        .select("email")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: "Email-kan horey ayaa loo diiwaangeliyey. Fadlan 'Sign In' ku gal." });
      }

      // Generate 6-digit verification code
      const verificationCode = crypto.randomInt(100000, 999999).toString();
      const codeHash = hashToken(verificationCode);
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

      const { error: insertError } = await supabase.from("dugsiga_users").insert([{
        email: cleanEmail,
        password: passwordHash,
        verified: false,
        verification_code: codeHash
      }]);

      if (insertError) {
        if (insertError.code === "23505") {
          return res.status(400).json({ error: "Email-kan horey ayaa loo diiwaangeliyey. Fadlan 'Sign In' ku gal." });
        }
        console.warn("Supabase auth insert notice:", insertError.message);
      }

      // Store verification code in persistent settings
      await supabase.from("dugsiga_settings").upsert({
        school_id: "__verifications__",
        key: cleanEmail,
        value: { codeHash, expiresAt }
      });

      // Send verification email
      await sendVerificationEmail({
        toEmail: cleanEmail,
        verificationCode
      });
    } catch (sbErr: any) {
      console.warn("Supabase auth notice:", sbErr?.message || sbErr);
    }
  } else if (existingLocalUser) {
    return res.status(400).json({ error: "Email-kan horey ayaa loo diiwaangeliyey. Fadlan 'Sign In' ku gal." });
  }

  // Always ensure user is saved in local database for seamless resilience
  if (!db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    db.users.push({ email: cleanEmail, password_hash: passwordHash, verified: false });
    saveLocalDB(db);
  }

  const userPayload: any = {
    email: cleanEmail,
    role: "admin",
    schoolId: cleanEmail,
    verified: false
  };
  const token = createSessionToken(userPayload);
  userPayload.token = token;

  res.json({
    success: true,
    message: "Diiwaangelintu way guuleysatay! Koodhka xaqiijinta ayaa laguu soo diray email-kaaga.",
    token,
    user: userPayload,
    emailSent: true
  });
});

app.post("/api/auth/verify", validateBody(verifyEmailSchema), async (req, res) => {
  const { email, code } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const codeHash = hashToken(cleanCode);

  let verified = false;

  // 1. Check Supabase
  if (!useLocalFallback && supabase) {
    try {
      const { data } = await supabase
        .from("dugsiga_settings")
        .select("value")
        .eq("school_id", "__verifications__")
        .eq("key", cleanEmail)
        .maybeSingle();

      if (data && data.value && data.value.expiresAt > Date.now()) {
        if (data.value.codeHash === codeHash) {
          verified = true;
          await supabase.from("dugsiga_settings").delete().eq("school_id", "__verifications__").eq("key", cleanEmail);
        }
      }

      if (!verified) {
        // Fallback check user table verification_code
        const { data: userRow } = await supabase.from("dugsiga_users").select("verification_code").ilike("email", cleanEmail).maybeSingle();
        if (userRow && userRow.verification_code === codeHash) {
          verified = true;
        }
      }

      if (verified) {
        await supabase.from("dugsiga_users").update({ verified: true, verification_code: null }).ilike("email", cleanEmail);
      }
    } catch (e: any) {
      console.warn("Supabase verify notice:", e?.message || e);
    }
  }

  // 2. Check local DB
  const db = loadLocalDB();
  const localIdx = db.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (localIdx > -1) {
    if (!verified && (db.users[localIdx].verification_code === cleanCode || db.users[localIdx].verification_code === codeHash)) {
      verified = true;
    }
    if (verified) {
      db.users[localIdx].verified = true;
      delete db.users[localIdx].verification_code;
      saveLocalDB(db);
    }
  }

  if (!verified) {
    return res.status(400).json({ error: "Koodhka xaqiijintu ma saxna ama wuu dhacay (Invalid or expired code)." });
  }

  return res.json({
    success: true,
    message: "Akoonkaaga si guul leh ayaa loo xaqiijiyey! Hadda waxaad isticmaali kartaa nidaamka."
  });
});

app.post("/api/auth/resend-verification", authRateLimiter, validateBody(resendVerificationSchema), async (req, res) => {
  const { email } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashToken(verificationCode);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  if (!useLocalFallback && supabase) {
    try {
      await supabase.from("dugsiga_settings").upsert({
        school_id: "__verifications__",
        key: cleanEmail,
        value: { codeHash, expiresAt }
      });
      await supabase.from("dugsiga_users").update({ verification_code: codeHash }).ilike("email", cleanEmail);
    } catch {}
  }

  const db = loadLocalDB();
  const localUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (localUser) {
    localUser.verification_code = codeHash;
    saveLocalDB(db);
  }

  await sendVerificationEmail({
    toEmail: cleanEmail,
    verificationCode
  });

  return res.json({
    success: true,
    message: "Koodh cusub oo xaqiijin ah ayaa loo soo diray email-kaaga."
  });
});

app.post("/api/auth/forgot-password", authRateLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  const genericResponse = {
    success: true,
    message: "Haddii email-kani ku jiro nidaamka, tilmaamaha dib-u-dejinta password-ka ayaa loo soo diray email-kaaga (If this email exists, password reset instructions have been sent)."
  };

  // Check if user exists
  let userExists = false;
  if (!useLocalFallback && supabase) {
    try {
      const { data } = await supabase.from("dugsiga_users").select("email").ilike("email", cleanEmail).maybeSingle();
      if (data) userExists = true;
    } catch {}
  }
  if (!userExists) {
    const db = loadLocalDB();
    if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
      userExists = true;
    }
  }

  if (!userExists) {
    return res.json(genericResponse);
  }

  // Generate secure reset token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenH = hashToken(rawToken);
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  if (!useLocalFallback && supabase) {
    try {
      await supabase.from("dugsiga_settings").upsert({
        school_id: "__password_resets__",
        key: tokenH,
        value: { email: cleanEmail, expiresAt }
      });
    } catch {}
  }

  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const host = req.get("host") || "localhost:3000";
  const appUrl = (process.env.APP_URL && process.env.APP_URL.startsWith("http")) ? process.env.APP_URL.replace(/\/$/, "") : `${protocol}://${host}`;
  const resetLink = `${appUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(cleanEmail)}`;

  await sendPasswordResetEmail({
    toEmail: cleanEmail,
    resetLink,
    expiresInMinutes: 60
  });

  return res.json(genericResponse);
});

app.post("/api/auth/reset-password", authRateLimiter, validateBody(resetPasswordSchema), async (req, res) => {
  const { email, token, newPassword } = req.body;
  const cleanEmail = email.trim().toLowerCase();
  const tokenH = hashToken(token.trim());

  let tokenValid = false;

  if (!useLocalFallback && supabase) {
    try {
      const { data } = await supabase
        .from("dugsiga_settings")
        .select("value")
        .eq("school_id", "__password_resets__")
        .eq("key", tokenH)
        .maybeSingle();

      if (data && data.value && data.value.expiresAt > Date.now()) {
        if (data.value.email.toLowerCase() === cleanEmail) {
          tokenValid = true;
          // Invalidate single-use token immediately
          await supabase.from("dugsiga_settings").delete().eq("school_id", "__password_resets__").eq("key", tokenH);
        }
      }
    } catch (e: any) {
      console.warn("Supabase reset password check notice:", e?.message || e);
    }
  }

  if (!tokenValid) {
    return res.status(400).json({ error: "Link-ga dib-u-dejintu ma shaqeynayo ama wuu dhacay (Invalid or expired reset token)." });
  }

  const freshHash = hashPassword(newPassword);

  // Update password in Supabase
  if (!useLocalFallback && supabase) {
    try {
      await supabase.from("dugsiga_users").update({ password: freshHash }).ilike("email", cleanEmail);
    } catch {}
  }

  // Update password in local DB
  const db = loadLocalDB();
  const localIdx = db.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (localIdx > -1) {
    db.users[localIdx].password_hash = freshHash;
    saveLocalDB(db);
  }

  // Invalidate all existing sessions for this user
  await revokeAllUserSessions(cleanEmail);

  return res.json({
    success: true,
    message: "Password-kaaga si guul leh ayaa loo beddelay. Dhammaan galaangalladii hore waa la xiray. Hadda ku gal password-ka cusub."
  });
});

app.post("/api/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (typeof req.headers["x-session-token"] === "string") {
    token = (req.headers["x-session-token"] as string).trim();
  } else if (req.body?.token) {
    token = String(req.body.token).trim();
  }

  if (token) {
    revokeSession(token);
  }

  return res.json({
    success: true,
    message: "Waad ka baxday nidaamka (Successfully logged out)."
  });
});

app.get("/api/documentation-pdf", (req, res) => {
  const publicPdf = path.join(process.cwd(), "public", "DUGSI_PRO_2026_DOCUMENTATION.pdf");
  const rootPdf = path.join(process.cwd(), "DUGSI_PRO_2026_DOCUMENTATION.pdf");
  const target = fs.existsSync(publicPdf) ? publicPdf : fs.existsSync(rootPdf) ? rootPdf : null;
  if (target) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="DUGSI_PRO_2026_DOCUMENTATION.pdf"');
    return res.sendFile(target);
  }
  res.status(404).json({ error: "Documentation PDF lama helin." });
});

app.post("/api/auth/login", authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Fadlan geli email iyo password." });
  const cleanEmail = email.trim().toLowerCase();

  // 1. If Supabase is connected, check Supabase first (source of truth)
  if (!useLocalFallback && supabase) {
    try {
      const { data: user, error } = await supabase
        .from("dugsiga_users")
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (!error && user) {
        const db = loadLocalDB();
        const localUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
        const matchesCloud = verifyPassword(password, user.password || "");
        const matchesLocal = localUser && verifyPassword(password, localUser.password_hash || "");

        if (matchesCloud || matchesLocal) {
          // Transparent migration: if stored hash is legacy format (no colon), upgrade to salted scrypt hash
          const cloudNeedsMigration = user.password && !user.password.includes(":");
          const localNeedsMigration = localUser && localUser.password_hash && !localUser.password_hash.includes(":");
          const freshHash = (cloudNeedsMigration || localNeedsMigration) ? hashPassword(password) : null;

          if (freshHash) {
            if (cloudNeedsMigration) {
              await supabase.from("dugsiga_users").update({ password: freshHash }).ilike("email", cleanEmail);
            }
            const localIdx = db.users.findIndex(u => u.email.toLowerCase() === cleanEmail);
            if (localIdx !== -1) {
              db.users[localIdx].password_hash = freshHash;
            } else {
              db.users.push({ email: cleanEmail, password_hash: freshHash, verified: true });
            }
            saveLocalDB(db);
          } else if (matchesLocal && !matchesCloud) {
            await supabase.from("dugsiga_users").update({ password: localUser.password_hash }).ilike("email", cleanEmail);
          }

          const authRes = buildAuthResponse(cleanEmail, db);
          if (authRes.error) {
            return res.status(403).json({ error: authRes.error });
          }
          return res.json(authRes);
        } else {
          return res.status(400).json({ error: "Password-ka aad gelisay ma saxna." });
        }
      }
    } catch (e: any) {
      console.warn("Supabase login check notice:", e?.message || e);
    }
  }

  // 2. Fallback to local DB if user exists locally or Supabase is not reached
  const db = loadLocalDB();
  const localUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  if (localUser) {
    if (verifyPassword(password, localUser.password_hash || "")) {
      // Migrate old hash if needed
      if (localUser.password_hash && !localUser.password_hash.includes(":")) {
        const freshHash = hashPassword(password);
        localUser.password_hash = freshHash;
        saveLocalDB(db);
        if (!useLocalFallback && supabase) {
          supabase.from("dugsiga_users").update({ password: freshHash }).ilike("email", cleanEmail).then(() => {}).catch(() => {});
        }
      }
      const authRes = buildAuthResponse(cleanEmail, db);
      if (authRes.error) {
        return res.status(403).json({ error: authRes.error });
      }
      return res.json(authRes);
    } else {
      return res.status(400).json({ error: "Password-ka aad gelisay ma saxna." });
    }
  }

  return res.status(400).json({ error: "Email ama password ayaa qalad ah." });
});

app.get("/api/students", async (req, res) => {
  const schoolId = getSchoolId(req);
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  const isTeacher = authUser?.role === "teacher";
  const teacherClasses = authUser?.assignedClasses || [];

  if (!useLocalFallback) {
    try {
      let query = supabase.from("dugsiga_students").select("*").eq("school_id", schoolId).order("full_name", { ascending: true });
      if (isTeacher && teacherClasses.length > 0) {
        query = query.in("class", teacherClasses);
      }
      const { data, error } = await query;
      if (error) throw error;
      const students = (data || []).map(s => ({
        id: s.id,
        fullName: s.full_name,
        class: s.class,
        gender: s.gender,
        guardianPhone: s.guardian_phone,
        status: s.status || "active",
        createdAt: s.created_at,
        photo: s.photo || "",
        dateOfBirth: s.date_of_birth || "",
        address: s.address || "",
        guardianName: s.guardian_name || "",
        section: s.section || "",
        rollNumber: s.roll_number || ""
      }));
      return res.json(students);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Ardayda (Fetch Students)"); }
  } else {
    const db = loadLocalDB();
    let list = (db.students || []).filter((s: any) => s.schoolId === schoolId);
    if (isTeacher && teacherClasses.length > 0) {
      list = list.filter((s: any) => teacherClasses.includes(s.class));
    }
    res.json(list);
  }
});

app.post("/api/students/check-duplicate", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { fullName, className, studentId, guardianPhone, excludeId } = req.body;
  if (!fullName && !studentId && !guardianPhone) {
    return res.json({ hasDuplicate: false, duplicates: [] });
  }

  if (!useLocalFallback) {
    try {
      let query = supabase.from("dugsiga_students").select("id, full_name, class, guardian_phone").eq("school_id", schoolId);
      if (excludeId) {
        query = query.neq("id", excludeId);
      }
      const { data, error } = await query;
      if (error) throw error;

      const duplicates: any[] = [];
      const cleanName = (fullName || "").trim().toLowerCase();

      for (const s of (data || [])) {
        const sName = (s.full_name || "").trim().toLowerCase();
        const sameId = studentId && s.id && s.id.toLowerCase() === studentId.trim().toLowerCase();
        const sameNameClass = cleanName && className && sName === cleanName && s.class === className;
        const samePhone = guardianPhone && s.guardian_phone && guardianPhone.length > 5 && s.guardian_phone === guardianPhone;

        if (sameId || sameNameClass || samePhone) {
          duplicates.push({
            id: s.id,
            fullName: s.full_name,
            class: s.class,
            guardianPhone: s.guardian_phone,
            matchReason: sameId ? 'Same Student ID' : sameNameClass ? 'Same Name & Class' : 'Same Guardian Phone'
          });
        }
      }
      return res.json({ hasDuplicate: duplicates.length > 0, duplicates });
    } catch (e: any) {
      return res.json({ hasDuplicate: false, duplicates: [] });
    }
  } else {
    const db = loadLocalDB();
    const students = (db.students || []).filter((s: any) => s.schoolId === schoolId && (!excludeId || s.id !== excludeId));
    const duplicates: any[] = [];
    const cleanName = (fullName || "").trim().toLowerCase();

    for (const s of students) {
      const sName = (s.fullName || "").trim().toLowerCase();
      const sameId = studentId && s.id && s.id.toLowerCase() === studentId.trim().toLowerCase();
      const sameNameClass = cleanName && className && sName === cleanName && s.class === className;
      const samePhone = guardianPhone && s.guardianPhone && guardianPhone.length > 5 && s.guardianPhone === guardianPhone;

      if (sameId || sameNameClass || samePhone) {
        duplicates.push({
          id: s.id,
          fullName: s.fullName,
          class: s.class,
          guardianPhone: s.guardianPhone,
          matchReason: sameId ? 'Same Student ID' : sameNameClass ? 'Same Name & Class' : 'Same Guardian Phone'
        });
      }
    }
    return res.json({ hasDuplicate: duplicates.length > 0, duplicates });
  }
});

app.post("/api/students/bulk", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { action, studentIds, targetClass, targetStatus } = req.body;
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: "studentIds waa qasab (studentIds array is required)" });
  }

  if (!useLocalFallback) {
    try {
      if (action === 'change_status' && targetStatus) {
        const { error } = await supabase.from("dugsiga_students").update({ status: targetStatus }).in("id", studentIds).eq("school_id", schoolId);
        if (error) throw error;
      } else if (action === 'change_class' && targetClass) {
        const { error } = await supabase.from("dugsiga_students").update({ class: targetClass }).in("id", studentIds).eq("school_id", schoolId);
        if (error) throw error;
      } else if (action === 'archive') {
        const { error } = await supabase.from("dugsiga_students").update({ status: 'archived' }).in("id", studentIds).eq("school_id", schoolId);
        if (error) throw error;
      } else if (action === 'delete') {
        await supabase.from("dugsiga_fees").delete().in("student_id", studentIds).eq("school_id", schoolId);
        await supabase.from("dugsiga_attendance").delete().in("student_id", studentIds).eq("school_id", schoolId);
        const { error } = await supabase.from("dugsiga_students").delete().in("id", studentIds).eq("school_id", schoolId);
        if (error) throw error;
      } else {
        return res.status(400).json({ error: "Action aan sax ahayn (Invalid bulk action)" });
      }
      return res.json({ success: true, count: studentIds.length });
    } catch (e: any) {
      return handleSupabaseError(res, e, "Hawsha guud ee ardayda (Bulk Students Operation)");
    }
  } else {
    const db = loadLocalDB();
    if (action === 'change_status' && targetStatus) {
      db.students = db.students.map((s: any) => (studentIds.includes(s.id) && s.schoolId === schoolId) ? { ...s, status: targetStatus } : s);
    } else if (action === 'change_class' && targetClass) {
      db.students = db.students.map((s: any) => (studentIds.includes(s.id) && s.schoolId === schoolId) ? { ...s, class: targetClass } : s);
    } else if (action === 'archive') {
      db.students = db.students.map((s: any) => (studentIds.includes(s.id) && s.schoolId === schoolId) ? { ...s, status: 'archived' } : s);
    } else if (action === 'delete') {
      db.students = db.students.filter((s: any) => !(studentIds.includes(s.id) && s.schoolId === schoolId));
      db.fees = db.fees.filter((f: any) => !(studentIds.includes(f.studentId) && f.schoolId === schoolId));
      db.attendance = db.attendance.filter((a: any) => !(studentIds.includes(a.studentId) && a.schoolId === schoolId));
    }
    saveLocalDB(db);
    return res.json({ success: true, count: studentIds.length });
  }
});

app.post("/api/students/check-duplicate", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { fullName, className, guardianPhone, studentId } = req.body;
  if (!fullName || !className) return res.json({ duplicate: false });

  const cleanName = String(fullName).trim().toLowerCase();
  const cleanPhone = guardianPhone ? String(guardianPhone).trim() : '';
  const cleanId = studentId ? String(studentId).trim().toLowerCase() : '';

  if (!useLocalFallback && supabase) {
    try {
      const { data, error } = await supabase
        .from("dugsiga_students")
        .select("id, full_name, class, guardian_phone")
        .eq("school_id", schoolId);
      if (error) throw error;
      const match = (data || []).find((s: any) => {
        const sameId = cleanId && s.id && s.id.toLowerCase() === cleanId;
        const sameNameClass = s.full_name && s.full_name.trim().toLowerCase() === cleanName && s.class === className;
        const samePhone = cleanPhone && cleanPhone.length > 6 && s.guardian_phone && s.guardian_phone.trim() === cleanPhone;
        return sameId || sameNameClass || samePhone;
      });
      if (match) {
        let reason = "Arday magacan iyo fasalkan wata ayaa horey ugu jiray nidaamka.";
        if (cleanId && match.id.toLowerCase() === cleanId) reason = "Student ID-gan horey ayaa loo isticmaalay.";
        else if (cleanPhone && match.guardian_phone && match.guardian_phone.trim() === cleanPhone) reason = "Taleefankan waalidka waxaa u diiwaangashan arday kale.";
        return res.json({
          duplicate: true,
          reason,
          existingStudent: { id: match.id, fullName: match.full_name, class: match.class }
        });
      }
      return res.json({ duplicate: false });
    } catch (e) {
      // fallback to local db
    }
  }

  const db = loadLocalDB();
  const match = (db.students || []).find((s: any) => {
    if (s.schoolId !== schoolId) return false;
    const sameId = cleanId && s.id && s.id.toLowerCase() === cleanId;
    const sameNameClass = s.fullName && s.fullName.trim().toLowerCase() === cleanName && s.class === className;
    const samePhone = cleanPhone && cleanPhone.length > 6 && s.guardianPhone && s.guardianPhone.trim() === cleanPhone;
    return sameId || sameNameClass || samePhone;
  });

  if (match) {
    let reason = "Arday magacan iyo fasalkan wata ayaa horey ugu jiray nidaamka.";
    if (cleanId && match.id.toLowerCase() === cleanId) reason = "Student ID-gan horey ayaa loo isticmaalay.";
    else if (cleanPhone && match.guardianPhone && match.guardianPhone.trim() === cleanPhone) reason = "Taleefankan waalidka waxaa u diiwaangashan arday kale.";
    return res.json({
      duplicate: true,
      reason,
      existingStudent: { id: match.id, fullName: match.fullName, class: match.class }
    });
  }

  return res.json({ duplicate: false });
});

app.post("/api/students", async (req, res) => {
  const schoolId = getSchoolId(req);
  const student = req.body;
  if (!student.fullName || !student.class) return res.status(400).json({ error: "Magaca iyo Class-ka waa qasab." });
  
  const studentId = (student.id && String(student.id).trim()) || 'std-' + Math.random().toString(36).substring(2, 11);
  const createdAt = student.createdAt || new Date().toISOString().split('T')[0];
  const fullStudent = { 
    ...student, 
    id: studentId, 
    createdAt,
    status: student.status || "active",
    gender: student.gender || "Male",
    dateOfBirth: student.dateOfBirth || "",
    address: student.address || "",
    guardianName: student.guardianName || "",
    section: student.section || "",
    rollNumber: student.rollNumber || ""
  };

  if (!useLocalFallback) {
    try {
      const { data: existing, error: checkError } = await supabase.from("dugsiga_students").select("id").ilike("full_name", student.fullName.trim()).eq("class", student.class).eq("school_id", schoolId).limit(1);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return res.status(400).json({ error: "Ardaygan magacan leh horey ayaa loogu diiwaangeliyey fasalkan. (Duplicate Student)" });
      
      const insertObj: any = {
        id: studentId,
        school_id: schoolId,
        full_name: student.fullName.trim(),
        class: student.class,
        gender: student.gender || "Male",
        guardian_phone: student.guardianPhone || "",
        status: student.status || "active",
        created_at: createdAt,
        photo: student.photo || "",
        date_of_birth: student.dateOfBirth || "",
        address: student.address || "",
        guardian_name: student.guardianName || "",
        section: student.section || "",
        roll_number: student.rollNumber || ""
      };
      
      let { error } = await supabase.from("dugsiga_students").insert([insertObj]);
      if (error) {
        if (error.code === '42703' || (error.message && (error.message.includes('photo') || error.message.includes('date_of_birth') || error.message.includes('section')))) {
          console.warn("Some columns might not exist on dugsiga_students. Retrying with basic columns.");
          const basicObj = {
            id: studentId,
            school_id: schoolId,
            full_name: student.fullName.trim(),
            class: student.class,
            gender: student.gender || "Male",
            guardian_phone: student.guardianPhone || "",
            status: student.status || "active",
            created_at: createdAt
          };
          const retryResult = await supabase.from("dugsiga_students").insert([basicObj]);
          error = retryResult.error;
        }
      }
      if (error) throw error;
      const db = loadLocalDB();
      db.students.push({ ...fullStudent, schoolId, fullName: student.fullName.trim() });
      saveLocalDB(db);
      return res.json(fullStudent);
    } catch (e: any) { return handleSupabaseError(res, e, "Diiwaangelinta Ardayga (Add Student)"); }
  } else {
    const db = loadLocalDB();
    const isDuplicate = (db.students || []).some((s: any) => s.schoolId === schoolId && s.fullName.trim().toLowerCase() === student.fullName.trim().toLowerCase() && s.class === student.class);
    if (isDuplicate) return res.status(400).json({ error: "Ardaygan magacan leh horey ayaa loogu diiwaangeliyey fasalkan. (Duplicate Student)" });
    db.students.push({ ...fullStudent, schoolId, fullName: student.fullName.trim() });
    saveLocalDB(db);
    res.json(fullStudent);
  }
});

app.get("/api/students/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback && supabase) {
    try {
      const { data, error } = await supabase
        .from("dugsiga_students")
        .select("*")
        .eq("id", id)
        .eq("school_id", schoolId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Ardayga lama helin (Student not found)" });

      return res.json({
        id: data.id,
        fullName: data.full_name,
        class: data.class,
        gender: data.gender,
        guardianPhone: data.guardian_phone,
        status: data.status || "active",
        createdAt: data.created_at,
        photo: data.photo || "",
        dateOfBirth: data.date_of_birth || "",
        address: data.address || "",
        guardianName: data.guardian_name || "",
        section: data.section || "",
        rollNumber: data.roll_number || ""
      });
    } catch (e: any) {
      return handleSupabaseError(res, e, "Soo qaadista Ardayga (Fetch Single Student)");
    }
  } else {
    const db = loadLocalDB();
    const student = (db.students || []).find((s: any) => s.id === id && s.schoolId === schoolId);
    if (!student) return res.status(404).json({ error: "Ardayga lama helin (Student not found)" });
    return res.json(student);
  }
});

app.put("/api/students/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  const updates = req.body;
  if (!useLocalFallback) {
    try {
      const updateObj: any = {};
      if (updates.fullName !== undefined) updateObj.full_name = updates.fullName;
      if (updates.class !== undefined) updateObj.class = updates.class;
      if (updates.gender !== undefined) updateObj.gender = updates.gender;
      if (updates.guardianPhone !== undefined) updateObj.guardian_phone = updates.guardianPhone;
      if (updates.status !== undefined) updateObj.status = updates.status;
      if (updates.photo !== undefined) updateObj.photo = updates.photo;
      if (updates.dateOfBirth !== undefined) updateObj.date_of_birth = updates.dateOfBirth;
      if (updates.address !== undefined) updateObj.address = updates.address;
      if (updates.guardianName !== undefined) updateObj.guardian_name = updates.guardianName;
      if (updates.section !== undefined) updateObj.section = updates.section;
      if (updates.rollNumber !== undefined) updateObj.roll_number = updates.rollNumber;

      let { error } = await supabase.from("dugsiga_students").update(updateObj).eq("id", id).eq("school_id", schoolId);
      if (error) {
        if (error.code === '42703' || (error.message && (error.message.includes('photo') || error.message.includes('date_of_birth')))) {
          console.warn("Some columns do not exist. Retrying update with base columns.");
          const baseUpdate: any = {};
          if (updates.fullName !== undefined) baseUpdate.full_name = updates.fullName;
          if (updates.class !== undefined) baseUpdate.class = updates.class;
          if (updates.gender !== undefined) baseUpdate.gender = updates.gender;
          if (updates.guardianPhone !== undefined) baseUpdate.guardian_phone = updates.guardianPhone;
          if (updates.status !== undefined) baseUpdate.status = updates.status;
          const retryResult = await supabase.from("dugsiga_students").update(baseUpdate).eq("id", id).eq("school_id", schoolId);
          error = retryResult.error;
        }
      }
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tafatirka Ardayga (Update Student)"); }
  } else {
    const db = loadLocalDB();
    const idx = db.students.findIndex(s => s.id === id && s.schoolId === schoolId);
    if (idx > -1) { db.students[idx] = { ...db.students[idx], ...updates }; saveLocalDB(db); return res.json({ success: true }); }
    res.status(404).json({ error: "Student not found" });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback) {
    try {
      const { error: err1 } = await supabase.from("dugsiga_students").delete().eq("id", id).eq("school_id", schoolId);
      if (err1) throw err1;
      const { error: err2 } = await supabase.from("dugsiga_fees").delete().eq("student_id", id).eq("school_id", schoolId);
      if (err2) throw err2;
      const { error: err3 } = await supabase.from("dugsiga_attendance").delete().eq("student_id", id).eq("school_id", schoolId);
      if (err3) throw err3;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tirtirista Ardayga (Delete Student)"); }
  } else {
    const db = loadLocalDB();
    db.students = db.students.filter(s => !(s.id === id && s.schoolId === schoolId));
    db.fees = db.fees.filter(f => !(f.studentId === id && f.schoolId === schoolId));
    db.attendance = db.attendance.filter(a => !(a.studentId === id && a.schoolId === schoolId));
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.get("/api/attendance", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { date, session_type } = req.query;
  if (!useLocalFallback) {
    try {
      let query = supabase.from("dugsiga_attendance").select("*").eq("school_id", schoolId);
      if (date) query = query.eq("date", date as string);
      if (session_type) query = query.eq("session_type", session_type as string);
      let { data, error } = await query;
      if (error) {
        if (error.code === '42703' || (error.message && error.message.toLowerCase().includes('session_type'))) {
          let retryQuery = supabase.from("dugsiga_attendance").select("date, student_id, status, timestamp, school_id").eq("school_id", schoolId);
          if (date) retryQuery = retryQuery.eq("date", date as string);
          const { data: retryData, error: retryError } = await retryQuery;
          if (retryError) throw retryError;
          data = retryData;
        } else { throw error; }
      }
      const formatted = (data || []).map(a => ({ date: a.date, studentId: a.student_id, status: a.status, timestamp: a.timestamp, sessionType: a.session_type || 'before_break' }));
      return res.json(formatted);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Xaadirinta (Fetch Attendance)"); }
  } else {
    const db = loadLocalDB();
    let list = db.attendance || [];
    list = list.filter(a => a.schoolId === schoolId);
    if (date) list = list.filter(a => a.date === date);
    if (session_type) list = list.filter(a => (a.sessionType || 'before_break') === session_type);
    res.json(list);
  }
});

app.post("/api/attendance", async (req, res) => {
  const schoolId = getSchoolId(req);
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  if (authUser?.role === "teacher" && authUser.assignedClasses && authUser.assignedClasses.length > 0) {
    const db = loadLocalDB();
    const students = db.students || [];
    const unassigned = (req.body.records || []).find((r: any) => {
      const st = students.find((s: any) => s.id === r.studentId);
      return st && !authUser.assignedClasses?.includes(st.class);
    });
    if (unassigned) {
      return res.status(403).json({ error: "Macallinku awood uma laha calaamadaynta fasal aan loo xilsaarin." });
    }
  }

  const { date, session_type, records } = req.body;
  if (!date || !Array.isArray(records)) return res.status(400).json({ error: "Date and records array required" });
  const sType = session_type || 'before_break';
  if (!useLocalFallback) {
    try {
      try {
        const { error: delError } = await supabase.from("dugsiga_attendance").delete().eq("date", date).eq("session_type", sType).eq("school_id", schoolId);
        if (delError) {
          if (delError.code === '42703' || (delError.message && delError.message.toLowerCase().includes('session_type'))) {
            const { error: delError2 } = await supabase.from("dugsiga_attendance").delete().eq("date", date).eq("school_id", schoolId);
            if (delError2) throw delError2;
          } else { throw delError; }
        }
      } catch (delErr: any) {
        const { error: delError2 } = await supabase.from("dugsiga_attendance").delete().eq("date", date).eq("school_id", schoolId);
        if (delError2) throw delError2;
      }
      const dbRecords = records.map(r => ({ school_id: schoolId, date: date, student_id: r.studentId, status: r.status, timestamp: r.timestamp }));
      if (dbRecords.length > 0) {
        try {
          const recordsWithSession = dbRecords.map(r => ({ ...r, session_type: sType }));
          const { error } = await supabase.from("dugsiga_attendance").insert(recordsWithSession);
          if (error) {
            if (error.code === '42703' || (error.message && error.message.toLowerCase().includes('session_type'))) {
              const { error: insertError } = await supabase.from("dugsiga_attendance").insert(dbRecords);
              if (insertError) throw insertError;
            } else { throw error; }
          }
        } catch (insertErr: any) {
          const { error: insertError } = await supabase.from("dugsiga_attendance").insert(dbRecords);
          if (insertError) throw insertError;
        }
      }
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Kaydinta Xaadirinta (Save Attendance)"); }
  } else {
    const db = loadLocalDB();
    db.attendance = (db.attendance || []).filter(a => !(a.schoolId === schoolId && a.date === date && (a.sessionType || 'before_break') === sType));
    records.forEach(r => { db.attendance.push({ schoolId, date, studentId: r.studentId, status: r.status, timestamp: r.timestamp, sessionType: sType }); });
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.put("/api/attendance/record", async (req, res) => {
  const schoolId = getSchoolId(req);
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  const { date, studentId, status, session_type } = req.body;
  if (!date || !studentId || !status) {
    return res.status(400).json({ error: "date, studentId, and status are required" });
  }

  if (authUser?.role === "teacher" && authUser.assignedClasses && authUser.assignedClasses.length > 0) {
    const db = loadLocalDB();
    const students = db.students || [];
    const targetStudent = students.find((s: any) => s.id === studentId);
    if (targetStudent && !authUser.assignedClasses.includes(targetStudent.class)) {
      return res.status(403).json({ error: "Macallinku awood uma laha beddelidda arday aan fasalkiisa ahayn." });
    }
  }

  const sType = session_type || 'before_break';
  const now = new Date().toISOString();

  if (!useLocalFallback) {
    try {
      try {
        await supabase.from("dugsiga_attendance").delete()
          .eq("school_id", schoolId)
          .eq("date", date)
          .eq("student_id", studentId)
          .eq("session_type", sType);
      } catch (delErr) {
        await supabase.from("dugsiga_attendance").delete()
          .eq("school_id", schoolId)
          .eq("date", date)
          .eq("student_id", studentId);
      }

      try {
        await supabase.from("dugsiga_attendance").insert({
          school_id: schoolId,
          date,
          student_id: studentId,
          status,
          session_type: sType,
          timestamp: now
        });
      } catch (insertErr) {
        await supabase.from("dugsiga_attendance").insert({
          school_id: schoolId,
          date,
          student_id: studentId,
          status,
          timestamp: now
        });
      }
      return res.json({ success: true });
    } catch (e: any) {
      return handleSupabaseError(res, e, "Calaamadaynta Xaadiriska Ardayga (Update Single Attendance)");
    }
  } else {
    const db = loadLocalDB();
    if (!db.attendance) db.attendance = [];
    db.attendance = db.attendance.filter(a => !(a.schoolId === schoolId && a.date === date && a.studentId === studentId && (a.sessionType || 'before_break') === sType));
    db.attendance.push({
      schoolId,
      date,
      studentId,
      status,
      sessionType: sType,
      timestamp: now
    });
    saveLocalDB(db);
    return res.json({ success: true });
  }
});

app.get("/api/fees", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase.from("dugsiga_fees").select("*").eq("school_id", schoolId);
      if (error) throw error;
      const formatted = (data || []).map(f => ({ id: f.id, studentId: f.student_id, month: f.month, year: f.year, amount: parseFloat(f.amount), paidAmount: parseFloat(f.paid_amount), status: f.status, createdAt: f.created_at, updatedAt: f.updated_at, history: f.history || [] }));
      return res.json(formatted);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Biilasha (Fetch Fees)"); }
  } else {
    const db = loadLocalDB();
    const list = (db.fees || []).filter((f: any) => f.schoolId === schoolId);
    res.json(list);
  }
});

app.post("/api/fees", async (req, res) => {
  const schoolId = getSchoolId(req);
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  if (authUser?.role === "teacher") {
    return res.status(403).json({ error: "Macallimiintu awood uma laha abuurista biilasha ardayda." });
  }

  const fee = req.body;
  if (!fee.studentId || !fee.month || !fee.year) return res.status(400).json({ error: "Missing required fields" });
  
  const feeId = fee.id || 'fee-' + Math.random().toString(36).substring(2, 11);
  const createdAt = fee.createdAt || new Date().toISOString();
  const fullFee = { ...fee, id: feeId, createdAt };

  if (!useLocalFallback) {
    try {
      const { data: existing, error: checkError } = await supabase.from("dugsiga_fees").select("id").eq("student_id", fee.studentId).eq("month", fee.month).eq("year", fee.year).eq("school_id", schoolId).limit(1);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return res.status(400).json({ error: "Biilka bishan ee ardaygan horey ayaa loo abuuray. (Duplicate Fee Record)" });
      const { error } = await supabase.from("dugsiga_fees").insert([{ 
        id: feeId, 
        school_id: schoolId, 
        student_id: fee.studentId, 
        month: fee.month, 
        year: fee.year, 
        amount: fee.amount, 
        paid_amount: fee.paidAmount !== undefined ? fee.paidAmount : (fee.paid_amount || 0), 
        status: fee.status || 'unpaid', 
        created_at: createdAt, 
        updated_at: fee.updatedAt || createdAt, 
        history: fee.history || [] 
      }]);
      if (error) throw error;
      return res.json(fullFee);
    } catch (e: any) { return handleSupabaseError(res, e, "Abuurista Biilka (Create Fee)"); }
  } else {
    const db = loadLocalDB();
    const isDuplicate = (db.fees || []).some((f: any) => f.schoolId === schoolId && f.studentId === fee.studentId && f.month === fee.month && f.year === fee.year);
    if (isDuplicate) return res.status(400).json({ error: "Biilka bishan ee ardaygan horey ayaa loo abuuray. (Duplicate Fee Record)" });
    db.fees.push({ ...fullFee, schoolId });
    saveLocalDB(db);
    res.json(fullFee);
  }
});

app.put("/api/fees/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const authUser = getAuthenticatedUser(req, loadLocalDB);
  if (authUser?.role === "teacher") {
    return res.status(403).json({ error: "Macallimiintu awood uma laha wax ka beddelka biilasha ardayda." });
  }

  const { id } = req.params;
  const updates = req.body;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_fees").update({ month: updates.month, year: updates.year, amount: updates.amount, paid_amount: updates.paidAmount, status: updates.status, updated_at: updates.updatedAt, history: updates.history }).eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Cusbooneysiinta Biilka (Update Fee)"); }
  } else {
    const db = loadLocalDB();
    const idx = db.fees.findIndex(f => f.id === id && f.schoolId === schoolId);
    if (idx > -1) { db.fees[idx] = { ...db.fees[idx], ...updates }; saveLocalDB(db); return res.json({ success: true }); }
    res.status(404).json({ error: "Fee not found" });
  }
});

app.delete("/api/fees/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_fees").delete().eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tirtirista Biilka (Delete Fee)"); }
  } else {
    const db = loadLocalDB();
    db.fees = db.fees.filter(f => !(f.id === id && f.schoolId === schoolId));
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.get("/api/classes", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase.from("dugsiga_classes").select("*").eq("school_id", schoolId);
      if (error) throw error;
      const formatted = (data || []).map(c => ({ id: c.id, className: c.class_name, teacherName: c.teacher_name, roomNumber: c.room_number, description: c.description, createdAt: c.created_at }));
      return res.json(formatted);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Fasallada (Fetch Classes)"); }
  } else {
    const db = loadLocalDB();
    const list = (db.classes || []).filter((c: any) => c.schoolId === schoolId);
    res.json(list);
  }
});

app.post("/api/classes", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id, className, teacherName, roomNumber, description, createdAt } = req.body;
  if (!className) return res.status(400).json({ error: "Class name is required" });
  if (!useLocalFallback) {
    try {
      const { data: existing, error: checkError } = await supabase.from("dugsiga_classes").select("id").ilike("class_name", className.trim()).eq("school_id", schoolId).limit(1);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return res.status(400).json({ error: "Fasalkan magacan leh horey ayaa loo diiwaangeliyey. (Duplicate Class)" });
      const { error } = await supabase.from("dugsiga_classes").insert([{ id: id || 'cls-' + Math.random().toString(36).substr(2, 9), school_id: schoolId, class_name: className.trim(), teacher_name: teacherName || "", room_number: roomNumber || "", description: description || "", created_at: createdAt || new Date().toISOString().split('T')[0] }]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Kaydinta Fasalka (Save Class)"); }
  } else {
    const db = loadLocalDB();
    if (!db.classes) db.classes = [];
    const isDuplicate = db.classes.some(c => c.schoolId === schoolId && c.className.trim().toLowerCase() === className.trim().toLowerCase());
    if (isDuplicate) return res.status(400).json({ error: "Fasalkan magacan leh horey ayaa loo diiwaangeliyey. (Duplicate Class)" });
    db.classes.push({ id: id || 'cls-' + Math.random().toString(36).substr(2, 9), schoolId, className: className.trim(), teacherName: teacherName || "", roomNumber: roomNumber || "", description: description || "", createdAt: createdAt || new Date().toISOString().split('T')[0] });
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.put("/api/classes/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  const { className, teacherName, roomNumber, description } = req.body;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_classes").update({ class_name: className, teacher_name: teacherName, room_number: roomNumber, description: description }).eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Cusbooneysiinta Fasalka (Update Class)"); }
  } else {
    const db = loadLocalDB();
    if (!db.classes) db.classes = [];
    const idx = db.classes.findIndex(c => c.id === id && c.schoolId === schoolId);
    if (idx > -1) { db.classes[idx] = { ...db.classes[idx], className, teacherName, roomNumber, description }; saveLocalDB(db); return res.json({ success: true }); }
    res.status(404).json({ error: "Class not found" });
  }
});

app.delete("/api/classes/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_classes").delete().eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tirtirista Fasalka (Delete Class)"); }
  } else {
    const db = loadLocalDB();
    if (!db.classes) db.classes = [];
    db.classes = db.classes.filter(c => !(c.id === id && c.schoolId === schoolId));
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.get("/api/subjects", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase.from("dugsiga_subjects").select("*").eq("school_id", schoolId);
      if (error) throw error;
      const formatted = (data || []).map(s => ({ id: s.id, subjectName: s.subject_name, subjectCode: s.subject_code, className: s.class_name, teacherName: s.teacher_name, createdAt: s.created_at }));
      return res.json(formatted);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Maddooyinka (Fetch Subjects)"); }
  } else {
    const db = loadLocalDB();
    const list = (db.subjects || []).filter((s: any) => s.schoolId === schoolId);
    res.json(list);
  }
});

app.post("/api/subjects", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id, subjectName, subjectCode, className, teacherName, createdAt } = req.body;
  if (!subjectName) return res.status(400).json({ error: "Subject name is required" });
  if (!useLocalFallback) {
    try {
      const { data: existing, error: checkError } = await supabase.from("dugsiga_subjects").select("id").ilike("subject_name", subjectName.trim()).eq("class_name", className || "").eq("school_id", schoolId).limit(1);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return res.status(400).json({ error: "Maaddadan magacan leh horey ayaa loogu daray fasalkan. (Duplicate Subject)" });
      const { error } = await supabase.from("dugsiga_subjects").insert([{ id: id || 'sub-' + Math.random().toString(36).substr(2, 9), school_id: schoolId, subject_name: subjectName.trim(), subject_code: subjectCode || "", class_name: className || "", teacher_name: teacherName || "", created_at: createdAt || new Date().toISOString().split('T')[0] }]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Kaydinta Maaddada (Save Subject)"); }
  } else {
    const db = loadLocalDB();
    if (!db.subjects) db.subjects = [];
    const isDuplicate = db.subjects.some(s => s.schoolId === schoolId && s.subjectName.trim().toLowerCase() === subjectName.trim().toLowerCase() && s.className === (className || ""));
    if (isDuplicate) return res.status(400).json({ error: "Maaddadan magacan leh horey ayaa loogu daray fasalkan. (Duplicate Subject)" });
    db.subjects.push({ id: id || 'sub-' + Math.random().toString(36).substr(2, 9), schoolId, subjectName: subjectName.trim(), subjectCode: subjectCode || "", className: className || "", teacherName: teacherName || "", createdAt: createdAt || new Date().toISOString().split('T')[0] });
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.put("/api/subjects/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  const { subjectName, subjectCode, className, teacherName } = req.body;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_subjects").update({ subject_name: subjectName, subject_code: subjectCode, class_name: className, teacher_name: teacherName }).eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Cusbooneysiinta Maaddada (Update Subject)"); }
  } else {
    const db = loadLocalDB();
    if (!db.subjects) db.subjects = [];
    const idx = db.subjects.findIndex(s => s.id === id && s.schoolId === schoolId);
    if (idx > -1) { db.subjects[idx] = { ...db.subjects[idx], subjectName, subjectCode, className, teacherName }; saveLocalDB(db); return res.json({ success: true }); }
    res.status(404).json({ error: "Subject not found" });
  }
});

app.delete("/api/subjects/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_subjects").delete().eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tirtirista Maaddada (Delete Subject)"); }
  } else {
    const db = loadLocalDB();
    if (!db.subjects) db.subjects = [];
    db.subjects = db.subjects.filter(s => !(s.id === id && s.schoolId === schoolId));
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.get("/api/exams", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase.from("dugsiga_exam_scores").select("*").eq("school_id", schoolId);
      if (error) throw error;
      const formatted = (data || []).map(e => ({ id: e.id, studentId: e.student_id, studentName: e.student_name, className: e.class_name, subjectName: e.subject_name, examName: e.exam_name, term: e.term, maxMarks: Number(e.max_marks || 100), marksObtained: Number(e.marks_obtained), grade: e.grade, examDate: e.exam_date, createdAt: e.created_at }));
      return res.json(formatted);
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Imtixaanada (Fetch Exams)"); }
  } else {
    const db = loadLocalDB();
    const list = (db.examScores || []).filter((e: any) => e.schoolId === schoolId);
    res.json(list);
  }
});

app.post("/api/exams", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id, studentId, studentName, className, subjectName, examName, term, maxMarks, marksObtained, grade, examDate, createdAt } = req.body;
  if (!studentId || !className || !subjectName || !examName || marksObtained === undefined) return res.status(400).json({ error: "Missing required fields for exam score recording" });
  if (!useLocalFallback) {
    try {
      const { data: existing, error: checkError } = await supabase.from("dugsiga_exam_scores").select("id").eq("student_id", studentId).eq("subject_name", subjectName).eq("exam_name", examName).eq("school_id", schoolId).limit(1);
      if (checkError) throw checkError;
      if (existing && existing.length > 0) return res.status(400).json({ error: "Natiijadan imtixaanka ee ardaygan horey ayaa loo duubay. (Duplicate Exam Score)" });
      const { error } = await supabase.from("dugsiga_exam_scores").insert([{ id: id || 'exm-' + Math.random().toString(36).substr(2, 9), school_id: schoolId, student_id: studentId, student_name: studentName || "", class_name: className, subject_name: subjectName, exam_name: examName, term: term || "Term 1", max_marks: maxMarks || 100, marks_obtained: marksObtained, grade: grade || "", exam_date: examDate || new Date().toISOString().split('T')[0], created_at: createdAt || new Date().toISOString().split('T')[0] }]);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Kaydinta Natiijada Imtixaanka (Save Exam Score)"); }
  } else {
    const db = loadLocalDB();
    if (!db.examScores) db.examScores = [];
    const isDuplicate = db.examScores.some(e => e.schoolId === schoolId && e.studentId === studentId && e.subjectName === subjectName && e.examName === examName);
    if (isDuplicate) return res.status(400).json({ error: "Natiijadan imtixaanka ee ardaygan horey ayaa loo duubay. (Duplicate Exam Score)" });
    db.examScores.push({ id: id || 'exm-' + Math.random().toString(36).substr(2, 9), schoolId, studentId, studentName: studentName || "", className, subjectName, examName, term: term || "Term 1", maxMarks: maxMarks || 100, marksObtained, grade: grade || "", examDate: examDate || new Date().toISOString().split('T')[0], createdAt: createdAt || new Date().toISOString().split('T')[0] });
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.put("/api/exams/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  const { studentId, studentName, className, subjectName, examName, term, maxMarks, marksObtained, grade, examDate } = req.body;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_exam_scores").update({ student_id: studentId, student_name: studentName, class_name: className, subject_name: subjectName, exam_name: examName, term: term, max_marks: maxMarks, marks_obtained: marksObtained, grade: grade, exam_date: examDate }).eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Cusbooneysiinta Natiijada Imtixaanka (Update Exam Score)"); }
  } else {
    const db = loadLocalDB();
    if (!db.examScores) db.examScores = [];
    const idx = db.examScores.findIndex(e => e.id === id && e.schoolId === schoolId);
    if (idx > -1) { db.examScores[idx] = { ...db.examScores[idx], studentId, studentName, className, subjectName, examName, term, maxMarks, marksObtained, grade, examDate }; saveLocalDB(db); return res.json({ success: true }); }
    res.status(404).json({ error: "Exam score record not found" });
  }
});

app.delete("/api/exams/:id", async (req, res) => {
  const schoolId = getSchoolId(req);
  const { id } = req.params;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_exam_scores").delete().eq("id", id).eq("school_id", schoolId);
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Tirtirista Natiijada (Delete Exam Score)"); }
  } else {
    const db = loadLocalDB();
    if (!db.examScores) db.examScores = [];
    db.examScores = db.examScores.filter(e => !(e.id === id && e.schoolId === schoolId));
    saveLocalDB(db);
    res.json({ success: true });
  }
});

app.get("/api/settings", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { data, error } = await supabase.from("dugsiga_settings").select("*").eq("school_id", schoolId).eq("key", "main_settings").single();
      if (error && error.code !== "PGRST116") throw error;
      if (data) return res.json(data.value);
      return res.json({ ...defaultSettings, schoolName: schoolId.includes("@") ? schoolId.split("@")[0].toUpperCase() : "Dugsiga Pro 2026" });
    } catch (e: any) { return handleSupabaseError(res, e, "Soo qaadista Qaabeynta (Fetch Settings)"); }
  } else {
    const db = loadLocalDB();
    if (!db.settings || typeof db.settings.schoolName === 'string') {
      const oldVal = db.settings || defaultSettings;
      db.settings = { "default-school": oldVal };
    }
    const schoolSettings = db.settings[schoolId] || { ...defaultSettings, schoolName: schoolId.includes("@") ? schoolId.split("@")[0].toUpperCase() : "Dugsiga Pro 2026" };
    res.json(schoolSettings);
  }
});

app.put("/api/settings", async (req, res) => {
  const schoolId = getSchoolId(req);
  const settings = req.body;
  if (!useLocalFallback) {
    try {
      const { error } = await supabase.from("dugsiga_settings").upsert({ school_id: schoolId, key: "main_settings", value: settings });
      if (error) throw error;
      return res.json({ success: true });
    } catch (e: any) { return handleSupabaseError(res, e, "Kaydinta Qaabeynta (Update Settings)"); }
  } else {
    const db = loadLocalDB();
    if (!db.settings || typeof db.settings.schoolName === 'string') {
      const oldVal = db.settings || defaultSettings;
      db.settings = { "default-school": oldVal };
    }
    db.settings[schoolId] = { ...(db.settings[schoolId] || defaultSettings), ...settings };
    saveLocalDB(db);
    res.json({ success: true });
  }
});

// Register Modernization & Extension Routes (Teachers, Staff, Guardians, Attendance, Timetable, Admissions, Library, Inventory, Announcements, Reports, RBAC)
registerModernRoutes(app, {
  getSchoolId,
  loadLocalDB,
  saveLocalDB,
  supabase,
  getUseLocalFallback: () => useLocalFallback,
  hasPermission,
  handleSupabaseError
});

// Register Complete Finance & Accounting Suite
registerFinanceRoutes(app, {
  getSchoolId,
  loadLocalDB,
  saveLocalDB,
  supabase,
  getUseLocalFallback: () => useLocalFallback,
  hasPermission,
  handleSupabaseError
});

app.post("/api/reset", async (req, res) => {
  const schoolId = getSchoolId(req);
  if (!useLocalFallback) {
    try {
      const { error: err1 } = await supabase.from("dugsiga_students").delete().eq("school_id", schoolId);
      if (err1) throw err1;
      const { error: err2 } = await supabase.from("dugsiga_fees").delete().eq("school_id", schoolId);
      if (err2) throw err2;
      const { error: err3 } = await supabase.from("dugsiga_attendance").delete().eq("school_id", schoolId);
      if (err3) throw err3;
      const { error: err4 } = await supabase.from("dugsiga_exam_scores").delete().eq("school_id", schoolId);
      if (err4) throw err4;
      const { error: err5 } = await supabase.from("dugsiga_classes").delete().eq("school_id", schoolId);
      if (err5) throw err5;
      const { error: err6 } = await supabase.from("dugsiga_subjects").delete().eq("school_id", schoolId);
      if (err6) throw err6;
      const { error: err7 } = await supabase.from("dugsiga_settings").delete().eq("school_id", schoolId).eq("key", "main_settings");
      if (err7) throw err7;
    } catch (e: any) { return handleSupabaseError(res, e, "Factory Reset"); }
  }
  const db = loadLocalDB();
  db.students = (db.students || []).filter((s: any) => s.schoolId !== schoolId);
  db.fees = (db.fees || []).filter((f: any) => f.schoolId !== schoolId);
  db.attendance = (db.attendance || []).filter((a: any) => a.schoolId !== schoolId);
  db.examScores = (db.examScores || []).filter((e: any) => e.schoolId !== schoolId);
  db.classes = (db.classes || []).filter((c: any) => c.schoolId !== schoolId);
  db.subjects = (db.subjects || []).filter((s: any) => s.schoolId !== schoolId);
  if (db.teachers) db.teachers = db.teachers.filter((t: any) => t.schoolId !== schoolId);
  if (db.staff) db.staff = db.staff.filter((s: any) => s.schoolId !== schoolId);
  if (db.guardians) db.guardians = db.guardians.filter((g: any) => g.schoolId !== schoolId);
  if (db.staffAttendance) db.staffAttendance = db.staffAttendance.filter((a: any) => a.schoolId !== schoolId);
  if (db.timetable) db.timetable = db.timetable.filter((t: any) => t.schoolId !== schoolId);
  if (db.admissions) db.admissions = db.admissions.filter((a: any) => a.schoolId !== schoolId);
  if (db.announcements) db.announcements = db.announcements.filter((a: any) => a.schoolId !== schoolId);
  if (db.libraryBooks) db.libraryBooks = db.libraryBooks.filter((b: any) => b.schoolId !== schoolId);
  if (db.libraryLoans) db.libraryLoans = db.libraryLoans.filter((l: any) => l.schoolId !== schoolId);
  if (db.inventory) db.inventory = db.inventory.filter((i: any) => i.schoolId !== schoolId);
  if (db.documents) db.documents = db.documents.filter((d: any) => d.schoolId !== schoolId);
  if (db.notifications) db.notifications = db.notifications.filter((n: any) => n.schoolId !== schoolId);
  if (db.settings && typeof db.settings === 'object' && !db.settings.schoolName) {
    delete db.settings[schoolId];
  } else {
    db.settings = {};
  }
  saveLocalDB(db);
  res.json({ success: true });
});

// Central error handling middleware (handles UNAUTHENTICATED errors across all routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.message === "UNAUTHENTICATED" || err.message?.includes("UNAUTHENTICATED") || err.status === 401)) {
    return res.status(401).json({ error: "Fadlan soo gal (login) marka hore." });
  }
  const reqId = (req as any).requestId || "unknown";
  console.error(`[Server Error ${reqId}] ${req.method} ${req.url}:`, err?.message || err);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: "Cillad farsamo ayaa dhacday (An internal server error occurred).",
      requestId: reqId
    });
  }
});

// Graceful process signal handling
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received. Gracefully shutting down...");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[Server] SIGINT received. Shutting down...");
  process.exit(0);
});

if (process.env.DISABLE_HMR !== "true") {
  process.env.DISABLE_HMR = "true";
}

async function startServer() {
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();