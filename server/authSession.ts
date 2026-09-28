import crypto from "crypto";
import express from "express";

export interface AuthenticatedUser {
  email: string;
  role: "admin" | "teacher" | "staff" | "accountant" | "receptionist";
  schoolId: string;
  name?: string;
  teacherId?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
}

export interface SessionInfo {
  token: string;
  user: AuthenticatedUser;
  createdAt: number;
  expiresAt: number;
}

// In-memory active session store with automatic TTL
const activeSessions = new Map<string, SessionInfo>();
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export function createSessionToken(user: AuthenticatedUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  activeSessions.set(token, {
    token,
    user,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  });
  return token;
}

export function getSession(token: string): AuthenticatedUser | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session.user;
}

export function revokeSession(token: string): boolean {
  return activeSessions.delete(token);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Fadlan geli password sax ah." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf." };
  }
  return { valid: true };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function legacySimpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (!stored.includes(":")) {
    return legacySimpleHash(password) === stored;
  }
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, "hex");
    if (hash.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hash, storedBuf);
  } catch {
    return false;
  }
}

/**
 * Derives and securely authenticates the requesting user.
 * ZERO TRUST: ONLY authenticates via verified session tokens.
 */
export function getAuthenticatedUser(
  req: express.Request,
  loadLocalDB?: () => any
): AuthenticatedUser | null {
  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const sessionUser = getSession(token);
    if (sessionUser) {
      return sessionUser;
    }
  }

  // 2. Fallback check for session token passed in custom header
  const customToken = req.headers["x-session-token"] || req.headers["x-auth-token"];
  if (typeof customToken === "string") {
    const sessionUser = getSession(customToken.trim());
    if (sessionUser) {
      return sessionUser;
    }
  }

  return null;
}

