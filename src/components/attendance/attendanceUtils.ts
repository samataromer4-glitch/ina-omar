import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Student, AttendanceRecord, AttendanceStatus } from "../../types";

export interface AttendanceSessionConfig {
  id: string;
  name: string;
  somaliName: string;
  startTime?: string;
  endTime?: string;
  isDefault?: boolean;
}

export const DEFAULT_SESSIONS: AttendanceSessionConfig[] = [
  {
    id: "before_break",
    name: "Morning (Before Break)",
    somaliName: "Ka Hor Break (Subax)",
    startTime: "07:30",
    endTime: "10:30",
    isDefault: true
  },
  {
    id: "after_break",
    name: "Afternoon (After Break)",
    somaliName: "Ka Dib Break (Duhur)",
    startTime: "11:00",
    endTime: "13:30"
  }
];

export function getStoredSessions(): AttendanceSessionConfig[] {
  try {
    const raw = localStorage.getItem("dugsiga_attendance_sessions");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Failed to load stored attendance sessions:", e);
  }
  return DEFAULT_SESSIONS;
}

export function saveStoredSessions(sessions: AttendanceSessionConfig[]): void {
  try {
    localStorage.setItem("dugsiga_attendance_sessions", JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save attendance sessions:", e);
  }
}

export function normalizeStatus(rawStatus?: string): AttendanceStatus {
  if (!rawStatus) return "Present";
  const s = rawStatus.toLowerCase().trim();
  if (s === "present" || s === "jooga") return "Present";
  if (s === "absent" || s === "ma joogo") return "Absent";
  if (s === "late" || s === "daahay") return "Late";
  if (s === "excused" || s === "fasax" || s === "leave" || s === "idan") return "Leave";
  return "Present";
}

export function getStatusBadgeConfig(status: AttendanceStatus | string) {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "Present":
      return {
        label: "Jooga",
        subLabel: "Present",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        pillActive: "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20",
        dotColor: "bg-emerald-400",
        badge: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      };
    case "Absent":
      return {
        label: "Ma Joogo",
        subLabel: "Absent",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        pillActive: "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20",
        dotColor: "bg-rose-500",
        badge: "text-rose-400 border-rose-500/30 bg-rose-500/10"
      };
    case "Late":
      return {
        label: "Daahay",
        subLabel: "Late",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        pillActive: "bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20",
        dotColor: "bg-amber-400",
        badge: "text-amber-400 border-amber-500/30 bg-amber-500/10"
      };
    case "Leave":
    case "Excused":
      return {
        label: "Fasax",
        subLabel: "Leave / Excused",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-blue-400",
        pillActive: "bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20",
        dotColor: "bg-blue-400",
        badge: "text-blue-400 border-blue-500/30 bg-blue-500/10"
      };
    default:
      return {
        label: "Unmarked",
        subLabel: "Lama calaamadayn",
        bg: "bg-[#ffffff05]",
        border: "border-[#ffffff10]",
        text: "text-[#737373]",
        pillActive: "bg-[#262626] text-white",
        dotColor: "bg-[#737373]",
        badge: "text-[#737373] border-[#ffffff10] bg-[#ffffff05]"
      };
  }
}

export function formatSessionName(sessionKey: string, customSessions: AttendanceSessionConfig[] = DEFAULT_SESSIONS): string {
  const found = customSessions.find(s => s.id === sessionKey);
  if (found) return `${found.somaliName} (${found.name})`;
  if (sessionKey === "before_break") return "Ka Hor Break (Morning)";
  if (sessionKey === "after_break") return "Ka Dib Break (Afternoon)";
  if (sessionKey === "morning") return "Subax (Morning)";
  if (sessionKey === "afternoon") return "Galab (Afternoon)";
  return sessionKey;
}

export interface StudentAttendanceSummary {
  studentId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendanceRate: number;
  currentStreak: number;
  lastRecordDate?: string;
  statusLogs: AttendanceRecord[];
}

export function calculateStudentAttendance(
  studentId: string,
  records: AttendanceRecord[]
): StudentAttendanceSummary {
  const sRecords = records
    .filter(r => r.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSessions = sRecords.length;
  const presentCount = sRecords.filter(r => normalizeStatus(r.status) === "Present").length;
  const absentCount = sRecords.filter(r => normalizeStatus(r.status) === "Absent").length;
  const lateCount = sRecords.filter(r => normalizeStatus(r.status) === "Late").length;
  const leaveCount = sRecords.filter(r => normalizeStatus(r.status) === "Leave").length;

  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + (lateCount * 0.5)) / totalSessions) * 100) : 100;

  // Calculate streak (consecutive present or late without absence)
  let currentStreak = 0;
  for (const rec of sRecords) {
    const st = normalizeStatus(rec.status);
    if (st === "Present" || st === "Late") {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    studentId,
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendanceRate,
    currentStreak,
    lastRecordDate: sRecords[0]?.date,
    statusLogs: sRecords
  };
}

