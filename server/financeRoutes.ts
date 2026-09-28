import type express from "express";
import crypto from "crypto";
import { createFinanceStore } from "./financeStore.js";
import { createRateLimiter, validatePositiveAmount } from "./securityRateLimiter.js";

interface FinanceRouteHelpers {
  getSchoolId: (req: express.Request) => string;
  loadLocalDB: () => any;
  saveLocalDB: (db: any) => void;
  supabase: any;
  getUseLocalFallback: () => boolean;
  hasPermission: (role: string, requiredPermission: string) => boolean;
  handleSupabaseError: (res: any, error: any, context: string) => void;
}

export function registerFinanceRoutes(app: express.Express, helpers: FinanceRouteHelpers) {
  const {
    getSchoolId,
    loadLocalDB,
    saveLocalDB,
    supabase,
    getUseLocalFallback,
    hasPermission,
    handleSupabaseError
  } = helpers;

  const store = createFinanceStore({ supabase, getUseLocalFallback, loadLocalDB, saveLocalDB });
  const financeWriteLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: "Codsiyo badan oo maaliyadeed. Fadlan wax yar sug (Rate limit exceeded)."
  });

  // Helper: check user role for finance operations
  const checkFinanceAuth = (req: express.Request, requiredPermission: string): { authorized: boolean; role: string; schoolId: string } => {
    const schoolId = getSchoolId(req);
    const db = loadLocalDB();
    const user = (db.users || []).find((u: any) => u.email.toLowerCase() === schoolId.toLowerCase());
    const role = user?.role || "School Admin";
    
    // School Admin and Super Admin always have full access
    if (role === "School Admin" || role === "Super Admin" || role === "Accountant") {
      return { authorized: true, role, schoolId };
    }
    
    // Principal can view, but not necessarily edit all
    if (role === "Principal" && (requiredPermission.includes("view") || requiredPermission.includes("reports"))) {
      return { authorized: true, role, schoolId };
    }

    const authorized = hasPermission(role, requiredPermission);
    return { authorized, role, schoolId };
  };

  // Helper: collision-proof invoice number generator
  const generateUniqueInvoiceNumber = (existingInvoices: any[], year: string | number = new Date().getFullYear()): string => {
    let num: string;
    let attempts = 0;
    do {
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      const timeSlice = Date.now().toString().slice(-4);
      num = `INV-${year}-${timeSlice}${randomHex}`;
      attempts++;
    } while (attempts < 50 && existingInvoices.some((inv: any) => inv.invoiceNumber === num));
    return num;
  };

  /* =========================================================================
     1. FEE STRUCTURES (CRUD)
     ========================================================================= */
  app.get("/api/fee-structures", async (req, res) => {
    const schoolId = getSchoolId(req);
    const list = await store.getFeeStructures(schoolId);
    return res.json(list);
  });

  app.post("/api/fee-structures", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid qaabeynta khidmadaha (Forbidden)" });

    const body = req.body;
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: "Magaca khidmadda waa khasab (Fee name is required)" });
    }

    const amtCheck = validatePositiveAmount(body.amount);
    if (!amtCheck.valid) {
      return res.status(400).json({ error: amtCheck.error });
    }

    const newStructure = {
      id: body.id || 'fs-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      name: body.name.trim(),
      category: body.category || 'Monthly Tuition',
      amount: amtCheck.value,
      className: body.className || 'All Classes',
      academicYear: body.academicYear || '2026-2027',
      term: body.term || 'All Terms',
      description: body.description || '',
      createdAt: new Date().toISOString()
    };

    await store.saveFeeStructure(newStructure);
    return res.status(201).json(newStructure);
  });

  app.put("/api/fee-structures/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid wax ka beddelka (Forbidden)" });

    const { id } = req.params;
    const existing = (await store.getFeeStructures(schoolId)).find((fs: any) => fs.id === id);
    if (!existing) return res.status(404).json({ error: "Fee structure not found" });

    const updated = { ...existing, ...req.body, id, schoolId };
    if (req.body.amount !== undefined) {
      const amtCheck = validatePositiveAmount(req.body.amount);
      if (!amtCheck.valid) return res.status(400).json({ error: amtCheck.error });
      updated.amount = amtCheck.value;
    }

    await store.saveFeeStructure(updated);
    return res.json(updated);
  });

  app.delete("/api/fee-structures/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid tirtirista (Forbidden)" });

    const { id } = req.params;
    await store.deleteFeeStructure(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     2. INVOICES (Single, Bulk, Filters)
     ========================================================================= */
  app.get("/api/invoices", async (req, res) => {
    const schoolId = getSchoolId(req);
    let invoices = await store.getInvoices(schoolId);

    const { status, class: className, studentId, search } = req.query;
    if (status && status !== 'All') {
      invoices = invoices.filter((inv: any) => inv.status?.toLowerCase() === (status as string).toLowerCase());
    }
    if (className && className !== 'All') {
      invoices = invoices.filter((inv: any) => inv.className === className);
    }
    if (studentId) {
      invoices = invoices.filter((inv: any) => inv.studentId === studentId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      invoices = invoices.filter((inv: any) => 
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.studentName && inv.studentName.toLowerCase().includes(q)) ||
        (inv.guardianPhone && inv.guardianPhone.includes(q))
      );
    }

    return res.json(invoices);
  });

  app.post("/api/invoices", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid abuurista biilasha (Forbidden)" });

    const body = req.body;
    if (!body.studentId) return res.status(400).json({ error: "Ardaygu waa khasab (Student is required)" });

    const students = await store.getStudents(schoolId);
    const student = students.find((s: any) => s.id === body.studentId);
    if (!student) return res.status(404).json({ error: "Ardayga lama helin (Student not found)" });

    const existingInvoices = await store.getInvoices(schoolId);
    const invoiceId = body.id || 'inv-' + Math.random().toString(36).substring(2, 11);
    const invoiceNumber = body.invoiceNumber || generateUniqueInvoiceNumber(existingInvoices, new Date().getFullYear());
    const items = Array.isArray(body.items) && body.items.length > 0 
      ? body.items 
      : [{ id: 'item-1', name: body.title || 'Waxbarasho / Tuition', category: body.category || 'Monthly Tuition', amount: Number(body.amount) || 50 }];

    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
    const discount = Number(body.discount) || 0;
    const total = Math.max(0, subtotal - discount);
    const paidAmount = Number(body.paidAmount) || 0;
    const balance = Math.max(0, total - paidAmount);
    const status = balance === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : (body.status || 'Unpaid'));

    const newInvoice = {
      id: invoiceId,
      invoiceNumber,
      schoolId,
      studentId: student.id,
      studentName: student.fullName,
      className: student.class,
      guardianName: student.guardianName || body.guardianName || 'Waalidka',
      guardianPhone: student.guardianPhone || body.guardianPhone || '',
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      balance,
      issueDate: body.issueDate || new Date().toISOString().split('T')[0],
      dueDate: body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status,
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };

    await store.saveInvoice(newInvoice);

    // If initial payment was made with invoice creation, record payment transaction
    if (paidAmount > 0) {
      const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await store.savePayment({
        id: 'pay-' + Math.random().toString(36).substring(2, 11),
        receiptNumber,
        schoolId,
        invoiceId,
        invoiceNumber,
        studentId: student.id,
        studentName: student.fullName,
        className: student.class,
        amount: paidAmount,
        paymentDate: newInvoice.issueDate,
        paymentMethod: body.paymentMethod || 'Cash',
        reference: body.paymentReference || 'INITIAL-PAY',
        remainingBalance: balance,
        receivedBy: 'Admin',
        notes: 'Initial payment upon invoice creation',
        createdAt: new Date().toISOString()
      });
    }

    return res.status(201).json(newInvoice);
  });

  // Bulk Invoice Generation
  app.post("/api/invoices/bulk", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid biilasha wadajirka ah (Forbidden)" });

    const { targetClass, feeStructureIds, month, year, dueDate, customAmount } = req.body;
    const students = await store.getStudents(schoolId);
    let targetStudents = students.filter((s: any) => s.status === 'active');
    if (targetClass && targetClass !== 'All') {
      targetStudents = targetStudents.filter((s: any) => s.class === targetClass);
    }

    if (targetStudents.length === 0) {
      return res.status(400).json({ error: "Arday firfircoon lagama helin fasalkan (No active students found)" });
    }

    const feeStructures = await store.getFeeStructures(schoolId);
    const selectedStructures = feeStructures.filter((fs: any) => (feeStructureIds || []).includes(fs.id));

    let defaultItems = selectedStructures.map((fs: any) => ({
      id: fs.id,
      name: fs.name,
      category: fs.category,
      amount: fs.amount
    }));

    if (defaultItems.length === 0) {
      const amt = Number(customAmount) || 50;
      defaultItems = [{
        id: 'bulk-item-1',
        name: `Lacagta Waxbarashada (${month || 'September'} ${year || 2026})`,
        category: 'Monthly Tuition',
        amount: amt
      }];
    }

    const subtotal = defaultItems.reduce((sum: number, it: any) => sum + it.amount, 0);
    const existingInvoices = await store.getInvoices(schoolId);
    const createdInvoices: any[] = [];
    const issueDate = new Date().toISOString().split('T')[0];
    const resolvedDueDate = dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    for (const student of targetStudents) {
      const alreadyHasMonthly = existingInvoices.some((inv: any) => 
        inv.studentId === student.id && 
        inv.notes?.includes(`${month} ${year}`)
      );
      if (alreadyHasMonthly) continue;

      const invoiceId = 'inv-' + Math.random().toString(36).substring(2, 11);
      const invoiceNumber = generateUniqueInvoiceNumber([...existingInvoices, ...createdInvoices], year || 2026);

      const newInv = {
        id: invoiceId,
        invoiceNumber,
        schoolId,
        studentId: student.id,
        studentName: student.fullName,
        className: student.class,
        guardianName: student.guardianName || 'Waalidka',
        guardianPhone: student.guardianPhone || '',
        items: defaultItems,
        subtotal,
        discount: 0,
        total: subtotal,
        paidAmount: 0,
        balance: subtotal,
        issueDate,
        dueDate: resolvedDueDate,
        status: 'Unpaid',
        notes: `Bulk generated for ${month || ''} ${year || ''}`,
        createdAt: new Date().toISOString()
      };

      createdInvoices.push(newInv);
    }

    if (createdInvoices.length > 0) {
      await store.saveInvoicesBulk(createdInvoices);
    }

    return res.json({ 
      success: true, 
      count: createdInvoices.length, 
      message: `${createdInvoices.length} biilal ayaa si guul leh loo abuuray.` 
    });
  });

  app.put("/api/invoices/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid wax ka beddelka (Forbidden)" });

    const { id } = req.params;
    const invoices = await store.getInvoices(schoolId);
    const current = invoices.find((inv: any) => inv.id === id);
    if (!current) return res.status(404).json({ error: "Invoice not found" });

    const updates = req.body;
    const discount = updates.discount !== undefined ? Number(updates.discount) : current.discount;
    const items = updates.items || current.items;
    const subtotal = items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
    const total = Math.max(0, subtotal - discount);
    const paidAmount = updates.paidAmount !== undefined ? Number(updates.paidAmount) : current.paidAmount;
    const balance = Math.max(0, total - paidAmount);
    const status = updates.status || (balance === 0 ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Unpaid'));

    const updated = {
      ...current,
      ...updates,
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      balance,
      status,
      updatedAt: new Date().toISOString()
    };

    await store.saveInvoice(updated);
    return res.json(updated);
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid tirtirista (Forbidden)" });

    const { id } = req.params;
    await store.deleteInvoice(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     3. PAYMENTS & RECEIPTS
     ========================================================================= */
  app.get("/api/payments", async (req, res) => {
    const schoolId = getSchoolId(req);
    const payments = await store.getPayments(schoolId);
    return res.json(payments);
  });

  app.post("/api/payments", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid qabashada lacagta (Forbidden)" });

    const body = req.body;
    const { invoiceId, amount, paymentMethod, reference, receivedBy, notes } = body;

    const amtCheck = validatePositiveAmount(amount);
    if (!amtCheck.valid) {
      return res.status(400).json({ error: amtCheck.error });
    }
    const payAmount = amtCheck.value;

    const invoices = await store.getInvoices(schoolId);
    const inv = invoices.find((i: any) => i.id === invoiceId);
    if (!inv) {
      return res.status(404).json({ error: "Biilka lama helin (Invoice not found)" });
    }

    if (payAmount > (inv.balance + 0.001)) {
      return res.status(400).json({ 
        error: `Cadadka la bixinayo ($${payAmount}) kama badnaan karo baaqiga haray ee biilka ($${inv.balance})` 
      });
    }

    // Duplicate submission protection within 30 seconds
    const existingPayments = await store.getPayments(schoolId);
    const duplicateTimeWindow = 30 * 1000;
    const isRecentDuplicate = existingPayments.some((p: any) => 
      p.invoiceId === invoiceId &&
      Math.abs(p.amount - payAmount) < 0.001 &&
      (Date.now() - new Date(p.createdAt || 0).getTime()) < duplicateTimeWindow
    );
    if (isRecentDuplicate) {
      return res.status(409).json({ 
        error: "Lacag bixintan hadda ayaa la diiwaangeliyey. Fadlan hubi si looga fogaado laba-jibbaarid (Duplicate transaction prevented)." 
      });
    }

    const newPaidAmount = Math.round(((Number(inv.paidAmount) || 0) + payAmount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((inv.total - newPaidAmount) * 100) / 100);
    const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

    const updatedInvoice = {
      ...inv,
      paidAmount: newPaidAmount,
      balance: newBalance,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    await store.saveInvoice(updatedInvoice);

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment = {
      id: 'pay-' + Math.random().toString(36).substring(2, 11),
      receiptNumber,
      schoolId,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      studentName: inv.studentName,
      className: inv.className,
      amount: payAmount,
      paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Cash',
      reference: reference || 'TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      remainingBalance: newBalance,
      receivedBy: receivedBy || 'Xisaabiyaha',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await store.savePayment(newPayment);

    return res.status(201).json({
      success: true,
      payment: newPayment,
      invoice: updatedInvoice
    });
  });

  /* =========================================================================
     4. EXPENSES MODULE
     ========================================================================= */
  app.get("/api/expenses", async (req, res) => {
    const schoolId = getSchoolId(req);
    let expenses = await store.getExpenses(schoolId);

    const { category, status, paymentMethod, from, to, search } = req.query;
    if (category && category !== 'All') {
      expenses = expenses.filter((e: any) => e.category === category);
    }
    if (status && status !== 'All') {
      expenses = expenses.filter((e: any) => e.status?.toLowerCase() === (status as string).toLowerCase());
    }
    if (paymentMethod && paymentMethod !== 'All') {
      expenses = expenses.filter((e: any) => e.paymentMethod === paymentMethod);
    }
    if (from) {
      expenses = expenses.filter((e: any) => e.date >= (from as string));
    }
    if (to) {
      expenses = expenses.filter((e: any) => e.date <= (to as string));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      expenses = expenses.filter((e: any) => 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.vendorPayee && e.vendorPayee.toLowerCase().includes(q)) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(q))
      );
    }

    return res.json(expenses);
  });

  app.post("/api/expenses", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid diiwaangelinta kharashka (Forbidden)" });

    const body = req.body;
    if (!body.category || !body.description || !body.amount) {
      return res.status(400).json({ error: "Category, description, and amount are required" });
    }

    const amtCheck = validatePositiveAmount(body.amount);
    if (!amtCheck.valid) return res.status(400).json({ error: amtCheck.error });

    const newExpense = {
      id: body.id || 'exp-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      expenseId: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: body.category,
      description: body.description.trim(),
      amount: amtCheck.value,
      date: body.date || new Date().toISOString().split('T')[0],
      paymentMethod: body.paymentMethod || 'Cash',
      vendorPayee: body.vendorPayee || 'General Payee',
      referenceNumber: body.referenceNumber || '',
      receiptDocument: body.receiptDocument || '',
      createdBy: body.createdBy || 'Admin',
      notes: body.notes || '',
      status: body.status || 'Paid',
      createdAt: new Date().toISOString()
    };

    await store.saveExpense(newExpense);
    return res.status(201).json(newExpense);
  });

  app.put("/api/expenses/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid wax ka beddelka kharashka (Forbidden)" });

    const { id } = req.params;
    const expenses = await store.getExpenses(schoolId);
    const existing = expenses.find((e: any) => e.id === id);
    if (!existing) return res.status(404).json({ error: "Expense not found" });

    const updated = {
      ...existing,
      ...req.body,
      id,
      schoolId,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount,
      updatedAt: new Date().toISOString()
    };

    await store.saveExpense(updated);
    return res.json(updated);
  });

  app.put("/api/expenses/:id/approve", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid oggolaanshaha kharashka (Forbidden)" });

    const { id } = req.params;
    const expenses = await store.getExpenses(schoolId);
    const existing = expenses.find((e: any) => e.id === id);
    if (!existing) return res.status(404).json({ error: "Expense not found" });

    const updated = {
      ...existing,
      status: 'Approved',
      updatedAt: new Date().toISOString()
    };

    await store.saveExpense(updated);
    return res.json(updated);
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid tirtirista kharashka (Forbidden)" });

    const { id } = req.params;
    await store.deleteExpense(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     5. INCOME MODULE
     ========================================================================= */
  app.get("/api/income", async (req, res) => {
    const schoolId = getSchoolId(req);
    const standaloneIncome = await store.getIncome(schoolId);
    const payments = await store.getPayments(schoolId);

    const feeIncome = payments.map((p: any) => ({
      id: p.id,
      incomeId: p.receiptNumber,
      category: 'Student Fees',
      description: `Student Fee: ${p.studentName} (${p.className}) - ${p.invoiceNumber}`,
      amount: p.amount,
      date: p.paymentDate,
      paymentMethod: p.paymentMethod,
      reference: p.reference,
      payer: p.studentName,
      notes: p.notes,
      createdBy: p.receivedBy,
      paymentId: p.id,
      createdAt: p.createdAt
    }));

    const combined = [...standaloneIncome, ...feeIncome];
    combined.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return res.json(combined);
  });

  app.post("/api/income", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid diiwaangelinta dakhliga (Forbidden)" });

    const body = req.body;
    if (!body.category || !body.description || !body.amount) {
      return res.status(400).json({ error: "Category, description, and amount are required" });
    }

    const amtCheck = validatePositiveAmount(body.amount);
    if (!amtCheck.valid) return res.status(400).json({ error: amtCheck.error });

    const newIncome = {
      id: body.id || 'inc-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      incomeId: `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: body.category,
      description: body.description.trim(),
      amount: amtCheck.value,
      date: body.date || new Date().toISOString().split('T')[0],
      paymentMethod: body.paymentMethod || 'Cash',
      reference: body.reference || '',
      payer: body.payer || 'Anonymous Donor',
      notes: body.notes || '',
      createdBy: body.createdBy || 'Admin',
      createdAt: new Date().toISOString()
    };

    await store.saveIncome(newIncome);
    return res.status(201).json(newIncome);
  });

  app.put("/api/income/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const incomeList = await store.getIncome(schoolId);
    const existing = incomeList.find((inc: any) => inc.id === id);
    if (!existing) return res.status(404).json({ error: "Income record not found" });

    const updated = {
      ...existing,
      ...req.body,
      id,
      schoolId,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount
    };

    await store.saveIncome(updated);
    return res.json(updated);
  });

  app.delete("/api/income/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    await store.deleteIncome(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     6. PAYROLL MODULE
     ========================================================================= */
  app.get("/api/payroll", async (req, res) => {
    const schoolId = getSchoolId(req);
    const list = await store.getPayroll(schoolId);
    return res.json(list);
  });

  app.post("/api/payroll", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid maaraynta mushahaarka (Forbidden)" });

    const body = req.body;
    if (!body.employeeId || !body.employeeName) {
      return res.status(400).json({ error: "Shaqaalaha waa khasab (Employee required)" });
    }

    const basicSalary = Number(body.basicSalary) || 0;
    const allowances = Number(body.allowances) || 0;
    const deductions = Number(body.deductions) || 0;
    const grossSalary = basicSalary + allowances;
    const netSalary = Math.max(0, grossSalary - deductions);

    const newPayroll = {
      id: body.id || 'pr-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      employeeType: body.employeeType || 'Teacher',
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      roleOrDepartment: body.roleOrDepartment || 'Teaching Staff',
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      paymentDate: body.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: body.paymentMethod || 'Bank',
      payrollPeriod: body.payrollPeriod || 'September 2026',
      status: body.status || 'Draft',
      notes: body.notes || '',
      expenseId: '',
      paidAt: '',
      createdAt: new Date().toISOString()
    };

    if (newPayroll.status === 'Paid') {
      const expId = 'exp-pr-' + newPayroll.id;
      newPayroll.expenseId = expId;
      newPayroll.paidAt = new Date().toISOString();

      await store.saveExpense({
        id: expId,
        schoolId,
        expenseId: `EXP-SAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Salaries',
        description: `Mushahar / Salary: ${newPayroll.employeeName} (${newPayroll.payrollPeriod})`,
        amount: netSalary,
        date: newPayroll.paymentDate,
        paymentMethod: newPayroll.paymentMethod,
        vendorPayee: newPayroll.employeeName,
        referenceNumber: 'PAYROLL-' + newPayroll.id.substring(newPayroll.id.length - 5).toUpperCase(),
        createdBy: 'Payroll System',
        notes: `Basic: $${basicSalary}, Allowances: $${allowances}, Deductions: $${deductions}`,
        status: 'Paid',
        payrollId: newPayroll.id,
        createdAt: new Date().toISOString()
      });
    }

    await store.savePayroll(newPayroll);
    return res.status(201).json(newPayroll);
  });

  app.put("/api/payroll/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const payrollList = await store.getPayroll(schoolId);
    const current = payrollList.find((pr: any) => pr.id === id);
    if (!current) return res.status(404).json({ error: "Payroll record not found" });

    const updates = req.body;
    const basicSalary = updates.basicSalary !== undefined ? Number(updates.basicSalary) : current.basicSalary;
    const allowances = updates.allowances !== undefined ? Number(updates.allowances) : current.allowances;
    const deductions = updates.deductions !== undefined ? Number(updates.deductions) : current.deductions;
    const grossSalary = basicSalary + allowances;
    const netSalary = Math.max(0, grossSalary - deductions);

    const updated = {
      ...current,
      ...updates,
      id,
      schoolId,
      basicSalary,
      allowances,
      deductions,
      grossSalary,
      netSalary,
      updatedAt: new Date().toISOString()
    };

    await store.savePayroll(updated);
    return res.json(updated);
  });

  app.put("/api/payroll/:id/pay", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const payrollList = await store.getPayroll(schoolId);
    const pr = payrollList.find((p: any) => p.id === id);
    if (!pr) return res.status(404).json({ error: "Payroll record not found" });

    const expId = pr.expenseId || ('exp-pr-' + pr.id);
    const updatedPr = {
      ...pr,
      status: 'Paid',
      paidAt: new Date().toISOString(),
      expenseId: expId
    };

    await store.saveExpense({
      id: expId,
      schoolId,
      expenseId: `EXP-SAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Salaries',
      description: `Mushahar / Salary: ${pr.employeeName} (${pr.payrollPeriod})`,
      amount: pr.netSalary,
      date: pr.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: pr.paymentMethod || 'Bank',
      vendorPayee: pr.employeeName,
      referenceNumber: 'PAYROLL-' + pr.id.substring(pr.id.length - 5).toUpperCase(),
      createdBy: 'Payroll System',
      notes: `Basic: $${pr.basicSalary}, Allowances: $${pr.allowances}, Deductions: $${pr.deductions}`,
      status: 'Paid',
      payrollId: pr.id,
      createdAt: new Date().toISOString()
    });

    await store.savePayroll(updatedPr);
    return res.json({ success: true, payroll: updatedPr });
  });

  app.delete("/api/payroll/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    await store.deletePayroll(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     7. BUDGETS MODULE
     ========================================================================= */
  app.get("/api/budgets", async (req, res) => {
    const schoolId = getSchoolId(req);
    const budgets = await store.getBudgets(schoolId);
    const expenses = (await store.getExpenses(schoolId)).filter((e: any) => e.status === 'Paid');
    const income = await store.getIncome(schoolId);
    const payments = await store.getPayments(schoolId);

    const enrichedBudgets = budgets.map((b: any) => {
      let actual = 0;
      if (b.type === 'Expense') {
        actual = expenses
          .filter((e: any) => b.category === 'All' || e.category === b.category)
          .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
      } else {
        if (b.category === 'Student Fees') {
          actual = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        } else {
          actual = income
            .filter((inc: any) => b.category === 'All' || inc.category === b.category)
            .reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0);
        }
      }

      const planned = Number(b.plannedAmount) || 0;
      const remaining = planned - actual;
      const variance = planned > 0 ? Math.round(((actual - planned) / planned) * 100) : 0;

      return {
        ...b,
        actualAmount: actual,
        remainingAmount: remaining,
        variance
      };
    });

    return res.json(enrichedBudgets);
  });

  app.post("/api/budgets", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const body = req.body;
    if (!body.category || !body.plannedAmount) {
      return res.status(400).json({ error: "Category and plannedAmount required" });
    }

    const amtCheck = validatePositiveAmount(body.plannedAmount);
    if (!amtCheck.valid) return res.status(400).json({ error: amtCheck.error });

    const newBudget = {
      id: body.id || 'bg-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      academicYear: body.academicYear || '2026-2027',
      period: body.period || 'Annual',
      category: body.category,
      type: body.type || 'Expense',
      plannedAmount: amtCheck.value,
      actualAmount: 0,
      remainingAmount: amtCheck.value,
      variance: 0,
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    };

    await store.saveBudget(newBudget);
    return res.status(201).json(newBudget);
  });

  app.put("/api/budgets/:id", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const budgets = await store.getBudgets(schoolId);
    const existing = budgets.find((b: any) => b.id === id);
    if (!existing) return res.status(404).json({ error: "Budget not found" });

    const updated = {
      ...existing,
      ...req.body,
      id,
      schoolId,
      plannedAmount: req.body.plannedAmount !== undefined ? Number(req.body.plannedAmount) : existing.plannedAmount
    };

    await store.saveBudget(updated);
    return res.json(updated);
  });

  app.delete("/api/budgets/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    await store.deleteBudget(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     8. PROFIT & LOSS REPORTING
     ========================================================================= */
  app.get("/api/profit-loss", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { period, from, to } = req.query;

    let startDate = from ? new Date(from as string) : new Date(new Date().getFullYear(), 0, 1);
    let endDate = to ? new Date(to as string) : new Date();

    if (period === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      startDate = new Date(todayStr);
      endDate = new Date(todayStr);
    } else if (period === 'week') {
      const now = new Date();
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
    } else if (period === 'month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const allPayments = await store.getPayments(schoolId);
    const allIncome = await store.getIncome(schoolId);
    const allExpenses = await store.getExpenses(schoolId);

    const payments = allPayments.filter((p: any) => p.paymentDate >= startStr && p.paymentDate <= endStr);
    const standaloneIncome = allIncome.filter((inc: any) => inc.date >= startStr && inc.date <= endStr);

    const revenueByCategory: Record<string, number> = {};
    let totalRevenue = 0;

    payments.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      totalRevenue += amt;
      revenueByCategory['Student Fees'] = (revenueByCategory['Student Fees'] || 0) + amt;
    });

    standaloneIncome.forEach((inc: any) => {
      const amt = Number(inc.amount) || 0;
      totalRevenue += amt;
      revenueByCategory[inc.category] = (revenueByCategory[inc.category] || 0) + amt;
    });

    const expenses = allExpenses.filter((e: any) => 
      e.status === 'Paid' && e.date >= startStr && e.date <= endStr
    );

    const expensesByCategory: Record<string, number> = {};
    let totalExpenses = 0;

    expenses.forEach((e: any) => {
      const amt = Number(e.amount) || 0;
      totalExpenses += amt;
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + amt;
    });

    const netProfit = totalRevenue - totalExpenses;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyTrend = months.map((m, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const mRev = allPayments.filter((p: any) => p.paymentDate?.startsWith(monthPrefix))
        .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) +
        allIncome.filter((inc: any) => inc.date?.startsWith(monthPrefix))
        .reduce((s: number, inc: any) => s + (Number(inc.amount) || 0), 0);

      const mExp = allExpenses.filter((e: any) => e.status === 'Paid' && e.date?.startsWith(monthPrefix))
        .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

      return {
        month: m,
        revenue: mRev,
        expenses: mExp,
        profit: mRev - mExp
      };
    });

    return res.json({
      period: (period as string) || 'Custom',
      from: startStr,
      to: endStr,
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueByCategory,
      expensesByCategory,
      monthlyTrend
    });
  });

  /* =========================================================================
     9. CASH FLOW
     ========================================================================= */
  app.get("/api/cash-flow", async (req, res) => {
    const schoolId = getSchoolId(req);
    const openingBalance = Number(req.query.openingBalance) || 0;

    const payments = await store.getPayments(schoolId);
    const standaloneIncome = await store.getIncome(schoolId);
    const expenses = (await store.getExpenses(schoolId)).filter((e: any) => e.status === 'Paid');

    let totalInflows = 0;
    const inflowsByCategory: Record<string, number> = {};
    const timeline: any[] = [];

    payments.forEach((p: any) => {
      const amt = Number(p.amount) || 0;
      totalInflows += amt;
      inflowsByCategory['Student Fees'] = (inflowsByCategory['Student Fees'] || 0) + amt;
      timeline.push({
        date: p.paymentDate,
        type: 'inflow',
        amount: amt,
        description: `Student Payment: ${p.studentName} (${p.receiptNumber})`,
        method: p.paymentMethod
      });
    });

    standaloneIncome.forEach((inc: any) => {
      const amt = Number(inc.amount) || 0;
      totalInflows += amt;
      inflowsByCategory[inc.category] = (inflowsByCategory[inc.category] || 0) + amt;
      timeline.push({
        date: inc.date,
        type: 'inflow',
        amount: amt,
        description: `${inc.category}: ${inc.description}`,
        method: inc.paymentMethod
      });
    });

    let totalOutflows = 0;
    const outflowsByCategory: Record<string, number> = {};

    expenses.forEach((e: any) => {
      const amt = Number(e.amount) || 0;
      totalOutflows += amt;
      outflowsByCategory[e.category] = (outflowsByCategory[e.category] || 0) + amt;
      timeline.push({
        date: e.date,
        type: 'outflow',
        amount: amt,
        description: `${e.category}: ${e.description}`,
        method: e.paymentMethod
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const closingBalance = openingBalance + totalInflows - totalOutflows;

    return res.json({
      openingBalance,
      totalInflows,
      totalOutflows,
      closingBalance,
      inflowsByCategory,
      outflowsByCategory,
      timeline
    });
  });

  /* =========================================================================
     10. FINANCE STATS
     ========================================================================= */
  app.get("/api/finance/stats", async (req, res) => {
    const schoolId = getSchoolId(req);
    const invoices = await store.getInvoices(schoolId);
    const payments = await store.getPayments(schoolId);
    const expenses = await store.getExpenses(schoolId);
    const paidExpenses = expenses.filter((e: any) => e.status === 'Paid');
    const income = await store.getIncome(schoolId);
    const payroll = await store.getPayroll(schoolId);

    const totalStudentFeePaid = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalStandaloneIncome = income.reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0);
    const totalRevenue = totalStudentFeePaid + totalStandaloneIncome;

    const totalExpenses = paidExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const totalOutstandingFees = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.balance) || 0), 0);
    const paidInvoicesCount = invoices.filter((inv: any) => inv.status === 'Paid').length;
    const pendingInvoicesCount = invoices.filter((inv: any) => inv.status !== 'Paid' && inv.status !== 'Cancelled').length;

    const totalPayrollPaid = payroll.filter((p: any) => p.status === 'Paid').reduce((sum: number, p: any) => sum + (Number(p.netSalary) || 0), 0);
    const totalPayrollPending = payroll.filter((p: any) => p.status !== 'Paid').reduce((sum: number, p: any) => sum + (Number(p.netSalary) || 0), 0);

    return res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOutstandingFees,
      paidInvoicesCount,
      pendingInvoicesCount,
      totalInvoicesCount: invoices.length,
      cashInflow: totalRevenue,
      cashOutflow: totalExpenses,
      closingCashBalance: totalRevenue - totalExpenses,
      payrollPaid: totalPayrollPaid,
      payrollPending: totalPayrollPending
    });
  });

  /* =========================================================================
     11. FINANCIAL REPORTS
     ========================================================================= */
  app.get("/api/financial-reports", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { type } = req.query;

    if (type === 'revenue') {
      const payments = await store.getPayments(schoolId);
      const income = await store.getIncome(schoolId);
      return res.json({ payments, income });
    }

    if (type === 'expenses') {
      const expenses = await store.getExpenses(schoolId);
      return res.json({ expenses });
    }

    if (type === 'payroll') {
      const payroll = await store.getPayroll(schoolId);
      return res.json({ payroll });
    }

    if (type === 'fees') {
      const invoices = await store.getInvoices(schoolId);
      return res.json({ invoices });
    }

    return res.json({ success: true });
  });

  /* =========================================================================
     12. DISCOUNTS MODULE
     ========================================================================= */
  app.get("/api/discounts", async (req, res) => {
    const schoolId = getSchoolId(req);
    let discounts = await store.getDiscounts(schoolId);
    const { invoiceId, studentId, search } = req.query;

    if (invoiceId) discounts = discounts.filter((d: any) => d.invoiceId === invoiceId);
    if (studentId) discounts = discounts.filter((d: any) => d.studentId === studentId);
    if (search) {
      const q = (search as string).toLowerCase();
      discounts = discounts.filter((d: any) => 
        (d.studentName && d.studentName.toLowerCase().includes(q)) ||
        (d.invoiceNumber && d.invoiceNumber.toLowerCase().includes(q)) ||
        (d.reason && d.reason.toLowerCase().includes(q))
      );
    }

    return res.json(discounts);
  });

  app.post("/api/discounts", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid bixinta qiimo-dhimista (Forbidden)" });

    const { invoiceId, discountType, value, reason, approvedBy, date, notes } = req.body;
    if (!invoiceId) return res.status(400).json({ error: "Biilka waa khasab (Invoice ID is required)" });
    
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ error: "Qiimo-dhimistu waa inay ka weynaato 0 (Value must be > 0)" });
    }

    const invoices = await store.getInvoices(schoolId);
    const inv = invoices.find((i: any) => i.id === invoiceId);
    if (!inv) {
      return res.status(404).json({ error: "Biilka lama helin (Invoice not found)" });
    }

    const maxDiscountAllowed = Math.max(0, inv.subtotal - (inv.paidAmount || 0));
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round(((inv.subtotal * numValue) / 100) * 100) / 100;
    } else {
      discountAmount = Math.round(numValue * 100) / 100;
    }

    if (discountAmount <= 0) {
      return res.status(400).json({ error: "Qiimo-dhimis sax ah ma ahan" });
    }

    if (discountAmount > maxDiscountAllowed) {
      return res.status(400).json({ 
        error: `Qiimo-dhimistu ($${discountAmount}) kama badnaan karto baaqiga dhiman ee biilka ($${maxDiscountAllowed})` 
      });
    }

    const currentDiscount = Number(inv.discount) || 0;
    const newTotalDiscount = Math.round((currentDiscount + discountAmount) * 100) / 100;
    const newTotal = Math.max(0, Math.round((inv.subtotal - newTotalDiscount) * 100) / 100);
    const newBalance = Math.max(0, Math.round((newTotal - (inv.paidAmount || 0)) * 100) / 100);
    const newStatus = newBalance === 0 ? 'Paid' : (inv.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

    const discountRecord = {
      id: 'disc-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      studentId: inv.studentId,
      studentName: inv.studentName,
      className: inv.className,
      discountType: discountType === 'percentage' ? 'percentage' : 'fixed',
      value: numValue,
      amount: discountAmount,
      reason: reason || 'Maamulka Dugsiga ayaa ansixiyey',
      approvedBy: approvedBy || 'Principal',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    const updatedInvoice = {
      ...inv,
      discount: newTotalDiscount,
      total: newTotal,
      balance: newBalance,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    await store.saveInvoice(updatedInvoice);
    await store.saveDiscount(discountRecord);

    return res.status(201).json({
      success: true,
      discount: discountRecord,
      invoice: updatedInvoice
    });
  });

  app.delete("/api/discounts/:id", async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "Forbidden" });

    const { id } = req.params;
    const discounts = await store.getDiscounts(schoolId);
    const disc = discounts.find((d: any) => d.id === id);
    if (!disc) return res.status(404).json({ error: "Discount not found" });

    // Revert invoice discount
    const invoices = await store.getInvoices(schoolId);
    const inv = invoices.find((i: any) => i.id === disc.invoiceId);
    if (inv) {
      const newTotalDiscount = Math.max(0, Math.round(((inv.discount || 0) - disc.amount) * 100) / 100);
      const newTotal = Math.max(0, Math.round((inv.subtotal - newTotalDiscount) * 100) / 100);
      const newBalance = Math.max(0, Math.round((newTotal - (inv.paidAmount || 0)) * 100) / 100);
      const newStatus = newBalance === 0 ? 'Paid' : (inv.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');

      await store.saveInvoice({
        ...inv,
        discount: newTotalDiscount,
        total: newTotal,
        balance: newBalance,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    }

    await store.deleteDiscount(id, schoolId);
    return res.json({ success: true });
  });

  /* =========================================================================
     13. REFUNDS MODULE
     ========================================================================= */
  app.get("/api/refunds", async (req, res) => {
    const schoolId = getSchoolId(req);
    let refunds = await store.getRefunds(schoolId);
    const { paymentId, invoiceId, studentId } = req.query;

    if (paymentId) refunds = refunds.filter((r: any) => r.paymentId === paymentId);
    if (invoiceId) refunds = refunds.filter((r: any) => r.invoiceId === invoiceId);
    if (studentId) refunds = refunds.filter((r: any) => r.studentId === studentId);

    return res.json(refunds);
  });

  app.post("/api/refunds", financeWriteLimiter, async (req, res) => {
    const { authorized, schoolId } = checkFinanceAuth(req, "finance.manage");
    if (!authorized) return res.status(403).json({ error: "U fasax ma tihid celinta lacagta (Forbidden)" });

    const { paymentId, refundAmount, reason, approvedBy, notes, date } = req.body;
    const amtCheck = validatePositiveAmount(refundAmount);
    if (!amtCheck.valid) return res.status(400).json({ error: amtCheck.error });
    const amountToRefund = amtCheck.value;

    const payments = await store.getPayments(schoolId);
    const payment = payments.find((p: any) => p.id === paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Rasiidka/Lacag bixinta asalka ah lama helin (Payment not found)" });
    }

    const priorRefunds = (await store.getRefunds(schoolId)).filter((r: any) => r.paymentId === paymentId);
    const totalPriorRefunded = priorRefunds.reduce((sum: number, r: any) => sum + (Number(r.refundAmount) || 0), 0);
    const remainingRefundable = Math.max(0, Math.round((payment.amount - totalPriorRefunded) * 100) / 100);

    if (amountToRefund > remainingRefundable) {
      return res.status(400).json({ 
        error: `Lacagta la celin karo ($${remainingRefundable}) kuma filna cadadka la codsaday ($${amountToRefund})` 
      });
    }

    const invoices = await store.getInvoices(schoolId);
    const inv = invoices.find((i: any) => i.id === payment.invoiceId);
    let updatedInvoice = null;

    if (inv) {
      const newPaid = Math.max(0, Math.round(((inv.paidAmount || 0) - amountToRefund) * 100) / 100);
      const newBal = Math.max(0, Math.round((inv.total - newPaid) * 100) / 100);
      const newStat = newBal === 0 ? 'Paid' : (newPaid > 0 ? 'Partially Paid' : 'Unpaid');

      updatedInvoice = {
        ...inv,
        paidAmount: newPaid,
        balance: newBal,
        status: newStat,
        updatedAt: new Date().toISOString()
      };
      await store.saveInvoice(updatedInvoice);
    }

    const refundRecord = {
      id: 'ref-' + Math.random().toString(36).substring(2, 11),
      schoolId,
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      studentId: payment.studentId,
      studentName: payment.studentName,
      className: payment.className,
      refundAmount: amountToRefund,
      paymentMethod: payment.paymentMethod,
      reason: reason || 'Lacag celin rasmi ah',
      approvedBy: approvedBy || 'Admin',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await store.saveRefund(refundRecord);

    return res.status(201).json({
      success: true,
      refund: refundRecord,
      invoice: updatedInvoice
    });
  });

  /* =========================================================================
     14. OUTSTANDING WORKSPACE
     ========================================================================= */
  app.get("/api/outstanding", async (req, res) => {
    const schoolId = getSchoolId(req);
    const allInvoices = await store.getInvoices(schoolId);
    let invoices = allInvoices.filter((inv: any) => inv.balance > 0 && inv.status !== 'Cancelled');

    const { class: className, studentId, overdueOnly, search } = req.query;
    if (className && className !== 'All') {
      invoices = invoices.filter((inv: any) => inv.className === className);
    }
    if (studentId) {
      invoices = invoices.filter((inv: any) => inv.studentId === studentId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      invoices = invoices.filter((inv: any) => 
        (inv.studentName && inv.studentName.toLowerCase().includes(q)) ||
        (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
        (inv.guardianPhone && inv.guardianPhone.includes(q))
      );
    }

    const now = new Date();
    const debtors = invoices.map((inv: any) => {
      const dueDate = new Date(inv.dueDate);
      const diffTime = now.getTime() - dueDate.getTime();
      const daysOverdue = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
      
      let agingBucket = 'Current';
      if (daysOverdue > 60) agingBucket = '60+ Days';
      else if (daysOverdue > 30) agingBucket = '31-60 Days';
      else if (daysOverdue > 0) agingBucket = '1-30 Days';

      return {
        ...inv,
        daysOverdue,
        isOverdue: daysOverdue > 0,
        agingBucket
      };
    });

    const filteredDebtors = overdueOnly === 'true' ? debtors.filter((d: any) => d.isOverdue) : debtors;
    const totalOutstanding = filteredDebtors.reduce((sum: number, d: any) => sum + (Number(d.balance) || 0), 0);
    const overdueDebtors = filteredDebtors.filter((d: any) => d.isOverdue);
    const totalOverdue = overdueDebtors.reduce((sum: number, d: any) => sum + (Number(d.balance) || 0), 0);
    const uniqueStudents = new Set(filteredDebtors.map((d: any) => d.studentId)).size;

    return res.json({
      summary: {
        totalOutstanding,
        totalOverdue,
        debtorCount: uniqueStudents,
        invoiceCount: filteredDebtors.length,
        overdueInvoiceCount: overdueDebtors.length,
        aging: {
          current: filteredDebtors.filter((d: any) => d.agingBucket === 'Current').reduce((s: number, d: any) => s + d.balance, 0),
          days1to30: filteredDebtors.filter((d: any) => d.agingBucket === '1-30 Days').reduce((s: number, d: any) => s + d.balance, 0),
          days31to60: filteredDebtors.filter((d: any) => d.agingBucket === '31-60 Days').reduce((s: number, d: any) => s + d.balance, 0),
          days60plus: filteredDebtors.filter((d: any) => d.agingBucket === '60+ Days').reduce((s: number, d: any) => s + d.balance, 0)
        }
      },
      debtors: filteredDebtors
    });
  });

  /* =========================================================================
     15. RECEIPTS MODULE
     ========================================================================= */
  app.get("/api/receipts", async (req, res) => {
    const schoolId = getSchoolId(req);
    let payments = await store.getPayments(schoolId);
    const invoices = await store.getInvoices(schoolId);
    const students = await store.getStudents(schoolId);

    const { method, search, from, to } = req.query;
    if (method && method !== 'All') {
      payments = payments.filter((p: any) => p.paymentMethod === method);
    }
    if (from && to) {
      payments = payments.filter((p: any) => p.paymentDate >= from && p.paymentDate <= to);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      payments = payments.filter((p: any) => 
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
        (p.studentName && p.studentName.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    }

    const enrichedReceipts = payments.map((p: any) => {
      const inv = invoices.find((i: any) => i.id === p.invoiceId);
      const student = students.find((s: any) => s.id === p.studentId);
      return {
        ...p,
        guardianPhone: inv?.guardianPhone || student?.guardianPhone || '',
        guardianName: inv?.guardianName || student?.guardianName || '',
        invoiceTotal: inv?.total ?? p.amount,
        currentInvoiceBalance: inv?.balance ?? (p.remainingBalance ?? 0)
      };
    });

    return res.json(enrichedReceipts);
  });

  /* =========================================================================
     16. STUDENT FINANCIAL STATEMENT
     ========================================================================= */
  app.get("/api/students/:id/finance", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    const students = await store.getStudents(schoolId);
    const student = students.find((s: any) => s.id === id);
    if (!student) return res.status(404).json({ error: "Ardayga lama helin (Student not found)" });

    const allInvoices = await store.getInvoices(schoolId);
    const allPayments = await store.getPayments(schoolId);
    const allDiscounts = await store.getDiscounts(schoolId);
    const allRefunds = await store.getRefunds(schoolId);

    const invoices = allInvoices.filter((inv: any) => inv.studentId === id);
    const payments = allPayments.filter((p: any) => p.studentId === id);
    const discounts = allDiscounts.filter((d: any) => d.studentId === id);
    const refunds = allRefunds.filter((r: any) => r.studentId === id);

    const totalBilled = invoices.reduce((s: number, i: any) => s + (Number(i.subtotal) || 0), 0);
    const totalDiscounts = discounts.reduce((s: number, d: any) => s + (Number(d.amount) || 0), 0);
    const totalNetBilled = invoices.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0);
    const totalPaid = payments.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
    const totalRefunded = refunds.reduce((s: number, r: any) => s + (Number(r.refundAmount) || 0), 0);
    const netPaid = Math.max(0, totalPaid - totalRefunded);
    const balanceDue = invoices.reduce((s: number, i: any) => s + (Number(i.balance) || 0), 0);

    const now = new Date();
    const overdueAmount = invoices
      .filter((i: any) => i.balance > 0 && new Date(i.dueDate).getTime() < now.getTime())
      .reduce((s: number, i: any) => s + (Number(i.balance) || 0), 0);

    return res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        class: student.class,
        admissionNumber: student.admissionNumber || student.id,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone
      },
      summary: {
        totalBilled,
        totalDiscounts,
        totalNetBilled,
        totalPaid: netPaid,
        totalRefunded,
        balanceDue,
        overdueAmount
      },
      invoices,
      payments,
      discounts,
      refunds
    });
  });
}
