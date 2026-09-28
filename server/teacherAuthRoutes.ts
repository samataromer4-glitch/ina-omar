import express from "express";
import crypto from "crypto";
import { sendTeacherInvitationEmail } from "./emailService.js";
import { generateSecureToken, validatePassword, getAuthenticatedUser, hashPassword } from "./authSession.js";

function getBaseAppUrl(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const host = req.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

export function registerTeacherAuthRoutes(
  app: express.Application,
  dependencies: {
    loadLocalDB: () => any;
    saveLocalDB: (data: any) => void;
    supabase: any;
    getUseLocalFallback: () => boolean;
  }
) {
  const { loadLocalDB, saveLocalDB, supabase, getUseLocalFallback } = dependencies;

  /**
   * GET /api/teachers/verify-invitation/:token
   * Verifies an activation token without activating yet.
   */
  app.get("/api/teachers/verify-invitation/:token", async (req, res) => {
    const { token } = req.params;
    if (!token || token.length < 16) {
      return res.status(400).json({ valid: false, error: "Link-ga casuumaaddu ma shaqeynayo (Invalid token)." });
    }

    const db = loadLocalDB();
    const teacher = (db.teachers || []).find((t: any) => t.invitationToken === token);

    if (!teacher) {
      // Check Supabase if connected
      if (!getUseLocalFallback() && supabase) {
        try {
          const { data, error } = await supabase
            .from("dugsiga_teachers")
            .select("*")
            .eq("invitation_token", token)
            .maybeSingle();

          if (!error && data) {
            const isExpired = data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date();
            if (isExpired) {
              return res.status(400).json({ valid: false, error: "Casuumaaddani way dhacday. Fadlan la xiriir maamulka iskuulka." });
            }
            if (data.status === "ACTIVE") {
              return res.status(400).json({ valid: false, error: "Akoonkan horey ayaa loo dhaqaajiyey. Fadlan 'Login' ku gal." });
            }
            return res.json({
              valid: true,
              teacherName: data.name,
              email: data.email,
              schoolId: data.school_id,
              status: data.status || "INVITED"
            });
          }
        } catch (sbErr) {
          console.warn("Supabase invitation verify notice:", sbErr);
        }
      }

      return res.status(400).json({
        valid: false,
        error: "Casuumaad lama helin ama horey ayaa loo isticmaalay. Fadlan la xiriir maamulka iskuulka."
      });
    }

    // Check expiration
    if (teacher.invitationExpiresAt && new Date(teacher.invitationExpiresAt) < new Date()) {
      return res.status(400).json({
        valid: false,
        error: "Casuumaaddani way dhacday (Invitation expired). Fadlan weydiiso maamulka in laguu soo cusboonaysiiyo."
      });
    }

    if (teacher.status === "ACTIVE") {
      return res.status(400).json({
        valid: false,
        error: "Akoonkan horey ayaa loo dhaqaajiyey. Fadlan gal adigoo isticmaalaya email-kaaga iyo password-kaaga."
      });
    }

    const schoolSettings = db.settings || {};
    return res.json({
      valid: true,
      teacherName: teacher.name,
      email: teacher.email,
      schoolId: teacher.schoolId,
      schoolName: schoolSettings.schoolName || "Dugsiga Pro 2026",
      status: teacher.status || "INVITED"
    });
  });

  /**
   * POST /api/teachers/activate-account
   * Teacher creates their password and activates the account.
   * Zero-trust: password is encrypted, token is permanently invalidated.
   */
  app.post("/api/teachers/activate-account", async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token-ka casuumaaddu waa khasab." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Labada password isma laha. Fadlan hubi." });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const db = loadLocalDB();
    const teacherIndex = (db.teachers || []).findIndex((t: any) => t.invitationToken === token);
    let teacher = teacherIndex > -1 ? db.teachers[teacherIndex] : null;

    if (!teacher && !getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_teachers")
          .select("*")
          .eq("invitation_token", token)
          .maybeSingle();
        if (!error && data) {
          teacher = {
            id: data.id,
            schoolId: data.school_id,
            name: data.name,
            email: data.email,
            status: data.status,
            invitationExpiresAt: data.invitation_expires_at
          };
        }
      } catch (e) {}
    }

    if (!teacher) {
      return res.status(400).json({ error: "Casuumaad sax ah lama helin ama horey ayaa loo dhaqaajiyey." });
    }

    if (teacher.invitationExpiresAt && new Date(teacher.invitationExpiresAt) < new Date()) {
      return res.status(400).json({ error: "Casuumaaddani way dhacday. Fadlan weydiiso maamulka in laguu soo diro mid cusub." });
    }

    const cleanEmail = (teacher.email || "").trim().toLowerCase();
    const passwordHash = hashPassword(password);
    const nowIso = new Date().toISOString();

    // 1. Update Teacher Record
    if (teacherIndex > -1) {
      db.teachers[teacherIndex].status = "ACTIVE";
      db.teachers[teacherIndex].invitationToken = null; // Token invalidated permanently
      db.teachers[teacherIndex].activatedAt = nowIso;
      db.teachers[teacherIndex].invitationStatus = "ACTIVE";
    }

    // 2. Create or Update User in Local DB
    if (!db.users) db.users = [];
    const userIndex = db.users.findIndex((u: any) => (u.email || "").toLowerCase() === cleanEmail);
    if (userIndex > -1) {
      db.users[userIndex].password_hash = passwordHash;
      db.users[userIndex].verified = true;
      db.users[userIndex].role = "teacher";
      db.users[userIndex].school_id = teacher.schoolId;
      db.users[userIndex].teacher_id = teacher.id;
      delete db.users[userIndex].invitation_token;
    } else {
      db.users.push({
        email: cleanEmail,
        password_hash: passwordHash,
        verified: true,
        role: "teacher",
        school_id: teacher.schoolId,
        teacher_id: teacher.id
      });
    }

    saveLocalDB(db);

    // 3. Update Supabase if active
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase
          .from("dugsiga_teachers")
          .update({
            status: "ACTIVE",
            invitation_token: null,
            activated_at: nowIso
          })
          .eq("id", teacher.id);

        await supabase
          .from("dugsiga_users")
          .upsert([
            {
              email: cleanEmail,
              password: passwordHash,
              verified: true
            }
          ], { onConflict: "email" });
      } catch (sbErr) {
        console.warn("Supabase teacher activation update notice:", sbErr);
      }
    }

    return res.json({
      success: true,
      message: "Hambalyo! Akoonkaaga Macallinka si buuxda ayaa loo dhaqaajiyey. Hadda waad gali kartaa.",
      email: cleanEmail
    });
  });

  /**
   * POST /api/teachers/:id/resend-invitation
   * Admin can resend invitation email to teacher with a fresh, secure one-time token.
   */
  app.post("/api/teachers/:id/resend-invitation", async (req, res) => {
    const authUser = getAuthenticatedUser(req, loadLocalDB);
    if (!authUser) {
      return res.status(401).json({ error: "Fadlan soo gal (login) marka hore." });
    }
    if (authUser.role === "teacher") {
      return res.status(403).json({ error: "Macallinku awood uma laha dib u diridda casuumaadaha." });
    }

    const { id } = req.params;
    const db = loadLocalDB();
    const teacherIndex = (db.teachers || []).findIndex((t: any) => t.id === id);

    if (teacherIndex === -1) {
      return res.status(404).json({ error: "Macallinka lama helin." });
    }

    const teacher = db.teachers[teacherIndex];
    if (!teacher.email || !teacher.email.includes("@")) {
      return res.status(400).json({ error: "Macallinkani ma laha email sax ah oo casuumaad loogu diro." });
    }

    const newToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const sentAt = new Date().toISOString();

    // Update in Local DB
    db.teachers[teacherIndex].invitationToken = newToken;
    db.teachers[teacherIndex].invitationExpiresAt = expiresAt;
    db.teachers[teacherIndex].invitationSentAt = sentAt;
    db.teachers[teacherIndex].status = "INVITED";
    saveLocalDB(db);

    // Update in Supabase
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase
          .from("dugsiga_teachers")
          .update({
            invitation_token: newToken,
            invitation_expires_at: expiresAt,
            status: "INVITED"
          })
          .eq("id", id);
      } catch (e) {}
    }

    const baseUrl = getBaseAppUrl(req);
    const activationLink = `${baseUrl}/activate-teacher?token=${newToken}`;
    const schoolSettings = db.settings || {};
    const schoolName = schoolSettings.schoolName || "Dugsiga Pro 2026";

    const emailResult = await sendTeacherInvitationEmail({
      toEmail: teacher.email,
      teacherName: teacher.name,
      schoolName,
      activationLink,
      expiresInDays: 7
    });

    return res.json({
      success: true,
      message: emailResult.success
        ? `Casuumaad cusub waxaa si guul leh loogu diray ${teacher.email}`
        : `Casuumaad ayaa loo sameeyay laakiin dirista email-ku waxay ku timid cillad. Link-ga tooska ah hoos kaga koobi garee.`,
      emailSent: emailResult.success,
      activationLink,
      invitationExpiresAt: expiresAt
    });
  });

  /**
   * POST /api/teachers/:id/toggle-status
   * Admin can deactivate or reactivate a teacher.
   */
  app.post("/api/teachers/:id/toggle-status", async (req, res) => {
    const authUser = getAuthenticatedUser(req, loadLocalDB);
    if (!authUser) {
      return res.status(401).json({ error: "Fadlan soo gal (login) marka hore." });
    }
    if (authUser.role === "teacher") {
      return res.status(403).json({ error: "Macallinku awood uma laha wax ka beddelka xaaladda macallimiinta." });
    }

    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE' | 'DEACTIVATED' | 'INACTIVE'
    const newStatus = status === "DEACTIVATED" || status === "INACTIVE" ? "DEACTIVATED" : "ACTIVE";

    const db = loadLocalDB();
    const idx = (db.teachers || []).findIndex((t: any) => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Macallinka lama helin." });
    }

    db.teachers[idx].status = newStatus;
    saveLocalDB(db);

    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_teachers").update({ status: newStatus }).eq("id", id);
      } catch (e) {}
    }

    return res.json({ success: true, status: newStatus });
  });
}
