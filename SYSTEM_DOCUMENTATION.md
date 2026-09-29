# DUGSI PRO 2026 — DOKUMENTATION-KA GUUD EE NIDAAMKA (FULL SYSTEM DOCUMENTATION)

---

## 1. DULMARKA GUUD (SYSTEM OVERVIEW)
**DUGSI PRO 2026** waa nidaam casri ah oo loogu talagalay maamulka dugsiyada iyo xarumaha waxbarashada (School Management System). Nidaamku wuxuu si buuxda u xalliyaa maamulka ardayda, xaadirinta maalinlaha ah, biilasha & lacag-bixinta, fasallada, maaddooyinka, imtixaanaadka, warbixinada waxbarashada, iyo qaabeynta dugsiga.

### Qaab-dhismeedka Tiknoolajiyadda (Tech Stack)
* **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Animations), Recharts (Analytics & Charts), Lucide React (Icons).
* **Backend:** Node.js, Express 4, TypeScript (tsx ee runtime & esbuild ee production bundle).
* **Kaydka Xogta (Databases):**
  1. **Supabase (PostgreSQL Cloud Database):** Xogta rasmiga ah ee daruuraha (Production Cloud DB) oo leh multi-tenancy (`school_id`).
  2. **Local JSON Fallback (`database.json`):** Kayd degdeg ah oo maxalli ah haddii internetka ama xiriirka Supabase uu go'o, kaas oo si toos ah iskugu xira mar kasta oo adeeggu dib u soo laabto (`syncLocalToSupabase`).
* **Dokumentiyo & Daabacaad:** `jspdf` & `jspdf-autotable` (Warbixinada PDF & Rasiidhada), `xlsx` (Soo dejinta & gelinta Excel-ka).
* **Email & Ogeysiisyada:** `nodemailer` (SMTP Authentication & notifications).
* **AI & Caqli Gacood:** `@google/genai` (Google Gemini AI Model Integration).

---

## 2. MODULES-KA IYO AASTAAMAHA (CORE MODULES & FEATURES)

### 2.1. Bogga Hore (Landing Page)
* **URL:** `/`
* **Features:**
  * Soo bandhigidda adeegyada DUGSI PRO 2026.
  * Liiska faa'iidooyinka (Live Attendance, Smart Fee Invoicing, Automated Grading, Fast Reports).
  * Xiriirka gelitaanka (Login) iyo is-diiwaangelinta cusub (Sign Up).
  * Daawashada Interactive Demo.

### 2.2. Xaqiijinta & Diiwaangelinta (Authentication & Authorization)
* **URL:** `/login` & `/signup`
* **Features:**
  * Diiwaangelinta Dugsiyada cusub (Email & Password).
  * Dugsiyo badan oo madax-bannaan (Multi-tenant isolation iyadoo la adeegsanayo `school_id` oo laga dhalinayo Email-ka maamulaha).
  * Auto-verification degdeg ah (Direct access without email blocks).
  * Xusuusashada gelitaanka (Session persistence via `localStorage`).

### 2.3. Dashboard-ka Guud (Executive Overview & Analytics)
* **Features:**
  * Tirada guud ee Ardayda (Total Students, Active vs Inactive).
  * Boqolleyda Xaadirinta Maanta (Daily Attendance Rate).
  * Dhaqaalaha & Lacagaha bishan (Total Billed vs Collected vs Pending).
  * Jaantusyada Dhaqaalaha & Xaadirinta (Recharts Interactive Bar & Pie Charts).
  * Digniinaha degdegga ah (Ardayda lacagaha lagu leeyahay, Ardayda maqan).

### 2.4. Maamulka Ardayda (Students Management)
* **Features:**
  * Diiwaangelinta arday cusub (Magaca, Fasalka, Jinsiga, Taleefanka Waalidka, Sawirka/Photo).
  * Ka hortagga ardayda laba jeer isku fasalka lagu qoro (Duplicate student check).
  * Raadinta degdegga ah (Search by name or phone) iyo kala shaandhaynta (Filter by class/status).
  * Tafatirka & Tirtirista ardayda (Update & Delete ardayga iyo xogtiisa la xiriirta).
  * Soo dejinta liiska ardayda (Export to Excel `.xlsx` ama PDF).
  * Soo gelinta arday badan mar qura (Bulk Excel Import).

