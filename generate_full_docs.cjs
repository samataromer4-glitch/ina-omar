const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");

function createFullDocumentationPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 600
  const darkGray = [51, 65, 85]; // Slate 700
  const lightGray = [241, 245, 249]; // Slate 100
  const totalPages = 6;

  function addHeader(title, subtitle) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 28, "F");

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 27, 210, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(subtitle, 14, 20);

    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153);
    doc.text("DUGSI PRO 2026 | ENTERPRISE", 145, 12);
    doc.setTextColor(203, 213, 225);
    doc.text("Tar: Sebtembar 2026", 145, 20);
  }

  function addFooter(pageNo) {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("DUGSI PRO 2026 - Dukumentiyada Rasmiga ah ee Nidaamka (Full System Documentation)", 14, 287);
    doc.text(`Bogga ${pageNo} ee ${totalPages}`, 176, 287);
  }

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE OVERVIEW
  // ==========================================
  addHeader("DUGSI PRO 2026 - DUKUMENTIYADA GUUD EE NIDAAMKA", "Full Technical Architecture, Database & Module Specifications");

  let y = 36;

  // Overview Card
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(14, y, 182, 38, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 38, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Dulmar Guud ee Nidaamka (System Overview)", 20, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const overviewText = "DUGSI PRO 2026 waa nidaam dhammaystiran oo heer caalami ah oo loogu talagalay maamulka dugsiyada Islaamiga ah, macaahidda waxbarashada, iyo xarumaha xifdinta Qur'aanka Kariimka. Nidaamku wuxuu isku xiraa maamulka ardayda, macallimiinta, imtixaanaadka, jadwalka xiisadaha, maktabadda, hantida, iyo qayb weyn oo maaliyadeed (Invoicing, Payments, P&L, Budgets, Payroll).";
  const splitOverview = doc.splitTextToSize(overviewText, 170);
  doc.text(splitOverview, 20, y + 16);

  y += 46;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Qaab-dhismeedka Farsamada (Technology Stack & Infrastructure)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Lakabka (Layer)", "Tiknoolajiyadda (Technology)", "Faahfaahinta Shaqada"]],
    body: [
      ["Frontend UI", "React 18+, TypeScript, Vite 6", "Single Page Application (SPA) xawaare sare leh oo leh animations casri ah."],
      ["Styling & Icons", "Tailwind CSS v4, Lucide React", "Muuqaal qurux badan, nadiif ah, responsive ah oo mobile iyo desktop u diyaarsan."],
      ["Backend Server", "Node.js, Express.js (Port 3000)", "Server REST API leh oo maamula Auth, Multi-Tenancy, xisaabaadka, iyo Sync."],
      ["Primary Database", "Supabase (PostgreSQL Cloud)", "27 Tables leh xogta dugsiyada, ardayda, maaliyadda, iyo xiriirrada."],
      ["Resilient Fallback", "Local File Storage (database.json)", "Haddii internetku go'o ama Supabase la waayo, si toos ah offline ugu shaqeeya."],
      ["Export & Docs", "PDF Generator, Excel/CSV Export", "Rasiidhada rasmiga ah, qaansheekooyinka, payslips, iyo warbixinada P&L."],
      ["Communication", "Direct WhatsApp Integration", "Hal-gujin loogu dirayo waalidka rasiidhada, biilasha, iyo ogeysiisyada."]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 36, fontStyle: "bold" }, 1: { cellWidth: 52 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Tiirarka Waaweyn ee Nidaamka (Core Pillars)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Tiirka (Pillar)", "Qaybaha ku Jira (Key Modules)", "Faa'iidada Dugsiga"]],
    body: [
      ["1. Academic & Student Core", "Ardayda, Fasallada, Maadooyinka, Xaadirinta, Imtixaanaadka, Kaarka Natiijooyinka", "Maamul dhamaystiran oo arday kasta taariikhdiisa iyo natiijooyinkiisa lagu hayo."],
      ["2. HR & Personnel", "Macallimiinta, Shaqaalaha, Waalidiinta, Xaadirinta Shaqaalaha, Timetable", "Isku xirka shaqaalaha, dhismaha jadwalka shaqada iyo xiriirka waalidiinta."],
      ["3. Operations & Campus", "Qaabilaadda (Admissions), Maktabadda, Qalabka (Inventory), Ogeysiisyada", "Habaynta ardayda cusub, hantida ma-guurtada ah iyo buugaagta maktabadda."],
      ["4. Institutional Finance", "Fee Structures, Invoices, Payments, Expenses, Income, P&L, Budgets, Payroll", "Xisaabaad xaqiiqo ah oo ka hortagaya wax isdaba-marin iyo khaladaadka lacagta."]
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.2 },
    columnStyles: { 0: { cellWidth: 42, fontStyle: "bold", textColor: [16, 185, 129] } },
    margin: { left: 14, right: 14 }
  });

  addFooter(1);

  // ==========================================
  // PAGE 2: ACADEMIC & STUDENT CORE
  // ==========================================
  doc.addPage();
  addHeader("DUGSI PRO 2026 - WAXBARASHADA & ARDAYDA", "Academic Management, Attendance, Grading & Classroom Operations");

  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Qaybaha Waxbarashada & Ardayda (Academic Modules Breakdown)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Qaybta (Module)", "Awoodaha & Shaqooyinka Muhiimka ah", "Habka Xogta & Shaashadda"]],
    body: [
      [
        "Students Directory (Maamulka Ardayda)",
        "- Diiwaangelin arday cusub oo wata sawir, taariikhda dhalashada, fasalka, iyo telefoonka waalidka.\n- Shaandhayn (Filter) fasal kasta ama xaalad (Active/Inactive).\n- Soo saaridda liiska ardayda oo Excel/CSV ah.",
        "Shaashadda StudentsView & API: /api/students"
      ],
      [
        "360° Student Profile Modal",
        "- Hal meel oo ardayga laga arko dhammaan taariikhdiisa:\n  1. Xogta Guud & Xiriirka Waalidka\n  2. Boqolleyda Xaadirinta (Attendance %)\n  3. Dhibcaha & Darajooyinka Imtixaanaadka\n  4. Hadhaaga Fiiga & Qaansheekooyinka u dhiman.",
        "Pop-up Modal casri ah oo hal gujin ku furma"
      ],
      [
        "Attendance Tracking (Xaadirinta)",
        "- Xaadirinta maalinlaha ah ee fasal kasta (Present, Absent, Late, Excused).\n- Kala saarista fadhiga Subaxa iyo Galabta (Session Type).\n- Tirakoob toos ah (Stats) oo muujinaya inta joogta iyo inta maqan.",
        "Shaashadda AttendanceView & API: /api/attendance"
      ],
      [
        "Classes & Subjects (Fasallada & Maadooyinka)",
        "- Dhismaha fasallada (Grade 1 ilaa Grade 12), Sections (A, B, C), iyo kuraasta (Capacity).\n- Qorista maadooyinka (Qur'aan, Tawxiid, Carabi, Xisaab, Saynis) iyo macallimiinta dhiga.",
        "Shaashadaha ClassesView & SubjectsView"
      ],
      [
        "Exams & Report Cards (Imtixaanaadka)",
        "- Galinta natiijooyinka imtixaanaadka (Marks Obtained vs Max Marks).\n- Xisaabinta tooska ah ee darajada (Grade: A+, A, B, C, D, Fail).\n- Soo saarista Kaarka Natiijada Ardayga (Report Card) oo daabacan.",
        "Shaashadda ExamsView & API: /api/exam-scores"
      ]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.2, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 42, fontStyle: "bold" }, 2: { cellWidth: 40 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Jadwalka Xiisadaha & Qaabilaadda Cusub (Timetable & Admissions)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Qaybta", "Sharaxaadda Shaqada", "Xalka Farsamo"]],
    body: [
      [
        "Timetable Schedule",
        "Jadwal todobaadle ah (Sabti ilaa Jimce) oo fasal kasta u qeexaya saacadaha, maadooyinka, macallinka, iyo qolka. Waxay ka hortagtaa isku-dhaca macallimiinta ama qolalka.",
        "TimetableScheduleView & dugsiga_timetable"
      ],
      [
        "Admissions & Intake",
        "Maamulka codsiyada ardayda cusub ee doonaya inay is-diiwaangeliyaan. Maamulku wuxuu xaaladda ka dhigi karaa Pending, Approved, ama hal gujin ku rogi karaa arday rasmi ah (Enrolled).",
        "AdmissionsView & dugsiga_admissions"
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" } },
    margin: { left: 14, right: 14 }
  });

  addFooter(2);

  // ==========================================
  // PAGE 3: HR, OPERATIONS & CAMPUS
  // ==========================================
  doc.addPage();
  addHeader("DUGSI PRO 2026 - SHAQAALAHA & HANTIDA DUGSIGA", "Human Resources, Staff Attendance, Library, Inventory & Notices");

  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Maamulka Shaqaalaha & Waalidiinta (Personnel & HR)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Doorka / Qaybta", "Xogta La Maamulo", "Xiriirka Nidaamka"]],
    body: [
      [
        "Teachers (Macallimiinta)",
        "Magaca, takhasuska (Specialization), heerka waxbarasho, fasallada iyo maadooyinka loo xilsaaray, mushaharka heshiiska ah, iyo taariikhda la shaqaaleeyay.",
        "dugsiga_teachers & /api/teachers"
      ],
      [
        "Staff (Shaqaalaha Kale)",
        "Xoghaynta, xisaabiyeyaasha, ilaalada, nadaafadda, darawallada gaadiidka, waaxdooda (Department), iyo mushaharkooda bisha.",
        "dugsiga_staff & /api/staff"
      ],
      [
        "Guardians (Waalidiinta)",
        "Waalidka mas'uulka ka ah ardayda, telefoonka tooska ah, WhatsApp-ka, xiriirka qaraabada (Aabe, Hooyo, Abti), iyo ardayda u diiwaangashan.",
        "dugsiga_guardians & /api/guardians"
      ],
      [
        "Staff Attendance",
        "Xaadirinta maalinlaha ah ee macallimiinta iyo shaqaalaha (Present, Absent, Late, On Leave). Waxay saldhig u tahay xisaabinta mushaharka.",
        "StaffAttendanceView & dugsiga_staff_attendance"
      ]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Maktabadda, Hantida & Ogeysiisyada (Campus Assets & Circulation)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Qaybta", "Ujeeddada & Hab-socodka", "Natiijada Maamul"]],
    body: [
      [
        "Maktabadda (Library Circulation)",
        "Diiwaangelinta buugaagta (Kutubta, Tafsiirka, Axaadiista, Maaddooyinka sayniska), tirada taalla, bixinta amaahda ardayda ama macallimiinta, iyo la socodka taariikhda soo celinta.",
        "Ka hortagga lumitaanka buugaagta qaaliga ah ee dugsiga."
      ],
      [
        "Hantida & Qalabka (Inventory)",
        "Diiwaanka kuraasta, miisaska, kombiyuutarrada, qalabka cod-baahiyaha, qolalka ay yaallaan, xaaladdooda (Good, Fair, Needs Repair), iyo qiimaha iibsiga.",
        "Ilaalinta hantida dugsiga iyo xisaabinta qiimaha qalabka yaalla."
      ],
      [
        "Ogeysiisyada (Announcements)",
        "Boodhka ogeysiisyada dugsiga ee lagu daabaco farriimaha degdegga ah. Waxaa loo kala saari karaa: Dhammaan, Macallimiinta kaliya, ama Waalidiinta kaliya.",
        "Xog-gaarsiin degdeg ah oo xafiiska iyo qoysaska isku xirta."
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" } },
    margin: { left: 14, right: 14 }
  });

  addFooter(3);

  // ==========================================
  // PAGE 4: FINANCE & ACCOUNTING SUITE
  // ==========================================
  doc.addPage();
  addHeader("DUGSI PRO 2026 - MAALIYADDA & XISAABAADKA", "Institutional Invoicing, Payments, P&L, Budgets & Payroll Engine");

  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Qaab-dhismeedka Xisaabaadka ee DUGSI PRO 2026", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Qaybta Maaliyadda", "Awoodaha & Xisaabinta", "Amniga Xisaabeed"]],
    body: [
      [
        "Fee Structures (Khidmadaha)",
        "Dejinta qiimaha khidmadaha kala duwan: Lacagta bisha (Tuition), Diiwaangelinta, Gaadiidka, Imtixaanka, Buugaagta. Waxaa lagu xiri karaa fasallo gaar ah ama dugsiga oo dhan.",
        "Qasab maaha in hal qiimo ardayda oo dhami bixiyaan."
      ],
      [
        "Invoices (Qaansheekooyinka)",
        "Jaridda qaansheekooyinka hal arday ama fasal dhan hal mar (Bulk Invoicing). Waxaa ku dhex jira line-items, qiimo-dhimis (Discounts), hadhaaga kaga dhiman, iyo daabacaadda PDF/WhatsApp.",
        "Qaansheekadu waa biil sugaya lacag-bixin, kuma darsanto dakhliga ilaa la bixiyo."
      ],
      [
        "Payments & Receipts (Rasiidhada)",
        "Qabashada lacagaha dhabta ah (Cash, Bank Transfer, EVC Plus, Zaad, Sahal). Waxay si toos ah hoos ugu dhigtaa hadhaaga qaansheekada waxayna soo saartaa rasiidh rasmi ah.",
        "Lacagta qabashadeeda kaliya ayaa loo aqoonsadaa Dakhli soo galay (Realized Revenue)."
      ],
      [
        "Expenses (Kharashaadka)",
        "Diiwaanka kharash kasta oo baxay (Ijaar, Koronto, Biyo, Dayactir, Agab). Waxaa la socda habka ogolaanshaha (Approval Workflow) iyo magaca qofkii ogolaaday.",
        "Kharash aan la ogolaan lama dhexgeynayo xisaab-xirka P&L."
      ],
      [
        "Profit & Loss (P&L Statement)",
        "Warbixin maaliyadeed oo soo bandhigaysa: Dakhliga Guud - Kharashka Guud = Faa'iidada Saafiga ah (Net Profit). Waxay leedahay shaandhayn taariikheed iyo soo saarid Excel/PDF.",
        "Ka hortagga in dakhliga ama kharashka laba jeer lagu celiyo (Double Counting Protection)."
      ],
      [
        "Budgets (Miisaaniyadda)",
        "Qoondaynta miisaaniyadda sanadlaha ah ee waax kasta. Nidaamku wuxuu bixinayaa digniin guduudan (Over-budget warning) haddii kharashku dhaafo intii loo qoondeeyay.",
        "Variance analysis xisaabisa farqiga u dhexeeya Planned vs Actual."
      ],
      [
        "Payroll Engine (Mushahaarka)",
        "Xisaabinta mushaharka: Basic Salary + Allowances - Deductions = Net Pay. Marka mushaharka la bixiyo, wuxuu toos ugu qormaayaa Expenses si uusan kharashku u lumin.",
        "Daabacaadda xaashida mushaharka (Printable Payslip)."
      ]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.2, textColor: darkGray, cellPadding: 2.2 },
    columnStyles: { 0: { cellWidth: 42, fontStyle: "bold" }, 2: { cellWidth: 42 } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Ka-hortagga Khaladaadka Xisaabaadka (Double Counting Protection Rules)", 14, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const rules = [
    "1. Invoices vs Payments: Qaansheekooyinka la jaray looma xisaabiyo dakhli dhab ah ilaa inta rasiidh lacag-bixin ah laga diiwaangeliyo.",
    "2. Payroll vs Expenses: Mushaharka marka la bixiyo waxaa loo qoraa hal kharash oo kaliya (Category = Salaries), loomana laba-laabo xisaabinta.",
    "3. Cash Flow Balance: Opening Cash + Payments Received + Other Income - Total Expenses = Closing Cash Balance."
  ];
  rules.forEach(r => {
    doc.text(r, 14, y);
    y += 5;
  });

  addFooter(4);

  // ==========================================
  // PAGE 5: COMPLETE SUPABASE DATABASE SCHEMA
  // ==========================================
  doc.addPage();
  addHeader("DUGSI PRO 2026 - KAYDKA XOGTA (SUPABASE SCHEMA)", "Detailed Specifications of all 27 Database Tables in PostgreSQL");

  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Liiska Dhammaan 27-ka Miis ee Supabase (PostgreSQL Cloud Tables)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["#", "Magaca Miiska (Table)", "Furaha (PK)", "Qaybaha Muhiimka ah (Columns)", "Doorka uu Qabto"]],
    body: [
      ["1", "dugsiga_users", "id", "email, password, role, verified", "Akoonnada maamulka & shaqaalaha"],
      ["2", "dugsiga_students", "id", "school_id, full_name, class, gender, phone", "Diiwaanka ardayda dugsiga"],
      ["3", "dugsiga_classes", "id", "school_id, class_name, teacher_name, room", "Liiska fasallada dugsiga"],
      ["4", "dugsiga_subjects", "id", "school_id, subject_name, subject_code, class", "Maadooyinka manhajka"],
      ["5", "dugsiga_exam_scores", "id", "school_id, student_id, marks, grade, term", "Dhibcaha imtixaanaadka ardayda"],
      ["6", "dugsiga_attendance", "Composite", "school_id, date, student_id, status, session", "Xaadirinta maalinlaha ah"],
      ["7", "dugsiga_fees", "id", "school_id, student_id, month, amount, paid", "Diiwaankii hore ee fiiga"],
      ["8", "dugsiga_settings", "Composite", "school_id, key, value (JSONB)", "Habaynta guud & lacagta dugsiga"],
      ["9", "dugsiga_teachers", "id", "teacher_id, name, phone, salary, classes", "Diiwaanka macallimiinta"],
      ["10", "dugsiga_staff", "id", "employee_id, name, role, department, salary", "Diiwaanka shaqaalaha dugsiga"],
      ["11", "dugsiga_guardians", "id", "name, phone, whatsapp, student_ids", "Waalidiinta & xiriirkooda"],
      ["12", "dugsiga_staff_attendance", "id", "staff_id, staff_name, date, status", "Xaadirinta shaqaalaha"],
      ["13", "dugsiga_timetable", "id", "class_name, teacher, subject, day, time", "Jadwalka xiisadaha todobaadka"],
      ["14", "dugsiga_admissions", "id", "applicant_name, desired_class, status", "Codsiyada ardayda cusub"],
      ["15", "dugsiga_announcements", "id", "title, message, audience, priority", "Ogeysiisyada dugsiga"],
      ["16", "dugsiga_library_books", "id", "title, author, isbn, total_copies", "Kataloogga buugaagta"],
      ["17", "dugsiga_library_loans", "id", "book_id, borrower_name, issue, due", "Diiwaanka amaahashada buugaagta"],
      ["18", "dugsiga_inventory", "id", "item_name, category, quantity, condition", "Hantida & qalabka dugsiga"],
      ["19", "dugsiga_documents", "id", "title, category, file_url, upload_date", "Dukumentiyada & shahaadooyinka"],
      ["20", "dugsiga_notifications", "id", "title, message, channel, recipient", "Farriimaha & ogeysiisyada"],
      ["21", "dugsiga_fee_structures", "id", "name, category, amount, class_name", "Qaab-dhismeedka khidmadaha"],
      ["22", "dugsiga_invoices", "id", "invoice_number, student_id, total, balance", "Qaansheekooyinka ardayda"],
      ["23", "dugsiga_payments", "id", "receipt_number, invoice_id, amount, method", "Rasiidhada lacag-bixinta"],
      ["24", "dugsiga_expenses", "id", "category, description, amount, status", "Kharashaadka baxay"],
      ["25", "dugsiga_income", "id", "category, description, amount, payer", "Dakhliga kale ee dugsiga"],
      ["26", "dugsiga_budgets", "id", "category, planned_amount, actual_amount", "Miisaaniyadda waaxaha"],
      ["27", "dugsiga_payroll", "id", "employee_name, gross, net_salary, status", "Mushahaarka shaqaalaha"]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 6.5, textColor: darkGray, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 38, fontStyle: "bold" }, 2: { cellWidth: 20 } },
    margin: { left: 14, right: 14 }
  });

  addFooter(5);

  // ==========================================
  // PAGE 6: SECURITY, RBAC & MAINTENANCE
  // ==========================================
  doc.addPage();
  addHeader("DUGSI PRO 2026 - AMNIGA, DOORARKA & MAAMULKA", "User Access Control, Password Encryption, Backup & Maintenance");

  y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Heerarka Xuquuqda Isticmaalaha (Role-Based Access Control - RBAC)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Doorka (Role)", "Awoodaha & Xeerarka Gelitaanka (Permissions)", "Xayiraadaha (Restrictions)"]],
    body: [
      [
        "Super Admin / Admin",
        "Awood buuxda oo 100% ah dhammaan 29-ka qaybood: Ardayda, Macallimiinta, Xisaabaadka, Settings-ka, iyo Beddelka xogta.",
        "Ma laha wax xaddidaad ah."
      ],
      [
        "Accountant (Xisaabiye)",
        "Gelitaanka buuxa ee Maaliyadda: Invoices, Payments, Expenses, Income, Budgets, Payroll, iyo P&L Reports.",
        "Ma beddeli karo darajooyinka imtixaanaadka ardayda ama manhajka."
      ],
      [
        "Teacher (Macallin)",
        "Gelitaanka fasallada iyo maadooyinka loo xilsaaray, xaadirinta ardayda fasalkiisa, iyo galinta dhibcaha imtixaanka.",
        "Ma arki karo xisaabaadka dugsiga, mushaharka dadka kale, ama settings-ka."
      ],
      [
        "Staff / Receptionist",
        "Qaabilaadda ardayda cusub (Admissions), xaadirinta shaqada, aragtida ogeysiisyada, iyo la socodka hantida.",
        "Ma tirtiri karo xogta mana arki karo faa'iidada maaliyadda."
      ]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Amniga Xogta & Tilmaamaha Kormeeka (Security & Maintenance)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Qodobka Amniga", "Habka uu Nidaamku u Fuliyo", "Talooyinka Maamulka Dugsiga"]],
    body: [
      [
        "Password Encryption",
        "Furayaasha sirta ah waxaa lagu qariyaa crypto.scryptSync iyadoo lagu darayo cryptographic salt.",
        "U yeel isticmaalayaasha furayaal adag oo ka kooban xarfo iyo lambarro."
      ],
      [
        "Database RLS Setting",
        "Miisaska Supabase waxay ku jiraan UNRESTRICTED (Disable RLS) maadaama Node Server-ku maamulo amniga.",
        "Ha Enable-gareynin RLS adigoo aan qorin SQL Policies, si aysan khaladaad u dhicin."
      ],
      [
        "Multi-Tenancy (school_id)",
        "Xog kasta waxay ku xiran tahay school_id gaar ah oo dugsiga u gaar ah.",
        "Dugsiyo kala duwan ma arki karaan xogta midba midka kale."
      ],
      [
        "Resilient Data Backup",
        "Xogtu waxay ku xiran tahay Supabase Cloud, iyadoo sidoo kale database.json maxalli ah u kaydsan tahay.",
        "Marmar ka qaado nuqul keyd ah (Download JSON Backup) shaashadda Settings."
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 38, fontStyle: "bold" } },
    margin: { left: 14, right: 14 }
  });

  addFooter(6);

  // Save to disk
  const pdfBytes = doc.output("arraybuffer");
  const buffer = Buffer.from(pdfBytes);

  const rootPdfPath = path.join(process.cwd(), "DUGSI_PRO_2026_FULL_DOCUMENTATION.pdf");
  const publicPdfPath = path.join(process.cwd(), "public", "DUGSI_PRO_2026_FULL_DOCUMENTATION.pdf");

  fs.writeFileSync(rootPdfPath, buffer);
  fs.writeFileSync(publicPdfPath, buffer);

  console.log("Successfully generated PDF documentation at:", rootPdfPath, "and", publicPdfPath);
  return true;
}

createFullDocumentationPDF();
