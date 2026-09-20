import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  Check, 
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SchoolClass } from '../../types';

interface StudentImportViewProps {
  existingStudents: Student[];
  classes: SchoolClass[];
  onImportStudents: (studentsToImport: any[]) => Promise<boolean>;
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
}

interface ParsedRow {
  index: number;
  fullName: string;
  className: string;
  gender: 'Male' | 'Female';
  guardianPhone: string;
  guardianName?: string;
  section?: string;
  rollNumber?: string;
  address?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  duplicateReason?: string;
}

export default function StudentImportView({
  existingStudents,
  classes,
  onImportStudents,
  onCancel,
  showToast,
  theme = 'dark'
}: StudentImportViewProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    skipped: number;
  }>({ total: 0, imported: 0, skipped: 0 });

  // Download Standardized Excel Template
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        "Magaca Ardayga (Full Name) *": "Maxamed Cali Jaamac",
        "Fasalka (Class) *": classes[0]?.className || "Fasalka 1aad",
        "Lab/Dhedig (Gender - Male/Female) *": "Male",
        "Telefoonka Waalidka (Guardian Phone) *": "+252615123456",
        "Magaca Waalidka (Guardian Name)": "Cali Jaamac",
        "Qeybta (Section)": "A",
        "Roll Number": "01",
        "Cinwaanka (Address)": "Muqdisho, Hodan"
      },
      {
        "Magaca Ardayga (Full Name) *": "Caasho Axmed Nuur",
        "Fasalka (Class) *": classes[0]?.className || "Fasalka 1aad",
        "Lab/Dhedig (Gender - Male/Female) *": "Female",
        "Telefoonka Waalidka (Guardian Phone) *": "+252615654321",
        "Magaca Waalidka (Guardian Name)": "Axmed Nuur",
        "Qeybta (Section)": "A",
        "Roll Number": "02",
        "Cinwaanka (Address)": "Muqdisho, Howlwadaag"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students_Template");
    XLSX.writeFile(wb, "DugsiPro_Students_Import_Template.xlsx");
    showToast("Template-ka Excel-ka waa la soo dejiyey!", "success");
  };

  // Parse Excel / CSV File
  const handleFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      showToast("Fadlan dooro fayl Excel (.xlsx, .xls) ama CSV (.csv)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          showToast("Faylka waa maran yahay!", "warning");
          return;
        }

        // Validate and check duplicates
        const processed: ParsedRow[] = rawJson.map((row, idx) => {
          // Normalize column headers
          const fullName = String(
            row['Magaca Ardayga (Full Name) *'] || 
            row['Magaca Ardayga'] || 
            row['Full Name'] || 
            row['FullName'] || 
            row['Name'] || 
            ''
          ).trim();

          const className = String(
            row['Fasalka (Class) *'] || 
            row['Fasalka'] || 
            row['Class'] || 
            row['Grade'] || 
            ''
          ).trim();

          const rawGender = String(
            row['Lab/Dhedig (Gender - Male/Female) *'] || 
            row['Lab/Dhedig'] || 
            row['Gender'] || 
            'Male'
          ).trim().toLowerCase();

          const gender: 'Male' | 'Female' = (rawGender.startsWith('f') || rawGender.includes('dhed') || rawGender.includes('girl')) ? 'Female' : 'Male';

          const guardianPhone = String(
            row['Telefoonka Waalidka (Guardian Phone) *'] || 
            row['Telefoonka Waalidka'] || 
            row['Guardian Phone'] || 
            row['Phone'] || 
            ''
          ).trim();

          const guardianName = String(
            row['Magaca Waalidka (Guardian Name)'] || 
            row['Magaca Waalidka'] || 
            row['Guardian Name'] || 
            ''
          ).trim();

          const section = String(row['Qeybta (Section)'] || row['Section'] || '').trim();
          const rollNumber = String(row['Roll Number'] || row['RollNumber'] || '').trim();
          const address = String(row['Cinwaanka (Address)'] || row['Address'] || '').trim();

          // Error validation
          const errors: string[] = [];
          if (!fullName) errors.push("Magaca ardayga waa maran (Name is empty)");
          if (!className) errors.push("Fasalka lama sheegin (Class is missing)");
          if (!guardianPhone) errors.push("Telefoonka waalidka waa qasab (Phone is missing)");

          // Duplicate detection against existing students
          let isDuplicate = false;
          let duplicateReason = '';

          const existingMatch = existingStudents.find(
            s => s.fullName.trim().toLowerCase() === fullName.toLowerCase() &&
                 s.class.trim().toLowerCase() === className.toLowerCase()
          );

          if (existingMatch) {
            isDuplicate = true;
            duplicateReason = `Arday hore ugu jiray fasalka (${existingMatch.id})`;
          } else if (guardianPhone.length >= 6) {
            const phoneMatch = existingStudents.find(
              s => s.fullName.trim().toLowerCase() === fullName.toLowerCase() &&
                   s.guardianPhone && s.guardianPhone.replace(/\D/g, '') === guardianPhone.replace(/\D/g, '')
            );
            if (phoneMatch) {
              isDuplicate = true;
              duplicateReason = `Magaca iyo telefoonka waalidka ayaa u dhigma ${phoneMatch.id}`;
            }
          }

          return {
            index: idx + 1,
            fullName,
            className,
            gender,
            guardianPhone,
            guardianName: guardianName || undefined,
            section: section || undefined,
            rollNumber: rollNumber || undefined,
            address: address || undefined,
            isValid: errors.length === 0,
            isDuplicate,
            errors,
            duplicateReason
          };
        });

        setParsedRows(processed);
        setStep('preview');
        showToast(`Faylka waa la falanqeeyey: ${processed.length} arday ayaa la helay`, "success");
      } catch (err) {
        console.error(err);
        showToast("Khalad ayaa dhacay akhrinta faylka Excel", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtered rows for the preview table
  const visibleRows = parsedRows.filter(r => {
    if (filterTab === 'valid') return r.isValid && !r.isDuplicate;
    if (filterTab === 'invalid') return !r.isValid;
    if (filterTab === 'duplicate') return r.isDuplicate;
    return true;
  });

  const validRowsCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length;
  const invalidRowsCount = parsedRows.filter(r => !r.isValid).length;
  const duplicateRowsCount = parsedRows.filter(r => r.isDuplicate).length;

  // Execute Safe Import
  const handleExecuteImport = async () => {
    const importableRows = parsedRows.filter(r => r.isValid && !r.isDuplicate);
    if (importableRows.length === 0) {
      showToast("Ma jiraan xog sax ah oo la soo galin karo", "warning");
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const studentsToImport = importableRows.map(r => ({
      id: 'std-' + Math.random().toString(36).substr(2, 9),
      fullName: r.fullName,
      class: r.className,
      gender: r.gender,
      guardianPhone: r.guardianPhone,
      guardianName: r.guardianName,
      section: r.section,
      rollNumber: r.rollNumber,
      address: r.address,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    }));

    try {
      setImportProgress(50);
      const success = await onImportStudents(studentsToImport);
      setImportProgress(100);

      if (success) {
        setImportSummary({
          total: parsedRows.length,
          imported: studentsToImport.length,
          skipped: parsedRows.length - studentsToImport.length
        });
        setStep('complete');
        showToast(`${studentsToImport.length} arday si guul leh ayaa loo soo geliyey!`, "success");
      }
    } catch (err) {
      showToast("Khalad ayaa dhacay xilliga soo gelinta", "error");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ffffff10] pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#737373] font-mono mb-1">
            <span className="hover:text-[#c4b5fd] cursor-pointer" onClick={onCancel}>Students</span>
            <span>/</span>
            <span className="text-[#c4b5fd] font-bold">Import Students</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif italic font-bold text-[#f5f5f5] tracking-tight">
            Soo Gelinta Ardayda (Bulk Import)
          </h1>
          <p className="text-xs text-[#a3a3a3] mt-1">
            Kala soo wareeg xogta ardayda faylasha Excel ama CSV adigoo ilaalinaya nidaamka xogta iyo kahortagga laban-laabashada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-sm border border-[#7c3aed]/40 hover:border-[#7c3aed] bg-[#7c3aed]/10 text-[#c4b5fd] uppercase tracking-wider text-[11px] font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Soo Degso Template-ka Excel</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-sm border border-[#ffffff10] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-[#e5e5e5] uppercase tracking-wider text-[11px] font-bold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ka Noqo</span>
          </button>
        </div>
      </div>

      {/* STEP 1: Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Guide Card */}
            <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
              <div className="w-8 h-8 rounded-sm bg-[#7c3aed]/10 text-[#c4b5fd] flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e5e5]">
                Diyaari Faylkaaga
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Soo degso template-ka rasmiga ah oo ku buuxi magacyada, fasallada, jinsiga, iyo telefoonka waalidka.
              </p>
              <ul className="text-[11px] text-[#737373] space-y-1.5 list-disc list-inside">
                <li>Magaca Ardayga (Waa Qasab)</li>
                <li>Fasalka (Waa Qasab)</li>
                <li>Telefoonka Waalidka (Waa Qasab)</li>
                <li>Lab/Dhedig (Male/Female)</li>
              </ul>
            </div>

            {/* Validation Card */}
            <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
              <div className="w-8 h-8 rounded-sm bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e5e5]">
                Hubin Toos ah & Kahortag
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Nidaamku wuxuu si toos ah u baari doonaa khaladaadka iyo haddii arday hore u jiray uu ku jiro liiska.
              </p>
              <div className="p-3 bg-[#0a0a0a] rounded border border-[#ffffff08] text-[10px] text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Ardayda labanlaabanta ah si toos ah ayaa looga reebayaa.</span>
              </div>
            </div>

            {/* Confirmation Card */}
            <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-5 space-y-4">
              <div className="w-8 h-8 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5e5e5]">
                Diiwaangeli Nidaamka
              </h3>
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                Ardayda saxda ah kaliya ayaa lagu darayaa keydka xogta iyadoo aan waxyeello loo geysan ardayda hore.
              </p>
              <div className="p-3 bg-[#0a0a0a] rounded border border-[#ffffff08] text-[10px] text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>100% Badbaado leh (Production Safe)</span>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="border-2 border-dashed border-[#ffffff15] hover:border-[#7c3aed] rounded-sm p-12 flex flex-col items-center justify-center gap-4 bg-[#0f0f0f] hover:bg-[#ffffff02] transition-colors cursor-pointer text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 text-[#c4b5fd] flex items-center justify-center">
              <Upload className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f5f5f5] tracking-wide">
                Halkan ku soo jiid faylka Excel ama CSV (Drag & Drop)
              </h3>
              <p className="text-xs text-[#737373]">
                Faylasha la taageero: <span className="font-mono text-[#a3a3a3]">.xlsx, .xls, .csv</span>
              </p>
            </div>
            <label className="px-6 py-2.5 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] uppercase tracking-wider text-xs font-bold transition-colors cursor-pointer shadow">
              <span>Dooro Fayl Kombiyuutarkaaga</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: Preview & Validation Step */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-sm bg-[#0f0f0f] border border-[#ffffff10]">
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#737373]">Guud ahaan Xogta</div>
              <div className="text-2xl font-bold font-mono text-[#f5f5f5] mt-1">{parsedRows.length}</div>
            </div>
            <div className="p-4 rounded-sm bg-[#0f0f0f] border border-emerald-500/20">
              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Sax ah (Diyaar)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{validRowsCount}</div>
            </div>
            <div className="p-4 rounded-sm bg-[#0f0f0f] border border-amber-500/20">
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">Laban-laab (Duplicate)</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{duplicateRowsCount}</div>
            </div>
            <div className="p-4 rounded-sm bg-[#0f0f0f] border border-rose-500/20">
              <div className="text-[10px] uppercase font-bold tracking-widest text-rose-400">Khalad ku jiro</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{invalidRowsCount}</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ffffff10] pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterTab === 'all' ? 'bg-[#ffffff10] text-white' : 'text-[#737373] hover:text-white'
                }`}
              >
                Dhammaan ({parsedRows.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('valid')}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterTab === 'valid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[#737373] hover:text-white'
                }`}
              >
                Sax Ah ({validRowsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('duplicate')}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterTab === 'duplicate' ? 'bg-amber-500/20 text-amber-400' : 'text-[#737373] hover:text-white'
                }`}
              >
                Laban-laab ({duplicateRowsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('invalid')}
                className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filterTab === 'invalid' ? 'bg-rose-500/20 text-rose-400' : 'text-[#737373] hover:text-white'
                }`}
              >
                Khalad ({invalidRowsCount})
              </button>
            </div>

            <div className="text-xs text-[#a3a3a3]">
              Kaliya ardayda saxda ah ee aan laban-laabmin ayaa la galinayaa ({validRowsCount} arday).
            </div>
          </div>

          {/* Table Preview */}
          <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#ffffff10] bg-[#0a0a0a] text-[10px] uppercase font-bold text-[#737373] tracking-widest">
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Xaaladda / Status</th>
                  <th className="p-3">Magaca Ardayga</th>
                  <th className="p-3">Fasalka</th>
                  <th className="p-3">Jinsiga</th>
                  <th className="p-3">Telefoonka Waalidka</th>
                  <th className="p-3">Faahfaahin / Xusuusin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ffffff06]">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-[#737373]">
                      Wax arday ah kuma jiraan qaybtaan.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((r) => (
                    <tr key={r.index} className="hover:bg-[#ffffff02] transition-colors">
                      <td className="p-3 text-center font-mono text-[#737373]">{r.index}</td>
                      <td className="p-3">
                        {r.isValid && !r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Diyaar</span>
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Laban-laab</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            <span>Khalad</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-[#f5f5f5] uppercase">{r.fullName || "—"}</td>
                      <td className="p-3 text-[#c4b5fd] font-medium">{r.className || "—"}</td>
                      <td className="p-3 text-[#a3a3a3]">{r.gender}</td>
                      <td className="p-3 font-mono text-[#a3a3a3]">{r.guardianPhone || "—"}</td>
                      <td className="p-3 text-[11px]">
                        {r.isDuplicate && (
                          <span className="text-amber-400">{r.duplicateReason}</span>
                        )}
                        {!r.isValid && (
                          <span className="text-rose-400">{r.errors.join(', ')}</span>
                        )}
                        {r.isValid && !r.isDuplicate && (
                          <span className="text-emerald-400">Xogtu waa sax</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Import Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#ffffff10]">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-5 py-2.5 rounded-sm border border-[#ffffff15] hover:bg-[#ffffff05] text-[#a3a3a3] hover:text-white uppercase tracking-wider text-xs font-bold transition-colors"
            >
              Dib ugu Noqo Doorashada Faylka
            </button>

            <button
              type="button"
              disabled={validRowsCount === 0 || isImporting}
              onClick={handleExecuteImport}
              className="px-8 py-3 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] uppercase tracking-widest text-xs font-bold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isImporting ? 'Soo Galinayaa...' : `Soo Geli ${validRowsCount} Arday oo Sax ah`}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Complete & Summary Step */}
      {step === 'complete' && (
        <div className="bg-[#0f0f0f] border border-[#ffffff10] rounded-sm p-8 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif italic font-bold text-[#f5f5f5]">
              Soo Gelintu Way Guulaysatay!
            </h2>
            <p className="text-xs text-[#a3a3a3]">
              Dhammaan xogtii saxda ahayd waxaa si nabadgelyo leh loogu daray nidaamka Dugsiga.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-[#0a0a0a] rounded-sm border border-[#ffffff08]">
            <div>
              <div className="text-[10px] text-[#737373] uppercase font-bold">Faylka Guud</div>
              <div className="text-lg font-mono font-bold text-[#f5f5f5]">{importSummary.total}</div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase font-bold">La Diiwaangeliyey</div>
              <div className="text-lg font-mono font-bold text-emerald-400">{importSummary.imported}</div>
            </div>
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-bold">Laga Gudbay</div>
              <div className="text-lg font-mono font-bold text-amber-400">{importSummary.skipped}</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 rounded-sm bg-[#e5e5e5] hover:bg-white text-[#0a0a0a] uppercase tracking-widest text-xs font-bold transition-colors shadow"
            >
              U Gudub Liiska Ardayda (View All Students)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