### 2.5. Xaadirinta Maalinlaha ah (Attendance System)
* **Features:**
  * Xaadirinta labada waqti: Nasashada ka hor (`before_break`) iyo Nasashada ka dib (`after_break`).
  * Xulashada taariikhda (Date selection) iyo fasalka (Class filter).
  * Xaaladaha: **Jooga (Present)**, **Maqan (Absent)**, **Soo Daahay (Late)**, iyo **Fasax (Excused)**.
  * Badhanka degdegga ah: "Dhammaan Jooga" (Mark All Present).
  * Fariin WhatsApp toos ah oo loo diro waalidka ardayga maqan ama soo daahay.
  * Daabacaadda xaadirinta fasalka ee PDF.

### 2.6. Maamulka Lacagaha & Biilasha (Fees & Finance)
* **Features:**
  * Abuurista biilasha billaha ah arday kasta ama fasal dhan mar qura (Bulk Generate).
  * Diiwaangelinta lacag-bixinta (Full Payment ama Qayb/Partial Payment).
  * Taariikhda lacag-bixinta (Payment Audit History oo leh taariikhda & xaddiga la bixiyey).
  * Daabacaadda Rasiidka Rasmiga ah ee PDF (Official Payment Receipt).
  * Ogeysiinta Waalidka WhatsApp-ka marka lacagta la bixiyo ama marka lagu leeyahay.
  * Soo dejinta liiska deynta ama dakhliga (Excel & PDF export).

### 2.7. Fasallada & Qolalka (Classes Management)
* **Features:**
  * Abuurista fasallo cusub (Magaca Fasalka, Macalinka Masuulka ah, Lambarka Qolka, Sharaxaad).
  * Tirada ardayda ku jirta fasal kasta si toos ah loogu xisaabiyo.
  * Tafatirka iyo tirtirista fasallada.

### 2.8. Maaddooyinka & Barayaasha (Subjects Management)
* **Features:**
  * Diiwaangelinta maaddooyinka (Magaca Maaddada, Koodhka, Fasalka loo dhigo, Macalinka dhiga).
  * Xiriirinta maaddada iyo fasalka si imtixaanaadka loogu diro si sax ah.

### 2.9. Imtixaanaadka & Natiijooyinka (Exams & Grading)
* **Features:**
  * Gelinta dhibcaha imtixaanka ardayda (Midterm, Final, Monthly Test, Term 1/2).
  * Xisaabinta tooska ah ee Darajooyinka (A, B, C, D, Fail) iyadoo la eegayo xadka dugsigu dejiyey.
  * Isbarbardhigga natiijooyinka ardayda fasal kasta.

### 2.10. Warbixinada & Shahaadooyinka (Academic Reports & Report Cards)
* **Features:**
  * **Class Performance Report:** Warbixin dhamaystiran oo fasal kasta ah (Ardayda, Xaadirinta, Dhaqaalaha, Celceliska Imtixaanaadka).
  * **Student Report Card (Kaarka Natiijada Ardayga):** Kaar daabacan oo ardayga u gaar ah oo ay ku qoran yihiin dhammaan maaddooyinka, dhibcaha, darajada, xaadirinta, iyo saxiixa maamulaha.
  * Toos ugu dirista warbixinta taleefanka waalidka (WhatsApp integration).

### 2.11. Qaabeynta Nidaamka (Settings & Customization)
* **Features:**
  * Magaca Dugsiga (School Name), Cinwaanka, Email-ka, Taleefanka.
  * Lacagta Dugsigu qaato (Currency: USD, SOS, KES, iwm.) iyo xaddiga fiiga caadiga ah.
  * Sanad-dugsiyeedka (Academic Year).
  * Xadka Darajooyinka (Grade Thresholds: A: 80%+, B: 70%+, C: 60%+, D: 50%+).
  * Theme-ka nidaamka (Light Mode & Dark Mode).
  * Xaaladda xiriirka Kaydka (Supabase DB Status & SQL setup scripts).
  * Dib-u-dejinta Nidaamka (Factory Reset oo tirtiraysa xogta dugsigaas keliya).

---

## 3. KEYDKA XOGTA IYO QAAB-DHISMEEDKA SQL (SUPABASE SCHEMA)

Nidaamku wuxuu isticmaalaa 8 miis (tables) oo ku dhex yaal Supabase PostgreSQL. Miis kasta wuxuu wataa `school_id` si dugsi kasta xogtiisa looga sooco dugsiyada kale (Multi-Tenancy).

