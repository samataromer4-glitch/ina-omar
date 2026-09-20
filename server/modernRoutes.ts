import type express from "express";
import { generateSecureToken } from "./authSession.js";
import { sendTeacherInvitationEmail } from "./emailService.js";
import { registerTeacherAuthRoutes } from "./teacherAuthRoutes.js";

interface ModernRouteHelpers {
  getSchoolId: (req: express.Request) => string;
  loadLocalDB: () => any;
  saveLocalDB: (db: any) => void;
  supabase: any;
  getUseLocalFallback: () => boolean;
  hasPermission: (role: string, requiredPermission: string) => boolean;
  handleSupabaseError: (res: any, error: any, context: string) => void;
}

export function registerModernRoutes(app: express.Express, helpers: ModernRouteHelpers) {
  const {
    getSchoolId,
    loadLocalDB,
    saveLocalDB,
    supabase,
    getUseLocalFallback,
    hasPermission,
    handleSupabaseError
  } = helpers;

  // Time overlap helper: determines if [s1, e1] and [s2, e2] overlap
  const timesOverlap = (s1: string, e1: string, s2: string, e2: string) => {
    return s1 < e2 && s2 < e1;
  };

  /* =========================================================================
     1. USER PROFILE & RBAC ROLE
     ========================================================================= */
  app.get("/api/user/profile", async (req, res) => {
    const schoolId = getSchoolId(req);
    const db = loadLocalDB();
    const localUser = (db.users || []).find((u: any) => u.email.toLowerCase() === schoolId.toLowerCase());
    const role = localUser?.role || "School Admin";
    return res.json({
      email: schoolId,
      role,
      isSuperAdmin: role === "Super Admin",
      isSchoolAdmin: role === "School Admin" || role === "Super Admin"
    });
  });

  /* =========================================================================
     2. TEACHERS (CRUD, SEARCH, ASSIGNMENTS)
     ========================================================================= */
  app.get("/api/teachers", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_teachers")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((t: any) => ({
          id: t.id,
          schoolId: t.school_id,
          teacherId: t.teacher_id,
          name: t.name,
          photo: t.photo || "",
          gender: t.gender || "Male",
          dateOfBirth: t.date_of_birth || "",
          phone: t.phone || "",
          email: t.email || "",
          address: t.address || "",
          qualification: t.qualification || "",
          specialization: t.specialization || "",
          hireDate: t.hire_date || "",
          employmentStatus: t.employment_status || "Full-Time",
          salary: Number(t.salary || 0),
          emergencyContact: t.emergency_contact || "",
          notes: t.notes || "",
          assignedClasses: Array.isArray(t.assigned_classes) ? t.assigned_classes : [],
          assignedSubjects: Array.isArray(t.assigned_subjects) ? t.assigned_subjects : [],
          createdAt: t.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {
        // Safe fallback to local DB
      }
    }
    const db = loadLocalDB();
    const list = (db.teachers || []).filter((t: any) => t.schoolId === schoolId);
    return res.json(list);
  });

  // Register Teacher Auth & Invitation endpoints
  registerTeacherAuthRoutes(app, { loadLocalDB, saveLocalDB, supabase, getUseLocalFallback });

  app.post("/api/teachers", async (req, res) => {
    const schoolId = getSchoolId(req);
    const teacherData = req.body;
    if (!teacherData.name || !teacherData.name.trim()) {
      return res.status(400).json({ error: "Magaca macallinka waa khasab (Teacher name is required)" });
    }
    const id = teacherData.id || "tch-" + Math.random().toString(36).substr(2, 9);
    const teacherId = teacherData.teacherId || "TCH-" + Math.floor(1000 + Math.random() * 9000);
    const createdAt = teacherData.createdAt || new Date().toISOString().split("T")[0];

    // Teacher Invitation Flow (Rules 3, 4, 5)
    // Admin does NOT create or set a password. Status starts as INVITED if email is present.
    const hasEmail = teacherData.email && teacherData.email.includes("@");
    const cleanEmail = hasEmail ? teacherData.email.trim().toLowerCase() : "";
    const invitationToken = hasEmail ? generateSecureToken() : null;
    const invitationExpiresAt = hasEmail ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;
    const invitationSentAt = hasEmail ? new Date().toISOString() : null;
    const status = teacherData.status || (hasEmail ? "INVITED" : "ACTIVE");

    const fullTeacher = {
      ...teacherData,
      id,
      teacherId,
      schoolId,
      email: cleanEmail || teacherData.email || "",
      status,
      invitationToken,
      invitationExpiresAt,
      invitationSentAt,
      role: "Teacher",
      createdAt
    };

    // Remove any accidental client-supplied password
    delete (fullTeacher as any).password;
    delete (fullTeacher as any).password_hash;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_teachers").insert([{
          id,
          school_id: schoolId,
          teacher_id: teacherId,
          name: teacherData.name.trim(),
          photo: teacherData.photo || "",
          gender: teacherData.gender || "Male",
          date_of_birth: teacherData.dateOfBirth || "",
          phone: teacherData.phone || "",
          email: cleanEmail || teacherData.email || "",
          address: teacherData.address || "",
          qualification: teacherData.qualification || "",
          specialization: teacherData.specialization || "",
          hire_date: teacherData.hireDate || createdAt,
          employment_status: teacherData.employmentStatus || "Full-Time",
          salary: Number(teacherData.salary || 0),
          emergency_contact: teacherData.emergencyContact || "",
          notes: teacherData.notes || "",
          assigned_classes: teacherData.assignedClasses || [],
          assigned_subjects: teacherData.assignedSubjects || [],
          status,
          invitation_token: invitationToken,
          invitation_expires_at: invitationExpiresAt,
          invitation_sent_at: invitationSentAt,
          created_at: createdAt
        }]);
        if (!error && cleanEmail) {
          try {
            await supabase.from("dugsiga_users").upsert([{
              email: cleanEmail,
              verified: false
            }], { onConflict: "email" });
          } catch (uErr) {}
        }
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.teachers) db.teachers = [];
    db.teachers.push(fullTeacher);

    // Register pending teacher in users array without password
    if (cleanEmail) {
      if (!db.users) db.users = [];
      const existingUserIdx = db.users.findIndex((u: any) => (u.email || "").toLowerCase() === cleanEmail);
      if (existingUserIdx === -1) {
        db.users.push({
          email: cleanEmail,
          password_hash: "", // No password until activated by teacher
          verified: false,
          role: "teacher",
          school_id: schoolId,
          teacher_id: id,
          invitation_token: invitationToken,
          invitation_expires_at: invitationExpiresAt
        });
      }
    }
    saveLocalDB(db);

    // Dispatch invitation email
    let activationLink = "";
    let emailSent = false;
    if (cleanEmail && invitationToken) {
      const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const host = req.get("host") || "localhost:3000";
      const baseUrl = process.env.APP_URL && process.env.APP_URL.startsWith("http")
        ? process.env.APP_URL.replace(/\/$/, "")
        : `${protocol}://${host}`;
      activationLink = `${baseUrl}/activate-teacher?token=${invitationToken}`;

      const schoolSettings = db.settings || {};
      const schoolName = schoolSettings.schoolName || "Dugsiga Pro 2026";

      try {
        const mailResult = await sendTeacherInvitationEmail({
          toEmail: cleanEmail,
          teacherName: teacherData.name.trim(),
          schoolName,
          activationLink,
          expiresInDays: 7
        });
        emailSent = mailResult.success;
      } catch (err) {
        console.warn("Could not send teacher invitation email:", err);
      }
    }

    return res.json({
      ...fullTeacher,
      activationLink,
      emailSent
    });
  });

  app.put("/api/teachers/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_teachers")
          .update({
            name: updates.name,
            photo: updates.photo,
            gender: updates.gender,
            date_of_birth: updates.dateOfBirth,
            phone: updates.phone,
            email: updates.email,
            address: updates.address,
            qualification: updates.qualification,
            specialization: updates.specialization,
            hire_date: updates.hireDate,
            employment_status: updates.employmentStatus,
            salary: Number(updates.salary || 0),
            emergency_contact: updates.emergencyContact,
            notes: updates.notes,
            assigned_classes: updates.assignedClasses || [],
            assigned_subjects: updates.assignedSubjects || []
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.teachers) db.teachers = [];
    const idx = db.teachers.findIndex((t: any) => t.id === id && t.schoolId === schoolId);
    if (idx > -1) {
      db.teachers[idx] = { ...db.teachers[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Teacher record not found" });
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;

    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_teachers").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.teachers) db.teachers = [];
    db.teachers = db.teachers.filter((t: any) => !(t.id === id && t.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     3. STAFF MEMBERS (CRUD & ROLES)
     ========================================================================= */
  app.get("/api/staff", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_staff")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((s: any) => ({
          id: s.id,
          schoolId: s.school_id,
          employeeId: s.employee_id,
          name: s.name,
          role: s.role,
          department: s.department || "",
          phone: s.phone || "",
          email: s.email || "",
          hireDate: s.hire_date || "",
          salary: Number(s.salary || 0),
          employmentStatus: s.employment_status || "Full-Time",
          notes: s.notes || "",
          createdAt: s.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.staff || []).filter((s: any) => s.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/staff", async (req, res) => {
    const schoolId = getSchoolId(req);
    const staffData = req.body;
    if (!staffData.name || !staffData.role) {
      return res.status(400).json({ error: "Magaca iyo doorka shaqaalaha waa khasab (Name & role required)" });
    }
    const id = staffData.id || "stf-" + Math.random().toString(36).substr(2, 9);
    const employeeId = staffData.employeeId || "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const createdAt = staffData.createdAt || new Date().toISOString().split("T")[0];

    const fullStaff = {
      ...staffData,
      id,
      employeeId,
      schoolId,
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_staff").insert([{
          id,
          school_id: schoolId,
          employee_id: employeeId,
          name: staffData.name.trim(),
          role: staffData.role,
          department: staffData.department || "",
          phone: staffData.phone || "",
          email: staffData.email || "",
          hire_date: staffData.hireDate || createdAt,
          salary: Number(staffData.salary || 0),
          employment_status: staffData.employmentStatus || "Full-Time",
          notes: staffData.notes || "",
          created_at: createdAt
        }]);
        if (!error) return res.json(fullStaff);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.staff) db.staff = [];
    db.staff.push(fullStaff);
    saveLocalDB(db);
    return res.json(fullStaff);
  });

  app.put("/api/staff/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_staff")
          .update({
            name: updates.name,
            role: updates.role,
            department: updates.department,
            phone: updates.phone,
            email: updates.email,
            hire_date: updates.hireDate,
            salary: Number(updates.salary || 0),
            employment_status: updates.employmentStatus,
            notes: updates.notes
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.staff) db.staff = [];
    const idx = db.staff.findIndex((s: any) => s.id === id && s.schoolId === schoolId);
    if (idx > -1) {
      db.staff[idx] = { ...db.staff[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Staff member not found" });
  });

  app.delete("/api/staff/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_staff").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.staff) db.staff = [];
    db.staff = db.staff.filter((s: any) => !(s.id === id && s.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     4. GUARDIANS / PARENTS
     ========================================================================= */
  app.get("/api/guardians", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_guardians")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((g: any) => ({
          id: g.id,
          schoolId: g.school_id,
          guardianId: g.guardian_id,
          name: g.name,
          relationship: g.relationship || "Guardian",
          phone: g.phone,
          whatsapp: g.whatsapp || g.phone,
          email: g.email || "",
          address: g.address || "",
          occupation: g.occupation || "",
          emergencyContact: g.emergency_contact || "",
          studentIds: Array.isArray(g.student_ids) ? g.student_ids : [],
          notes: g.notes || "",
          createdAt: g.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.guardians || []).filter((g: any) => g.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/guardians", async (req, res) => {
    const schoolId = getSchoolId(req);
    const guardian = req.body;
    if (!guardian.name || !guardian.phone) {
      return res.status(400).json({ error: "Magaca iyo taleefanka waalidka waa khasab (Name & phone required)" });
    }
    const id = guardian.id || "grd-" + Math.random().toString(36).substr(2, 9);
    const guardianId = guardian.guardianId || "GRD-" + Math.floor(1000 + Math.random() * 9000);
    const createdAt = guardian.createdAt || new Date().toISOString().split("T")[0];

    const fullGuardian = {
      ...guardian,
      id,
      guardianId,
      schoolId,
      whatsapp: guardian.whatsapp || guardian.phone,
      studentIds: guardian.studentIds || [],
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_guardians").insert([{
          id,
          school_id: schoolId,
          guardian_id: guardianId,
          name: guardian.name.trim(),
          relationship: guardian.relationship || "Guardian",
          phone: guardian.phone.trim(),
          whatsapp: guardian.whatsapp || guardian.phone.trim(),
          email: guardian.email || "",
          address: guardian.address || "",
          occupation: guardian.occupation || "",
          emergency_contact: guardian.emergencyContact || "",
          student_ids: guardian.studentIds || [],
          notes: guardian.notes || "",
          created_at: createdAt
        }]);
        if (!error) return res.json(fullGuardian);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.guardians) db.guardians = [];
    db.guardians.push(fullGuardian);
    saveLocalDB(db);
    return res.json(fullGuardian);
  });

  app.put("/api/guardians/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_guardians")
          .update({
            name: updates.name,
            relationship: updates.relationship,
            phone: updates.phone,
            whatsapp: updates.whatsapp,
            email: updates.email,
            address: updates.address,
            occupation: updates.occupation,
            emergency_contact: updates.emergencyContact,
            student_ids: updates.studentIds || [],
            notes: updates.notes
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.guardians) db.guardians = [];
    const idx = db.guardians.findIndex((g: any) => g.id === id && g.schoolId === schoolId);
    if (idx > -1) {
      db.guardians[idx] = { ...db.guardians[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Guardian not found" });
  });

  app.delete("/api/guardians/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_guardians").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.guardians) db.guardians = [];
    db.guardians = db.guardians.filter((g: any) => !(g.id === id && g.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     5. TEACHER & STAFF ATTENDANCE
     ========================================================================= */
  app.get("/api/staff-attendance", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { date, staffId } = req.query;

    if (!getUseLocalFallback() && supabase) {
      try {
        let q = supabase.from("dugsiga_staff_attendance").select("*").eq("school_id", schoolId);
        if (date) q = q.eq("date", date as string);
        if (staffId) q = q.eq("staff_id", staffId as string);
        const { data, error } = await q;
        if (error) throw error;
        const formatted = (data || []).map((a: any) => ({
          id: a.id,
          schoolId: a.school_id,
          staffId: a.staff_id,
          staffName: a.staff_name,
          role: a.role,
          date: a.date,
          status: a.status,
          timestamp: a.timestamp,
          notes: a.notes || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    let list = (db.staffAttendance || []).filter((a: any) => a.schoolId === schoolId);
    if (date) list = list.filter((a: any) => a.date === date);
    if (staffId) list = list.filter((a: any) => a.staffId === staffId);
    return res.json(list);
  });

  app.post("/api/staff-attendance", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: "Taariikhda iyo diiwaanka waa khasab (Date and records required)" });
    }

    const prepared = records.map((r: any) => ({
      id: r.id || "att-stf-" + Math.random().toString(36).substr(2, 9),
      schoolId,
      staffId: r.staffId,
      staffName: r.staffName || "",
      role: r.role || "Staff",
      date,
      status: r.status || "Present",
      timestamp: r.timestamp || new Date().toISOString(),
      notes: r.notes || ""
    }));

    if (!getUseLocalFallback() && supabase) {
      try {
        // Delete existing for this date first
        await supabase
          .from("dugsiga_staff_attendance")
          .delete()
          .eq("school_id", schoolId)
          .eq("date", date);

        if (prepared.length > 0) {
          await supabase.from("dugsiga_staff_attendance").insert(
            prepared.map(p => ({
              id: p.id,
              school_id: schoolId,
              staff_id: p.staffId,
              staff_name: p.staffName,
              role: p.role,
              date: p.date,
              status: p.status,
              timestamp: p.timestamp,
              notes: p.notes
            }))
          );
        }
        return res.json({ success: true, count: prepared.length });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.staffAttendance) db.staffAttendance = [];
    // remove existing for this date & school
    db.staffAttendance = db.staffAttendance.filter((a: any) => !(a.schoolId === schoolId && a.date === date));
    prepared.forEach(p => db.staffAttendance.push(p));
    saveLocalDB(db);
    return res.json({ success: true, count: prepared.length });
  });

  /* =========================================================================
     6. TIMETABLE & SCHEDULE (WITH COLLISION VALIDATION)
     ========================================================================= */
  app.get("/api/timetable", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { className, teacherName, day } = req.query;

    if (!getUseLocalFallback() && supabase) {
      try {
        let q = supabase.from("dugsiga_timetable").select("*").eq("school_id", schoolId);
        if (className) q = q.eq("class_name", className as string);
        if (teacherName) q = q.eq("teacher_name", teacherName as string);
        if (day) q = q.eq("day", day as string);
        const { data, error } = await q;
        if (error) throw error;
        const formatted = (data || []).map((t: any) => ({
          id: t.id,
          schoolId: t.school_id,
          academicYear: t.academic_year || "",
          term: t.term || "Term 1",
          className: t.class_name,
          teacherName: t.teacher_name,
          subjectName: t.subject_name,
          roomNumber: t.room_number || "",
          day: t.day,
          startTime: t.start_time,
          endTime: t.end_time
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    let list = (db.timetable || []).filter((t: any) => t.schoolId === schoolId);
    if (className) list = list.filter((t: any) => t.className === className);
    if (teacherName) list = list.filter((t: any) => t.teacherName === teacherName);
    if (day) list = list.filter((t: any) => t.day === day);
    return res.json(list);
  });

  app.post("/api/timetable", async (req, res) => {
    const schoolId = getSchoolId(req);
    const slot = req.body;
    const { className, teacherName, subjectName, roomNumber, day, startTime, endTime, academicYear, term } = slot;

    if (!className || !teacherName || !subjectName || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "Dhammaan macluumaadka jadwalka waa khasab (All timetable fields required)" });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: "Waqtiga bilowgu waa inuu ka horeeyaa kan dhammaadka (Start time must precede end time)" });
    }

    // Load existing slots to perform collision detection
    let existingSlots: any[] = [];
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data } = await supabase.from("dugsiga_timetable").select("*").eq("school_id", schoolId).eq("day", day);
        if (data) {
          existingSlots = data.map((t: any) => ({
            id: t.id,
            className: t.class_name,
            teacherName: t.teacher_name,
            roomNumber: t.room_number || "",
            day: t.day,
            startTime: t.start_time,
            endTime: t.end_time
          }));
        }
      } catch (e: any) {}
    }
    if (existingSlots.length === 0) {
      const db = loadLocalDB();
      existingSlots = (db.timetable || []).filter((t: any) => t.schoolId === schoolId && t.day === day);
    }

    // Collision Check 1: Teacher Conflict
    const teacherConflict = existingSlots.find(
      s => s.teacherName.trim().toLowerCase() === teacherName.trim().toLowerCase() &&
           timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
    if (teacherConflict) {
      return res.status(400).json({
        error: `Isku dhac: Macallinka ${teacherName} wuxuu fasal kale (${teacherConflict.className}) leeyahay waqtigan (${teacherConflict.startTime} - ${teacherConflict.endTime}) maalinta ${day}.`
      });
    }

    // Collision Check 2: Class Conflict
    const classConflict = existingSlots.find(
      s => s.className.trim().toLowerCase() === className.trim().toLowerCase() &&
           timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
    if (classConflict) {
      return res.status(400).json({
        error: `Isku dhac: Fasalka ${className} wuxuu cashar kale (${classConflict.subjectName || "Cashar"}) leeyahay waqtigan (${classConflict.startTime} - ${classConflict.endTime}) maalinta ${day}.`
      });
    }

    // Collision Check 3: Room Conflict
    if (roomNumber && roomNumber.trim()) {
      const roomConflict = existingSlots.find(
        s => s.roomNumber && s.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase() &&
             timesOverlap(startTime, endTime, s.startTime, s.endTime)
      );
      if (roomConflict) {
        return res.status(400).json({
          error: `Isku dhac: Qolka ${roomNumber} waxaa ku jira fasalka ${roomConflict.className} waqtigan (${roomConflict.startTime} - ${roomConflict.endTime}).`
        });
      }
    }

    const id = slot.id || "tmt-" + Math.random().toString(36).substr(2, 9);
    const newSlot = {
      id,
      schoolId,
      academicYear: academicYear || "2025/2026",
      term: term || "Term 1",
      className: className.trim(),
      teacherName: teacherName.trim(),
      subjectName: subjectName.trim(),
      roomNumber: roomNumber ? roomNumber.trim() : "",
      day,
      startTime,
      endTime
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_timetable").insert([{
          id,
          school_id: schoolId,
          academic_year: newSlot.academicYear,
          term: newSlot.term,
          class_name: newSlot.className,
          teacher_name: newSlot.teacherName,
          subject_name: newSlot.subjectName,
          room_number: newSlot.roomNumber,
          day: newSlot.day,
          start_time: newSlot.startTime,
          end_time: newSlot.endTime
        }]);
        if (!error) return res.json(newSlot);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.timetable) db.timetable = [];
    db.timetable.push(newSlot);
    saveLocalDB(db);
    return res.json(newSlot);
  });

  app.delete("/api/timetable/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_timetable").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.timetable) db.timetable = [];
    db.timetable = db.timetable.filter((t: any) => !(t.id === id && t.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     7. ADMISSIONS & ENROLLMENT (SAFE TRANSITION TO STUDENT)
     ========================================================================= */
  app.get("/api/admissions", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_admissions")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((a: any) => ({
          id: a.id,
          schoolId: a.school_id,
          applicantName: a.applicant_name,
          gender: a.gender || "Male",
          dateOfBirth: a.date_of_birth || "",
          desiredClass: a.desired_class,
          guardianName: a.guardian_name || "",
          guardianPhone: a.guardian_phone || "",
          guardianRelationship: a.guardian_relationship || "Parent",
          admissionDate: a.admission_date || "",
          status: a.status || "Pending",
          notes: a.notes || "",
          studentId: a.student_id || undefined,
          createdAt: a.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.admissions || []).filter((a: any) => a.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/admissions", async (req, res) => {
    const schoolId = getSchoolId(req);
    const adm = req.body;
    if (!adm.applicantName || !adm.desiredClass) {
      return res.status(400).json({ error: "Magaca codsadaha iyo fasalka waa khasab (Applicant name & class required)" });
    }

    const id = adm.id || "adm-" + Math.random().toString(36).substr(2, 9);
    const createdAt = adm.createdAt || new Date().toISOString().split("T")[0];
    const admissionDate = adm.admissionDate || createdAt;

    const fullAdmission = {
      ...adm,
      id,
      schoolId,
      status: adm.status || "Pending",
      createdAt,
      admissionDate
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_admissions").insert([{
          id,
          school_id: schoolId,
          applicant_name: adm.applicantName.trim(),
          gender: adm.gender || "Male",
          date_of_birth: adm.dateOfBirth || "",
          desired_class: adm.desiredClass.trim(),
          guardian_name: adm.guardianName || "",
          guardian_phone: adm.guardianPhone || "",
          guardian_relationship: adm.guardianRelationship || "Parent",
          admission_date: admissionDate,
          status: adm.status || "Pending",
          notes: adm.notes || "",
          created_at: createdAt
        }]);
        if (!error) return res.json(fullAdmission);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.admissions) db.admissions = [];
    db.admissions.push(fullAdmission);
    saveLocalDB(db);
    return res.json(fullAdmission);
  });

  app.put("/api/admissions/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_admissions")
          .update({
            applicant_name: updates.applicantName,
            gender: updates.gender,
            date_of_birth: updates.dateOfBirth,
            desired_class: updates.desiredClass,
            guardian_name: updates.guardianName,
            guardian_phone: updates.guardianPhone,
            guardian_relationship: updates.guardianRelationship,
            admission_date: updates.admissionDate,
            status: updates.status,
            notes: updates.notes
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.admissions) db.admissions = [];
    const idx = db.admissions.findIndex((a: any) => a.id === id && a.schoolId === schoolId);
    if (idx > -1) {
      db.admissions[idx] = { ...db.admissions[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Admission record not found" });
  });

  // Safe 1-Click Transition: convert Applicant → Official Enrolled Student
  app.post("/api/admissions/:id/enroll", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const db = loadLocalDB();

    let admission: any = null;
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data } = await supabase
          .from("dugsiga_admissions")
          .select("*")
          .eq("id", id)
          .eq("school_id", schoolId)
          .single();
        if (data) {
          admission = {
            id: data.id,
            applicantName: data.applicant_name,
            gender: data.gender,
            dateOfBirth: data.date_of_birth,
            desiredClass: data.desired_class,
            guardianPhone: data.guardian_phone,
            guardianName: data.guardian_name,
            status: data.status,
            studentId: data.student_id
          };
        }
      } catch (e: any) {}
    }

    if (!admission) {
      admission = (db.admissions || []).find((a: any) => a.id === id && a.schoolId === schoolId);
    }

    if (!admission) {
      return res.status(404).json({ error: "Codsiga lama helin (Admission not found)" });
    }

    if (admission.status === "Enrolled" && admission.studentId) {
      return res.status(400).json({ error: "Ardaygan horey ayaa loo diiwaangeliyey (Already enrolled)" });
    }

    // Create official Student record
    const newStudentId = "std-" + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString().split("T")[0];

    const newStudent = {
      id: newStudentId,
      schoolId,
      fullName: admission.applicantName,
      class: admission.desiredClass,
      gender: admission.gender || "Male",
      guardianPhone: admission.guardianPhone || "",
      guardianName: admission.guardianName || "",
      dateOfBirth: admission.dateOfBirth || "",
      status: "active",
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_students").insert([{
          id: newStudentId,
          school_id: schoolId,
          full_name: newStudent.fullName,
          class: newStudent.class,
          gender: newStudent.gender,
          guardian_phone: newStudent.guardianPhone,
          status: "active",
          created_at: createdAt
        }]);

        await supabase
          .from("dugsiga_admissions")
          .update({ status: "Enrolled", student_id: newStudentId })
          .eq("id", id)
          .eq("school_id", schoolId);
      } catch (e: any) {}
    }

    // Update local DB
    if (!db.students) db.students = [];
    db.students.push(newStudent);

    const admIdx = (db.admissions || []).findIndex((a: any) => a.id === id && a.schoolId === schoolId);
    if (admIdx > -1) {
      db.admissions[admIdx].status = "Enrolled";
      db.admissions[admIdx].studentId = newStudentId;
    }
    saveLocalDB(db);

    return res.json({
      success: true,
      message: `Ardayga ${newStudent.fullName} waxaa si guul leh loogu diiwaangeliyey fasalka ${newStudent.class}`,
      student: newStudent
    });
  });

  /* =========================================================================
     8. ANNOUNCEMENTS
     ========================================================================= */
  app.get("/api/announcements", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_announcements")
          .select("*")
          .eq("school_id", schoolId)
          .order("publish_date", { ascending: false });
        if (error) throw error;
        const formatted = (data || []).map((a: any) => ({
          id: a.id,
          schoolId: a.school_id,
          title: a.title,
          message: a.message,
          audience: a.audience || "Everyone",
          targetClass: a.target_class || undefined,
          author: a.author || "School Admin",
          priority: a.priority || "Normal",
          status: a.status || "Active",
          publishDate: a.publish_date || "",
          expiryDate: a.expiry_date || undefined,
          createdAt: a.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.announcements || []).filter((a: any) => a.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/announcements", async (req, res) => {
    const schoolId = getSchoolId(req);
    const ann = req.body;
    if (!ann.title || !ann.message) {
      return res.status(400).json({ error: "Cinwaanka iyo fariinta ogeysiiska waa khasab (Title & message required)" });
    }

    const id = ann.id || "ann-" + Math.random().toString(36).substr(2, 9);
    const createdAt = ann.createdAt || new Date().toISOString().split("T")[0];
    const publishDate = ann.publishDate || createdAt;

    const fullAnnouncement = {
      ...ann,
      id,
      schoolId,
      publishDate,
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_announcements").insert([{
          id,
          school_id: schoolId,
          title: ann.title.trim(),
          message: ann.message.trim(),
          audience: ann.audience || "Everyone",
          target_class: ann.targetClass || "",
          author: ann.author || "School Admin",
          priority: ann.priority || "Normal",
          status: ann.status || "Active",
          publish_date: publishDate,
          expiry_date: ann.expiryDate || "",
          created_at: createdAt
        }]);
        if (!error) return res.json(fullAnnouncement);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.announcements) db.announcements = [];
    db.announcements.push(fullAnnouncement);
    saveLocalDB(db);
    return res.json(fullAnnouncement);
  });

  app.put("/api/announcements/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_announcements")
          .update({
            title: updates.title,
            message: updates.message,
            audience: updates.audience,
            target_class: updates.targetClass,
            author: updates.author,
            priority: updates.priority,
            status: updates.status,
            publish_date: updates.publishDate,
            expiry_date: updates.expiryDate
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.announcements) db.announcements = [];
    const idx = db.announcements.findIndex((a: any) => a.id === id && a.schoolId === schoolId);
    if (idx > -1) {
      db.announcements[idx] = { ...db.announcements[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Announcement not found" });
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_announcements").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.announcements) db.announcements = [];
    db.announcements = db.announcements.filter((a: any) => !(a.id === id && a.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     9. LIBRARY (BOOKS & LOANS)
     ========================================================================= */
  app.get("/api/library/books", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_library_books")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((b: any) => ({
          id: b.id,
          schoolId: b.school_id,
          isbn: b.isbn || "",
          title: b.title,
          author: b.author,
          category: b.category || "General",
          totalCopies: Number(b.total_copies || 1),
          availableCopies: Number(b.available_copies !== undefined ? b.available_copies : b.total_copies || 1),
          location: b.location || "",
          createdAt: b.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.libraryBooks || []).filter((b: any) => b.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/library/books", async (req, res) => {
    const schoolId = getSchoolId(req);
    const book = req.body;
    if (!book.title || !book.author) {
      return res.status(400).json({ error: "Cinwaanka iyo qoraaga buugga waa khasab (Title & author required)" });
    }

    const id = book.id || "bk-" + Math.random().toString(36).substr(2, 9);
    const totalCopies = Number(book.totalCopies || 1);
    const availableCopies = book.availableCopies !== undefined ? Number(book.availableCopies) : totalCopies;
    const createdAt = book.createdAt || new Date().toISOString().split("T")[0];

    const fullBook = {
      ...book,
      id,
      schoolId,
      totalCopies,
      availableCopies,
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_library_books").insert([{
          id,
          school_id: schoolId,
          isbn: book.isbn || "",
          title: book.title.trim(),
          author: book.author.trim(),
          category: book.category || "General",
          total_copies: totalCopies,
          available_copies: availableCopies,
          location: book.location || "",
          created_at: createdAt
        }]);
        if (!error) return res.json(fullBook);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.libraryBooks) db.libraryBooks = [];
    db.libraryBooks.push(fullBook);
    saveLocalDB(db);
    return res.json(fullBook);
  });

  app.put("/api/library/books/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_library_books")
          .update({
            isbn: updates.isbn,
            title: updates.title,
            author: updates.author,
            category: updates.category,
            total_copies: Number(updates.totalCopies || 1),
            available_copies: Number(updates.availableCopies || 0),
            location: updates.location
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.libraryBooks) db.libraryBooks = [];
    const idx = db.libraryBooks.findIndex((b: any) => b.id === id && b.schoolId === schoolId);
    if (idx > -1) {
      db.libraryBooks[idx] = { ...db.libraryBooks[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Book not found" });
  });

  app.delete("/api/library/books/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_library_books").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.libraryBooks) db.libraryBooks = [];
    db.libraryBooks = db.libraryBooks.filter((b: any) => !(b.id === id && b.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  // Loans
  app.get("/api/library/loans", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_library_loans")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((l: any) => ({
          id: l.id,
          schoolId: l.school_id,
          bookId: l.book_id,
          bookTitle: l.book_title,
          borrowerType: l.borrower_type,
          borrowerId: l.borrower_id,
          borrowerName: l.borrower_name,
          issueDate: l.issue_date,
          dueDate: l.due_date,
          returnDate: l.return_date || undefined,
          status: l.status || "Borrowed"
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.libraryLoans || []).filter((l: any) => l.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/library/loans", async (req, res) => {
    const schoolId = getSchoolId(req);
    const loan = req.body;
    if (!loan.bookId || !loan.borrowerName || !loan.dueDate) {
      return res.status(400).json({ error: "Buugga, magaca qaadaha, iyo taariikhda soo celinta waa khasab" });
    }

    const id = loan.id || "loan-" + Math.random().toString(36).substr(2, 9);
    const issueDate = loan.issueDate || new Date().toISOString().split("T")[0];

    const fullLoan = {
      ...loan,
      id,
      schoolId,
      issueDate,
      status: "Borrowed"
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_library_loans").insert([{
          id,
          school_id: schoolId,
          book_id: loan.bookId,
          book_title: loan.bookTitle || "",
          borrower_type: loan.borrowerType || "Student",
          borrower_id: loan.borrowerId || "N/A",
          borrower_name: loan.borrowerName.trim(),
          issue_date: issueDate,
          due_date: loan.dueDate,
          status: "Borrowed"
        }]);

        // Decrement available copies
        const { data: bData } = await supabase.from("dugsiga_library_books").select("available_copies").eq("id", loan.bookId).single();
        if (bData && bData.available_copies > 0) {
          await supabase.from("dugsiga_library_books").update({ available_copies: bData.available_copies - 1 }).eq("id", loan.bookId);
        }
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.libraryLoans) db.libraryLoans = [];
    db.libraryLoans.push(fullLoan);

    // Decrement copies locally
    const bk = (db.libraryBooks || []).find((b: any) => b.id === loan.bookId);
    if (bk && bk.availableCopies > 0) {
      bk.availableCopies -= 1;
    }
    saveLocalDB(db);
    return res.json(fullLoan);
  });

  app.put("/api/library/loans/:id/return", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const returnDate = new Date().toISOString().split("T")[0];

    let bookId = "";
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data: loan } = await supabase.from("dugsiga_library_loans").select("book_id").eq("id", id).eq("school_id", schoolId).single();
        if (loan) bookId = loan.book_id;
        await supabase.from("dugsiga_library_loans").update({ status: "Returned", return_date: returnDate }).eq("id", id).eq("school_id", schoolId);
        if (bookId) {
          const { data: bData } = await supabase.from("dugsiga_library_books").select("available_copies, total_copies").eq("id", bookId).single();
          if (bData && bData.available_copies < bData.total_copies) {
            await supabase.from("dugsiga_library_books").update({ available_copies: bData.available_copies + 1 }).eq("id", bookId);
          }
        }
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    const loan = (db.libraryLoans || []).find((l: any) => l.id === id && l.schoolId === schoolId);
    if (loan) {
      loan.status = "Returned";
      loan.returnDate = returnDate;
      const bk = (db.libraryBooks || []).find((b: any) => b.id === loan.bookId);
      if (bk && bk.availableCopies < bk.totalCopies) {
        bk.availableCopies += 1;
      }
      saveLocalDB(db);
      return res.json({ success: true, message: "Buugga si nabad ah ayaa loo soo celiyey" });
    }
    return res.status(404).json({ error: "Loan record not found" });
  });

  /* =========================================================================
     10. INVENTORY / SCHOOL ASSETS
     ========================================================================= */
  app.get("/api/inventory", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_inventory")
          .select("*")
          .eq("school_id", schoolId);
        if (error) throw error;
        const formatted = (data || []).map((i: any) => ({
          id: i.id,
          schoolId: i.school_id,
          itemName: i.item_name,
          category: i.category || "Furniture",
          quantity: Number(i.quantity || 1),
          location: i.location || "",
          condition: i.condition || "Good",
          purchaseDate: i.purchase_date || "",
          purchaseCost: Number(i.purchase_cost || 0),
          assignedTo: i.assigned_to || "",
          status: i.status || "Available",
          notes: i.notes || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.inventory || []).filter((i: any) => i.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/inventory", async (req, res) => {
    const schoolId = getSchoolId(req);
    const item = req.body;
    if (!item.itemName) {
      return res.status(400).json({ error: "Magaca alaabta waa khasab (Item name required)" });
    }

    const id = item.id || "inv-" + Math.random().toString(36).substr(2, 9);
    const fullItem = {
      ...item,
      id,
      schoolId,
      quantity: Number(item.quantity || 1),
      purchaseCost: Number(item.purchaseCost || 0)
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase.from("dugsiga_inventory").insert([{
          id,
          school_id: schoolId,
          item_name: item.itemName.trim(),
          category: item.category || "Furniture",
          quantity: Number(item.quantity || 1),
          location: item.location || "",
          condition: item.condition || "Good",
          purchase_date: item.purchaseDate || "",
          purchase_cost: Number(item.purchaseCost || 0),
          assigned_to: item.assignedTo || "",
          status: item.status || "Available",
          notes: item.notes || ""
        }]);
        if (!error) return res.json(fullItem);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.inventory) db.inventory = [];
    db.inventory.push(fullItem);
    saveLocalDB(db);
    return res.json(fullItem);
  });

  app.put("/api/inventory/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    const updates = req.body;

    if (!getUseLocalFallback() && supabase) {
      try {
        const { error } = await supabase
          .from("dugsiga_inventory")
          .update({
            item_name: updates.itemName,
            category: updates.category,
            quantity: Number(updates.quantity || 1),
            location: updates.location,
            condition: updates.condition,
            purchase_date: updates.purchaseDate,
            purchase_cost: Number(updates.purchaseCost || 0),
            assigned_to: updates.assignedTo,
            status: updates.status,
            notes: updates.notes
          })
          .eq("id", id)
          .eq("school_id", schoolId);
        if (!error) return res.json({ success: true });
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.inventory) db.inventory = [];
    const idx = db.inventory.findIndex((i: any) => i.id === id && i.schoolId === schoolId);
    if (idx > -1) {
      db.inventory[idx] = { ...db.inventory[idx], ...updates };
      saveLocalDB(db);
      return res.json({ success: true });
    }
    return res.status(404).json({ error: "Item not found" });
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    const schoolId = getSchoolId(req);
    const { id } = req.params;
    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_inventory").delete().eq("id", id).eq("school_id", schoolId);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    if (!db.inventory) db.inventory = [];
    db.inventory = db.inventory.filter((i: any) => !(i.id === id && i.schoolId === schoolId));
    saveLocalDB(db);
    return res.json({ success: true });
  });

  /* =========================================================================
     11. COMMUNICATIONS & NOTIFICATIONS
     ========================================================================= */
  app.get("/api/notifications", async (req, res) => {
    const schoolId = getSchoolId(req);
    if (!getUseLocalFallback() && supabase) {
      try {
        const { data, error } = await supabase
          .from("dugsiga_notifications")
          .select("*")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const formatted = (data || []).map((n: any) => ({
          id: n.id,
          schoolId: n.school_id,
          title: n.title,
          message: n.message,
          channel: n.channel,
          recipient: n.recipient,
          recipientName: n.recipient_name,
          status: n.status || "Sent",
          createdAt: n.created_at || ""
        }));
        return res.json(formatted);
      } catch (e: any) {}
    }
    const db = loadLocalDB();
    const list = (db.notifications || []).filter((n: any) => n.schoolId === schoolId);
    return res.json(list);
  });

  app.post("/api/notifications", async (req, res) => {
    const schoolId = getSchoolId(req);
    const notif = req.body;
    if (!notif.title || !notif.message || !notif.recipient) {
      return res.status(400).json({ error: "Cinwaanka, fariinta iyo qofka loo dirayo waa khasab" });
    }

    const id = notif.id || "notif-" + Math.random().toString(36).substr(2, 9);
    const createdAt = notif.createdAt || new Date().toISOString();

    const fullNotif = {
      ...notif,
      id,
      schoolId,
      status: "Sent",
      createdAt
    };

    if (!getUseLocalFallback() && supabase) {
      try {
        await supabase.from("dugsiga_notifications").insert([{
          id,
          school_id: schoolId,
          title: notif.title.trim(),
          message: notif.message.trim(),
          channel: notif.channel || "whatsapp",
          recipient: notif.recipient.trim(),
          recipient_name: notif.recipientName || "",
          status: "Sent",
          created_at: createdAt
        }]);
      } catch (e: any) {}
    }

    const db = loadLocalDB();
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(fullNotif);
    saveLocalDB(db);
    return res.json(fullNotif);
  });

  /* =========================================================================
     12. HIGH-PERFORMANCE DASHBOARD ANALYTICS AGGREGATE
     ========================================================================= */
  app.get("/api/analytics/dashboard", async (req, res) => {
    const schoolId = getSchoolId(req);
    const db = loadLocalDB();

    const students = (db.students || []).filter((s: any) => s.schoolId === schoolId);
    const teachers = (db.teachers || []).filter((t: any) => t.schoolId === schoolId);
    const staff = (db.staff || []).filter((s: any) => s.schoolId === schoolId);
    const classes = (db.classes || []).filter((c: any) => c.schoolId === schoolId);
    const subjects = (db.subjects || []).filter((s: any) => s.schoolId === schoolId);
    const fees = (db.fees || []).filter((f: any) => f.schoolId === schoolId);
    const admissions = (db.admissions || []).filter((a: any) => a.schoolId === schoolId);
    const books = (db.libraryBooks || []).filter((b: any) => b.schoolId === schoolId);
    const loans = (db.libraryLoans || []).filter((l: any) => l.schoolId === schoolId && l.status === "Borrowed");
    const announcements = (db.announcements || []).filter((a: any) => a.schoolId === schoolId && a.status === "Active");

    const totalCollectedFees = fees.reduce((sum: number, f: any) => sum + (Number(f.paidAmount) || 0), 0);
    const totalPendingFees = fees.reduce((sum: number, f: any) => sum + Math.max(0, (Number(f.amount) || 0) - (Number(f.paidAmount) || 0)), 0);

    const today = new Date().toISOString().split("T")[0];
    const studentAttendanceToday = (db.attendance || []).filter((a: any) => a.schoolId === schoolId && a.date === today);
    const staffAttendanceToday = (db.staffAttendance || []).filter((a: any) => a.schoolId === schoolId && a.date === today);

    return res.json({
      studentsCount: students.length,
      activeStudentsCount: students.filter((s: any) => s.status === "active").length,
      teachersCount: teachers.length,
      staffCount: staff.length,
      classesCount: classes.length,
      subjectsCount: subjects.length,
      totalCollectedFees,
      totalPendingFees,
      pendingAdmissionsCount: admissions.filter((a: any) => a.status === "Pending").length,
      totalBooksCount: books.reduce((sum: number, b: any) => sum + (Number(b.totalCopies) || 0), 0),
      activeLoansCount: loans.length,
      activeAnnouncementsCount: announcements.length,
      todayAttendance: {
        studentsPresent: studentAttendanceToday.filter((a: any) => (a.status || "").toLowerCase() === "present").length,
        studentsTotalMarked: studentAttendanceToday.length,
        staffPresent: staffAttendanceToday.filter((a: any) => (a.status || "").toLowerCase() === "present").length,
        staffTotalMarked: staffAttendanceToday.length
      }
    });
  });
}
