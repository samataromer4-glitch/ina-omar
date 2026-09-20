import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileSpreadsheet,
  Users,
  GraduationCap,
  TrendingUp,
  FileText,
  Calendar,
  Sparkles
} from "lucide-react";
import { Student, SchoolClass, AttendanceRecord, AttendanceStatus, AuthUser } from "../types";
import { AttendanceOverviewScreen } from "./attendance/AttendanceOverviewScreen";
import { TakeAttendanceScreen } from "./attendance/TakeAttendanceScreen";
import { RecordsScreen } from "./attendance/RecordsScreen";
import { StudentsScreen } from "./attendance/StudentsScreen";
import { ClassesScreen } from "./attendance/ClassesScreen";
import { InsightsScreen } from "./attendance/InsightsScreen";
import { ReportsScreen } from "./attendance/ReportsScreen";

export type AttendanceNavPrimary =
  | "overview"
  | "take"
  | "records"
  | "students"
  | "classes"
  | "insights"
  | "reports";

export type AttendanceSubTab = string;

interface AttendanceViewProps {
  user: AuthUser;
  students: Student[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  initialSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
  onSaveAttendanceSheet: (date: string, sessionType: string, records: { studentId: string; status: AttendanceStatus }[]) => Promise<void>;
  onUpdateSingleAttendance?: (date: string, studentId: string, newStatus: AttendanceStatus, sessionType?: string, reason?: string) => Promise<void>;
  onUpdateRecord?: (date: string, studentId: string, newStatus: AttendanceStatus, sessionType?: string, reason?: string) => Promise<void>;
  onRefreshData?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  user,
  students,
  classes,
  attendance,
  initialSubTab,
  onSubTabChange,
  onSaveAttendanceSheet,
  onUpdateSingleAttendance,
  onUpdateRecord,
  onRefreshData
}) => {
  const handleUpdateRecord = onUpdateSingleAttendance || onUpdateRecord || (async () => {});
  // Parse initialSubTab into primary and secondary segments
  const parseNav = (raw?: string): { primary: AttendanceNavPrimary; sub?: string } => {
    if (!raw) return { primary: "overview" };
    const cleaned = raw.replace("attendance/", "").replace("attendance:", "");

    const parts = cleaned.split("/");
    const primaryPart = parts[0];
    const subPart = parts[1];

    if (primaryPart === "take" || primaryPart === "take_attendance") {
      return { primary: "take", sub: subPart };
    }
    if (primaryPart === "records" || primaryPart === "history") {
      const sub = subPart || (primaryPart === "history" ? "history" : "today");
      return { primary: "records", sub };
    }
    if (primaryPart === "students" || primaryPart === "student") {
      const sub = subPart || (primaryPart === "student" ? "student_attendance" : "student_attendance");
      return { primary: "students", sub };
    }
    if (primaryPart === "classes" || primaryPart === "class") {
      const sub = subPart || "class_overview";
      return { primary: "classes", sub };
    }
    if (primaryPart === "insights" || primaryPart === "late_absence" || primaryPart === "analytics") {
      const sub = subPart || (primaryPart === "late_absence" ? "absence" : "trends");
      return { primary: "insights", sub };
    }
    if (primaryPart === "reports") {
      const sub = subPart || "daily";
      return { primary: "reports", sub };
    }

    return { primary: "overview" };
  };

  const initialParsed = useMemo(() => parseNav(initialSubTab), [initialSubTab]);
  const [activePrimary, setActivePrimary] = useState<AttendanceNavPrimary>(initialParsed.primary);
  const [activeSub, setActiveSub] = useState<string | undefined>(initialParsed.sub);

  // Deep linking sync
  useEffect(() => {
    const p = parseNav(initialSubTab);
    setActivePrimary(p.primary);
    setActiveSub(p.sub);
  }, [initialSubTab]);

  const handleNavigatePrimary = (primary: AttendanceNavPrimary, sub?: string) => {
    setActivePrimary(primary);
    setActiveSub(sub);
    const targetUrl = sub ? `${primary}/${sub}` : primary;
    if (onSubTabChange) {
      onSubTabChange(targetUrl);
    }
  };

  // State for pre-selected parameters when jumping between screens
  const [jumpClass, setJumpClass] = useState<string | undefined>(undefined);
  const [jumpStudentId, setJumpStudentId] = useState<string | undefined>(undefined);

  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const navItems: Array<{
    id: AttendanceNavPrimary;
    label: string;
    somali: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "overview", label: "Overview", somali: "Dulmar", icon: LayoutDashboard },
    { id: "take", label: "Take Attendance", somali: "Qabo", icon: ClipboardCheck },
    { id: "records", label: "Records", somali: "Diiwaanka", icon: FileSpreadsheet },
    { id: "students", label: "Students", somali: "Ardayda", icon: Users },
    { id: "classes", label: "Classes", somali: "Fasallada", icon: GraduationCap },
    { id: "insights", label: "Insights", somali: "Falanqayn", icon: TrendingUp },
    { id: "reports", label: "Reports", somali: "Warbixinno", icon: FileText }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 2 & 3. PURPOSE-BUILT ATTENDANCE NAVIGATION HEADER */}
      <div className="border-b border-[#262626] pb-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePrimary === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigatePrimary(item.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-[#1f1f1f] text-white border border-[#333333] shadow-xs"
                    : "text-[#737373] hover:text-[#d4d4d4] hover:bg-[#141414] border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#a855f7]" : "text-[#737373]"}`} />
                <span>{item.label}</span>
                <span className="text-[10px] text-[#737373] font-normal hidden md:inline">
                  · {item.somali}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#7c3aed] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE SCREEN */}
      <div>
        {/* Screen 01: Attendance Overview */}
        {activePrimary === "overview" && (
          <AttendanceOverviewScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            onNavigateToTake={(className) => {
              setJumpClass(className);
              handleNavigatePrimary("take");
            }}
            onNavigateToAlerts={() => {
              handleNavigatePrimary("students", "alerts");
            }}
            onNavigateToRecords={() => {
              handleNavigatePrimary("records", "today");
            }}
          />
        )}

        {/* Screen 02: Take Attendance */}
        {activePrimary === "take" && (
          <TakeAttendanceScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            initialClass={jumpClass}
            initialDate={todayDate}
            onSaveSheet={async (date, session, records) => {
              await onSaveAttendanceSheet(date, session, records);
            }}
            onViewSummary={() => {
              handleNavigatePrimary("overview");
            }}
            onSelectNextClass={(nextCls) => {
              setJumpClass(nextCls);
            }}
          />
        )}

        {/* Screen 03: Records (Today, History, Corrections) */}
        {activePrimary === "records" && (
          <RecordsScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            initialSubTab={(activeSub as any) || "today"}
            onUpdateRecord={handleUpdateRecord}
          />
        )}

        {/* Screen 04 & 05: Students (Student Attendance, Attendance Alerts) */}
        {activePrimary === "students" && (
          <StudentsScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            initialSubTab={(activeSub as any) || "student_attendance"}
            initialStudentId={jumpStudentId}
            onNavigateToTake={(className) => {
              setJumpClass(className);
              handleNavigatePrimary("take");
            }}
          />
        )}

        {/* Screen 06: Classes (Class Overview, Class Trends) */}
        {activePrimary === "classes" && (
          <ClassesScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            initialSubTab={(activeSub as any) || "class_overview"}
            initialClass={jumpClass}
            onNavigateToTake={(className) => {
              setJumpClass(className);
              handleNavigatePrimary("take");
            }}
          />
        )}

        {/* Screen 07: Insights (Attendance Trends, Absence Analysis, Late Analysis) */}
        {activePrimary === "insights" && (
          <InsightsScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            initialSubTab={(activeSub as any) || "trends"}
          />
        )}

        {/* Screen 08: Reports (Daily, Student, Class, Monthly) */}
        {activePrimary === "reports" && (
          <ReportsScreen
            user={user}
            students={students}
            classes={classes}
            attendance={attendance}
            todayDate={todayDate}
            initialSubTab={(activeSub as any) || "daily"}
          />
        )}
      </div>
    </div>
  );
};
