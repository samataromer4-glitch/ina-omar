# DUGSI PRO 2026 — School Management & Finance SaaS

DUGSI PRO 2026 is an enterprise-grade School Management & Finance SaaS engineered for modern primary, secondary, and tertiary educational institutions. It features multi-tenant isolation, real-time student tracking, automated fee invoicing, receipt generation, payroll, profit & loss analytics, and cloud database persistence powered by Supabase PostgreSQL.

---

## 🏛️ System Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    DUGSI PRO 2026 Client                     │
│           React 19 + TypeScript + Vite + Tailwind CSS        │
│          PWA Offline Caching + Role-Based Navigations        │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / JSON API (Bearer JWT)
┌──────────────────────────────▼───────────────────────────────┐
│                    Express API Gateway                       │
│  - Helmet HTTP hardening & secure headers                    │
│  - Request ID correlation & audit trails                     │
│  - Centralized Zod schema validation                         │
│  - Rate limiting (Auth: 30/min, Finance: 120/min)            │
│  - Persistent Session Store with SHA-256 token hashing       │
│  - scrypt password hashing & legacy migration                │
│  - Zero-trust tenant derivation (from session token only)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ Service Role / Authenticated
┌──────────────────────────────▼───────────────────────────────┐
│                Supabase PostgreSQL 17 Cloud                  │
│  - 29 Core & Financial relational tables                     │
│  - Row Level Security (RLS) enabled on all 29 tables         │
│  - Tenant isolation policies enforced at database level      │
│  - Compound indexes on (school_id, ...)                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Capabilities & Modules

### 1. Authentication & Security
- **scrypt Key Derivation**: High-entropy password hashing with crypto.scryptSync and salt.
- **Session Persistence**: Cryptographically random 32-byte opaque session tokens stored in PostgreSQL (`dugsiga_settings` under `__sessions__`).
- **Real Email Verification**: 6-digit numeric codes with 24-hour expiration sent via SMTP with simulated dev fallback.
- **Account Recovery**: Secure password reset flow (`/api/auth/forgot-password` and `/api/auth/reset-password`) with single-use tokens and automatic revocation of all active sessions upon password reset.
- **Zero-Trust Multi-Tenancy**: The client cannot override tenant identity via headers (`X-School-Email`, `X-School-Id`). Identity is derived strictly from server-authenticated sessions.

### 2. Academics & Administration
- **Students**: Admissions, enrollment, attendance sheets, class rosters, report cards, ID generation.
- **Teachers & Staff**: HR records, qualifications, subject assignments, invitation workflows via email, role assignments.
- **Timetable & Scheduling**: Conflict detection across teachers, classes, and rooms.
- **Admissions**: Application intake, review, student conversion.
- **Maktabadda (Library)**: Book cataloging, loan tracking, overdue calculations.
- **Qalabka (Inventory)**: Asset registration, condition monitoring, valuation.

### 3. Finance & Accounting (Authoritative PostgreSQL)
- **Fee Structures**: Flexible pricing structures by class, term, and academic year.
- **Invoices**: Single and bulk invoice generation with subtotal, discounts, and outstanding balance tracking.
- **Payments**: Collision-proof receipt generation (`REC-YYYYMMDD-XXXX`), overpayment protection, duplicate transaction guards.
- **Refunds**: Multi-step refund authorization with balance reversal and invoice recalculation.
- **Discounts**: Scholarship concessions with balance synchronization.
- **Expenses**: Category breakdown, vendor payee tracking, and manager approvals.
- **Budgets**: Planned vs. actual variance analysis.
- **Payroll**: Net salary computation, tax/allowance deductions, and one-click salary expense linking.
- **Financial Analytics**: Profit & Loss (P&L), Cash Flow timeline, Aging debtors analysis.

---

## 📋 Database Schema (29 Tables)