```sql
-- 1. Miiska Isticmaalayaasha Dugsiga
CREATE TABLE IF NOT EXISTS dugsiga_users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Miiska Ardayda
CREATE TABLE IF NOT EXISTS dugsiga_students (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  class TEXT NOT NULL,
  gender TEXT,
  guardian_phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  photo TEXT
);

-- 3. Miiska Fasallada
CREATE TABLE IF NOT EXISTS dugsiga_classes (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  teacher_name TEXT,
  room_number TEXT,
  description TEXT,
  created_at TEXT
);

-- 4. Miiska Maaddooyinka
CREATE TABLE IF NOT EXISTS dugsiga_subjects (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  subject_code TEXT,
  class_name TEXT,
  teacher_name TEXT,
  created_at TEXT
);

-- 5. Miiska Natiijooyinka Imtixaanaadka
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

-- 6. Miiska Xaadirinta
CREATE TABLE IF NOT EXISTS dugsiga_attendance (
  school_id TEXT NOT NULL,
  date TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT,
  session_type TEXT DEFAULT 'before_break',
  PRIMARY KEY (school_id, date, student_id, session_type)
);

-- 7. Miiska Biilasha & Fiiga
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

-- 8. Miiska Qaabeynta Dugsiga
CREATE TABLE IF NOT EXISTS dugsiga_settings (
  school_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  PRIMARY KEY (school_id, key)
);
```

---

## 4. API ENDPOINTS-KA NIDAAMKA (REST API SPECIFICATION)

Dhammaan baaqyada API-yada ee la xiriira dugsiga waxay sitaan Header-ka `X-School-Email` kaas oo u oggolaanaya server-ka inuu xogta u kala sooco dugsi kasta.

### 4.1. Authentication
* `POST /api/auth/signup`: Diiwaangeli dugsi cusub (`{ email, password }`).
* `POST /api/auth/login`: Gal dugsiga (`{ email, password }`).
* `POST /api/auth/verify`: Xaqiijinta account-ka (Auto-enabled).

### 4.2. Ardayda (Students)
* `GET /api/students`: Soo saar dhammaan ardayda dugsiga.
* `POST /api/students`: Ku dar arday cusub.
* `PUT /api/students/:id`: Cusbooneysii xogta ardayga.
* `DELETE /api/students/:id`: Tirtir ardayga iyo dhammaan xogtiisa la xiriirta.

### 4.3. Xaadirinta (Attendance)
* `GET /api/attendance?date=YYYY-MM-DD&session_type=before_break`: Soo qaad xaadirinta maalin cayiman.
* `POST /api/attendance`: Keydi xaadirinta ardayda (`{ date, session_type, records: [...] }`).

### 4.4. Biilasha & Dhaqaalaha (Fees)
* `GET /api/fees`: Soo saar dhammaan diiwaanka biilasha.
* `POST /api/fees`: Abuur biil cusub.
* `PUT /api/fees/:id`: Diwaangeli lacag bixin cusub ama badal xogta biilka.
* `DELETE /api/fees/:id`: Tirtir biilka.

### 4.5. Fasallada (Classes)
* `GET /api/classes`: Soo qaad dhammaan fasallada.
* `POST /api/classes`: Ku dar fasal cusub.
* `PUT /api/classes/:id`: Wax ka beddel fasalka.
* `DELETE /api/classes/:id`: Tirtir fasalka.

### 4.6. Maaddooyinka (Subjects)
* `GET /api/subjects`: Soo qaad dhammaan maaddooyinka.
* `POST /api/subjects`: Ku dar maaddo cusub.
* `PUT /api/subjects/:id`: Wax ka beddel maaddada.
* `DELETE /api/subjects/:id`: Tirtir maaddada.

### 4.7. Imtixaanaadka (Exams)
* `GET /api/exams`: Soo qaad buundooyinka imtixaanaadka.
* `POST /api/exams`: Ku dar buundo cusub.
* `PUT /api/exams/:id`: Wax ka beddel buundada ardayga.
* `DELETE /api/exams/:id`: Tirtir buundada.

### 4.8. Qaabeynta & Xogta Guud (Settings & Maintenance)
* `GET /api/settings`: Soo qaad qaabeynta dugsiga xilligan.
* `PUT /api/settings`: Keydi qaabeynta cusub (Magaca dugsiga, xadka darajooyinka, iwm).
* `GET /api/db/status`: Hubi xaaladda xiriirka Supabase DB iyo SQL script-ka.
* `POST /api/reset`: Dib-u-dejin buuxda (Factory reset) ee xogta dugsiga gelaya codsiga.

---

## 5. SIRTA IYO FURAYAASHA API (SECRETS & ENVIRONMENT VARIABLES)

