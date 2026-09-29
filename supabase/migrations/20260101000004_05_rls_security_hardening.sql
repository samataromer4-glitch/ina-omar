-- ============================================================================
-- DUGSI PRO 2026 - MIGRATION 05: RLS SECURITY HARDENING & PERMISSIONS
-- ============================================================================

-- 1. Remove dangerous public.rls_auto_enable SECURITY DEFINER exposure
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    BEGIN
      EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;';
      EXECUTE 'DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

-- 2. Enable Row Level Security (RLS) on all tenant-owned tables
DO $$
DECLARE
  tbl_name TEXT;
  tables_list TEXT[] := ARRAY[
    'dugsiga_users',
    'dugsiga_students',
    'dugsiga_classes',
    'dugsiga_subjects',
    'dugsiga_exam_scores',
    'dugsiga_attendance',
    'dugsiga_fees',
    'dugsiga_settings',
    'dugsiga_teachers',
    'dugsiga_staff',
    'dugsiga_guardians',
    'dugsiga_staff_attendance',
    'dugsiga_timetable',
    'dugsiga_admissions',
    'dugsiga_announcements',
    'dugsiga_library_books',
    'dugsiga_library_loans',
    'dugsiga_inventory',
    'dugsiga_documents',
    'dugsiga_notifications',
    'dugsiga_fee_structures',
    'dugsiga_invoices',
    'dugsiga_payments',
    'dugsiga_expenses',
    'dugsiga_income',
    'dugsiga_budgets',
    'dugsiga_payroll',
    'dugsiga_discounts',
    'dugsiga_refunds'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tables_list LOOP
    BEGIN
      -- Enable Row Level Security
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl_name);
      
      -- Revoke wide public access from anon
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon, PUBLIC;', tbl_name);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated, service_role;', tbl_name);
      
      -- Tenant Isolation Policy: school_id derived from server-controlled context or JWT claim
      IF tbl_name <> 'dugsiga_users' THEN
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%s" ON %I;', tbl_name, tbl_name);
        EXECUTE format(
          'CREATE POLICY "tenant_isolation_%s" ON %I FOR ALL USING (
            (select auth.role()) = ''service_role''
            OR school_id = coalesce(
              nullif(current_setting(''app.current_school_id'', true), ''''),
              (select auth.jwt() ->> ''school_id''),
              (select auth.jwt() ->> ''email'')
            )
          ) WITH CHECK (
            (select auth.role()) = ''service_role''
            OR school_id = coalesce(
              nullif(current_setting(''app.current_school_id'', true), ''''),
              (select auth.jwt() ->> ''school_id''),
              (select auth.jwt() ->> ''email'')
            )
          );',
          tbl_name, tbl_name
        );
      ELSE
        EXECUTE format('DROP POLICY IF EXISTS "users_isolation" ON dugsiga_users;');
        EXECUTE format(
          'CREATE POLICY "users_isolation" ON dugsiga_users FOR ALL USING (
            (select auth.role()) = ''service_role''
            OR email = coalesce((select auth.jwt() ->> ''email''), nullif(current_setting(''app.current_user_email'', true), ''''))
          ) WITH CHECK (
            (select auth.role()) = ''service_role''
            OR email = coalesce((select auth.jwt() ->> ''email''), nullif(current_setting(''app.current_user_email'', true), ''''))
          );'
        );
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: %', SQLERRM;
    END;
  END LOOP;
END $$;