| # | Table Name | Purpose |
|---|---|---|
| 1 | `dugsiga_users` | Admin & staff credentials, scrypt password hashes, verification codes |
| 2 | `dugsiga_students` | Student demographic records, class assignments, guardian contact |
| 3 | `dugsiga_classes` | Class definitions, room numbers, capacities, academic years |
| 4 | `dugsiga_subjects` | Course subjects, codes, passing marks, maximum marks |
| 5 | `dugsiga_exam_scores` | Academic exam results, scores obtained, letter grades |
| 6 | `dugsiga_attendance` | Daily student attendance registers (before/after break) |
| 7 | `dugsiga_fees` | Historical monthly student fee tracking records |
| 8 | `dugsiga_settings` | School branding, settings, persistent sessions, password resets |
| 9 | `dugsiga_teachers` | Teacher directory, qualifications, salaries, assigned classes |
| 10 | `dugsiga_staff` | Support staff records, employment status, roles |
| 11 | `dugsiga_guardians` | Parent contact numbers, WhatsApp, linked student IDs |
| 12 | `dugsiga_staff_attendance` | Teacher & staff daily attendance check-ins |
| 13 | `dugsiga_timetable` | Weekly class schedules, teacher assignments, room booking |
| 14 | `dugsiga_admissions` | Prospective student admissions intake workflow |
| 15 | `dugsiga_announcements` | Institution-wide bulletins and target class notifications |
| 16 | `dugsiga_library_books` | Library catalog, ISBN, copies available |
| 17 | `dugsiga_library_loans` | Book borrowing, due dates, return statuses |
| 18 | `dugsiga_inventory` | School physical assets, condition, acquisition cost |
| 19 | `dugsiga_documents` | File records, student certificates, school documents |
| 20 | `dugsiga_notifications` | Push and internal user notification queue |
| 21 | `dugsiga_fee_structures` | Tuition & auxiliary fee rates per grade and term |
| 22 | `dugsiga_invoices` | Student billing invoices with line items, balance, status |
| 23 | `dugsiga_payments` | Fee collections, receipts, transaction methods |
| 24 | `dugsiga_expenses` | Operational expenses, vendor payees, payroll linkages |
| 25 | `dugsiga_income` | Non-tuition revenue streams and donations |
| 26 | `dugsiga_budgets` | Planned vs actual budget tracking and variance |
| 27 | `dugsiga_payroll` | Staff payroll calculation, net salaries, approval status |
| 28 | `dugsiga_discounts` | Student fee concessions and discount ledger |
| 29 | `dugsiga_refunds` | Payment reversals and balance restitution ledger |

---

## 🛠️ Local Development & Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 2. Installation
```bash
git clone https://github.com/samataromer4-glitch/ina-omar.git
cd ina-omar
npm ci
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure:
```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Supabase Credentials
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SECRET_KEY=<your-service-role-key>

# SMTP Configuration (Optional in dev, required in prod)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@school.com
SMTP_PASS=app-password
SMTP_FROM="DUGSI PRO 2026" <admin@school.com>
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

The test suite runs with native Node.js Test Runner and TSX.

```bash
# Run linting (TypeScript compiler check)
npm run lint

# Run all 28 automated integration tests
npm test

# Build production client and server bundles
npm run build
```

---

## 🚀 Database Migrations

Migration files are stored in `supabase/migrations/`:
- `20260101000000_01_core_tables.sql`
- `20260101000001_02_academic_and_hr.sql`
- `20260101000002_03_finance_tables.sql`
- `20260101000003_04_indexes_and_constraints.sql`
- `20260101000004_05_rls_security_hardening.sql`

To execute the entire schema in a single step, copy the contents of `DUGSI_PRO_2026_ALL_TABLES.sql` and run it in the **Supabase Dashboard ➡️ SQL Editor**.

---

## 🔒 Security Posture

1. **Helmet & Secure Headers**: Strict CSP options, Frameguard, and X-Content-Type-Options.
2. **CORS Allowlist**: Origins restricted to authorized application hosts.
3. **Rate Limiting**:
   - Authentication mutations: 30 requests / minute
   - Financial transactions: 120 requests / minute
4. **Row Level Security (RLS)**:
   - Enabled on all 29 database tables.
   - Public/anon execution of `public.rls_auto_enable()` is revoked/dropped.
   - Tenant isolation enforced strictly by `school_id = authenticated_tenant`.
5. **No Secrets in Frontend**: Secret keys and service role credentials remain strictly server-side.
