-- ============================================================================
-- DUGSI PRO 2026 - MIGRATION 04: INDEXES & CONSTRAINTS
-- ============================================================================

-- Primary tenant isolation indexes across all tables
CREATE INDEX IF NOT EXISTS idx_dugsiga_users_email ON dugsiga_users(email);
CREATE INDEX IF NOT EXISTS idx_dugsiga_students_school_id ON dugsiga_students(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_classes_school_id ON dugsiga_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_subjects_school_id ON dugsiga_subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_exam_scores_school_id ON dugsiga_exam_scores(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_attendance_school_id ON dugsiga_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_fees_school_id ON dugsiga_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_settings_school_id ON dugsiga_settings(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_teachers_school_id ON dugsiga_teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_staff_school_id ON dugsiga_staff(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_guardians_school_id ON dugsiga_guardians(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_staff_attendance_school_id ON dugsiga_staff_attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_timetable_school_id ON dugsiga_timetable(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_admissions_school_id ON dugsiga_admissions(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_announcements_school_id ON dugsiga_announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_library_books_school_id ON dugsiga_library_books(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_library_loans_school_id ON dugsiga_library_loans(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_inventory_school_id ON dugsiga_inventory(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_documents_school_id ON dugsiga_documents(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_notifications_school_id ON dugsiga_notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_fee_structures_school_id ON dugsiga_fee_structures(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_invoices_school_id ON dugsiga_invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_payments_school_id ON dugsiga_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_expenses_school_id ON dugsiga_expenses(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_income_school_id ON dugsiga_income(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_budgets_school_id ON dugsiga_budgets(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_payroll_school_id ON dugsiga_payroll(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_discounts_school_id ON dugsiga_discounts(school_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_refunds_school_id ON dugsiga_refunds(school_id);

-- Operational Query & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_dugsiga_students_class ON dugsiga_students(school_id, class);
CREATE INDEX IF NOT EXISTS idx_dugsiga_attendance_date ON dugsiga_attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_dugsiga_invoices_student ON dugsiga_invoices(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_dugsiga_invoices_status ON dugsiga_invoices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_dugsiga_payments_date ON dugsiga_payments(school_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_dugsiga_expenses_date ON dugsiga_expenses(school_id, date);
CREATE INDEX IF NOT EXISTS idx_dugsiga_timetable_class ON dugsiga_timetable(school_id, class_name, day);
CREATE INDEX IF NOT EXISTS idx_dugsiga_payroll_period ON dugsiga_payroll(school_id, payroll_period);
