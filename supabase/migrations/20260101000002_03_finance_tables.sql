-- ============================================================================
-- DUGSI PRO 2026 - MIGRATION 03: FINANCE TABLES (21-29)
-- ============================================================================

-- 21. Fee Structures Table
CREATE TABLE IF NOT EXISTS dugsiga_fee_structures (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  class_name TEXT DEFAULT 'All Classes',
  academic_year TEXT DEFAULT '2026-2027',
  term TEXT DEFAULT 'All Terms',
  description TEXT,
  created_at TEXT
);

-- 22. Invoices Table
CREATE TABLE IF NOT EXISTS dugsiga_invoices (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  class_name TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 23. Payments Table
CREATE TABLE IF NOT EXISTS dugsiga_payments (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL,
  invoice_id TEXT,
  invoice_number TEXT,
  student_id TEXT,
  student_name TEXT,
  class_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  reference TEXT,
  remaining_balance NUMERIC DEFAULT 0,
  received_by TEXT NOT NULL,
  notes TEXT,
  created_at TEXT
);

-- 24. Expenses Table
CREATE TABLE IF NOT EXISTS dugsiga_expenses (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  expense_id TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  vendor_payee TEXT NOT NULL,
  reference_number TEXT,
  receipt_document TEXT,
  created_by TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Approved',
  payroll_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 25. Income Table
CREATE TABLE IF NOT EXISTS dugsiga_income (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  income_id TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  reference TEXT,
  payer TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  payment_id TEXT,
  created_at TEXT
);

-- 26. Budgets Table
CREATE TABLE IF NOT EXISTS dugsiga_budgets (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2026-2027',
  period TEXT NOT NULL DEFAULT 'Annual',
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Expense',
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT
);

-- 27. Payroll Table
CREATE TABLE IF NOT EXISTS dugsiga_payroll (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  employee_type TEXT NOT NULL DEFAULT 'Teacher',
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  role_or_department TEXT,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  gross_salary NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  payment_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'EVC Plus',
  payroll_period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  notes TEXT,
  paid_at TEXT,
  expense_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 28. Discounts Table
CREATE TABLE IF NOT EXISTS dugsiga_discounts (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  invoice_number TEXT,
  student_id TEXT NOT NULL,
  student_name TEXT,
  class_name TEXT,
  discount_type TEXT DEFAULT 'fixed',
  value NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  approved_by TEXT,
  date TEXT,
  notes TEXT,
  created_at TEXT
);

-- 29. Refunds Table
CREATE TABLE IF NOT EXISTS dugsiga_refunds (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  receipt_number TEXT,
  invoice_id TEXT,
  invoice_number TEXT,
  student_id TEXT,
  student_name TEXT,
  class_name TEXT,
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  reason TEXT,
  approved_by TEXT,
  date TEXT,
  notes TEXT,
  created_at TEXT
);