Faylka `.env` ama `.env.example` wuxuu xafidaa furayaasha muhiimka ah ee nidaamku u baahan yahay:

| Magaca Variable-ka | Ujeeddadiisa | Tusaale / Qiimo |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Furaha Google Gemini AI (Gorfaynta xogta & Caqliga Gacoodka) | `AIzaSy...` (Laga helo Google AI Studio) |
| `APP_URL` | Cinwaanka URL-ka uu nidaamku ka shaqeynayo | `https://ais-dev-...run.app` |
| `SUPABASE_URL` | Cinwaanka Mashruuca Supabase (PostgreSQL Database) | `https://mdvfcqujqjnvfpzowayo.supabase.co` |
| `SUPABASE_ANON_KEY` | Furaha Guud ee Supabase (Public Client API Key) | `eyJhbGciOi...` |
| `SUPABASE_PUBLISHABLE_KEY` | Furaha Publishable-ka ee Supabase SDK | `sb_publish_...` ama Anon JWT |
| `SUPABASE_SECRET_KEY` | Furaha qarsoon ee Server-ka (`service_role` key) | `eyJhbGciOi...` (Super Admin Access) |
| `SUPABASE_JWKS_URL` | JWT Signing Secret ama JWKS URL ee furaha lagu hubiyo | Supabase Auth JWKS Endpoint |
| `SMTP_HOST` | Host-ka Server-ka Email-ka (Gmail, SendGrid, iwm) | `smtp.gmail.com` |
| `SMTP_PORT` | Port-ka SMTP ee ammaan ah | `587` (TLS) ama `465` (SSL) |
| `SMTP_USER` | Email-ka loo isticmaalo dirista farriimaha | `your_email@gmail.com` |
| `SMTP_PASS` | Google App Password-ka gaarka ah ee SMTP | `your_google_app_password` |
| `SMTP_FROM` | Email-ka ka muuqanaya cinwaanka soo diraha | `your_email@gmail.com` |

> ⚠️ **FIIRO GAAR AH OO KU SAABSAN AMMAANKA:**
> Furayaasha `SUPABASE_SECRET_KEY` iyo `GEMINI_API_KEY` iyo `SMTP_PASS` waligood lama gaarsiiyo browser-ka macmiilka (Client). Waxay ku jiraan oo keliya server-ka dambe (`server.ts`).

---

## 6. AMMAANKA IYO XAFAADINTA XOGTA (SECURITY ARCHITECTURE)
1. **Multi-Tenant Data Isolation:** Dugsiyadu isma arki karaan xogtooda maxaa yeelay codsi kasta waxaa lagu shaandheeyaa `school_id` oo si toos ah looga soo dheegto kalfadhiga la xaqiijiyey (authenticated Bearer token). Dhammaan miisaska (Tables 1–29) waxay leeyihiin `school_id` iyo index u gaar ah (`CREATE INDEX IF NOT EXISTS idx_<table_name>_school_id ON <table_name>(school_id)`).
2. **Production Finance Architecture (Supabase Cloud PostgreSQL):**
   Dhammaan xogta maaliyadda iyo xisaabaadka waxaa si toos ah loogu kaydiyaa miisaska rasmiga ah ee Supabase:
   * `dugsiga_fee_structures`: Qaab-dhismeedka khidmadaha dugsiga
   * `dugsiga_invoices`: Biilasha ardayda oo leh xisaabinta baaqiga iyo xaaladda
   * `dugsiga_payments`: Rasiidhada lacag-qabashada oo leh ilaalinta laba-jibbaarista (duplicate protection)
   * `dugsiga_expenses`: Kharashaadka dugsiga iyo nidaamka ogolaanshaha (Approval workflow)
   * `dugsiga_income`: Dakhliga kale ee dugsiga soo gala
   * `dugsiga_budgets`: Miisaaniyadda qorshaysan iyo cabbirka farqiga (Variance tracking)
   * `dugsiga_payroll`: Mushahaarka macallimiinta iyo shaqaalaha oo si toos ah ugu xira kharashaadka (linked expense)
   * `dugsiga_discounts`: Qiimo-dhimista sharciga ah oo toos u cusboonaysiisa baaqiga biilka
   * `dugsiga_refunds`: Celinta lacagaha oo xaqiijisa inaan laga badin lacagtii la bixiyey
