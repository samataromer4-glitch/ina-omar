import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, GraduationCap, ArrowRight } from "lucide-react";

interface TeacherActivationViewProps {
  token: string;
  onActivatedSuccess: (email: string) => void;
  onGoToLogin: () => void;
}

export const TeacherActivationView: React.FC<TeacherActivationViewProps> = ({
  token,
  onActivatedSuccess,
  onGoToLogin
}) => {
  const [loading, setLoading] = useState(true);
  const [verifyingError, setVerifyingError] = useState<string | null>(null);
  const [teacherData, setTeacherData] = useState<{
    teacherName: string;
    email: string;
    schoolName?: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setVerifyingError("Token-ka casuumaaddu ma furna ama ma jiro. Fadlan hubi link-gii email-kaaga.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/teachers/verify-invitation/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setVerifyingError(data.error || "Casuumaaddani ma shaqeynayso ama way dhacday.");
        } else {
          setTeacherData({
            teacherName: data.teacherName,
            email: data.email,
            schoolName: data.schoolName || "Dugsiga Pro 2026"
          });
        }
      } catch (err: any) {
        setVerifyingError("Ma suurtogalin in la xaqiijiyo casuumaadda. Fadlan hubi internet-kaaga.");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError("Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Labada password isma laha. Fadlan si taxaddar leh dib ugu qor.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/teachers/activate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Dhaqaajinta akoonku way fashilantay.");
      } else {
        setIsActivated(true);
      }
    } catch (err: any) {
      setSubmitError("Cilad farsamo ayaa dhacday. Fadlan mar kale isku day.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background aura */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Branding */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              {teacherData?.schoolName || "Dugsi Pro 2026"}
            </h1>
            <p className="text-xs text-slate-400">Nidaamka Dhaqaajinta Akoonka Macallinka</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Xaqiijinta casuumaadda macallinka...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && verifyingError && (
          <div className="space-y-5 py-4">
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-300 mb-1">Casuumaad Aan Shaqeynayn</div>
                <div className="text-xs leading-relaxed text-rose-200/90">{verifyingError}</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Haddii aad tahay macallin dugsiga ka tirsan, fadlan la xiriir maamulka dugsigaaga si laguu soo diro casuumaad cusub oo shaqeynaysa.
            </p>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
            >
              U gudub Bogga Galitaanka (Login)
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && !verifyingError && isActivated && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Hambalyo! Akoonkaagu waa Diyaar</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Akoonkaaga Macallinka si buuxda ayaa loo dhaqaajiyey. Hadda waxaad geli kartaa adigoo isticmaalaya email-kaaga iyo password-ka cusub.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onActivatedSuccess(teacherData?.email || "")}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              <span>Gali Akoonkaaga Hadda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form State */}
        {!loading && !verifyingError && !isActivated && teacherData && (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <div className="text-xs text-purple-400 font-medium">Ku soo dhowow DUGSI PRO:</div>
              <div className="text-sm font-bold text-white">{teacherData.teacherName}</div>
              <div className="text-xs text-slate-400">{teacherData.email}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Fadlan samayso password ammaan ah oo aad ku geli doonto akoonkaaga. Maamulka dugsigu ma oga mana arki karo password-kan.
            </p>

            {submitError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Password Cusub (Ugu yaraan 8 xaraf)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Xaqiiji Password-ka (Confirm Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? "Dhaqaajinta ayaa socota..." : "Dhaqaaji Akoonka Macallinka"}</span>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-xs text-slate-400 hover:text-purple-400 transition"
              >
                Horey ma u lahayd akoon shaqeynaya? <span className="underline">Halkan gal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
