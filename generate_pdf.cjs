const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");

function generateDocumentationPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [124, 58, 237]; // Violet 600
  const darkGray = [51, 65, 85];
  const lightGray = [241, 245, 249];

  // Helper for adding headers
  function addHeader(title, subtitle) {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 30, "F");

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 29, 210, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 14, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(subtitle, 14, 21);

    doc.setFontSize(8);
    doc.setTextColor(167, 139, 250);
    doc.text("DUGSI PRO 2026 | SAAS SYSTEM", 145, 13);
    doc.setTextColor(203, 213, 225);
    doc.text("Tar: 2026-09-17", 145, 21);
  }

  function addFooter(pageNo, totalPages) {
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 282, 196, 282);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("DUGSI PRO 2026 - Nidaamka Casriga ah ee Maamulka Dugsiyada (Full System Documentation)", 14, 287);
    doc.text(`Bogga ${pageNo} ee ${totalPages}`, 176, 287);
  }

  // --- PAGE 1: COVER & OVERVIEW ---
  addHeader("DUGSI PRO 2026 - DOKUMENTATION-KA GUUD", "Full Technical & Functional Specification Document");

  let y = 38;

  // Overview box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(14, y, 182, 34, 2, 2, "F");

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. Dulmarka Guud ee Nidaamka (System Overview)", 18, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const overviewText = 
    "DUGSI PRO 2026 waa nidaam dhammeystiran oo casri ah oo loogu talagalay maamulka dugsiyada, machadyada, " +
    "iyo xarumaha waxbarashada (All-in-One Cloud School ERP). Nidaamku wuxuu si hufan u xalliyaa maamulka ardayda, " +
    "xaadirinta labada xilli, biilasha & rasiidhada, fasallada, maaddooyinka, imtixaanaadka, iyo warbixinada PDF & WhatsApp.";
  const splitOverview = doc.splitTextToSize(overviewText, 174);
  doc.text(splitOverview, 18, y + 15);

  y += 40;

  // Tech Stack Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("Qaab-dhismeedka Tiknoolajiyadda (Tech Stack)", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Qaybta (Layer)", "Tiknoolajiyadda (Technology)", "Ujeeddada & Doorka (Role)"]],
    body: [
      ["Frontend UI", "React 19, TypeScript, Vite 6, Tailwind CSS v4", "Shaashadaha casriga ah, xawaare sare, mobile responsive"],
      ["Animations & Icons", "Motion (Framer Motion), Lucide React", "Dhaqdhaqaaqa quruxda badan iyo calaamadaha casriga ah"],
      ["Charts & Data", "Recharts Interactive Analytics", "Jaantusyada maaliyadda, xaadirinta, iyo natiijooyinka ardayda"],
      ["Backend Engine", "Node.js & Express 4 (TypeScript)", "RESTful API routes, xaqiijinta amniga iyo xogta dugsiga"],
      ["Cloud Database", "Supabase (PostgreSQL Cloud)", "Kaydka rasmiga ah ee daruuraha oo leh Multi-Tenant isolation"],
      ["Local Fallback DB", "Local JSON DB (database.json)", "Kayd offline degdeg ah haddii internetku go'o oo auto-sync leh"],
      ["PDF & Reports", "jsPDF, jsPDF-AutoTable, SheetJS (XLSX)", "Daabacaadda kaararka natiijada, rasiidhada, iyo Excel import/export"],
      ["AI & Caqli Gacood", "@google/genai (Google Gemini AI)", "Falanqaynta xogta dugsiga iyo caqliga macmalka ah"]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Multi-Tenancy Architecture Callout
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, y, 182, 30, 2, 2, "FD");

  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Amniga iyo Kala-soocnaanta Dugsiyada (Multi-Tenant Isolation)", 18, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const multiTenantText = 
    "Dugsiyadu waxay leeyihiin xog gebi ahaanba kala xiran oo madax-bannaan. Codsi kasta oo frontend-ka ka yimaada " +
    "wuxuu wataa cinwaanka email-ka dugsiga (X-School-Email). Server-ku wuxuu u beddelaa aqoonsi gaar ah (school_id), " +
    "taas oo xaqiijinaysa in dugsi kale uusan marnaba arki karin ama taaban karin ardayda, lacagaha, ama natiijooyinka dugsi kale.";
  doc.text(doc.splitTextToSize(multiTenantText, 174), 18, y + 14);

  // --- PAGE 2: CORE MODULES & FEATURES ---
  doc.addPage();
  addHeader("DUGSI PRO 2026 - MODULES-KA IYO AASTAAMAHA", "Qaybaha Shaqo ee Nidaamka iyo Astaamahooda (Core Features)");

  y = 38;

  const modulesData = [
    ["1. Dashboard", "Guddi kormeer oo muujinaya tirada guud ee ardayda, boqolleyda xaadirinta maanta, dakhliga bishan, iyo digniinaha lacagaha dhiman."],
    ["2. Maamulka Ardayda", "Diiwaangelinta ardayda, sawirka, taleefanka waalidka, fasalka, ka-hortagga duplicate-ka, iyo soo gelinta/dejinta Excel (.xlsx) & PDF."],
    ["3. Xaadirinta Maalinlaha", "Xaadirinta labada xilli (Nasashada ka hor & Nasashada ka dib), xaaladaha: Jooga, Maqan, Soo daahay, Fasax. Farriin WhatsApp degdeg ah."],
    ["4. Lacagaha & Biilasha", "Abuurista biilasha ardayda/fasalka (Bulk Invoicing), bixinta buuxda/qaybta ah, taariikhda bixinta, iyo Rasiidka Rasmiga ah ee PDF."],
    ["5. Fasallada & Qolalka", "Maamulka fasallada, macallinka masuulka ah, lambarka qolka, iyo xisaabinta tooska ah ee tirada ardayda fasal kasta ku jirta."],
    ["6. Maaddooyinka", "Diiwaangelinta maaddooyinka, koodhadhka maaddooyinka, macallimiinta dhiga, iyo fasallada loo xilsaaray."],
    ["7. Imtixaanaadka", "Gelinta natiijooyinka imtixaanaadka (Midterm, Final, Monthly Test), xisaabinta tooska ah ee darajooyinka A, B, C, D, iyo Fail."],
    ["8. Warbixinada & Kaarka", "Warbixinta waxqabadka fasalka (Class Performance) iyo Kaarka Natiijada Ardayga (Student Report Card) oo PDF ah oo waalidka loo diri karo."],
    ["9. Qaabeynta (Settings)", "Beddelka magaca dugsiga, lacagta (Currency), qiimaha caadiga ah ee fiiga, xadka buundooyinka, iyo Light/Dark Mode."],
    ["10. Backup & Reset", "Soo dejinta/gelinta xogta dugsiga oo JSON ah, xiriirka tooska ah ee Supabase, iyo tirtiridda xogta dugsiga oo kaliya haddii loo baahdo."]
  ];

  autoTable(doc, {
    startY: y,
    head: [["Module-ka", "Sharaxaadda Shaqada iyo Astaamaha (Description & Capabilities)"]],
    body: modulesData,
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: darkGray, cellPadding: 2.8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 40, fontStyle: "bold", textColor: accentColor } },
    margin: { left: 14, right: 14 }
  });

  // --- PAGE 3: DATABASE SCHEMA & REST API SPECIFICATION ---
  doc.addPage();
  addHeader("DUGSI PRO 2026 - KAYDKA XOGTA IYO REST API", "Supabase PostgreSQL Database Tables & Backend Endpoints");

  y = 38;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("Miisaska Kaydka Xogta ee Supabase (PostgreSQL Schema)", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Miiska (Table Name)", "Furaha Sare (PK)", "Columns-ka Muhiimka ah", "Sharaxaadda"]],
    body: [
      ["dugsiga_users", "email", "password, verified, created_at", "Akoonnada maamulayaasha dugsiyada"],
      ["dugsiga_students", "id", "school_id, full_name, class, gender, phone, photo", "Diiwaanka dhammaan ardayda dugsiga"],
      ["dugsiga_classes", "id", "school_id, class_name, teacher_name, room_number", "Liiska fasallada dugsiga"],
      ["dugsiga_subjects", "id", "school_id, subject_name, subject_code, class_name", "Maaddooyinka waxbarashada"],
      ["dugsiga_exam_scores", "id", "school_id, student_id, class_name, marks, grade", "Natiijooyinka imtixaanaadka ardayda"],
      ["dugsiga_attendance", "Composite", "status, timestamp, session_type", "Diiwaanka xaadirinta maalinlaha ah"],
      ["dugsiga_fees", "id", "school_id, student_id, month, amount, paid_amount, history", "Biilasha iyo xisaabaadka lacag-bixinta"],
      ["dugsiga_settings", "Composite", "value (JSONB)", "Qaabeynta dugsiga (Magaca, Lacagta, iwm)"]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: darkGray, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("Liiska REST API Endpoints-ka Server-ka", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Method", "Endpoint Path", "Headers / Query", "Ujeeddada (Function)"]],
    body: [
      ["POST", "/api/auth/signup", "Body: email, password", "Diiwaangelinta dugsi cusub"],
      ["POST", "/api/auth/login", "Body: email, password", "Galitaanka nidaamka"],
      ["GET / POST", "/api/students", "Header: X-School-Email", "Soo saarista & ku darista ardayda"],
      ["PUT / DELETE", "/api/students/:id", "Header: X-School-Email", "Wax ka beddelka & tirtiridda ardayga"],
      ["GET / POST", "/api/attendance", "Query: date, session_type", "Soo qaadista & kaydinta xaadirinta"],
      ["GET / POST", "/api/fees", "Header: X-School-Email", "Soo saarista & abuurista biilasha"],
      ["PUT / DELETE", "/api/fees/:id", "Header: X-School-Email", "Bixinta lacagta & soo saarista rasiidka"],
      ["GET / POST", "/api/classes", "Header: X-School-Email", "Maamulka fasallada dugsiga"],
      ["GET / POST", "/api/subjects", "Header: X-School-Email", "Maamulka maaddooyinka waxbarashada"],
      ["GET / POST", "/api/exams", "Header: X-School-Email", "Maamulka natiijooyinka imtixaanaadka"],
      ["GET / PUT", "/api/settings", "Header: X-School-Email", "Soo qaadista & keydinta qaabeynta dugsiga"],
      ["GET", "/api/db/status", "None", "Hubinta xiriirka Supabase Cloud Database"],
      ["POST", "/api/reset", "Header: X-School-Email", "Tirtiridda xogta dugsiga gelaya (Factory Reset)"]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: darkGray, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 24, fontStyle: "bold" }, 1: { cellWidth: 38 } },
    margin: { left: 14, right: 14 }
  });

  // --- PAGE 4: ENVIRONMENT VARIABLES, SECRETS & DEPLOYMENT ---
  doc.addPage();
  addHeader("DUGSI PRO 2026 - SIRTA, FURAYAASHA & DEPLOYMENT", "Environment Variables, Security Keys & Installation Guide");

  y = 38;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("Furayaasha Sirta ah & Environment Variables (.env)", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Variable Name", "Qiimaha / Tusaalaha (Value / Example)", "Ujeeddada iyo Amniga (Security Note)"]],
    body: [
      ["GEMINI_API_KEY", "AIzaSy... (Laga helo Google AI Studio)", "Furaha caqliga gacoodka Google Gemini (Server-side secret)"],
      ["APP_URL", "https://ais-dev-...run.app", "Cinwaanka rasmiga ah ee nidaamku ka shaqeynayo"],
      ["SUPABASE_URL", "https://mdvfcqujqjnvfpzowayo.supabase.co", "Cinwaanka mashruuca Cloud Database ee Supabase"],
      ["SUPABASE_ANON_KEY", "eyJhbGciOi... (Anon JWT Token)", "Furaha caadiga ah ee la wadaagi karo Supabase SDK"],
      ["SUPABASE_SECRET_KEY", "eyJhbGciOi... (Service Role Key)", "Furaha qarsoon ee maamulaha sarre ee Supabase (Super Admin)"],
      ["SUPABASE_PUBLISHABLE_KEY", "sb_publish_... / anon key", "Furaha publishable-ka ah ee ku habboon client SDKs"],
      ["SUPABASE_JWKS_URL", "Supabase Auth JWKS Endpoint", "URL-ka xaqiijinta tokens-ka JWT"],
      ["SMTP_HOST", "smtp.gmail.com", "Server-ka loo isticmaalo dirista email-lada"],
      ["SMTP_PORT", "587 (TLS) ama 465 (SSL)", "Port-ka ammaan ah ee SMTP email"],
      ["SMTP_USER", "your_email@gmail.com", "Cinwaanka email-ka diraha rasmiga ah"],
      ["SMTP_PASS", "your_google_app_password", "Furaha sirta ah ee Google App Password ee email-ka"],
      ["SMTP_FROM", "your_email@gmail.com", "Cinwaanka ka muuqanaya sanduuqa email-ka qaataha"]
    ],
    theme: "striped",
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: darkGray, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold", textColor: accentColor } },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Run & Build Instructions Box
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(14, y, 182, 48, 2, 2, "F");

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Tallaabooyinka Ku-rakibidda iyo Kicinta (Installation & Running)", 18, y + 7);

  doc.setFont("courier", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("# 1. Ku shub dhammaan xirmooyinka lagama maarmaanka ah", 18, y + 15);
  doc.text("npm install", 18, y + 20);
  doc.text("# 2. Kici server-ka horumarinta (Development Mode)", 18, y + 26);
  doc.text("npm run dev", 18, y + 31);
  doc.text("# 3. U diyaari una kici shaashadda rasmiga ah (Production Deployment)", 18, y + 37);
  doc.text("npm run build && npm start", 18, y + 42);

  // Add footers with page count to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "DUGSI_PRO_2026_DOCUMENTATION.pdf");
  const rootOutputPath = path.join(process.cwd(), "DUGSI_PRO_2026_DOCUMENTATION.pdf");

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outputPath, pdfBuffer);
  fs.writeFileSync(rootOutputPath, pdfBuffer);

  console.log("PDF generated successfully at:", outputPath);
  console.log("File size:", pdfBuffer.length, "bytes");
}

generateDocumentationPDF();
