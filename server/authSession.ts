import crypto from "crypto";
import express from "express";

export interface AuthenticatedUser {
  email: string;
  role: "admin" | "teacher" | "staff" | "accountant" | "receptionist" | string;
  schoolId: string;
  name?: string;
  teacherId?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  [key: string]: any;
}

export interface SessionInfo {
  tokenHash: string;
  user: AuthenticatedUser;
  createdAt: number;
  expiresAt: number;
}

// In-memory active session store with automatic TTL + persistence layer
const activeSessions = new Map<string, SessionInfo>();
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

let dbClient: any = null;
let localDbLoader: (() => any) | null = null;
let localDbSaver: ((db: any) => void) | null = null;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function initializeSessionStore(dependencies: {
  supabase?: any;
  loadLocalDB?: () => any;
  saveLocalDB?: (db: any) => void;
}) {
  dbClient = dependencies.supabase || null;
  localDbLoader = dependencies.loadLocalDB || null;
  localDbSaver = dependencies.saveLocalDB || null;

  // Preload sessions from database asynchronously
  preloadSessionsFromDatabase().catch(err => {
    console.warn("[AuthSession] Preloading sessions warning:", err?.message || err);
  });

  // Schedule periodic cleanup every 6 hours
  setInterval(cleanupExpiredSessions, 6 * 60 * 60 * 1000);
}

async function preloadSessionsFromDatabase() {
  if (dbClient) {
    try {
      const { data, error } = await dbClient
        .from("dugsiga_settings")
        .select("key, value")
        .eq("school_id", "__sessions__");
      if (!error && Array.isArray(data)) {
        const now = Date.now();
        let loaded = 0;
        for (const row of data) {
          const s = row.value as SessionInfo;
          if (s && s.expiresAt > now && s.user) {
            activeSessions.set(row.key, s);
            loaded++;
          }
        }
        if (loaded > 0) {
          console.log(`[AuthSession] Preloaded ${loaded} active sessions from Supabase.`);
        }
      }
    } catch (e: any) {
      console.warn("[AuthSession] Notice loading sessions from Supabase:", e?.message || e);
    }
  }

  // Also check local database if configured
  if (localDbLoader) {
    try {
      const db = localDbLoader();
      if (Array.isArray(db.activeSessions)) {
        const now = Date.now();
        for (const s of db.activeSessions) {
          if (s && s.expiresAt > now && !activeSessions.has(s.tokenHash)) {
            activeSessions.set(s.tokenHash, s);
          }
        }
      }
    } catch {}
  }
}

export function createSessionToken(user: AuthenticatedUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenH = hashToken(token);
  const now = Date.now();
  const sessionInfo: SessionInfo = {
    tokenHash: tokenH,
    user,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  };

  // 1. In-memory cache
  activeSessions.set(tokenH, sessionInfo);

  // 2. Persistent storage in background (write-through)
  persistSession(sessionInfo).catch(err => {
    console.warn("[AuthSession] Session persistence error:", err?.message || err);
  });

  return token;
}

async function persistSession(session: SessionInfo) {
  if (dbClient) {
    try {
      await dbClient.from("dugsiga_settings").upsert({
        school_id: "__sessions__",
        key: session.tokenHash,
        value: session
      });
    } catch {}
  }

  if (localDbLoader && localDbSaver) {
    try {
      const db = localDbLoader();
      if (!Array.isArray(db.activeSessions)) db.activeSessions = [];
      const idx = db.activeSessions.findIndex((s: any) => s.tokenHash === session.tokenHash);
      if (idx > -1) {
        db.activeSessions[idx] = session;
      } else {
        db.activeSessions.push(session);
      }
      localDbSaver(db);
    } catch {}
  }
}

export function getSession(token: string): AuthenticatedUser | null {
  if (!token || typeof token !== "string") return null;
  const tokenH = hashToken(token);
  const session = activeSessions.get(tokenH);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    revokeSession(token);
    return null;
  }
  return session.user;
}

export async function getSessionAsync(token: string): Promise<AuthenticatedUser | null> {
  const cached = getSession(token);
  if (cached) return cached;

  if (!token || typeof token !== "string") return null;
  const tokenH = hashToken(token);

  // Check Supabase if not in memory
  if (dbClient) {
    try {
      const { data, error } = await dbClient
        .from("dugsiga_settings")
        .select("value")
        .eq("school_id", "__sessions__")
        .eq("key", tokenH)
        .maybeSingle();

      if (!error && data && data.value) {
        const s = data.value as SessionInfo;
        if (s && s.expiresAt > Date.now()) {
          activeSessions.set(tokenH, s);
          return s.user;
        } else {
          // expired
          await dbClient.from("dugsiga_settings").delete().eq("school_id", "__sessions__").eq("key", tokenH);
        }
      }
    } catch {}
  }

  return null;
}

export function revokeSession(token: string): boolean {
  if (!token) return false;
  const tokenH = hashToken(token);
  const existed = activeSessions.delete(tokenH);

  // Remove from Supabase
  if (dbClient) {
    dbClient.from("dugsiga_settings")
      .delete()
      .eq("school_id", "__sessions__")
      .eq("key", tokenH)
      .then(() => {})
      .catch(() => {});
  }

  // Remove from local database
  if (localDbLoader && localDbSaver) {
    try {
      const db = localDbLoader();
      if (Array.isArray(db.activeSessions)) {
        db.activeSessions = db.activeSessions.filter((s: any) => s.tokenHash !== tokenH);
        localDbSaver(db);
      }
    } catch {}
  }

  return existed;
}

export async function revokeAllUserSessions(email: string): Promise<number> {
  const cleanEmail = email.trim().toLowerCase();
  let count = 0;

  // 1. Invalidate in memory
  for (const [key, s] of activeSessions.entries()) {
    if (s.user && s.user.email.toLowerCase() === cleanEmail) {
      activeSessions.delete(key);
      count++;
    }
  }

  // 2. Invalidate in Supabase
  if (dbClient) {
    try {
      const { data } = await dbClient
        .from("dugsiga_settings")
        .select("key, value")
        .eq("school_id", "__sessions__");
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row.value && row.value.user && row.value.user.email.toLowerCase() === cleanEmail) {
            await dbClient.from("dugsiga_settings").delete().eq("school_id", "__sessions__").eq("key", row.key);
          }
        }
      }
    } catch {}
  }

  // 3. Invalidate in local DB
  if (localDbLoader && localDbSaver) {
    try {
      const db = localDbLoader();
      if (Array.isArray(db.activeSessions)) {
        db.activeSessions = db.activeSessions.filter((s: any) => s.user?.email?.toLowerCase() !== cleanEmail);
        localDbSaver(db);
      }
    } catch {}
  }

  return count;
}

export function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [key, session] of activeSessions.entries()) {
    if (session.expiresAt <= now) {
      activeSessions.delete(key);
    }
  }
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
  _loadLocalDB?: () => any
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

  // 2. Check session token passed in custom headers
  const customToken = req.headers["x-session-token"] || req.headers["x-auth-token"];
  if (typeof customToken === "string") {
    const sessionUser = getSession(customToken.trim());
    if (sessionUser) {
      return sessionUser;
    }
  }

  return null;
}
