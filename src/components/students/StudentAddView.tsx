import React, { useState, useEffect } from 'react';
import { 
  User, 
  School, 
  Phone, 
  FileText, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Upload,
  X,
  Plus,
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SchoolClass } from '../../types';

interface StudentAddViewProps {
  classes: SchoolClass[];
  onAddStudent: (studentData: any) => Promise<boolean>;
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
}

function compressImage(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function StudentAddView({
  classes,
  onAddStudent,
  onCancel,
  showToast,
  theme = 'dark'
}: StudentAddViewProps) {
  // 5 Step Stepper State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female',
    nationalId: '',
    class: classes[0]?.className || '',
    section: '',
    rollNumber: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    guardianName: '',
    guardianRelationship: 'Father',
    guardianPhone: '',
    guardianPhoneAlt: '',
    address: '',
    previousSchool: '',
    bloodGroup: '',
    medicalNotes: '',
    photo: '',
    status: 'active' as 'active' | 'inactive' | 'archived'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    found: boolean;
    reason?: string;
    existingStudent?: any;
  }>({ found: false });

  // Real-time Duplicate Check (Debounced)
  useEffect(() => {
    if (!formData.fullName.trim() || !formData.class) {
      setDuplicateWarning({ found: false });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/students/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName.trim(),
            className: formData.class,
            guardianPhone: formData.guardianPhone.trim()
          })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.duplicate) {
            setDuplicateWarning({
              found: true,
              reason: result.reason,
              existingStudent: result.existingStudent
            });
          } else {
            setDuplicateWarning({ found: false });
          }
        }
      } catch (err) {
        console.warn("Duplicate check error:", err);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.fullName, formData.class, formData.guardianPhone]);

  // Handle Photo Upload with Auto-compression
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("Fadlan soo geli sawir sax ah (PNG, JPG)", "error");
      return;
    }
    try {
      const compressedDataUrl = await compressImage(file, 400, 0.85);
      setFormData(prev => ({ ...prev, photo: compressedDataUrl }));
      showToast("Sawirka ardayga waa la habeeyey!", "success");
    } catch (e) {
      showToast("Khalad ayaa dhacay akhrinta sawirka", "error");
    }
  };

  // Step-specific validation
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) {
        errs.fullName = "Magaca oo buuxa waa qasab (Full Name is required)";
      } else if (formData.fullName.trim().split(' ').length < 2) {
        errs.fullName = "Fadlan geli ugu yaraan labo magac (Enter at least first and last name)";
      }
    } else if (step === 2) {
      if (!formData.class) {
        errs.class = "Fasalka waa qasab (Class is required)";
      }
    } else if (step === 3) {
      if (!formData.guardianPhone.trim()) {
        errs.guardianPhone = "Telefoonka waalidka waa qasab (Guardian phone is required)";
      } else if (formData.guardianPhone.replace(/[^0-9]/g, '').length < 6) {
        errs.guardianPhone = "Fadlan geli lambar telefoon sax ah";
      }
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstMsg = Object.values(errs)[0];
      showToast(firstMsg, "warning");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Full validation before final submission
  const validateAll = (): boolean => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  };

  // Submit Handler
  const handleSubmit = async (addAnother = false) => {
    if (!validateAll()) {
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    const newStudent = {
      id: 'std-' + Math.random().toString(36).substr(2, 9),
      fullName: formData.fullName.trim(),
      class: formData.class,
      gender: formData.gender,
      guardianPhone: formData.guardianPhone.trim(),
      guardianName: formData.guardianName.trim() || undefined,
      status: formData.status,
      photo: formData.photo || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address || undefined,
      section: formData.section || undefined,
      rollNumber: formData.rollNumber || undefined,
      createdAt: formData.enrollmentDate || new Date().toISOString().split('T')[0]
    };

    try {
      const success = await onAddStudent(newStudent);
      if (success) {
        showToast("Ardayga si guul leh ayaa loo diiwaangeliyey!", "success");
        if (addAnother) {
          setFormData({
            fullName: '',
            dateOfBirth: '',
            gender: 'Male',
            nationalId: '',
            class: formData.class,
            section: formData.section,
            rollNumber: '',
            enrollmentDate: new Date().toISOString().split('T')[0],
            guardianName: '',
            guardianRelationship: 'Father',
            guardianPhone: '',
            guardianPhoneAlt: '',
            address: '',
            previousSchool: '',
            bloodGroup: '',
            medicalNotes: '',
            photo: '',
            status: 'active'
          });
          setCurrentStep(1);
          setFormErrors({});
          setDuplicateWarning({ found: false });
        } else {
          onCancel();
        }
      }
    } catch (err) {
      showToast("Khalad ayaa dhacay diiwaangelinta ardayga", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Personal', desc: 'Xogta Shakhsiga' },
    { num: 2, title: 'Enrollment', desc: 'Fasalka & Qorista' },
    { num: 3, title: 'Guardian', desc: 'Waalidka & Xiriirka' },
    { num: 4, title: 'Additional', desc: 'Caafimaadka & Hore' },
    { num: 5, title: 'Review & Save', desc: 'Hubi oo Diiwaangeli' }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ffffff10] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#737373] font-mono mb-1">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={onCancel}>Students</span>
            <span>/</span>
            <span className="text-[#c4b5fd] font-bold">Add Student</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f5f5] tracking-tight">
            Diiwaangelinta Arday Cusub
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Student Registration Wizard — Raac talaabooyinka si habaysan oo degdeg ah.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="self-start sm:self-auto px-3.5 py-2 rounded-sm border border-[#ffffff15] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] uppercase tracking-wider text-[11px] font-semibold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ka Noqo (Cancel)</span>
        </button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-3 sm:p-4">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  onClick={() => {
                    // Allow clicking earlier steps or next if valid
                    if (step.num < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className={`flex items-center gap-2 text-left group cursor-pointer transition-all ${
                    isCurrent ? 'opacity-100' : isDone ? 'opacity-90' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#ffffff08] text-[#737373] border border-[#ffffff10]'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4" /> : step.num}
                  </div>
                  <div className="hidden md:block">
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-[#a3a3a3]'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-[#737373]">{step.desc}</p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-3 h-[1px] bg-[#ffffff10]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning.found && (
        <div className="p-4 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3 animate-slide-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider text-[11px]">
              ⚠️ Digniin: Arday Nuucaan ah Horey Ayuu U Jiray! (Potential Duplicate Detected)
            </p>
            <p className="text-[#e5e5e5] leading-relaxed">
              {duplicateWarning.reason || "Arday magacan iyo fasalkan wata ayaa horey ugu jiray nidaamka."}
            </p>
            {duplicateWarning.existingStudent && (
              <p className="text-[10px] font-mono text-amber-200">
                Ardayga Hore: {duplicateWarning.existingStudent.fullName} | ID: {duplicateWarning.existingStudent.id} | Fasal: {duplicateWarning.existingStudent.class}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step Content Card */}
      <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-6 sm:p-8 space-y-6">

        {/* STEP 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#ffffff08] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Talaabada 1: Xogta Shakhsiga (Personal Information)
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Geli magaca ardayga, jinsiga, taariikhda dhalashada, iyo sawirkiisa.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                Step 1 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] flex items-center justify-between">
                  <span>Magaca oo Buuxa (Full Name) *</span>
                  {formErrors.fullName && <span className="text-rose-400 font-normal text-xs">{formErrors.fullName}</span>}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                  }}
                  placeholder="Tusaale: Maxamed Cali Jaamac"
                  className={`w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors ${
                    formErrors.fullName ? 'border-rose-500/50' : 'border-[#ffffff10]'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Jinsiga (Gender) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Male' })}
                    className={`py-2.5 px-4 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formData.gender === 'Male'
                        ? 'bg-[#3b82f6]/15 border-[#3b82f6] text-[#60a5fa]'
                        : 'border-[#ffffff10] bg-[#0a0a0a] text-[#737373] hover:text-[#e5e5e5]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                    <span>Lab (Male)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Female' })}
                    className={`py-2.5 px-4 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formData.gender === 'Female'
                        ? 'bg-[#ec4899]/15 border-[#ec4899] text-[#f472b6]'
                        : 'border-[#ffffff10] bg-[#0a0a0a] text-[#737373] hover:text-[#e5e5e5]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ec4899]"></span>
                    <span>Dhedig (Female)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Taariikhda Dhalashada (Date of Birth)
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Lambarka Aqoonsiga / National ID (Optional)
                </label>
                <input
                  type="text"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="Tusaale: SOM-98214"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] uppercase font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* Photo Upload Box */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] block">
                  Sawirka Ardayga (Student Photo)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-sm bg-[#0a0a0a] border border-[#ffffff08]">
                  {formData.photo ? (
                    <div className="relative group shrink-0">
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: '' })}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#ffffff05] border border-[#ffffff10] flex items-center justify-center text-[#737373] shrink-0">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <label
                      className="border-2 border-dashed border-[#ffffff15] hover:border-[#7c3aed] rounded-sm p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#0f0f0f] hover:bg-[#ffffff02] transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                    >
                      <Upload className="w-4 h-4 text-[#c4b5fd]" />
                      <div className="text-center">
                        <span className="text-xs font-semibold text-[#e5e5e5]">
                          Guji si aad sawir u soo geliso ama ku soo jiid (Drag & Drop)
                        </span>
                        <span className="text-[10px] text-[#737373] block mt-0.5">
                          PNG, JPG (Si toos ah ayaa loo hagaajinayaa cabbirka)
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoUpload(f);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: School Enrollment */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#ffffff08] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Talaabada 2: Qorista Iskuulka (School Enrollment)
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Xaqiiji fasalka, qeybta, lambarka taxanaha, iyo taariikhda qorista.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                Step 2 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] flex items-center justify-between">
                  <span>Fasalka (Class) *</span>
                  {formErrors.class && <span className="text-rose-400 font-normal text-xs">{formErrors.class}</span>}
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => {
                    setFormData({ ...formData, class: e.target.value });
                    if (formErrors.class) setFormErrors({ ...formErrors, class: '' });
                  }}
                  className={`w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] ${
                    formErrors.class ? 'border-rose-500/50' : 'border-[#ffffff10]'
                  }`}
                  required
                >
                  <option value="">-- Dooro Fasal --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.className}>{c.className}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Qeybta / Section (Optional)
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="Tusaale: A ama B"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] uppercase focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Lambarka Taxanaha / Roll Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="Tusaale: 015"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Taariikhda Diiwaangelinta (Enrollment Date)
                </label>
                <input
                  type="date"
                  value={formData.enrollmentDate}
                  onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Xaaladda Diiwaanka (Initial Status)
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="active">Active (Firfircoon)</option>
                  <option value="inactive">Inactive (Aan Firfircoonayn)</option>
                  <option value="archived">Archived (Kaydsan)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Guardian Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#ffffff08] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Talaabada 3: Macluumaadka Waalidka (Guardian Details)
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Xogta qofka masuulka ka ah ardayga ee lagu xiriirayo fariimaha & biilasha.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                Step 3 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Magaca Waalidka / Masuulka (Guardian Name)
                </label>
                <input
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  placeholder="Tusaale: Cali Jaamac Xasan"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Xiriirka Ardayga (Relationship)
                </label>
                <select
                  value={formData.guardianRelationship}
                  onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="Father">Aabbe (Father)</option>
                  <option value="Mother">Hooyo (Mother)</option>
                  <option value="Uncle">Adeer / Eedo (Uncle/Aunt)</option>
                  <option value="Brother">Walaal (Sibling)</option>
                  <option value="Other">Masuul Kale (Other Guardian)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] flex items-center justify-between">
                  <span>Telefoonka Rasmiga ah (Primary Phone) *</span>
                  {formErrors.guardianPhone && <span className="text-rose-400 font-normal text-xs">{formErrors.guardianPhone}</span>}
                </label>
                <input
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, guardianPhone: e.target.value });
                    if (formErrors.guardianPhone) setFormErrors({ ...formErrors, guardianPhone: '' });
                  }}
                  placeholder="Tusaale: +252 61 555 1234"
                  className={`w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border text-xs text-[#e5e5e5] font-mono focus:outline-none focus:border-[#7c3aed] ${
                    formErrors.guardianPhone ? 'border-rose-500/50' : 'border-[#ffffff10]'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Telefoon Labaad / Alternative Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.guardianPhoneAlt}
                  onChange={(e) => setFormData({ ...formData, guardianPhoneAlt: e.target.value })}
                  placeholder="Tusaale: +252 61 222 3456"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Cinwaanka Guriga (Residential Address)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Tusaale: Degmada Hodan, Xaafadda Taleex, Muqdisho"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Additional Details */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#ffffff08] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Talaabada 4: Xogta Dheeraadka ah (Additional Details)
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Iskuulkii hore, kooxda dhiigga, iyo qoraallo caafimaad haddii ay jiraan.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                Step 4 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Iskuulkii Hore (Previous School)
                </label>
                <input
                  type="text"
                  value={formData.previousSchool}
                  onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
                  placeholder="Tusaale: Dugsiga Al-Nuur"
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Kooxda Dhiigga (Blood Group)
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="">-- Lama yaqaan (Unknown) --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                  Qoraallo Caafimaad / Medical or Dietary Notes
                </label>
                <textarea
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  rows={3}
                  placeholder="Xasaasiyad (allergies), baahiyo gaar ah, ama daryeel caafimaad..."
                  className="w-full px-4 py-2.5 rounded-sm bg-[#0a0a0a] border border-[#ffffff10] text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Save */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#ffffff08] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#f5f5f5]">
                  Talaabada 5: Hubi oo Diiwaangeli (Review & Save)
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Xaqiiji xogta ka hor inta aadan rasmi ahaan u kaydin nidaamka.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
                Step 5 of 5
              </span>
            </div>

            {/* Profile Overview Card */}
            <div className="p-5 rounded-sm bg-[#141414] border border-[#ffffff10] space-y-4">
              <div className="flex items-center gap-4 border-b border-[#ffffff08] pb-4">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt={formData.fullName}
                    className="w-16 h-16 rounded-full object-cover border border-[#ffffff20]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#7c3aed]/20 text-[#c4b5fd] flex items-center justify-center font-bold text-lg border border-[#7c3aed]/30">
                    {formData.fullName ? formData.fullName.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {formData.fullName || 'Student Name'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                      Fasalka: {formData.class}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-mono font-semibold border border-blue-500/30">
                      {formData.gender}
                    </span>
                    <span className="text-[11px] text-[#737373] font-mono">
                      Qorista: {formData.enrollmentDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#737373] block">Waalidka / Masuulka</span>
                  <span className="text-[#f5f5f5] font-semibold">{formData.guardianName || 'Lama hayo'} ({formData.guardianRelationship})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#737373] block">Telefoonka Waalidka</span>
                  <span className="text-[#c4b5fd] font-mono font-semibold">{formData.guardianPhone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#737373] block">Cinwaanka</span>
                  <span className="text-[#a3a3a3]">{formData.address || 'Muqdisho'}</span>
                </div>
                {formData.dateOfBirth && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#737373] block">Taariikhda Dhalashada</span>
                    <span className="text-[#a3a3a3] font-mono">{formData.dateOfBirth}</span>
                  </div>
                )}
                {formData.rollNumber && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#737373] block">Roll Number</span>
                    <span className="text-[#a3a3a3] font-mono">{formData.rollNumber}</span>
                  </div>
                )}
                {formData.bloodGroup && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#737373] block">Kooxda Dhiigga</span>
                    <span className="text-rose-400 font-semibold">{formData.bloodGroup}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#ffffff08]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="w-full sm:w-auto px-4 py-2.5 rounded-sm border border-[#ffffff15] bg-[#ffffff03] hover:bg-[#ffffff08] text-[#d4d4d4] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dib u Noqo (Back)</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sii Soco ({steps[currentStep].title})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-sm border border-[#ffffff15] bg-[#ffffff05] hover:bg-[#ffffff10] text-[#c4b5fd] text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kaydi & Mid Kale</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Diiwaangelinayaa...' : 'Dhammee oo Diiwaangeli'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
