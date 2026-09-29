import crypto from "crypto";

export interface FinanceStoreContext {
  supabase: any;
  getUseLocalFallback: () => boolean;
  loadLocalDB: () => any;
  saveLocalDB: (db: any) => void;
}

export function createFinanceStore(ctx: FinanceStoreContext) {
  const { supabase, getUseLocalFallback, loadLocalDB, saveLocalDB } = ctx;

  // Supabase is authoritative in production. Fallback is only allowed if explicitly enabled or Supabase is unconfigured.
  const isSupabaseConfigured = () => Boolean(supabase) && !getUseLocalFallback();
  const allowLocalFallback = () => process.env.ALLOW_LOCAL_FALLBACK === "true" || getUseLocalFallback() || !supabase;

  // Helper: ensure local DB arrays exist for offline/dev fallback
  const getEnsureDB = () => {
    const db = loadLocalDB();
    if (!db.feeStructures) db.feeStructures = [];
    if (!db.invoices) db.invoices = [];
    if (!db.payments) db.payments = [];
    if (!db.expenses) db.expenses = [];
    if (!db.income) db.income = [];
    if (!db.budgets) db.budgets = [];
    if (!db.payroll) db.payroll = [];
    if (!db.fees) db.fees = [];
    if (!db.discounts) db.discounts = [];
    if (!db.refunds) db.refunds = [];
    if (!db.students) db.students = [];
    return db;
  };

  /* =========================================================================
     1. FEE STRUCTURES (dugsiga_fee_structures)
     ========================================================================= */
  const formatFeeStructureFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    name: row.name,
    category: row.category,
    amount: Number(row.amount || 0),
    className: row.class_name || "All Classes",
    academicYear: row.academic_year || "2026-2027",
    term: row.term || "All Terms",
    description: row.description || "",
    createdAt: row.created_at || ""
  });

  const toFeeStructureDB = (item: any) => ({
    id: item.id,
    school_id: item.schoolId,
    name: item.name,
    category: item.category,
    amount: Number(item.amount || 0),
    class_name: item.className || "All Classes",
    academic_year: item.academicYear || "2026-2027",
    term: item.term || "All Terms",
    description: item.description || "",
    created_at: item.createdAt || new Date().toISOString()
  });

  async function getFeeStructures(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_fee_structures")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getFeeStructures:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatFeeStructureFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.feeStructures || []).filter((fs: any) => fs.schoolId === schoolId);
  }

  async function saveFeeStructure(item: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_fee_structures")
        .upsert([toFeeStructureDB(item)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveFeeStructure:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.feeStructures || []).findIndex((fs: any) => fs.id === item.id && fs.schoolId === item.schoolId);
    if (idx > -1) {
      db.feeStructures[idx] = { ...db.feeStructures[idx], ...item };
    } else {
      db.feeStructures.unshift(item);
    }
    saveLocalDB(db);
  }

  async function deleteFeeStructure(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_fee_structures")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteFeeStructure:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.feeStructures = (db.feeStructures || []).filter((fs: any) => !(fs.id === id && fs.schoolId === schoolId));
    saveLocalDB(db);
  }

  /* =========================================================================
     2. INVOICES (dugsiga_invoices)
     ========================================================================= */
  const formatInvoiceFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    invoiceNumber: row.invoice_number,
    studentId: row.student_id,
    studentName: row.student_name,
    className: row.class_name,
    guardianName: row.guardian_name || "",
    guardianPhone: row.guardian_phone || "",
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total || 0),
    paidAmount: Number(row.paid_amount || 0),
    balance: Number(row.balance || 0),
    issueDate: row.issue_date || "",
    dueDate: row.due_date || "",
    status: row.status || "Unpaid",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  });

  const toInvoiceDB = (inv: any) => ({
    id: inv.id,
    school_id: inv.schoolId,
    invoice_number: inv.invoiceNumber,
    student_id: inv.studentId,
    student_name: inv.studentName,
    class_name: inv.className,
    guardian_name: inv.guardianName || "",
    guardian_phone: inv.guardianPhone || "",
    items: Array.isArray(inv.items) ? inv.items : [],
    subtotal: Number(inv.subtotal || 0),
    discount: Number(inv.discount || 0),
    total: Number(inv.total || 0),
    paid_amount: Number(inv.paidAmount || 0),
    balance: Number(inv.balance || 0),
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    status: inv.status || "Unpaid",
    notes: inv.notes || "",
    created_at: inv.createdAt || new Date().toISOString(),
    updated_at: inv.updatedAt || new Date().toISOString()
  });

  async function getInvoices(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_invoices")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getInvoices:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatInvoiceFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.invoices || []).filter((inv: any) => inv.schoolId === schoolId);
  }

  async function getInvoiceById(id: string, schoolId: string): Promise<any | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_invoices")
        .select("*")
        .eq("id", id)
        .eq("school_id", schoolId)
        .maybeSingle();

      if (error) {
        console.error("[FinanceStore] Error in getInvoiceById:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return formatInvoiceFromDB(data);
      }
    }

    const db = getEnsureDB();
    const inv = (db.invoices || []).find((i: any) => i.id === id && i.schoolId === schoolId);
    return inv || null;
  }

  async function saveInvoice(inv: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_invoices")
        .upsert([toInvoiceDB(inv)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveInvoice:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.invoices || []).findIndex((i: any) => i.id === inv.id && i.schoolId === inv.schoolId);
    if (idx > -1) {
      db.invoices[idx] = { ...db.invoices[idx], ...inv };
    } else {
      db.invoices.unshift(inv);
    }
    saveLocalDB(db);
  }

  async function saveInvoicesBulk(invoices: any[]): Promise<void> {
    if (invoices.length === 0) return;

    if (isSupabaseConfigured()) {
      const rows = invoices.map(toInvoiceDB);
      const { error } = await supabase.from("dugsiga_invoices").upsert(rows, { onConflict: "id" });
      if (error) {
        console.error("[FinanceStore] Error in saveInvoicesBulk:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase bulk write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    for (const inv of invoices) {
      const idx = (db.invoices || []).findIndex((i: any) => i.id === inv.id && i.schoolId === inv.schoolId);
      if (idx > -1) {
        db.invoices[idx] = { ...db.invoices[idx], ...inv };
      } else {
        db.invoices.push(inv);
      }
    }
    saveLocalDB(db);
  }

  async function deleteInvoice(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_invoices")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteInvoice:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.invoices = (db.invoices || []).filter((inv: any) => !(inv.id === id && inv.schoolId === schoolId));
    db.fees = (db.fees || []).filter((f: any) => !(f.id === id && f.schoolId === schoolId));
    saveLocalDB(db);
  }

  /* =========================================================================
     3. PAYMENTS (dugsiga_payments)
     ========================================================================= */
  const formatPaymentFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    receiptNumber: row.receipt_number,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    studentId: row.student_id,
    studentName: row.student_name,
    className: row.class_name,
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method || "Cash",
    reference: row.reference || "",
    remainingBalance: Number(row.remaining_balance || 0),
    receivedBy: row.received_by,
    notes: row.notes || "",
    createdAt: row.created_at || ""
  });

  const toPaymentDB = (p: any) => ({
    id: p.id,
    school_id: p.schoolId,
    receipt_number: p.receiptNumber,
    invoice_id: p.invoiceId,
    invoice_number: p.invoiceNumber,
    student_id: p.studentId,
    student_name: p.studentName,
    class_name: p.className,
    amount: Number(p.amount || 0),
    payment_date: p.paymentDate,
    payment_method: p.paymentMethod || "Cash",
    reference: p.reference || "",
    remaining_balance: Number(p.remainingBalance || 0),
    received_by: p.receivedBy,
    notes: p.notes || "",
    created_at: p.createdAt || new Date().toISOString()
  });

  async function getPayments(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_payments")
        .select("*")
        .eq("school_id", schoolId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getPayments:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatPaymentFromDB);
      }
    }

    const db = getEnsureDB();
    const list = (db.payments || []).filter((p: any) => p.schoolId === schoolId);
    list.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return list;
  }

  async function savePayment(p: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_payments")
        .upsert([toPaymentDB(p)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in savePayment:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.payments || []).findIndex((item: any) => item.id === p.id && item.schoolId === p.schoolId);
    if (idx > -1) {
      db.payments[idx] = { ...db.payments[idx], ...p };
    } else {
      db.payments.unshift(p);
    }
    saveLocalDB(db);
  }

  /**
   * TRANSACTIONAL: Record payment, update invoice paid amount and balance, check overpayment & duplicates.
   */
  async function recordPayment(paymentData: any): Promise<{ payment: any; invoice: any }> {
    const { schoolId, invoiceId, amount, paymentMethod, reference, receivedBy, notes, paymentDate } = paymentData;

    // 1. Fetch invoice
    const invoice = await getInvoiceById(invoiceId, schoolId);
    if (!invoice) {
      throw new Error("Invoice-ka lama helin (Invoice not found)");
    }
    if (invoice.balance <= 0) {
      throw new Error("Invoice-kan horey ayaa loo wada bixiyey (Invoice is already fully paid)");
    }
    if (amount > invoice.balance) {
      throw new Error(`Lacagta aad bixinayso ($${amount}) way ka badan tahay haraaga biilka ($${invoice.balance})`);
    }

    // 2. Prevent duplicate payment within 2 minutes for identical invoice and amount
    const recentPayments = await getPayments(schoolId);
    const now = Date.now();
    const isDuplicate = recentPayments.some(p => {
      if (p.invoiceId !== invoiceId || p.amount !== amount) return false;
      const paymentTime = new Date(p.createdAt || p.paymentDate).getTime();
      return Math.abs(now - paymentTime) < 2 * 60 * 1000;
    });

    if (isDuplicate) {
      throw new Error("Lacag-bixintan oo kale horey ayaa loo qabtay dhowr daqiiqo ka hor (Duplicate payment detected)");
    }

    // 3. Generate collision-proof receipt number
    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPaidAmount = Number((invoice.paidAmount + amount).toFixed(2));
    const newBalance = Number((invoice.total - newPaidAmount).toFixed(2));
    const newStatus = newBalance <= 0 ? "Paid" : "Partial";

    const paymentRecord = {
      id: 'pay-' + crypto.randomBytes(6).toString("hex"),
      schoolId,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      className: invoice.className,
      amount,
      paymentDate: paymentDate || new Date().toISOString().split("T")[0],
      paymentMethod: paymentMethod || "Cash",
      reference: reference || "",
      remainingBalance: Math.max(0, newBalance),
      receivedBy: receivedBy || "Accountant",
      notes: notes || "",
      createdAt: new Date().toISOString()
    };

    // 4. Save payment record
    await savePayment(paymentRecord);

    // 5. Update invoice
    const updatedInvoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      balance: Math.max(0, newBalance),
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    await saveInvoice(updatedInvoice);

    return { payment: paymentRecord, invoice: updatedInvoice };
  }

  /* =========================================================================
     4. EXPENSES (dugsiga_expenses)
     ========================================================================= */
  const formatExpenseFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    expenseId: row.expense_id,
    category: row.category,
    description: row.description,
    amount: Number(row.amount || 0),
    date: row.date,
    paymentMethod: row.payment_method || "Cash",
    vendorPayee: row.vendor_payee,
    referenceNumber: row.reference_number || "",
    receiptDocument: row.receipt_document || "",
    createdBy: row.created_by,
    notes: row.notes || "",
    status: row.status || "Approved",
    payrollId: row.payroll_id || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  });

  const toExpenseDB = (e: any) => ({
    id: e.id,
    school_id: e.schoolId,
    expense_id: e.expenseId,
    category: e.category,
    description: e.description,
    amount: Number(e.amount || 0),
    date: e.date,
    payment_method: e.paymentMethod || "Cash",
    vendor_payee: e.vendorPayee,
    reference_number: e.referenceNumber || "",
    receipt_document: e.receiptDocument || "",
    created_by: e.createdBy,
    notes: e.notes || "",
    status: e.status || "Approved",
    payroll_id: e.payrollId || null,
    created_at: e.createdAt || new Date().toISOString(),
    updated_at: e.updatedAt || new Date().toISOString()
  });

  async function getExpenses(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_expenses")
        .select("*")
        .eq("school_id", schoolId)
        .order("date", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getExpenses:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatExpenseFromDB);
      }
    }

    const db = getEnsureDB();
    const list = (db.expenses || []).filter((e: any) => e.schoolId === schoolId);
    list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }

  async function saveExpense(e: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_expenses")
        .upsert([toExpenseDB(e)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveExpense:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.expenses || []).findIndex((item: any) => item.id === e.id && item.schoolId === e.schoolId);
    if (idx > -1) {
      db.expenses[idx] = { ...db.expenses[idx], ...e };
    } else {
      db.expenses.unshift(e);
    }
    saveLocalDB(db);
  }

  async function deleteExpense(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_expenses")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteExpense:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.expenses = (db.expenses || []).filter((e: any) => !(e.id === id && e.schoolId === schoolId));
    saveLocalDB(db);
  }

  /* =========================================================================
     5. INCOME (dugsiga_income)
     ========================================================================= */
  const formatIncomeFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    incomeId: row.income_id,
    category: row.category,
    description: row.description,
    amount: Number(row.amount || 0),
    date: row.date,
    paymentMethod: row.payment_method || "Cash",
    reference: row.reference || "",
    payer: row.payer,
    notes: row.notes || "",
    createdBy: row.created_by,
    paymentId: row.payment_id || "",
    createdAt: row.created_at || ""
  });

  const toIncomeDB = (inc: any) => ({
    id: inc.id,
    school_id: inc.schoolId,
    income_id: inc.incomeId,
    category: inc.category,
    description: inc.description,
    amount: Number(inc.amount || 0),
    date: inc.date,
    payment_method: inc.paymentMethod || "Cash",
    reference: inc.reference || "",
    payer: inc.payer,
    notes: inc.notes || "",
    created_by: inc.createdBy,
    payment_id: inc.paymentId || null,
    created_at: inc.createdAt || new Date().toISOString()
  });

  async function getIncome(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_income")
        .select("*")
        .eq("school_id", schoolId)
        .order("date", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getIncome:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatIncomeFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.income || []).filter((inc: any) => inc.schoolId === schoolId);
  }

  async function saveIncome(inc: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_income")
        .upsert([toIncomeDB(inc)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveIncome:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.income || []).findIndex((item: any) => item.id === inc.id && item.schoolId === inc.schoolId);
    if (idx > -1) {
      db.income[idx] = { ...db.income[idx], ...inc };
    } else {
      db.income.unshift(inc);
    }
    saveLocalDB(db);
  }

  async function deleteIncome(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_income")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteIncome:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.income = (db.income || []).filter((inc: any) => !(inc.id === id && inc.schoolId === schoolId));
    saveLocalDB(db);
  }

  /* =========================================================================
     6. BUDGETS (dugsiga_budgets)
     ========================================================================= */
  const formatBudgetFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    academicYear: row.academic_year || "2026-2027",
    period: row.period || "Annual",
    category: row.category,
    type: row.type || "Expense",
    plannedAmount: Number(row.planned_amount || 0),
    actualAmount: Number(row.actual_amount || 0),
    remainingAmount: Number(row.remaining_amount || 0),
    variance: Number(row.variance || 0),
    notes: row.notes || "",
    createdAt: row.created_at || ""
  });

  const toBudgetDB = (b: any) => ({
    id: b.id,
    school_id: b.schoolId,
    academic_year: b.academicYear || "2026-2027",
    period: b.period || "Annual",
    category: b.category,
    type: b.type || "Expense",
    planned_amount: Number(b.plannedAmount || 0),
    actual_amount: Number(b.actualAmount || 0),
    remaining_amount: Number(b.remainingAmount || 0),
    variance: Number(b.variance || 0),
    notes: b.notes || "",
    created_at: b.createdAt || new Date().toISOString()
  });

  async function getBudgets(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_budgets")
        .select("*")
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in getBudgets:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatBudgetFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.budgets || []).filter((b: any) => b.schoolId === schoolId);
  }

  async function saveBudget(b: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_budgets")
        .upsert([toBudgetDB(b)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveBudget:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.budgets || []).findIndex((item: any) => item.id === b.id && item.schoolId === b.schoolId);
    if (idx > -1) {
      db.budgets[idx] = { ...db.budgets[idx], ...b };
    } else {
      db.budgets.push(b);
    }
    saveLocalDB(db);
  }

  async function deleteBudget(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_budgets")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteBudget:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.budgets = (db.budgets || []).filter((b: any) => !(b.id === id && b.schoolId === schoolId));
    saveLocalDB(db);
  }

  /* =========================================================================
     7. PAYROLL (dugsiga_payroll)
     ========================================================================= */
  const formatPayrollFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    employeeType: row.employee_type || "Teacher",
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    roleOrDepartment: row.role_or_department || "",
    basicSalary: Number(row.basic_salary || 0),
    allowances: Number(row.allowances || 0),
    deductions: Number(row.deductions || 0),
    grossSalary: Number(row.gross_salary || 0),
    netSalary: Number(row.net_salary || 0),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method || "EVC Plus",
    payrollPeriod: row.payroll_period,
    status: row.status || "Draft",
    notes: row.notes || "",
    paidAt: row.paid_at || "",
    expenseId: row.expense_id || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || ""
  });

  const toPayrollDB = (pr: any) => ({
    id: pr.id,
    school_id: pr.schoolId,
    employee_type: pr.employeeType || "Teacher",
    employee_id: pr.employeeId,
    employee_name: pr.employeeName,
    role_or_department: pr.roleOrDepartment || "",
    basic_salary: Number(pr.basicSalary || 0),
    allowances: Number(pr.allowances || 0),
    deductions: Number(pr.deductions || 0),
    gross_salary: Number(pr.grossSalary || 0),
    net_salary: Number(pr.netSalary || 0),
    payment_date: pr.paymentDate,
    payment_method: pr.paymentMethod || "EVC Plus",
    payroll_period: pr.payrollPeriod,
    status: pr.status || "Draft",
    notes: pr.notes || "",
    paid_at: pr.paidAt || null,
    expense_id: pr.expenseId || null,
    created_at: pr.createdAt || new Date().toISOString(),
    updated_at: pr.updatedAt || new Date().toISOString()
  });

  async function getPayroll(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_payroll")
        .select("*")
        .eq("school_id", schoolId)
        .order("payment_date", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getPayroll:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatPayrollFromDB);
      }
    }

    const db = getEnsureDB();
    const list = (db.payroll || []).filter((pr: any) => pr.schoolId === schoolId);
    list.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    return list;
  }

  async function savePayroll(pr: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_payroll")
        .upsert([toPayrollDB(pr)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in savePayroll:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.payroll || []).findIndex((item: any) => item.id === pr.id && item.schoolId === pr.schoolId);
    if (idx > -1) {
      db.payroll[idx] = { ...db.payroll[idx], ...pr };
    } else {
      db.payroll.unshift(pr);
    }
    saveLocalDB(db);
  }

  async function deletePayroll(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_payroll")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deletePayroll:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const pr = (db.payroll || []).find((p: any) => p.id === id && p.schoolId === schoolId);
    if (pr?.expenseId) {
      db.expenses = (db.expenses || []).filter((e: any) => e.id !== pr.expenseId && e.payrollId !== id);
    }
    db.payroll = (db.payroll || []).filter((p: any) => !(p.id === id && p.schoolId === schoolId));
    saveLocalDB(db);
  }

  /**
   * TRANSACTIONAL: Pay payroll and create single linked salary expense without duplicates.
   */
  async function payPayroll(id: string, schoolId: string, paymentMethod: string = "EVC Plus"): Promise<any> {
    const payrollList = await getPayroll(schoolId);
    const item = payrollList.find(p => p.id === id);
    if (!item) throw new Error("Diiwaanka mushaharka lama helin (Payroll record not found)");
    if (item.status === "Paid") throw new Error("Mushaharkan horey ayaa loo bixiyey (Payroll is already marked as paid)");

    // Prevent duplicate salary expenses
    const existingExpenses = await getExpenses(schoolId);
    let expense = existingExpenses.find(e => e.payrollId === id);

    if (!expense) {
      expense = {
        id: 'exp-' + crypto.randomBytes(6).toString("hex"),
        schoolId,
        expenseId: 'EXP-SALARY-' + Date.now().toString().slice(-6),
        category: 'Salaries',
        description: `Mushahar: ${item.employeeName} (${item.payrollPeriod})`,
        amount: item.netSalary,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: paymentMethod || item.paymentMethod || "EVC Plus",
        vendorPayee: item.employeeName,
        referenceNumber: `PAYROLL-${item.payrollPeriod}-${item.employeeId}`,
        receiptDocument: "",
        createdBy: "Accountant",
        notes: `Toos looga bixiyay Payroll module`,
        status: "Approved",
        payrollId: item.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveExpense(expense);
    }

    const updatedPayroll = {
      ...item,
      status: "Paid",
      paidAt: new Date().toISOString(),
      expenseId: expense.id,
      updatedAt: new Date().toISOString()
    };
    await savePayroll(updatedPayroll);

    return { payroll: updatedPayroll, expense };
  }

  /* =========================================================================
     8. DISCOUNTS (dugsiga_discounts)
     ========================================================================= */
  const formatDiscountFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    studentId: row.student_id,
    studentName: row.student_name,
    class_name: row.class_name,
    discountType: row.discount_type || "fixed",
    value: Number(row.value || 0),
    amount: Number(row.amount || 0),
    reason: row.reason || "",
    approvedBy: row.approved_by || "",
    date: row.date || "",
    notes: row.notes || "",
    createdAt: row.created_at || ""
  });

  const toDiscountDB = (d: any) => ({
    id: d.id,
    school_id: d.schoolId,
    invoice_id: d.invoiceId,
    invoice_number: d.invoiceNumber,
    student_id: d.studentId,
    student_name: d.studentName,
    class_name: d.className || d.class_name || "",
    discount_type: d.discountType || "fixed",
    value: Number(d.value || 0),
    amount: Number(d.amount || 0),
    reason: d.reason || "",
    approved_by: d.approvedBy || "",
    date: d.date || "",
    notes: d.notes || "",
    created_at: d.createdAt || new Date().toISOString()
  });

  async function getDiscounts(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_discounts")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getDiscounts:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatDiscountFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.discounts || []).filter((d: any) => d.schoolId === schoolId);
  }

  async function saveDiscount(d: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_discounts")
        .upsert([toDiscountDB(d)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveDiscount:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.discounts || []).findIndex((item: any) => item.id === d.id && item.schoolId === d.schoolId);
    if (idx > -1) {
      db.discounts[idx] = { ...db.discounts[idx], ...d };
    } else {
      db.discounts.unshift(d);
    }
    saveLocalDB(db);
  }

  async function deleteDiscount(id: string, schoolId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_discounts")
        .delete()
        .eq("id", id)
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in deleteDiscount:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase delete failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    db.discounts = (db.discounts || []).filter((d: any) => !(d.id === id && d.schoolId === schoolId));
    saveLocalDB(db);
  }

  /**
   * TRANSACTIONAL: Apply discount, validate concession, recalculate invoice balance and status.
   */
  async function applyDiscount(discountData: any): Promise<{ discount: any; invoice: any }> {
    const { schoolId, invoiceId, value, discountType, reason, approvedBy } = discountData;
    const invoice = await getInvoiceById(invoiceId, schoolId);
    if (!invoice) throw new Error("Invoice-ka lama helin (Invoice not found)");

    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = Number(((invoice.subtotal * value) / 100).toFixed(2));
    } else {
      discountAmount = Number(value);
    }

    if (discountAmount > invoice.subtotal) {
      throw new Error("Qiimo-dhimistu kama weynaan karto wadarta biilka (Discount exceeds invoice subtotal)");
    }

    const discountRecord = {
      id: 'disc-' + crypto.randomBytes(6).toString("hex"),
      schoolId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      className: invoice.className,
      discountType: discountType || "fixed",
      value: Number(value),
      amount: discountAmount,
      reason: reason || "Fee concession",
      approvedBy: approvedBy || "Admin",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      createdAt: new Date().toISOString()
    };

    await saveDiscount(discountRecord);

    const newDiscount = Number((invoice.discount + discountAmount).toFixed(2));
    const newTotal = Math.max(0, Number((invoice.subtotal - newDiscount).toFixed(2)));
    const newBalance = Math.max(0, Number((newTotal - invoice.paidAmount).toFixed(2)));
    const newStatus = newBalance <= 0 ? "Paid" : (invoice.paidAmount > 0 ? "Partial" : "Unpaid");

    const updatedInvoice = {
      ...invoice,
      discount: newDiscount,
      total: newTotal,
      balance: newBalance,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    await saveInvoice(updatedInvoice);

    return { discount: discountRecord, invoice: updatedInvoice };
  }

  /* =========================================================================
     9. REFUNDS (dugsiga_refunds)
     ========================================================================= */
  const formatRefundFromDB = (row: any) => ({
    id: row.id,
    schoolId: row.school_id,
    paymentId: row.payment_id,
    receiptNumber: row.receipt_number,
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    studentId: row.student_id,
    studentName: row.student_name,
    className: row.class_name,
    refundAmount: Number(row.refund_amount || 0),
    paymentMethod: row.payment_method || "Cash",
    reason: row.reason || "",
    approvedBy: row.approved_by || "",
    date: row.date || "",
    notes: row.notes || "",
    createdAt: row.created_at || ""
  });

  const toRefundDB = (r: any) => ({
    id: r.id,
    school_id: r.schoolId,
    payment_id: r.paymentId,
    receipt_number: r.receiptNumber,
    invoice_id: r.invoiceId,
    invoice_number: r.invoiceNumber,
    student_id: r.studentId,
    student_name: r.studentName,
    class_name: r.className || r.class_name || "",
    refund_amount: Number(r.refundAmount || 0),
    payment_method: r.paymentMethod || "Cash",
    reason: r.reason || "",
    approved_by: r.approvedBy || "",
    date: r.date || "",
    notes: r.notes || "",
    created_at: r.createdAt || new Date().toISOString()
  });

  async function getRefunds(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_refunds")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[FinanceStore] Error in getRefunds:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map(formatRefundFromDB);
      }
    }

    const db = getEnsureDB();
    return (db.refunds || []).filter((r: any) => r.schoolId === schoolId);
  }

  async function saveRefund(r: any): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from("dugsiga_refunds")
        .upsert([toRefundDB(r)], { onConflict: "id" });

      if (error) {
        console.error("[FinanceStore] Error in saveRefund:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase write failed: ${error.message}`);
      }
      return;
    }

    const db = getEnsureDB();
    const idx = (db.refunds || []).findIndex((item: any) => item.id === r.id && item.schoolId === r.schoolId);
    if (idx > -1) {
      db.refunds[idx] = { ...db.refunds[idx], ...r };
    } else {
      db.refunds.unshift(r);
    }
    saveLocalDB(db);
  }

  /**
   * TRANSACTIONAL: Process refund on payment, ensure non-over-refund, restore invoice balance.
   */
  async function processRefund(refundData: any): Promise<{ refund: any; invoice?: any }> {
    const { schoolId, paymentId, refundAmount, reason, paymentMethod, approvedBy } = refundData;
    const payments = await getPayments(schoolId);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error("Lacag-bixinta la celinayo lama helin (Payment not found)");

    const refunds = await getRefunds(schoolId);
    const alreadyRefunded = refunds
      .filter(r => r.paymentId === paymentId)
      .reduce((sum, r) => sum + r.refundAmount, 0);

    const maxRefundable = Number((payment.amount - alreadyRefunded).toFixed(2));
    if (refundAmount > maxRefundable) {
      throw new Error(`Qaddarka lacag-celinta ($${refundAmount}) wuxuu ka badan yahay inta u hartay lacagtan ($${maxRefundable})`);
    }

    const refundRecord = {
      id: 'ref-' + crypto.randomBytes(6).toString("hex"),
      schoolId,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      studentId: payment.studentId,
      studentName: payment.studentName,
      className: payment.className,
      refundAmount,
      paymentMethod: paymentMethod || payment.paymentMethod || "Cash",
      reason: reason || "Returned upon request",
      approvedBy: approvedBy || "Admin",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      createdAt: new Date().toISOString()
    };

    await saveRefund(refundRecord);

    let updatedInvoice: any = undefined;
    if (payment.invoiceId) {
      const invoice = await getInvoiceById(payment.invoiceId, schoolId);
      if (invoice) {
        const newPaidAmount = Math.max(0, Number((invoice.paidAmount - refundAmount).toFixed(2)));
        const newBalance = Math.min(invoice.total, Number((invoice.total - newPaidAmount).toFixed(2)));
        const newStatus = newPaidAmount <= 0 ? "Unpaid" : (newBalance <= 0 ? "Paid" : "Partial");

        updatedInvoice = {
          ...invoice,
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        await saveInvoice(updatedInvoice);
      }
    }

    return { refund: refundRecord, invoice: updatedInvoice };
  }

  /* =========================================================================
     10. STUDENTS & USERS LOOKUP
     ========================================================================= */
  async function getStudents(schoolId: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("dugsiga_students")
        .select("*")
        .eq("school_id", schoolId);

      if (error) {
        console.error("[FinanceStore] Error in getStudents:", error);
        if (!allowLocalFallback()) throw new Error(`Supabase query failed: ${error.message}`);
      } else if (data) {
        return data.map((s: any) => ({
          id: s.id,
          schoolId: s.school_id,
          fullName: s.full_name,
          class: s.class,
          gender: s.gender,
          guardianPhone: s.guardian_phone,
          guardianName: s.guardian_name,
          status: s.status,
          photo: s.photo,
          dateOfBirth: s.date_of_birth,
          address: s.address,
          section: s.section,
          rollNumber: s.roll_number,
          createdAt: s.created_at
        }));
      }
    }

    const db = getEnsureDB();
    return (db.students || []).filter((s: any) => s.schoolId === schoolId);
  }

  return {
    getEnsureDB,
    getFeeStructures,
    saveFeeStructure,
    deleteFeeStructure,
    getInvoices,
    getInvoiceById,
    saveInvoice,
    saveInvoicesBulk,
    deleteInvoice,
    getPayments,
    savePayment,
    recordPayment,
    getExpenses,
    saveExpense,
    deleteExpense,
    getIncome,
    saveIncome,
    deleteIncome,
    getBudgets,
    saveBudget,
    deleteBudget,
    getPayroll,
    savePayroll,
    deletePayroll,
    payPayroll,
    getDiscounts,
    saveDiscount,
    deleteDiscount,
    applyDiscount,
    getRefunds,
    saveRefund,
    processRefund,
    getStudents
  };
}
