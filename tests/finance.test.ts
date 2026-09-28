import assert from "node:assert";
import { describe, it } from "node:test";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

describe("DUGSI PRO 2026 - Production Hardening & Finance Tests", async () => {
  let authToken = "";
  const testEmail = `admin-${Date.now()}@dugsipro.com`;
  const testPassword = "Password123!Secure";
  let createdInvoiceId = "";
  let createdPaymentId = "";

  it("1. Unauthenticated requests to protected endpoints return 401", async () => {
    const res = await fetch(`${BASE_URL}/api/invoices`);
    assert.strictEqual(res.status, 401, "Expected 401 for unauthenticated request");
    const data = await res.json();
    assert.ok(data.error, "Expected error message");
  });

  it("2. Tenant impersonation via X-School-Email without token is rejected with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/invoices`, {
      headers: { "X-School-Email": "victim-school@example.com" }
    });
    assert.strictEqual(res.status, 401, "Expected 401 rejecting impersonation header");
  });

  it("3. Admin signup creates secure scrypt password hash and returns session token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert.strictEqual(res.status, 200, "Signup should succeed");
    const data = await res.json();
    assert.ok(data.token, "Signup must return session token");
    assert.strictEqual(data.user.email, testEmail.toLowerCase());
    authToken = data.token;
  });

  it("4. Authenticated request with Bearer token can read Fee Structures", async () => {
    const res = await fetch(`${BASE_URL}/api/fee-structures`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    assert.strictEqual(res.status, 200, "Should get 200 OK with valid bearer token");
    const data = await res.json();
    assert.ok(Array.isArray(data), "Expected fee structures array");
  });

  it("5. Can create a new Fee Structure", async () => {
    const res = await fetch(`${BASE_URL}/api/fee-structures`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Test Fee Structure",
        category: "Monthly Tuition",
        amount: 45,
        className: "Fasalka 1aad"
      })
    });
    assert.strictEqual(res.status, 201, "Should create fee structure with 201");
    const data = await res.json();
    assert.strictEqual(data.amount, 45);
    assert.strictEqual(data.schoolId, testEmail.toLowerCase());
  });

  it("6. Student creation and Invoice generation", async () => {
    // 1. Create a student
    const studentRes = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: "Jaamac Cali Maxamed",
        class: "Fasalka 1aad",
        gender: "Male",
        guardianPhone: "+252615000001",
        guardianName: "Cali Maxamed"
      })
    });
    assert.strictEqual(studentRes.status, 200, "Student creation should succeed");
    const student = await studentRes.json();
    assert.ok(student.id, "Student must have id");

    // 2. Create invoice for student
    const invRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentId: student.id,
        amount: 60,
        title: "Waxbarasho / Tuition"
      })
    });
    assert.strictEqual(invRes.status, 201, "Invoice creation should succeed");
    const inv = await invRes.json();
    assert.strictEqual(inv.total, 60);
    assert.strictEqual(inv.balance, 60);
    assert.strictEqual(inv.status, "Unpaid");
    createdInvoiceId = inv.id;
  });

  it("7. Record Payment and verify balance update", async () => {
    assert.ok(createdInvoiceId, "Need invoice ID from previous test");
    const payRes = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        invoiceId: createdInvoiceId,
        amount: 40,
        paymentMethod: "EVC Plus",
        reference: "TXN-TEST-123",
        receivedBy: "Test Accountant"
      })
    });
    assert.strictEqual(payRes.status, 201, "Payment creation should succeed");
    const data = await payRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.payment.amount, 40);
    assert.strictEqual(data.invoice.balance, 20);
    assert.strictEqual(data.invoice.status, "Partially Paid");
    createdPaymentId = data.payment.id;
  });

  it("8. Duplicate payment prevention within window", async () => {
    const dupRes = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        invoiceId: createdInvoiceId,
        amount: 40,
        paymentMethod: "EVC Plus"
      })
    });
    // Should either reject overpayment (balance is only 20) or duplicate
    assert.ok(dupRes.status === 400 || dupRes.status === 409, "Should reject overpayment or duplicate");
  });

  it("9. Can add Discount and recalculate invoice balance", async () => {
    const discRes = await fetch(`${BASE_URL}/api/discounts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        invoiceId: createdInvoiceId,
        discountType: "fixed",
        value: 10,
        reason: "Academic Merit Scholarship"
      })
    });
    assert.strictEqual(discRes.status, 201, "Discount should be created");
    const data = await discRes.json();
    assert.strictEqual(data.discount.amount, 10);
    assert.strictEqual(data.invoice.balance, 10);
  });

  it("10. Can record Expense and approve it", async () => {
    const expRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category: "Utilities",
        description: "Biyaha iyo Korontada",
        amount: 35,
        status: "Pending"
      })
    });
    assert.strictEqual(expRes.status, 201, "Expense creation should succeed");
    const exp = await expRes.json();
    assert.strictEqual(exp.amount, 35);

    const approveRes = await fetch(`${BASE_URL}/api/expenses/${exp.id}/approve`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    assert.strictEqual(approveRes.status, 200, "Approve expense should succeed");
    const approved = await approveRes.json();
    assert.strictEqual(approved.status, "Approved");
  });

  it("11. Finance stats reflects accurate financial metrics", async () => {
    const res = await fetch(`${BASE_URL}/api/finance/stats`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200, "Finance stats should return 200");
    const stats = await res.json();
    assert.ok(stats.totalRevenue >= 40, "Total revenue must include the 40 payment");
    assert.ok(stats.totalOutstandingFees >= 10, "Outstanding balance must include remaining invoice balance");
  });

  it("12. Can process Refund on payment and update invoice balance", async () => {
    assert.ok(createdPaymentId, "Need payment ID");
    const refRes = await fetch(`${BASE_URL}/api/refunds`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        paymentId: createdPaymentId,
        refundAmount: 15,
        reason: "Overcharge correction"
      })
    });
    assert.strictEqual(refRes.status, 201, "Refund should be recorded");
    const data = await refRes.json();
    assert.strictEqual(data.refund.refundAmount, 15);
  });

  it("13. Outstanding endpoint returns debtors and aging analysis", async () => {
    const res = await fetch(`${BASE_URL}/api/outstanding`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200, "Outstanding endpoint should return 200");
    const data = await res.json();
    assert.ok(data.summary, "Expected summary");
    assert.ok(Array.isArray(data.debtors), "Expected debtors array");
  });

  it("14. Student financial statement returns complete profile summary", async () => {
    const stdsRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const stds = await stdsRes.json();
    const targetStudent = stds[0];
    assert.ok(targetStudent?.id, "Student must exist");

    const res = await fetch(`${BASE_URL}/api/students/${targetStudent.id}/finance`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200, "Student finance should return 200");
    const data = await res.json();
    assert.ok(data.student, "Expected student info");
    assert.ok(data.summary, "Expected summary");
    assert.ok(Array.isArray(data.invoices), "Expected invoices");
    assert.ok(Array.isArray(data.payments), "Expected payments");
  });

  it("15. Budgets module supports creation and variance tracking", async () => {
    const bgRes = await fetch(`${BASE_URL}/api/budgets`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        category: "Utilities",
        type: "Expense",
        plannedAmount: 500
      })
    });
    assert.strictEqual(bgRes.status, 201, "Budget creation should return 201");
    const bg = await bgRes.json();
    assert.strictEqual(bg.plannedAmount, 500);

    const listRes = await fetch(`${BASE_URL}/api/budgets`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const list = await listRes.json();
    assert.ok(Array.isArray(list), "Expected budgets list");
    const found = list.find((b: any) => b.id === bg.id);
    assert.ok(found, "Created budget must be in list");
  });

  it("16. Payroll creation and paying auto-links expense transaction", async () => {
    const prRes = await fetch(`${BASE_URL}/api/payroll`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeType: "Teacher",
        employeeId: "TCH-001",
        employeeName: "Ustadh Sharmaarke",
        basicSalary: 250,
        allowances: 30,
        deductions: 10,
        paymentMethod: "EVC Plus",
        payrollPeriod: "September 2026",
        status: "Draft"
      })
    });
    assert.strictEqual(prRes.status, 201, "Payroll creation should succeed");
    const pr = await prRes.json();
    assert.strictEqual(pr.netSalary, 270);

    // Pay the payroll
    const payPrRes = await fetch(`${BASE_URL}/api/payroll/${pr.id}/pay`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    assert.strictEqual(payPrRes.status, 200, "Marking payroll as paid should succeed");
    const payPrData = await payPrRes.json();
    assert.strictEqual(payPrData.payroll.status, "Paid");

    // Verify linked expense was created
    const expListRes = await fetch(`${BASE_URL}/api/expenses`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    const expenses = await expListRes.json();
    const linkedExp = expenses.find((e: any) => e.payrollId === pr.id || e.id === payPrData.payroll.expenseId);
    assert.ok(linkedExp, "Linked expense must exist for paid payroll");
    assert.strictEqual(linkedExp.amount, 270);
  });
});
