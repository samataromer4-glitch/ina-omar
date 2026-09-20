import React, { useState } from 'react';
import { FileText, Printer, Search, Download, Calendar, DollarSign, Award, Users, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SchoolClass, SchoolSubject, ExamScore, AttendanceRecord, FeeRecord } from '../types';

interface ReportsViewProps {
  students: Student[];
  classes: SchoolClass[];
  subjects: SchoolSubject[];
  examScores: ExamScore[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  theme: 'light' | 'dark';
}

export default function ReportsView({
  students,
  classes,
  subjects,
  examScores,
  attendance,
  fees,
  theme
}: ReportsViewProps) {
  const [subTab, setSubTab] = useState<'class' | 'student'>('class');
  const [selectedClass, setSelectedClass] = useState<string>(classes.length > 0 ? classes[0].className : '1A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // 1. CLASS REPORT CALCULATIONS
  const classStudents = students.filter(s => s.class.toLowerCase() === selectedClass.toLowerCase());
  const classStudentsActive = classStudents.filter(s => s.status === 'active');
  const classMaleCount = classStudents.filter(s => s.gender === 'Male').length;
  const classFemaleCount = classStudents.filter(s => s.gender === 'Female').length;

  // Class Attendance Calculation
  const classStudentIds = classStudents.map(s => s.id);
  const classAttendanceRecords = attendance.filter(a => classStudentIds.includes(a.studentId));
  const totalClassAttendancePossibilities = classAttendanceRecords.length;
  const totalClassPresent = classAttendanceRecords.filter(a => a.status === 'Present').length;
  const classAttendanceRate = totalClassAttendancePossibilities 
    ? Math.round((totalClassPresent / totalClassAttendancePossibilities) * 100) 
    : 100;

  // Class Finance Calculation
  const classFees = fees.filter(f => classStudentIds.includes(f.studentId));
  const classTotalInvoiced = classFees.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const classTotalPaid = classFees.reduce((acc, curr) => acc + Number(curr.paidAmount), 0);
  const classFinanceRate = classTotalInvoiced ? Math.round((classTotalPaid / classTotalInvoiced) * 100) : 0;

  // Class Exam Calculation
  const classExams = examScores.filter(e => e.className.toLowerCase() === selectedClass.toLowerCase());
  const classExamAvg = classExams.length 
    ? Math.round(classExams.reduce((acc, curr) => acc + (curr.marksObtained / curr.maxMarks * 100), 0) / classExams.length)
    : 0;


  // 2. STUDENT REPORT CARD CALCULATIONS
  const activeStudent = students.find(s => s.id === selectedStudentId);
  const activeStudentExams = examScores.filter(e => e.studentId === selectedStudentId);
  const activeStudentAttendance = attendance.filter(a => a.studentId === selectedStudentId);
  const activeStudentFees = fees.filter(f => f.studentId === selectedStudentId);

  // Student Attendance Summary
  const stdTotalAttendanceCount = activeStudentAttendance.length;
  const stdPresentCount = activeStudentAttendance.filter(a => a.status === 'Present').length;
  const stdAbsentCount = activeStudentAttendance.filter(a => a.status === 'Absent').length;
  const stdLateCount = activeStudentAttendance.filter(a => a.status === 'Late').length;
  const stdExcusedCount = activeStudentAttendance.filter(a => a.status === 'Excused').length;
  const stdAttendanceRate = stdTotalAttendanceCount 
    ? Math.round((stdPresentCount / stdTotalAttendanceCount) * 100) 
    : 100;

  // Student Fee Summary
  const stdTotalInvoiced = activeStudentFees.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const stdTotalPaid = activeStudentFees.reduce((acc, curr) => acc + Number(curr.paidAmount), 0);
  const stdBalance = stdTotalInvoiced - stdTotalPaid;

  // Student Exam Average
  const stdAvgPercentage = activeStudentExams.length
    ? Math.round(activeStudentExams.reduce((acc, curr) => acc + (curr.marksObtained / curr.maxMarks * 100), 0) / activeStudentExams.length)
    : 0;

  const getAcademicFeedback = (percentage: number): { text: string; color: string } => {
    if (percentage >= 90) return { text: "Aad iyo Aad u Fiican (Outstanding Performance)", color: "text-emerald-400" };
    if (percentage >= 80) return { text: "Aad u Fiican (Very Good Progress)", color: "text-teal-400" };
    if (percentage >= 70) return { text: "Waa Fiican tahay (Good Effort)", color: "text-sky-400" };
    if (percentage >= 60) return { text: "Dadaal dheeraad ah Samee (Needs Improvement)", color: "text-amber-400" };
    return { text: "Heerka waa mid hooseeya, fadlan la xiriir iskuulka (Underachieving, Contact School)", color: "text-rose-400" };
  };

  const exportClassReportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Top border accent bar
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
      doc.text('Xafiiska Maamulka & Diiwaangelinta', 15, 25);

      // Title
      doc.setTextColor(124, 58, 237);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('WARBIXINTA GUUD EE FASALKA', 195, 20, { align: 'right' });
      doc.text(`(CLASS REPORT - ${selectedClass.toUpperCase()})`, 195, 24, { align: 'right' });

      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Taariikhda: ${new Date().toLocaleDateString()}`, 195, 30, { align: 'right' });
      doc.text(`Tirada Ardayda: ${classStudents.length}`, 195, 34, { align: 'right' });

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
      doc.text('Attendance Rate', 20, 49);
      doc.text('Tuition Fee Rate', 75, 49);
      doc.text('Exam Score Avg', 135, 49);

      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${classAttendanceRate}%`, 20, 55);
      doc.text(`${classFinanceRate}%`, 75, 55);
      doc.text(`${classExamAvg}%`, 135, 55);

      // Detailed Info
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      const teacherName = classes.find(c => c.className === selectedClass)?.teacherName || 'Lama qoondeyn';
      const roomNum = classes.find(c => c.className === selectedClass)?.roomNumber || 'N/A';
      doc.text(`Macallinka: ${teacherName}   |   Room: ${roomNum}   |   Wiilal: ${classMaleCount}   |   Gabdho: ${classFemaleCount}`, 15, 71);

      // Table
      const tableBody = classStudents.map((s, idx) => [
        (idx + 1).toString(),
        s.id,
        s.fullName.toUpperCase(),
        s.gender.toUpperCase(),
        s.guardianPhone || 'N/A',
        s.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 76,
        head: [['#', 'Arday ID', 'Magaca Ardayga (Student Name)', 'Gender', 'Phone', 'Status']],
        body: tableBody.length > 0 ? tableBody : [['-', '-', 'Fasalkan hadda arday kuma diiwaangashana.', '-', '-', '-']],
        headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'left', fontStyle: 'bold' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Dugsiga Portal - System Generated Official Class Report`, 105, 282, { align: 'center' });

      doc.save(`Warbixinta_Fasalka_${selectedClass.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to export class report PDF:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!activeStudent) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. PDF Page Background & Margins
    // Accent color: Deep Royal Purple [124, 58, 237]
    // Dark text color: Charcoal [17, 24, 39]
    // Muted text color: Cool Gray [107, 114, 128]

    // Top border accent bar
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 6, 'F');

    // 2. School Header
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Dugsiga Portal', 15, 20);

    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Xafiiska Imtixaanaadka & Maamulka', 15, 25);

    // Document Title on Right
    doc.setTextColor(124, 58, 237);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('WARQADDA NATIIJADA', 195, 20, { align: 'right' });
    doc.text('(STUDENT REPORT CARD)', 195, 24, { align: 'right' });

    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Taariikhda: ${new Date().toISOString().split('T')[0]}`, 195, 29, { align: 'right' });
    doc.text(`Ardayda ID: ${activeStudent.id}`, 195, 33, { align: 'right' });

    // Header Divider Line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, 38, 195, 38);

    // 3. Student Photo Box (X = 15, Y = 43, Size = 26x26)
    const photoSize = 26;
    if (activeStudent.photo) {
      try {
        doc.addImage(activeStudent.photo, 'JPEG', 15, 43, photoSize, photoSize);
      } catch (e) {
        // Fallback placeholder box on error
        doc.setFillColor(243, 244, 246);
        doc.rect(15, 43, photoSize, photoSize, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.rect(15, 43, photoSize, photoSize, 'S');
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(8);
        doc.text('Sawir', 28, 56, { align: 'center' });
      }
    } else {
      // Elegant standard empty avatar box
      doc.setFillColor(243, 244, 246);
      doc.rect(15, 43, photoSize, photoSize, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(15, 43, photoSize, photoSize, 'S');
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.text('No Photo', 28, 56, { align: 'center' });
    }

    // 4. Student Demographics Info Grid (beside photo, starting at X = 48)
    const gridX = 48;
    const gridY = 43;

    doc.setFillColor(249, 250, 251);
    doc.rect(gridX, gridY, 147, photoSize, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.rect(gridX, gridY, 147, photoSize, 'S');

    // Demographics Labels and Values
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.text('Magaca (Student Name)', gridX + 5, gridY + 6);
    doc.text('Fasalka (Class)', gridX + 80, gridY + 6);
    doc.text('Lab/Dhedig (Gender)', gridX + 5, gridY + 18);
    doc.text('Taleefanka Waalidka', gridX + 80, gridY + 18);

    doc.setFontSize(9.5);
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.text(activeStudent.fullName.toUpperCase(), gridX + 5, gridY + 11);
    doc.text(activeStudent.class.toUpperCase(), gridX + 80, gridY + 11);
    doc.text(activeStudent.gender.toUpperCase(), gridX + 5, gridY + 23);
    doc.text(activeStudent.guardianPhone || 'N/A', gridX + 80, gridY + 23);

    // 5. Attendance & Finance Performance Section (Y = 75 to 102)
    const sectionY = 75;

    // Left Box: Attendance Summary (X = 15 to 102)
    doc.setFillColor(249, 250, 251);
    doc.rect(15, sectionY, 87, 26, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.rect(15, sectionY, 87, 26, 'S');

    doc.setFontSize(9);
    doc.setTextColor(124, 58, 237);
    doc.setFont('Helvetica', 'bold');
    doc.text('Xaadirinta (Attendance)', 20, sectionY + 5);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Xaadir (Present): ${stdPresentCount}`, 20, sectionY + 11);
    doc.text(`Maqan (Absent): ${stdAbsentCount}`, 20, sectionY + 16);
    doc.text(`Celcelis Rate: ${stdAttendanceRate}%`, 20, sectionY + 21);

    // Right Box: Finance Summary (X = 108 to 195)
    doc.setFillColor(249, 250, 251);
    doc.rect(108, sectionY, 87, 26, 'F');
    doc.setDrawColor(243, 244, 246);
    doc.rect(108, sectionY, 87, 26, 'S');

    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.setFont('Helvetica', 'bold');
    doc.text('Maaliyadda (Fee Status)', 113, sectionY + 5);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Lagu Leeyahay: $${stdTotalInvoiced}`, 113, sectionY + 11);
    doc.text(`La Bixiyey: $${stdTotalPaid}`, 113, sectionY + 16);
    doc.text(`Hoor (Balance): $${stdBalance}`, 113, sectionY + 21);

    // 6. Academics Table (using autoTable)
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Natiijada Imtixaanada (Academic Exam Scores)', 15, 111);

    const tableBody = activeStudentExams.map(score => {
      const percentage = Math.round((score.marksObtained / score.maxMarks) * 100);
      return [
        score.subjectName,
        score.examName,
        score.term,
        score.marksObtained.toString(),
        score.maxMarks.toString(),
        `${percentage}%`,
        score.grade
      ];
    });

    autoTable(doc, {
      startY: 115,
      head: [['Maaddada (Subject)', 'Imtixaan', 'Term', 'La Helay', 'Sare', 'Boqolley (%)', 'Grade']],
      body: tableBody.length > 0 ? tableBody : [['Weli wax natiijo ah lama helin', '-', '-', '-', '-', '-', '-']],
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2.5, font: 'Helvetica' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // 7. Overall Average and Feedback
    const finalY = (doc as any).lastAutoTable.finalY || 160;

    if (activeStudentExams.length > 0) {
      doc.setFillColor(243, 244, 246);
      doc.rect(15, finalY + 6, 180, 18, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(15, finalY + 6, 180, 18, 'S');

      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('Helvetica', 'normal');
      doc.text('CELCELISKA GUUD (OVERALL AVERAGE)', 20, finalY + 12);
      
      doc.setFontSize(13);
      doc.setTextColor(124, 58, 237);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${stdAvgPercentage}%`, 20, finalY + 20);