export interface DailyAttendanceStats {
  date: string;
  sessionType: string;
  totalStudents: number;
  markedStudents: number;
  unmarkedStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  attendanceRate: number;
  isComplete: boolean;
}

export function calculateDailyStats(
  date: string,
  sessionType: string,
  targetStudents: Student[],
  allRecords: AttendanceRecord[]
): DailyAttendanceStats {
  const sessionRecords = allRecords.filter(
    r => r.date === date && (r.sessionType || "before_break") === sessionType
  );

  const studentMap = new Map<string, AttendanceRecord>();
  sessionRecords.forEach(r => studentMap.set(r.studentId, r));

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let markedStudents = 0;

  targetStudents.forEach(s => {
    const rec = studentMap.get(s.id);
    if (rec) {
      markedStudents++;
      const st = normalizeStatus(rec.status);
      if (st === "Present") presentCount++;
      else if (st === "Absent") absentCount++;
      else if (st === "Late") lateCount++;
      else if (st === "Leave") leaveCount++;
    }
  });

  const totalStudents = targetStudents.length;
  const unmarkedStudents = Math.max(0, totalStudents - markedStudents);
  const attendanceRate = markedStudents > 0 
    ? Math.round(((presentCount + (lateCount * 0.5)) / markedStudents) * 100)
    : 0;

  return {
    date,
    sessionType,
    totalStudents,
    markedStudents,
    unmarkedStudents,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    attendanceRate,
    isComplete: totalStudents > 0 && unmarkedStudents === 0
  };
}

