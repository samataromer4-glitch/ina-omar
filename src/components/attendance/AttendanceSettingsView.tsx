import React, { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Shield,
  MessageSquare
} from "lucide-react";
import { AuthUser } from "../../types";
import {
  AttendanceSessionConfig,
  DEFAULT_SESSIONS,
  getStoredSessions,
  saveStoredSessions
} from "./attendanceUtils";

interface AttendanceSettingsViewProps {
  user: AuthUser;
}

export const AttendanceSettingsView: React.FC<AttendanceSettingsViewProps> = ({ user }) => {
  const [sessions, setSessions] = useState<AttendanceSessionConfig[]>(() => getStoredSessions());
  const [defaultSheetStatus, setDefaultSheetStatus] = useState<string>(() => {
    return localStorage.getItem("dugsiga_attendance_default_status") || "unmarked";
  });
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState<number>(() => {
    return Number(localStorage.getItem("dugsiga_attendance_late_threshold") || "15");
  });
  const [teachersCanMarkAllClasses, setTeachersCanMarkAllClasses] = useState<boolean>(() => {
    return localStorage.getItem("dugsiga_attendance_teachers_all_classes") === "true";
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New session modal / form inline
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionSomali, setNewSessionSomali] = useState("");

  const handleAddSession = () => {
    if (!newSessionName.trim() || !newSessionSomali.trim()) return;
    const newId = newSessionName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString(36);
    const updated = [
      ...sessions,
      {
        id: newId,
        name: newSessionName.trim(),
        somaliName: newSessionSomali.trim()
      }
    ];
    setSessions(updated);
    setNewSessionName("");
    setNewSessionSomali("");
  };

  const handleRemoveSession = (id: string) => {
    if (sessions.length <= 1) {
      alert("Waa inaad haysataa ugu yaraan hal xilli xaadiris ah.");
      return;
    }
    setSessions(sessions.filter(s => s.id !== id));
  };

  const handleSaveAllSettings = () => {
    saveStoredSessions(sessions);
    localStorage.setItem("dugsiga_attendance_default_status", defaultSheetStatus);
    localStorage.setItem("dugsiga_attendance_late_threshold", lateThresholdMinutes.toString());
    localStorage.setItem("dugsiga_attendance_teachers_all_classes", teachersCanMarkAllClasses.toString());

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm("Ma hubtaa inaad dib ugu celiso dhammaan qaabeynta xilliyada xaaladdii hore?")) {
      setSessions(DEFAULT_SESSIONS);
      setDefaultSheetStatus("unmarked");
      setLateThresholdMinutes(15);
      setTeachersCanMarkAllClasses(false);
      saveStoredSessions(DEFAULT_SESSIONS);
      localStorage.removeItem("dugsiga_attendance_default_status");
      localStorage.removeItem("dugsiga_attendance_late_threshold");
      localStorage.removeItem("dugsiga_attendance_teachers_all_classes");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-[#7c3aed]/15 text-[#c4b5fd] border border-[#7c3aed]/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Qaabeynta Xaadiriska (Attendance System Settings)
            </h2>
            <p className="text-xs text-[#737373]">
              Habaynta xilliyada xaadiriska, xuduudaha daahitaanka, iyo rukhsadaha macallimiinta.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Si guul leh ayaa loo kaydiyey!</span>
          </div>
        )}
      </div>

      {/* 1. SESSIONS CONFIGURATION */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#ffffff08] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c4b5fd]" />
              <span>Xilliyada Xaadiriska Maalinlaha ah (Attendance Sessions)</span>
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Xilli kasta waxa uu leeyahay diiwaan u gaar ah maalintii (tusaale: Ka hor break, Ka dib break).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 rounded-sm bg-[#0a0a0a] border border-[#ffffff08]"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-white flex items-center gap-2">
                  <span>{s.somaliName}</span>
                  <span className="text-[#737373] font-normal font-mono text-[11px]">({s.name})</span>
                  {s.isDefault && (
                    <span className="px-1.5 py-0.2 rounded-2xs bg-[#7c3aed]/15 text-[#c4b5fd] text-[9px] font-mono">
                      Aasaasi (Default)
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#737373] font-mono">
                  ID: {s.id}
                </div>
              </div>

              {sessions.length > 1 && (
                <button
                  onClick={() => handleRemoveSession(s.id)}
                  className="p-1.5 rounded-xs text-[#737373] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Tirtir xilligan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add new session row */}
        <div className="pt-2 border-t border-[#ffffff08] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={newSessionSomali}
            onChange={e => setNewSessionSomali(e.target.value)}
            placeholder="Magaca Soomaaliga (e.g. Galab)"
            className="flex-1 px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
          />
          <input
            type="text"
            value={newSessionName}
            onChange={e => setNewSessionName(e.target.value)}
            placeholder="English Name (e.g. Afternoon Session)"
            className="flex-1 px-3 py-1.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#7c3aed]"
          />
          <button
            onClick={handleAddSession}
            className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffffff15] text-[#c4b5fd] text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kudar Xilli</span>
          </button>
        </div>
      </div>

      {/* 2. GENERAL ATTENDANCE BEHAVIOR */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#ffffff08] pb-3">
          <Shield className="w-4 h-4 text-[#c4b5fd]" />
          <span>Xeerarka & Dhaqanka Xaadiriska (Rules & Behaviors)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Xaaladda Asalka ah Marka Warqadda La Furo (Default State):
            </label>
            <select
              value={defaultSheetStatus}
              onChange={e => setDefaultSheetStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-white focus:outline-none focus:border-[#7c3aed]"
            >
              <option value="unmarked">Lama Calaamadayn (Empty / Unmarked)</option>
              <option value="Present">Dhammaan Jooga Ka Dhig Asal ahaan (Default to Present)</option>
            </select>
            <span className="text-[11px] text-[#737373] block">
              Doorashada 'Lama Calaamadayn' waxay dhiirrigelisaa xaqiijin rasmi ah oo arday kasta lagu sameeyo.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white block">
              Waqtiga Daahitaanka loo Aqoonsanayo (Daqiiqado):
            </label>
            <input
              type="number"
              value={lateThresholdMinutes}
              onChange={e => setLateThresholdMinutes(Number(e.target.value))}
              min={5}
              max={60}
              className="w-full px-3 py-2 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs font-mono text-white focus:outline-none focus:border-[#7c3aed]"
            />
            <span className="text-[11px] text-[#737373] block">
              Daqiiqadaha ka dib marka gambaleelka la yeeriyo ee ardayga loo diiwaangeliyo 'Daahay'.
            </span>
          </div>
        </div>

        {/* Teacher permissions */}
        <div className="pt-3 border-t border-[#ffffff08] space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={teachersCanMarkAllClasses}
              onChange={e => setTeachersCanMarkAllClasses(e.target.checked)}
              className="rounded-xs text-[#7c3aed] focus:ring-0 w-4 h-4 bg-[#0a0a0a] border-[#ffffff20]"
            />
            <span className="text-xs text-[#e5e5e5] font-medium">
              U oggolow macallimiintu inay xaadiriyaan dhammaan fasallada (Allow teachers to mark any class)
            </span>
          </label>
          <p className="text-[11px] text-[#737373] pl-7">
            Haddii aan la dooran, macallimiintu waxay xaadirin karaan kaliya fasallada loogu qoondeeyay profile-kooda.
          </p>
        </div>
      </div>

      {/* 3. SAVE AND ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#262626] border border-[#ffffff15] text-[#a3a3a3] hover:text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Dib ugu Celi Asalkii (Reset to Defaults)</span>
        </button>

        <button
          onClick={handleSaveAllSettings}
          className="px-5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-sm shadow-md flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Kaydi Qaabeynta (Save Settings)</span>
        </button>
      </div>
    </div>
  );
};