      const feedback = getAcademicFeedback(stdAvgPercentage);
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.setFont('Helvetica', 'bold');
      doc.text(feedback.text, 80, finalY + 16);
    }

    // 8. Signature Area (Y = 250 approx)
    const sigY = 250;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);

    // Left signature line
    doc.line(15, sigY, 90, sigY);
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.text('Saxiixa Macallinka (Class Teacher)', 52, sigY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.text('Dugsiga Portal Office', 52, sigY + 9, { align: 'center' });

    // Right signature line
    doc.line(120, sigY, 195, sigY);
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.setFont('Helvetica', 'bold');
    doc.text('Saxiixa Maamulaha (Headmaster)', 157, sigY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.setFont('Helvetica', 'normal');
    doc.text('Shaabadda Iskuulka', 157, sigY + 9, { align: 'center' });

    // Footer copyright or watermark
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Dugsiga Portal - System Generated Official Academic Record', 105, 282, { align: 'center' });

    doc.save(`Warbixinta_Ardayga_${activeStudent.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  // Filter students for search dropdown
  const searchedStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.class.toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div id="reports-view-root" className="space-y-6">
      {/* Printable Area CSS Wrapper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible;
          }
          #printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif italic tracking-tight text-[#f5f5f5] flex items-center gap-3">
            Warbixinnada <span className="text-[#c4b5fd] font-sans font-normal text-sm bg-[#7c3aed20] px-3 py-1 rounded-full border border-[#7c3aed30]">Reports Portal</span>
          </h1>
          <p className="text-[11px] uppercase tracking-widest text-[#737373] mt-1">Soo saar warbixinnada gaarka ah ee fasallada iyo warqadaha imtixaanka ardayda</p>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-[#121212]/80 backdrop-blur-md border border-[#ffffff10] p-1 rounded-xl w-fit">
          <button 
            onClick={() => setSubTab('class')}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              subTab === 'class' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-[#e5e5e5]'
            }`}
          >
            Fasallada (Class Report)
          </button>
          <button 
            onClick={() => setSubTab('student')}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
              subTab === 'student' ? 'bg-[#7c3aed] text-white' : 'text-[#737373] hover:text-[#e5e5e5]'
            }`}
          >
            Ardayda (Student Report Card)
          </button>
        </div>
      </div>

      {/* ==================== CLASS REPORTS TAB ==================== */}
      {subTab === 'class' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 no-print"
        >
          {/* Class Select Bar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161616]/60 to-[#0e0e0e]/80 border border-[#ffffff08] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-serif italic text-white">Dooro Fasalka aad rabto warbixintiisa</h2>
              <p className="text-[10px] uppercase tracking-wider text-[#737373]">Xogta hoose waxay si toos ah u xisaabinaysaa celcelisyada fasalkan</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-3.5 rounded-xl border border-[#ffffff10] bg-[#0a0a0a] text-xs font-bold uppercase tracking-wider text-[#e5e5e5] focus:outline-none focus:border-[#7c3aed] min-w-[200px]"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.className}>{c.className}</option>
                ))}
              </select>
              <button
                onClick={exportClassReportToPDF}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-xs uppercase tracking-widest font-bold shadow-lg transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-[#7c3aed10] text-[#c4b5fd] border border-[#7c3aed20]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Ardayda Fasalka</p>
                <p className="text-2xl font-bold font-mono text-white">{classStudents.length} <span className="text-xs text-[#525252]">Active</span></p>
              </div>
            </div>

            <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-[#10b98110] text-[#34d399] border border-[#10b98120]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Xaadirinta (Attendance)</p>
                <p className="text-2xl font-bold font-mono text-white">{classAttendanceRate}%</p>
              </div>
            </div>

            <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-[#3b82f610] text-[#60a5fa] border border-[#3b82f620]">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Lacag Bixinta (Tuition)</p>
                <p className="text-2xl font-bold font-mono text-white">{classFinanceRate}%</p>
              </div>
            </div>

            <div className="bg-[#121212]/40 backdrop-blur-md border border-[#ffffff10] p-5 rounded-2xl flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider">Celcelis Imtixaan (Exam Avg)</p>
                <p className="text-2xl font-bold font-mono text-white">{classExamAvg}%</p>
              </div>
            </div>
          </div>

          {/* Detailed Demographic and Class List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Class statistics summary card */}
            <div className="bg-gradient-to-br from-[#161616]/60 to-[#0e0e0e]/80 border border-[#ffffff08] p-6 rounded-2xl shadow-xl space-y-6">
              <h3 className="text-xl font-serif italic text-white border-b border-[#ffffff05] pb-3">Warbixinta Guud</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Fasalka:</span>
                  <span className="font-bold text-white uppercase font-mono bg-[#ffffff05] px-3 py-1 rounded border border-[#ffffff08]">{selectedClass}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Macallinka Mas'uulka:</span>
                  <span className="font-semibold text-[#e5e5e5]">{classes.find(c => c.className === selectedClass)?.teacherName || 'Lama qoondeyn'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Qolka (Room):</span>
                  <span className="font-mono text-[#e5e5e5]">{classes.find(c => c.className === selectedClass)?.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Wiilal (Boys):</span>
                  <span className="font-semibold text-[#c4b5fd] font-mono">{classMaleCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#737373]">Gabdho (Girls):</span>
                  <span className="font-semibold text-rose-400 font-mono">{classFemaleCount}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#ffffff05] pt-4">
                  <span className="text-[#737373]">Biilasha la soo ururiyey:</span>
                  <span className="font-mono font-bold text-emerald-400">${classTotalPaid} / ${classTotalInvoiced}</span>
                </div>
              </div>
            </div>

            {/* Right side: Student Roster table inside this Class */}
            <div className="lg:col-span-2 bg-gradient-to-b from-[#161616]/60 to-[#0e0e0e]/80 border border-[#ffffff08] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
              <div className="p-6 border-b border-[#ffffff05] flex items-center justify-between">
                <h3 className="text-xl font-serif italic text-white">Liiska Ardayda Fasalka</h3>
                <span className="text-[10px] font-mono uppercase bg-[#7c3aed20] border border-[#7c3aed30] text-[#c4b5fd] px-3 py-1 rounded-full">{classStudents.length} Arday</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#ffffff05] bg-[#000000]/10 text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                      <th className="px-6 py-3">Magaca (Name)</th>
                      <th className="px-4 py-3">Lab/Dhedig (Gender)</th>
                      <th className="px-4 py-3">Teleefanka Waalidka (Phone)</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ffffff03] text-xs">
                    {classStudents.length > 0 ? (
                      classStudents.map(student => (
                        <tr key={student.id} className="hover:bg-[#ffffff01] transition-colors text-[#a3a3a3]">
                          <td className="px-6 py-3.5 text-white font-semibold uppercase tracking-wider text-[11px]">{student.fullName}</td>
                          <td className="px-4 py-3.5 uppercase text-[10px]">{student.gender}</td>
                          <td className="px-4 py-3.5 font-mono">{student.guardianPhone || 'N/A'}</td>
                          <td className="px-6 py-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${
                              student.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#ffffff05] text-[#737373]'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#525252]">Fasalkaan hadda arday kuma diiwaangashana.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================== STUDENT REPORT CARD TAB ==================== */}
      {subTab === 'student' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Student Select and Search Control */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161616]/60 to-[#0e0e0e]/80 border border-[#ffffff08] shadow-xl no-print space-y-4">
            <h2 className="text-lg font-serif italic text-white">Dooro Ardayga si aad u soo saarto Warbixintiisa (Report Card)</h2>
            
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#525252]" />
              <input 
                type="text"
                placeholder="Ku raadi magaca ama fasalka ardayga..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 rounded-xl border border-[#ffffff10] bg-[#0a0a0a] text-xs uppercase tracking-widest text-[#e5e5e5] placeholder-[#525252] focus:outline-none focus:border-[#7c3aed]/50 transition-colors"
              />
            </div>

            {/* Quick search matches */}
            {studentSearch.trim() && (
              <div className="bg-[#101010] border border-[#ffffff10] rounded-xl overflow-hidden divide-y divide-[#ffffff05] text-xs max-h-56 overflow-y-auto shadow-2xl">
                {searchedStudents.length > 0 ? (
                  searchedStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setStudentSearch('');
                      }}
                      className="w-full text-left px-5 py-3 hover:bg-[#7c3aed10] transition-colors flex items-center justify-between text-white font-medium"
                    >
                      <span className="uppercase tracking-wider">{student.fullName}</span>
                      <span className="font-mono text-[10px] text-[#737373] uppercase">Fasalka: {student.class}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-5 py-3 text-center text-[#525252]">Wax arday ah oo magacaas leh lama helin.</div>
                )}
              </div>
            )}

            {/* Selection Status */}
            {selectedStudentId ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#7c3aed0a] border border-[#7c3aed20]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#7c3aed15] text-[#c4b5fd]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      {students.find(s => s.id === selectedStudentId)?.fullName}
                    </p>
                    <p className="text-[10px] font-mono text-[#737373] uppercase">
                      Class: {students.find(s => s.id === selectedStudentId)?.class} | ID: {selectedStudentId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase tracking-widest font-bold shadow-lg transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>La soo deg (Download PDF)</span>
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-white text-[10px] uppercase tracking-widest font-bold shadow-lg transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Daabac (Print Card)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-[#ffffff05] bg-[#ffffff02] text-[#737373] text-xs text-center font-serif italic">
                Fadlan dooro arday sare ka raadi si aad u bilowdo diyaarinta warqadda natiijada.
              </div>
            )}
          </div>

          {/* ==================== PRINTABLE REPORT CARD TEMPLATE ==================== */}
          {selectedStudentId && activeStudent && (
            <div 
              id="printable-report-card" 
              className="bg-gradient-to-b from-[#161616]/80 to-[#0d0d0d]/90 border border-[#ffffff08] rounded-3xl p-8 shadow-2xl space-y-8 max-w-4xl mx-auto"
            >
              {/* Report Header */}
              <div className="border-b border-[#ffffff10] pb-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="w-14 h-14 bg-gradient-to-tr from-[#7c3aed] to-[#6d28d9] rounded-2xl flex items-center justify-center text-white font-bold font-mono text-xl shadow-lg">
                    DP
                  </div>
                  <div>
                    <h1 className="text-3xl font-serif italic font-bold text-white tracking-tight">Dugsiga Portal</h1>
                    <p className="text-[10px] uppercase tracking-widest text-[#737373] font-mono mt-0.5">Xafiiska Imtixaanaadka & Maamulka</p>
                  </div>
                </div>

                <div className="text-center md:text-right font-mono text-[10px] text-[#737373] space-y-1">
                  <p className="text-xs uppercase font-bold text-[#c4b5fd] tracking-widest">Warqadda Natiijada (Report Card)</p>
                  <p>Taariikhda: {new Date().toISOString().split('T')[0]}</p>
                  <p>ID: {activeStudent.id}</p>
                </div>
              </div>

              {/* Student Demographics Info Grid */}
              <div className="flex flex-col md:flex-row gap-6 bg-[#ffffff02] border border-[#ffffff05] p-5 rounded-2xl items-center">
                {/* Photo Section */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#ffffff05] border border-[#ffffff10] flex items-center justify-center shrink-0">
                  {activeStudent.photo ? (
                    <img src={activeStudent.photo} alt={activeStudent.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#7c3aed]/10 text-[#c4b5fd] flex flex-col items-center justify-center text-center p-1">
                      <Users className="w-5 h-5 mb-0.5 text-[#c4b5fd]/80" />
                      <span className="text-[8px] uppercase tracking-wider font-bold">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Info Fields */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full text-left">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#525252] font-semibold">Magaca (Student Name)</p>
                    <p className="text-xs font-bold text-white uppercase mt-1 tracking-wider">{activeStudent.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#525252] font-semibold">Fasalka (Class)</p>
                    <p className="text-xs font-bold text-white uppercase mt-1 font-mono">{activeStudent.class}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#525252] font-semibold">Lab/Dhedig (Gender)</p>
                    <p className="text-xs font-bold text-white uppercase mt-1">{activeStudent.gender}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[#525252] font-semibold">Taleefanka Waalidka</p>
                    <p className="text-xs font-bold text-white font-mono mt-1">{activeStudent.guardianPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Attendance & Finance Performance Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Mini-Report */}
                <div className="bg-[#121212]/40 border border-[#ffffff05] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#7c3aed] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Xaadirinta (Attendance)</span>
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">Xaadir (Present)</p>
                      <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{stdPresentCount}</p>
                    </div>
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">Maqan (Absent)</p>
                      <p className="text-lg font-bold font-mono text-rose-400 mt-1">{stdAbsentCount}</p>
                    </div>
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">Celcelis Rate</p>
                      <p className="text-lg font-bold font-mono text-white mt-1">{stdAttendanceRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Finance Mini-Report */}
                <div className="bg-[#121212]/40 border border-[#ffffff05] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#10b981] flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Maaliyadda (Fee Status)</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">Lagu Leeyahay</p>
                      <p className="text-lg font-bold font-mono text-white mt-1">${stdTotalInvoiced}</p>
                    </div>
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">La Bixiyey</p>
                      <p className="text-lg font-bold font-mono text-emerald-400 mt-1">${stdTotalPaid}</p>
                    </div>
                    <div className="bg-[#ffffff02] p-3 rounded-xl border border-[#ffffff05]">
                      <p className="text-[9px] uppercase text-[#737373]">Hoor (Balance)</p>
                      <p className="text-lg font-bold font-mono text-amber-500 mt-1">${stdBalance}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Academics performance report */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Natiijada Academiga (Academic Exam Scores)</span>
                </h3>

                <div className="border border-[#ffffff05] rounded-2xl overflow-hidden bg-[#ffffff01]">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-[#ffffff05] bg-[#000000]/20 text-[9px] uppercase font-bold tracking-widest text-[#737373]">
                        <th className="px-6 py-3.5 text-left">Maaddada (Subject)</th>
                        <th className="px-4 py-3.5">Imtixaan (Exam)</th>
                        <th className="px-4 py-3.5">Term</th>
                        <th className="px-4 py-3.5">Dhibcaha la Helay</th>
                        <th className="px-4 py-3.5">Dhibcaha Sare</th>
                        <th className="px-4 py-3.5">Boqolley (%)</th>
                        <th className="px-6 py-3.5 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffffff03] text-xs">
                      {activeStudentExams.length > 0 ? (
                        activeStudentExams.map(score => {
                          const percentage = Math.round((score.marksObtained / score.maxMarks) * 100);
                          let gradeColor = 'text-rose-400';
                          if (score.grade === 'A') gradeColor = 'text-emerald-400 font-bold';
                          else if (score.grade === 'B') gradeColor = 'text-teal-400 font-bold';
                          else if (score.grade === 'C') gradeColor = 'text-sky-400 font-bold';
                          else if (score.grade === 'D') gradeColor = 'text-amber-400';

                          return (
                            <tr key={score.id} className="text-[#a3a3a3] font-medium">
                              <td className="px-6 py-3.5 text-left text-white font-serif italic text-sm">{score.subjectName}</td>
                              <td className="px-4 py-3.5 text-[11px]">{score.examName}</td>
                              <td className="px-4 py-3.5 font-mono text-[10px]">{score.term}</td>
                              <td className="px-4 py-3.5 font-mono text-white font-semibold">{score.marksObtained}</td>
                              <td className="px-4 py-3.5 font-mono">{score.maxMarks}</td>
                              <td className="px-4 py-3.5 font-mono">{percentage}%</td>
                              <td className={`px-6 py-3.5 text-right font-mono text-[11px] ${gradeColor}`}>{score.grade}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#525252]">Wax natiijo imtixaan ah weli looma diiwaangelin ardaygaan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GPA / Combined Academic feedback footer */}
              {activeStudentExams.length > 0 && (
                <div className="p-6 bg-gradient-to-r from-[#7c3aed0a] to-[#6d28d905] border border-[#7c3aed15] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <p className="text-[9px] uppercase tracking-wider text-[#737373] font-semibold">Celceliska Guud ee Imtixaanka (Overall Average)</p>
                    <p className={`text-base font-bold tracking-wide ${getAcademicFeedback(stdAvgPercentage).color}`}>
                      {getAcademicFeedback(stdAvgPercentage).text}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center font-mono">
                      <p className="text-[9px] uppercase text-[#737373]">Boqolley Guud</p>
                      <p className="text-3xl font-black text-white mt-1">{stdAvgPercentage}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Printing Signatures area (for authentic school reports) */}
              <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                <div className="border-t border-[#ffffff10] pt-3 space-y-1">
                  <p className="font-semibold text-white">Saxiixa Macallinka (Class Teacher)</p>
                  <p className="text-[10px] text-[#737373]">Dugsiga Portal Office</p>
                </div>
                <div className="border-t border-[#ffffff10] pt-3 space-y-1">
                  <p className="font-semibold text-white">Saxiixa Maamulaha (Headmaster)</p>
                  <p className="text-[10px] text-[#737373]">Shaabadda Iskuulka</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