3. **Resilient Local Fallback:** Haddii Supabase ama internetku go'o ama la joogo deegaanka maxalliga ah (offline), nidaamku wuxuu si hufan ugu wareegaa `database.seed.json` / `database.json`, isagoo ilaalinaya sii shaqaynta nidaamka.
4. **Password Security:** Furayaasha sirta ah waxaa lagu kaydiyaa hab ammaan ah oo salted scrypt ah (`hashPassword`) oo ka difaacaya weerarrada brute force iyo rainbow tables.
5. **Rate Limiting & Input Validation:** Nidaamku wuxuu leeyahay sliding-window rate limiters oo ka difaacaya weerarada automated brute-force `/api/auth/*` iyo `/api/payments`. Cadadka lacagta kasta waxaa lagu hubiyaa xaqiijinta (`validatePositiveAmount`).

---

## 7. AUTOMATED TESTS & CONTINUOUS INTEGRATION (CI)
* **Automated Integration Test Suite (`npm test`):**
  Wuxuu fuliyaa **28 tijaabo** oo dhammeystiran oo tijaabiya laba qeybood oo waaweyn:
  
  **Qaybta 1: Finance Integration Tests (16 Tests):**
  1. Diidmada codsiyada aan fasaxnayn (401 Unauthorized)
  2. Ka hortagga xatooyada aqoonsiga dugsiga (Tenant impersonation blocked)
  3. Diiwaangelinta ammaan ah iyo dhalinta session token
  4. Akhrista iyo qorista Fee Structures
  5. Diiwaangelinta Ardayda iyo abuurista Biilasha (Invoices)
  6. Qabashada lacag-bixinta (Payments) iyo cusboonaysiinta baaqiga
  7. Ka hortagga laba-jibbaarista lacag-bixinta
  8. Diiwaangelinta Qiimo-dhimista (Discounts)
  9. Diiwaangelinta Kharashaadka (Expenses) iyo ansixintooda
  10. Xisaabaadka guud ee maaliyadda (Finance Stats)
  11. Lacag-celinta rasmiga ah (Refunds)
  12. Warbixinta baaqiyada iyo gabowga deynta (Outstanding & Aging)
  13. Xisaab-xirka ardayga (Student Financial Statement)
  14. Qorsheynta miisaaniyadda (Budgets)
  15. Mushahaarka shaqaalaha iyo xiriirinta kharashka (Payroll & Linked Expense)
  16. Ka hortagga lacag-dhaafka (Overpayment protection)

  **Qaybta 2: Auth, Tenancy & Security Hardening Tests (12 Tests):**
  17. Diiwaangelinta School A iyo soo saarista session token
  18. Diiwaangelinta School B iyo soo saarista session token
  19. Xaqiijinta xogta gelitaanka ee Zod (Validation error handling)
  20. Abuurista arday School A
  21. Kala soocidda xogta (Tenant Isolation): School B ma akhrisan karo ardayda School A (IDOR blocked)
  22. Kala soocidda xogta: School B ma tirtiri karo ardayda School A
  23. Kala soocidda xogta: Liiska School B kuma jiraan ardayda School A
  24. Dib-u-dejinta password-ka (Forgot password generic response against enumeration)
  25. Diidmada reset password haddii token-ku khaldan yahay
  26. Ka bixidda nidaamka (Logout) oo si toos ah u baabi'isa session token-ka
  27. Dib-u-galista password-ka saxda ah oo bixisa token cusub
  28. Diidmada password-ka khaldan

* **GitHub Actions CI Workflow (`.github/workflows/ci.yml`):**
  Si toos ah ayuu u hubiyaa code-ka, typecheck/lint (`npm run lint`), build (`npm run build`), iyo test suite (`npm test`) mar kasta oo la sameeyo push ama pull request.

---

## 8. SIDA LOO KICIYO LOONA HIRGELIYO (INSTALLATION & DEPLOYMENT)

### 1. Soo Degsashada iyo Ku Rakibidda:
```bash
# 1. Ku shub xirmooyinka lagama maarmaanka ah
npm install

# 2. Samee faylka .env adigoo ka koobiyeynaya .env.example
cp .env.example .env

# 3. Kici server-ka tijaabada (Development Mode)
npm run dev
```

### 2. Dhisidda Production-ka (Production Build):
```bash
# U diyaari server-ka iyo frontend-ka shaashadda rasmiga ah
npm run build

# Kici nidaamka dhammeystiran
npm start
```
Nidaamku wuxuu si toos ah uga shaqeynayaa: `http://localhost:3000`

---
*Dokumentigani wuxuu si buuxda u qeexayaa dhammaan qaybaha, siraha, furayaasha, iyo qaab-dhismeedka nidaamka **DUGSI PRO 2026**.*