export function openWhatsAppAttendanceAlert(
  student: Student,
  date: string,
  status: AttendanceStatus | string,
  schoolName: string = "Dugsiga",
  customNote?: string
): void {
  const phone = student.guardianPhone?.replace(/[^0-9]/g, "");
  if (!phone) {
    alert(`Ardayga ${student.fullName} ma laha taleefan waalid oo diiwaangashan.`);
    return;
  }

  const norm = normalizeStatus(status);
  let statusText = "Ma Joogo (Absent)";
  if (norm === "Late") statusText = "Waa uu Daahay (Late)";
  if (norm === "Leave") statusText = "Fasax ayuu ku maqan yahay (On Leave)";

  const message = `Asc Waalidka ${student.fullName},\n\n` +
    `Waxaan kugu wargelinaynaa in ardaygaaga ${student.fullName} (ID: ${student.id}, Fasalka: ${student.class}) ` +
    `maanta oo taariikhdu tahay ${date} loo diiwaangeliyey inuu: *${statusText}*.\n\n` +
    (customNote ? `Xusuusin: ${customNote}\n\n` : "") +
    `Haddii ay jiraan sababo gaar ah ama su'aalo, fadlan la soo xiriir maamulka dugsiga.\n` +
    `Mahadsanid,\n${schoolName}`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

export function exportAttendancePDF({
  schoolName,
  date,
  className,
  sessionName,
  students,
  records
}: {
  schoolName: string;
  date: string;
  className: string;
  sessionName: string;
  students: Student[];
  records: AttendanceRecord[];
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Top header accent line
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 210, 6, "F");

  // School name and title
  doc.setTextColor(17, 24, 39);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text(schoolName || "Dugsiga Pro 2026", 14, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Diiwaanka Xaadiriska Ardayda / Official Attendance Roster", 14, 24);

  // Metadata block right
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(124, 58, 237);
  doc.text(`FASALKA: ${className.toUpperCase()}`, 196, 18, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Taariikhda: ${date}`, 196, 23, { align: "right" });
  doc.text(`Xilliga: ${sessionName}`, 196, 28, { align: "right" });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(14, 32, 196, 32);

  // Calculate statistics
  const recMap = new Map<string, AttendanceRecord>();
  records.forEach(r => recMap.set(r.studentId, r));

  let p = 0, a = 0, l = 0, e = 0;
  students.forEach(st => {
    const rec = recMap.get(st.id);
    const s = rec ? normalizeStatus(rec.status) : "Present";
    if (s === "Present") p++;
    else if (s === "Absent") a++;
    else if (s === "Late") l++;
    else if (s === "Leave") e++;
  });

  const rate = students.length > 0 ? Math.round(((p + (l * 0.5)) / students.length) * 100) : 100;

  // Summary Grid
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 36, 182, 18, 1, 1, "F");
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, 36, 182, 18, 1, 1, "S");

  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text("WADARTA", 20, 42);
  doc.text("JOOGA (PRESENT)", 56, 42);
  doc.text("MA JOOGO (ABSENT)", 96, 42);
  doc.text("DAAHAY (LATE)", 136, 42);
  doc.text("HEERKA (RATE)", 172, 42);

  doc.setFontSize(11);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text(`${students.length}`, 20, 49);
  doc.setTextColor(16, 185, 129);
  doc.text(`${p}`, 56, 49);
  doc.setTextColor(239, 68, 68);
  doc.text(`${a}`, 96, 49);
  doc.setTextColor(245, 158, 11);
  doc.text(`${l}`, 136, 49);
  doc.setTextColor(124, 58, 237);
  doc.text(`${rate}%`, 172, 49);

  // Student table
  const tableRows = students.map((s, idx) => {
    const rec = recMap.get(s.id);
    const st = rec ? normalizeStatus(rec.status) : "Present";
    const statusLabel = st === "Present" ? "JOOGA (PRESENT)" :
      st === "Absent" ? "MA JOOGO (ABSENT)" :
      st === "Late" ? "DAAHAY (LATE)" : "FASAX (LEAVE)";

    return [
      (idx + 1).toString(),
      s.id,
      s.fullName,
      s.class,
      s.gender || "M",
      s.guardianPhone || "-",
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: 58,
    head: [["#", "ID", "Magaca Ardayga (Name)", "Fasalka", "Jinsi", "Taleefanka Waalidka", "Xaaladda (Status)"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: "Helvetica"
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "center", fontStyle: "bold", cellWidth: 20 },
      2: { cellWidth: 55 },
      3: { halign: "center", cellWidth: 22 },
      4: { halign: "center", cellWidth: 14 },
      5: { cellWidth: 32 },
      6: { halign: "center", fontStyle: "bold", cellWidth: 31 }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Dugsiga Pro 2026 • Official Attendance Document • Bogga ${i} / ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  doc.save(`Attendance_${className.replace(/\s+/g, "_")}_${date}.pdf`);
}

export function exportAttendanceExcel({
  date,
  className,
  sessionName,
  students,
  records
}: {
  date: string;
  className: string;
  sessionName: string;
  students: Student[];
  records: AttendanceRecord[];
}) {
  const recMap = new Map<string, AttendanceRecord>();
  records.forEach(r => recMap.set(r.studentId, r));

  const rows = students.map((s, idx) => {
    const rec = recMap.get(s.id);
    const status = rec ? normalizeStatus(rec.status) : "Present";
    return {
      "No": idx + 1,
      "Student ID": s.id,
      "Full Name": s.fullName,
      "Class": s.class,
      "Gender": s.gender || "Male",
      "Guardian Phone": s.guardianPhone || "",
      "Date": date,
      "Session": sessionName,
      "Status": status,
      "Timestamp": rec?.timestamp || ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `Attendance_${className.replace(/\s+/g, "_")}_${date}.xlsx`);
}

export function exportAttendanceToCSV(records: AttendanceRecord[], students: Student[], filename = "Attendance_Report") {
  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const headers = ["Student ID", "Full Name", "Class", "Date", "Session", "Status", "Reason / Notes", "Timestamp"];
  const rows = records.map(r => {
    const s = studentMap.get(r.studentId);
    return [
      `"${r.studentId}"`,
      `"${s?.fullName || ""}"`,
      `"${s?.class || ""}"`,
      `"${r.date}"`,
      `"${r.sessionType || "Morning"}"`,
      `"${normalizeStatus(r.status)}"`,
      `"${r.reason || ""}"`,
      `"${r.timestamp || ""}"`
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAttendanceToPDF(records: AttendanceRecord[], students: Student[], title = "Attendance Report") {
  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const doc = new jsPDF();

  // Header
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, 210, 28, "F");

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.text("DUGSI PRO 2026 - ATTENDANCE REGISTER", 14, 13);

  doc.setFontSize(9);
  doc.setTextColor(168, 85, 247);
  doc.setFont("Helvetica", "normal");
  doc.text(title, 14, 21);

  doc.setTextColor(160, 160, 160);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 21, { align: "right" });

  const tableRows = records.map((r, idx) => {
    const s = studentMap.get(r.studentId);
    return [
      idx + 1,
      r.date,
      r.studentId,
      s?.fullName || r.studentId,
      s?.class || "-",
      r.sessionType === "after_break" ? "Afternoon" : "Morning",
      normalizeStatus(r.status)
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [["#", "Date", "ID", "Student Name", "Class", "Session", "Status"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: "Helvetica"
    }
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
}

export function exportAttendanceToExcel(records: AttendanceRecord[], students: Student[], filename = "Attendance_Report") {
  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const rows = records.map((r, idx) => {
    const s = studentMap.get(r.studentId);
    return {
      "No": idx + 1,
      "Date": r.date,
      "Student ID": r.studentId,
      "Full Name": s?.fullName || "",
      "Class": s?.class || "",
      "Session": r.sessionType === "after_break" ? "Afternoon" : "Morning",
      "Status": normalizeStatus(r.status),
      "Reason": r.reason || "",
      "Timestamp": r.timestamp || ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
