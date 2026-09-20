import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Award, X, Sparkles, Search, User, Filter, Percent, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExamScore, Student, SchoolSubject, SchoolClass } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExamsViewProps {
  examScores: ExamScore[];
  students: Student[];
  subjects: SchoolSubject[];
  classes: SchoolClass[];
  onAddExamScore: (examData: Omit<ExamScore, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateExamScore: (id: string, examData: Partial<ExamScore>) => Promise<void>;
  onDeleteExamScore: (id: string) => Promise<void>;
  theme: 'light' | 'dark';
}

export default function ExamsView({
  examScores,
  students,
  subjects,
  classes,
  onAddExamScore,
  onUpdateExamScore,
  onDeleteExamScore,
  theme
}: ExamsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Form State
  const [form, setForm] = useState({
    studentId: '',
    className: '',
    subjectName: '',
    examName: 'Imtixaanka Dhexe (Midterm)',
    term: 'Term 1',
    maxMarks: 100,
    marksObtained: 0,
    examDate: new Date().toISOString().split('T')[0]
  });

  // Calculate dynamic Grade based on percentage
  const calculateGrade = (obtained: number, max: number): string => {
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      // Find subjects related to this student's class
      const classSubjects = subjects.filter(sub => sub.className.toLowerCase() === student.class.toLowerCase());
      setForm({
        ...form,
        studentId,
        className: student.class,
        subjectName: classSubjects.length > 0 ? classSubjects[0].subjectName : ''
      });
    } else {
      setForm({
        ...form,
        studentId: '',
        className: '',
        subjectName: ''
      });
    }
  };

  const openAddModal = () => {
    setEditingExam(null);
    const firstStudent = students[0];
    const initialStudentId = firstStudent ? firstStudent.id : '';
    const initialClass = firstStudent ? firstStudent.class : '';
    const classSubjects = firstStudent ? subjects.filter(sub => sub.className.toLowerCase() === firstStudent.class.toLowerCase()) : [];
    const initialSubject = classSubjects.length > 0 ? classSubjects[0].subjectName : '';

    setForm({
      studentId: initialStudentId,
      className: initialClass,
      subjectName: initialSubject,
      examName: 'Imtixaanka Dhexe (Midterm)',
      term: 'Term 1',
      maxMarks: 100,
      marksObtained: 0,
      examDate: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const openEditModal = (exam: ExamScore) => {
    setEditingExam(exam);
    setForm({
      studentId: exam.studentId,
      className: exam.className,
      subjectName: exam.subjectName,
      examName: exam.examName,
      term: exam.term || 'Term 1',
      maxMarks: exam.maxMarks || 100,
      marksObtained: exam.marksObtained || 0,
      examDate: exam.examDate || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.className || !form.subjectName) return;

    setLoading(true);
    const student = students.find(s => s.id === form.studentId);
    const payload = {
      studentId: form.studentId,
      studentName: student ? student.fullName : '',
      className: form.className,
      subjectName: form.subjectName,
      examName: form.examName,
      term: form.term,
      maxMarks: Number(form.maxMarks),
      marksObtained: Number(form.marksObtained),
      grade: calculateGrade(Number(form.marksObtained), Number(form.maxMarks)),
      examDate: form.examDate
    };

    try {
      if (editingExam) {
        await onUpdateExamScore(editingExam.id, payload);
      } else {
        await onAddExamScore(payload);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, examName: string, studentName: string) => {
    if (window.confirm(`Ma guursaneysaa inaad tirtirto natiijada imtixaanka "${examName}" ee ardayga ${studentName}?`)) {
      setLoading(true);
      try {
        await onDeleteExamScore(id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredExams = examScores.filter(e => {
    const student = students.find(s => s.id === e.studentId);
    const studentName = student ? student.fullName.toLowerCase() : '';
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                          e.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === 'All' || e.className.toLowerCase() === classFilter.toLowerCase();
    const matchesSubject = subjectFilter === 'All' || e.subjectName.toLowerCase() === subjectFilter.toLowerCase();
    return matchesSearch && matchesClass && matchesSubject;
  });

  // Calculate high-level metrics
  const totalEntries = filteredExams.length;
  const averagePercentage = totalEntries 
    ? Math.round(filteredExams.reduce((acc, curr) => acc + (curr.marksObtained / curr.maxMarks * 100), 0) / totalEntries) 
    : 0;

  const passedCount = filteredExams.filter(e => (e.marksObtained / e.maxMarks * 100) >= 60).length;
  const passRate = totalEntries ? Math.round((passedCount / totalEntries) * 100) : 0;

  // Find top score
  const topScoreEntry = filteredExams.length 
    ? [...filteredExams].sort((a, b) => (b.marksObtained / b.maxMarks) - (a.marksObtained / a.maxMarks))[0] 
    : null;

  // Get subjects in class filter for form / filter
  const currentClassSubjects = form.className 
    ? subjects.filter(s => s.className.toLowerCase() === form.className.toLowerCase()) 
    : [];

  const downloadExcelTemplate = () => {
    const rows: any[] = [];
    students.filter(s => s.status === 'active').forEach(s => {
      const sSubjects = subjects.filter(sub => sub.className.toLowerCase() === s.class.toLowerCase());
      if (sSubjects.length > 0) {
        sSubjects.forEach(sub => {
          rows.push({
            "Arday ID (Student ID)": s.id,
            "Magaca Ardayga (Name)": s.fullName,
            "Fasalka (Class)": s.class,
            "Maaddada (Subject)": sub.subjectName,
            "Imtixaanka (Exam Name)": 'Imtixaanka Dhexe (Midterm)',
            "Term-ka (Term)": 'Term 1',
            "Dhibcaha Ugu Badan (Max Marks)": 100,
            "Dhibcaha la Helay (Marks Obtained)": '',
            "Taariikhda (Date - YYYY-MM-DD)": new Date().toISOString().split('T')[0]
          });
        });
      } else {
        rows.push({
          "Arday ID (Student ID)": s.id,
          "Magaca Ardayga (Name)": s.fullName,
          "Fasalka (Class)": s.class,
          "Maaddada (Subject)": 'General',
          "Imtixaanka (Exam Name)": 'Imtixaanka Dhexe (Midterm)',
          "Term-ka (Term)": 'Term 1',
          "Dhibcaha Ugu Badan (Max Marks)": 100,
          "Dhibcaha la Helay (Marks Obtained)": '',
          "Taariikhda (Date - YYYY-MM-DD)": new Date().toISOString().split('T')[0]
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exam_Template");
    XLSX.writeFile(wb, "Natiijooyinka_Template.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let importedCount = 0;
        let errorCount = 0;

        for (const row of data as any[]) {
          const studentId = row["Arday ID (Student ID)"] || row["studentId"];
          const subjectName = row["Maaddada (Subject)"] || row["subjectName"];
          const examName = row["Imtixaanka (Exam Name)"] || row["examName"] || 'Imtixaanka Dhexe (Midterm)';
          const term = row["Term-ka (Term)"] || row["term"] || 'Term 1';
          const maxMarks = Number(row["Dhibcaha Ugu Badan (Max Marks)"] || row["maxMarks"] || 100);
          const marksObtainedStr = row["Dhibcaha la Helay (Marks Obtained)"] !== undefined 
            ? row["Dhibcaha la Helay (Marks Obtained)"] 
            : row["marksObtained"];
          
          if (!studentId || !subjectName || marksObtainedStr === '' || marksObtainedStr === undefined) {
            errorCount++;
            continue;
          }

          const marksObtained = Number(marksObtainedStr);
          const examDate = row["Taariikhda (Date - YYYY-MM-DD)"] || row["examDate"] || new Date().toISOString().split('T')[0];
          
          const student = students.find(s => s.id === studentId);
          if (!student) {
            errorCount++;
            continue;
          }

          const payload = {
            studentId,
            studentName: student.fullName,
            className: student.class,
            subjectName,
            examName,
            term,
            maxMarks,
            marksObtained,
            grade: calculateGrade(marksObtained, maxMarks),
            examDate: typeof examDate === 'string' ? examDate : new Date().toISOString().split('T')[0]
          };

          await onAddExamScore(payload);
          importedCount++;
        }

        alert(`Soo gelinta waa dhammaatay!\nNatiijooyinka si guul leh loo soo galiyey: ${importedCount}\nFidiyada ka haray ama dhibcaha aan la buuxin: ${errorCount}`);
      } catch (err) {
        console.error("Failing to parse excel:", err);
        alert("Faylka Excel lama akhrin karo. Fadlan hubi in template-ka saxda ah aad soo gelisay.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportExamsToPDF = () => {
    try {
      if (filteredExams.length === 0) {
        alert("Ma jiraan natiijooyin imtixaan oo la dhoofiyo.");
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Top border accent bar (Deep Purple)
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 6, 'F');

      // School info
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Dugsiga Portal', 15, 20);

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Xafiiska Imtixaanaadka & Maamulka', 15, 25);

      // Title
      doc.setTextColor(124, 58, 237);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('NATIIJOOYINKA IMTIXAANADA', 195, 20, { align: 'right' });
      doc.text('(EXAMINATION MARKS RECORD)', 195, 24, { align: 'right' });

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Taariikhda: ${new Date().toLocaleDateString()}`, 195, 30, { align: 'right' });
      doc.text(`Diiwaanada: ${filteredExams.length} Natiijooyin`, 195, 34, { align: 'right' });

      // Divider
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 38, 195, 38);

      // Metrics grid box (X = 15, Y = 43)
      doc.setFillColor(249, 250, 251);
      doc.rect(15, 43, 180, 22, 'F');
      doc.setDrawColor(243, 244, 246);
      doc.rect(15, 43, 180, 22, 'S');

      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.text('Average Percentage', 20, 49);
      doc.text('Pass Rate (>=60%)', 75, 49);
      doc.text('Total Exam Entries', 135, 49);

      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${averagePercentage}%`, 20, 55);
      doc.text(`${passRate}%`, 75, 55);
      doc.text(`${totalEntries}`, 135, 55);

      // Table
      const tableBody = filteredExams.map((e, idx) => {
        const student = students.find(s => s.id === e.studentId);
        const percentage = Math.round((e.marksObtained / e.maxMarks) * 100);
        return [
          (idx + 1).toString(),
          student ? student.fullName.toUpperCase() : e.studentName.toUpperCase(),
          e.className.toUpperCase(),
          e.subjectName.toUpperCase(),
          e.examName.toUpperCase(),
          `${e.marksObtained} / ${e.maxMarks}`,
          `${percentage}%`,
          e.grade.toUpperCase()
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [['#', 'Ardayga (Student)', 'Fasalka (Class)', 'Maaddada (Subject)', 'Imtixaan (Exam)', 'Marks', 'Percentage', 'Grade']],
        body: tableBody,
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'left' },
          4: { halign: 'left' },
          5: { halign: 'center' },
          6: { halign: 'center', fontStyle: 'bold' },
          7: { halign: 'center', fontStyle: 'bold' }
        }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Dugsiga Portal - System Generated Official Examination Statement`, 105, 282, { align: 'center' });

      doc.save(`Liiska_Natiijooyinka_Imtixaanada.pdf`);
    } catch (err) {
      console.error("Failed to export exams to PDF:", err);
    }
  };

  return (
    <div id="exams-view-root" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5] flex items-center gap-3">
            Natiijooyinka <span className="text-[#c4b5fd] font-sans font-normal text-sm bg-[#7c3aed20] px-3 py-1 rounded-full border border-[#7c3aed30]">Exams & Marks</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Geli natiijooyinka imtixaanka adoo isticmaalaya nidaamka darajooyinka casriga ah</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button 
            onClick={downloadExcelTemplate}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 text-xs uppercase tracking-widest font-bold shadow-lg transition-all duration-300 cursor-pointer"
            title="Download prepopulated student exam Excel template"
          >
            <Download className="w-4 h-4" />
            <span>Template Excel</span>
          </button>

          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 text-amber-400 text-xs uppercase tracking-widest font-bold shadow-lg transition-all duration-300 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Soo Geli (Import)</span>
            <input 
              type="file"
              accept=".xlsx, .xls"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>

          <button 
            onClick={exportExamsToPDF}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 hover:bg-[#7c3aed]/20 text-[#c4b5fd] text-xs uppercase tracking-widest font-bold shadow-lg transition-all duration-300 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Dhoofi PDF (Export PDF)</span>
          </button>
          <button 
            onClick={openAddModal}
            disabled={students.length === 0 || subjects.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs uppercase tracking-widest font-bold shadow-lg hover:shadow-[#7c3aed20] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Natiijo Cusub (Add Marks)</span>
          </button>
        </div>
      </div>

      {(students.length === 0 || subjects.length === 0) && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3">
          <span>Fadlan hubi inaad haysato ugu yaraan hal arday iyo hal maaddo ka hor inta aadan gelin natiijada imtixaanka.</span>
        </div>
      )}

      {/* Statistics dashboard panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#7c3aed10] text-[#c4b5fd] border border-[#7c3aed20]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Imtixaannada la Galiyey</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{totalEntries}</p>
          </div>
        </div>

        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#10b98110] text-[#34d399] border border-[#10b98120]">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Celcelis Guud (Average)</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{averagePercentage}%</p>
          </div>
        </div>

        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#3b82f610] text-[#60a5fa] border border-[#3b82f620]">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Gudbista (Pass Rate)</p>
            <p className="text-xl font-bold font-mono text-[#f5f5f5]">{passRate}%</p>
          </div>
        </div>

        <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="truncate flex-1">
            <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Ardayga ugu Sareeya</p>
            <p className="text-xs font-bold text-[#f5f5f5] truncate mt-0.5">
              {topScoreEntry ? `${students.find(s => s.id === topScoreEntry.studentId)?.fullName || 'Arday'} (${Math.round(topScoreEntry.marksObtained / topScoreEntry.maxMarks * 100)}%)` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#525252]" />
          <input 
            type="text"
            placeholder="Ku raadi magac arday, imtixaan ama maaddo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
          />
        </div>

        <div>
          <select 
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]/50"
          >
            <option value="All">Dhamaan Fasallada</option>
            {classes.map(c => (
              <option key={c.id} value={c.className}>{c.className}</option>
            ))}
          </select>
        </div>

        <div>
          <select 
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/40 backdrop-blur-md text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed]/50"
          >
            <option value="All">Dhamaan Madooyinka</option>
            {/* Get unique subjects */}
            {Array.from(new Set(subjects.map(s => s.subjectName))).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Results Table */}
      <div className="bg-gradient-to-b from-[#161616]/60 to-[#0e0e0e]/80 backdrop-blur-lg border border-[#ffffff08] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ffffff08] bg-[#000000]/20 text-[10px] uppercase font-bold tracking-widest text-[#737373] text-center">
                <th className="px-6 py-4 text-left">Ardayga (Student)</th>
                <th className="px-4 py-4">Fasalka (Class)</th>
                <th className="px-4 py-4">Maaddada (Subject)</th>
                <th className="px-4 py-4">Imtixaanka (Exam)</th>
                <th className="px-4 py-4">Term</th>
                <th className="px-4 py-4">Dhibcaha (Score)</th>
                <th className="px-4 py-4">Boqolley (%)</th>
                <th className="px-4 py-4">Darajo (Grade)</th>
                <th className="px-6 py-4 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffffff05] text-xs">
              {filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const student = students.find(s => s.id === exam.studentId);
                  const percentage = Math.round((exam.marksObtained / exam.maxMarks) * 100);
                  
                  // Color codes for grades
                  let gradeBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                  if (exam.grade === 'A') gradeBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                  else if (exam.grade === 'B') gradeBg = 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
                  else if (exam.grade === 'C') gradeBg = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
                  else if (exam.grade === 'D') gradeBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                  return (
                    <tr key={exam.id} className="hover:bg-[#ffffff02] transition-colors text-center font-medium text-[#e5e5e5]">
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#7c3aed10] border border-[#7c3aed20] flex items-center justify-center text-[#c4b5fd] text-xs font-bold font-mono uppercase">
                            {student ? student.fullName.substring(0, 2) : 'A'}
                          </div>
                          <div>
                            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">{student ? student.fullName : exam.studentName}</p>
                            <p className="text-[9px] text-[#525252] font-mono mt-0.5">ID: {exam.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 uppercase font-mono text-[10px] text-[#a3a3a3]">{exam.className}</td>
                      <td className="px-4 py-4 text-white font-serif italic text-sm">{exam.subjectName}</td>
                      <td className="px-4 py-4 text-[#a3a3a3]">{exam.examName}</td>
                      <td className="px-4 py-4 font-mono text-[10px] text-[#737373]">{exam.term}</td>
                      <td className="px-4 py-4 font-mono">
                        <span className="text-white font-bold">{exam.marksObtained}</span>
                        <span className="text-[#525252] mx-1">/</span>
                        <span className="text-[#a3a3a3]">{exam.maxMarks}</span>
                      </td>
                      <td className="px-4 py-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${percentage >= 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold font-mono ${gradeBg}`}>
                          {exam.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(exam)}
                            className="p-1.5 rounded-lg bg-[#ffffff05] hover:bg-[#7c3aed20] border border-[#ffffff08] hover:border-[#7c3aed30] text-[#a3a3a3] hover:text-[#c4b5fd] transition-all"
                            title="Tafatir"
                          >
                            <Edit2 className="w-3" h-3="" />
                          </button>
                          <button 
                            onClick={() => handleDelete(exam.id, exam.examName, student ? student.fullName : exam.studentName)}
                            className="p-1.5 rounded-lg bg-[#ffffff05] hover:bg-rose-950/30 border border-[#ffffff08] hover:border-rose-500/30 text-[#a3a3a3] hover:text-rose-400 transition-all"
                            title="Tirtir"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#737373]">
                    <Award className="w-12 h-12 text-[#525252] mx-auto mb-3" />
                    <h4 className="font-serif italic text-base text-[#e5e5e5]">Wax natiijo ah lama helin</h4>
                    <p className="text-[11px] mt-1">Fadlan hubi shuruudaha raadinta ama billow gelinta natiijo cusub.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exam Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-gradient-to-b from-[#181818] to-[#101010] border border-[#ffffff10] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden animate-fade-in"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9]"></div>
              
              <button 
                className="absolute right-4 top-4 p-1.5 rounded-lg text-[#737373] hover:bg-[#ffffff05] hover:text-white transition-all" 
                onClick={() => setShowModal(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-serif italic text-[#f5f5f5] mb-6 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#c4b5fd]" />
                {editingExam ? 'Tafatir Imtixaanka' : 'Geli Natiijo Imtixaan'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Dooro Ardayga (Student) *</label>
                    <select 
                      value={form.studentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs uppercase tracking-widest text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      required
                    >
                      <option value="">-- Dooro Arday --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.class})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Maaddada (Subject) *</label>
                    <select 
                      value={form.subjectName}
                      onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      required
                      disabled={!form.studentId}
                    >
                      <option value="">-- Dooro Maaddo --</option>
                      {currentClassSubjects.map(sub => (
                        <option key={sub.id} value={sub.subjectName}>{sub.subjectName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Nooca Imtixaanka (Exam Type)</label>
                    <select 
                      value={form.examName}
                      onChange={(e) => setForm({ ...form, examName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    >
                      <option value="Imtixaanka Koowaad (First Exam)">Imtixaanka Koowaad (First Exam)</option>
                      <option value="Imtixaanka Dhexe (Midterm)">Imtixaanka Dhexe (Midterm)</option>
                      <option value="Imtixaanka Dhamaadka (Final Exam)">Imtixaanka Dhamaadka (Final Exam)</option>
                      <option value="Imtixaan Kedis ah (Quiz)">Imtixaan Kedis ah (Quiz)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Term / Semester</label>
                    <select 
                      value={form.term}
                      onChange={(e) => setForm({ ...form, term: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Dhibcaha Sare (Max Marks)</label>
                    <input 
                      type="number"
                      value={form.maxMarks}
                      onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs font-mono text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Dhibcaha la Helay (Obtained)</label>
                    <input 
                      type="number"
                      value={form.marksObtained}
                      onChange={(e) => setForm({ ...form, marksObtained: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs font-mono text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                      max={form.maxMarks}
                      min={0}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Darajada la Filayo (Grade)</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/40 text-xs font-bold font-mono text-[#c4b5fd] flex items-center justify-center">
                      {calculateGrade(Number(form.marksObtained), Number(form.maxMarks))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#737373] uppercase tracking-widest text-[9px]">Taariikhda Imtixaanka (Exam Date)</label>
                  <input 
                    type="date"
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#ffffff10] bg-[#121212]/80 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] transition-colors"
                    required
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-3 rounded-xl border border-[#ffffff10] hover:bg-[#ffffff05] text-[#737373] hover:text-[#e5e5e5] uppercase tracking-widest font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white uppercase tracking-widest font-bold shadow-lg hover:shadow-[#7c3aed20] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Kaydinaya...' : 'Kaydi (Save)'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
