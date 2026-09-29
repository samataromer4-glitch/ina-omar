import assert from "node:assert";
import { describe, it } from "node:test";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

describe("DUGSI PRO 2026 - Auth, Tenancy & Security Hardening Tests", async () => {
  const schoolAEmail = `school-a-${Date.now()}@dugsipro.com`;
  const schoolBEmail = `school-b-${Date.now()}@dugsipro.com`;
  const initialPassword = "Password123!Secure";
  const newPassword = "NewPassword456!Secure";

  let tokenA = "";
  let tokenB = "";
  let studentAId = "";

  it("1. Signup School A and receive session token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: schoolAEmail, password: initialPassword })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, "Must return session token");
    tokenA = data.token;
  });

  it("2. Signup School B and receive session token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: schoolBEmail, password: initialPassword })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    tokenB = data.token;
  });

  it("3. Zod input validation rejects malformed email and short password", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "123" })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error.code, "VALIDATION_ERROR");
    assert.ok(data.error.fields.email, "Expected email validation error");
    assert.ok(data.error.fields.password, "Expected password validation error");
  });

  it("4. School A creates a student", async () => {
    const res = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: "Arday School A",
        class: "Fasalka 1aad",
        gender: "Male",
        guardianPhone: "+252615111111"
      })
    });
    assert.strictEqual(res.status, 200);
    const student = await res.json();
    assert.ok(student.id);
    studentAId = student.id;
  });

  it("5. Tenant Isolation: School B cannot read School A student by ID (IDOR blocked)", async () => {
    const res = await fetch(`${BASE_URL}/api/students/${studentAId}`, {
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    assert.strictEqual(res.status, 404, "School B must get 404 for School A student");
  });

  it("6. Tenant Isolation: School B cannot delete School A student", async () => {
    const res = await fetch(`${BASE_URL}/api/students/${studentAId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    // Even if it returns 200, it must not delete School A's student
    // Verify School A can still read their student:
    const verifyRes = await fetch(`${BASE_URL}/api/students/${studentAId}`, {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    assert.strictEqual(verifyRes.status, 200, "Student must still exist in School A");
  });

  it("7. Tenant Isolation: School B student list does NOT contain School A student", async () => {
    const res = await fetch(`${BASE_URL}/api/students`, {
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    assert.strictEqual(res.status, 200);
    const students = await res.json();
    const hasStudentA = students.some((s: any) => s.id === studentAId || s.fullName === "Arday School A");
    assert.strictEqual(hasStudentA, false, "School B list must never contain School A student");
  });

  it("8. Forgot password returns safe generic response without account enumeration", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: schoolAEmail })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes("dib-u-dejinta"));

    // Also verify non-existent email returns identical success shape
    const nonExistentRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "doesnotexist@nowhere.com" })
    });
    assert.strictEqual(nonExistentRes.status, 200);
    const nonExistentData = await nonExistentRes.json();
    assert.strictEqual(nonExistentData.success, true);
  });

  it("9. Reset password with invalid token is rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: schoolAEmail,
        token: "completely_fake_invalid_token_12345678",
        newPassword
      })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  it("10. Logout revokes session token immediately", async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    assert.strictEqual(logoutRes.status, 200);

    // Verify revoked token can no longer access protected endpoints
    const protectedRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    assert.strictEqual(protectedRes.status, 401, "Revoked session token must return 401");
  });

  it("11. Relogin with correct password grants new valid session", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: schoolAEmail, password: initialPassword })
    });
    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    assert.ok(data.token);
    tokenA = data.token;

    // Can access protected endpoint again
    const accessRes = await fetch(`${BASE_URL}/api/students`, {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    assert.strictEqual(accessRes.status, 200);
  });

  it("12. Wrong password on login is rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: schoolAEmail, password: "IncorrectPassword999!" })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });
});
