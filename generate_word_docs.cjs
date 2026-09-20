const fs = require("fs");
const path = require("path");

function generateWordDocumentation() {
  const content = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>DUGSI PRO 2026 - Full System Documentation</title>
<style>
  body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    margin: 40px;
  }
  h1 {
    color: #0f172a;
    font-size: 26pt;
    border-bottom: 3px solid #10b981;
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
  .subtitle {
    color: #64748b;
    font-size: 13pt;
    margin-bottom: 30px;
  }
  h2 {
    color: #0f172a;
    font-size: 17pt;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 5px;
    margin-top: 30px;
  }
  h3 {
    color: #10b981;
    font-size: 13pt;
    margin-top: 20px;
  }
  p {
    font-size: 11pt;
    margin-bottom: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    margin-bottom: 25px;
    font-size: 10pt;
  }
  th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: bold;
    text-align: left;
    padding: 10px;
    border: 1px solid #0f172a;
  }
  td {
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .highlight-box {
    background-color: #f1f5f9;
    border-left: 5px solid #10b981;
    padding: 15px;
    border-radius: 4px;
    margin: 20px 0;
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 8.5pt;
    font-weight: bold;
    border-radius: 3px;
    background-color: #d1fae5;
    color: #065f46;
  }
  .footer {
    margin-top: 50px;
    font-size: 9pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 15px;
  }
</style>
</head>
<body>

<h1>DUGSI PRO 2026 – DUKUMENTIYADA GUUD EE NIDAAMKA</h1>
<div class="subtitle">Enterprise Islamic School Management & Financial Accounting Platform</div>

<div class="highlight-box">
  <strong>Nuqulka:</strong> DUGSI PRO 2026 Enterprise Edition<br>
  <strong>Taariikhda:</strong> Sebtembar 2026<br>
  <strong>Xaaladda Nidaamka:</strong> 100% Production Ready (29 Modules & 27 Database Tables)<br>
  <strong>Database:</strong> Supabase PostgreSQL (Cloud) oo wata Resilient Local JSON Storage Engine
</div>

<h2>1. Dulmar Guud & Qaab-dhismeedka (Architecture)</h2>
<p>
  <strong>DUGSI PRO 2026</strong> waa madal dhammaystiran oo loogu talagalay maamulka casriga ah ee dugsiyada Islaamiga ah, macaahidda waxbarashada, iyo xarumaha xifdinta Qur'aanka Kariimka. Nidaamku wuxuu si hufan isugu dubbaridaa maamulka ardayda, diiwaangelinta shaqaalaha iyo macallimiinta, imtixaanaadka, jadwalka xiisadaha, maktabadda, hantida, iyo qayb aad u ballaaran oo maaliyadeed iyo xisaabaad ah.
</p>

<table>
  <thead>
    <tr>
      <th>Lakabka (Layer)</th>
      <th>Tiknoolajiyadda (Technology)</th>
      <th>Sharaxaadda Shaqada</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend UI</strong></td>
      <td>React 18+, TypeScript, Vite 6</td>
      <td>Single Page Application (SPA) xawaare sare leh, UI casri ah oo mobile & desktop ku habboon.</td>
    </tr>
    <tr>
      <td><strong>Styling & Design</strong></td>
      <td>Tailwind CSS v4, Lucide React Icons</td>
      <td>Muuqaal qurux badan, iftiin leh, typography cad iyo animations indhaha u roon.</td>
    </tr>
    <tr>
      <td><strong>Backend Server</strong></td>
      <td>Node.js & Express.js (Port 3000)</td>
      <td>Server REST API oo maamula Auth, Multi-Tenancy, xisaabaadka, iyo sync-ga xogta.</td>
    </tr>
    <tr>
      <td><strong>Primary Database</strong></td>
      <td>Supabase (PostgreSQL Cloud)</td>
      <td>27 Miis (Tables) oo leh diiwaanka dugsiga, xisaabaadka, iyo xiriirrada.</td>
    </tr>
    <tr>
      <td><strong>Resilient Backup</strong></td>
      <td>Local File Storage (database.json)</td>
      <td>Keyd degdeg ah oo shaqeeya haddii internet-ku go'o ama server-ku offline noqdo.</td>
    </tr>
    <tr>
      <td><strong>Export & Print</strong></td>
      <td>PDF Engine, Excel/CSV Exporter</td>
      <td>Soo saaridda rasiidhada lacagta, qaansheekooyinka, payslips-ka, iyo warbixinada P&L.</td>
    </tr>
  </tbody>
</table>

<h2>2. Liiska Dhammaan 27-ka Miis ee Supabase Database</h2>
<p>Kani waa liiska miisaska rasmiga ah ee ku jira Supabase Database-kaaga:</p>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Magaca Miiska (Table Name)</th>
      <th>Furaha (Primary Key)</th>
      <th>Ujeeddada & Xogta uu Qabto</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>1</td><td><strong>dugsiga_users</strong></td><td>id (Auto)</td><td>Akoonnada maamulayaasha, xisaabiyeyaasha, iyo macallimiinta.</td></tr>
    <tr><td>2</td><td><strong>dugsiga_students</strong></td><td>id (Text)</td><td>Diiwaanka ardayda, fasalka, sawirka, iyo telefoonka waalidka.</td></tr>
    <tr><td>3</td><td><strong>dugsiga_classes</strong></td><td>id (Text)</td><td>Fasallada dugsiga (Grade 1-12, Section A/B, Qolalka).</td></tr>
    <tr><td>4</td><td><strong>dugsiga_subjects</strong></td><td>id (Text)</td><td>Maadooyinka manhajka (Qur'aan, Carabi, Xisaab, Saynis).</td></tr>
    <tr><td>5</td><td><strong>dugsiga_exam_scores</strong></td><td>id (Text)</td><td>Dhibcaha imtixaanaadka ardayda iyo darajooyinka (A, B, C, D).</td></tr>
    <tr><td>6</td><td><strong>dugsiga_attendance</strong></td><td>Composite</td><td>Xaadirinta maalinlaha ah ee ardayda fasal kasta.</td></tr>
    <tr><td>7</td><td><strong>dugsiga_fees</strong></td><td>id (Text)</td><td>Diiwaankii hore ee fiiga ardayda bishii.</td></tr>
    <tr><td>8</td><td><strong>dugsiga_settings</strong></td><td>Composite</td><td>Habaynta dugsiga (Magaca, Lacagta sida USD/SLSH, Sannadka).</td></tr>
    <tr><td>9</td><td><strong>dugsiga_teachers</strong></td><td>id (Text)</td><td>Macallimiinta, takhasuskooda, mushaharka, iyo fasallada ay dhigaan.</td></tr>
    <tr><td>10</td><td><strong>dugsiga_staff</strong></td><td>id (Text)</td><td>Shaqaalaha dugsiga (Ilaalada, nadaafadda, xoghaynta, gaadiidka).</td></tr>
    <tr><td>11</td><td><strong>dugsiga_guardians</strong></td><td>id (Text)</td><td>Waalidiinta ardayda dhashay, WhatsApp-ka, iyo xiriirkooda.</td></tr>
    <tr><td>12</td><td><strong>dugsiga_staff_attendance</strong></td><td>id (Text)</td><td>Xaadirinta maalinlaha ah ee macallimiinta iyo shaqaalaha.</td></tr>
    <tr><td>13</td><td><strong>dugsiga_timetable</strong></td><td>id (Text)</td><td>Jadwalka xiisadaha todobaadka (Sabti - Jimce).</td></tr>
    <tr><td>14</td><td><strong>dugsiga_admissions</strong></td><td>id (Text)</td><td>Codsiyada ardayda cusub ee doonaya inay is-diiwaangeliyaan.</td></tr>
    <tr><td>15</td><td><strong>dugsiga_announcements</strong></td><td>id (Text)</td><td>Ogeysiisyada dugsiga ee ardayda, waalidiinta, ama shaqaalaha.</td></tr>
    <tr><td>16</td><td><strong>dugsiga_library_books</strong></td><td>id (Text)</td><td>Buugaagta maktabadda, tirada guud, ISBN-ka, iyo qoraaga.</td></tr>
    <tr><td>17</td><td><strong>dugsiga_library_loans</strong></td><td>id (Text)</td><td>Diiwaanka amaahashada iyo soo celinta buugaagta.</td></tr>
    <tr><td>18</td><td><strong>dugsiga_inventory</strong></td><td>id (Text)</td><td>Qalabka iyo hantida dugsiga (Kuraasta, kombiyuutarrada, qolalka).</td></tr>
    <tr><td>19</td><td><strong>dugsiga_documents</strong></td><td>id (Text)</td><td>Dukumentiyada, shahaadooyinka, iyo faylalka la keydiyo.</td></tr>
    <tr><td>20</td><td><strong>dugsiga_notifications</strong></td><td>id (Text)</td><td>Farriimaha iyo digniinaha nidaamka.</td></tr>
    <tr><td>21</td><td><strong>dugsiga_fee_structures</strong></td><td>id (Text)</td><td>Qaababka khidmadaha (Tuition, Diiwaangelin, Gaadiid, Buugaag).</td></tr>
    <tr><td>22</td><td><strong>dugsiga_invoices</strong></td><td>id (Text)</td><td>Qaansheekooyinka ardayda loo jaro oo wata discounts & hadhaa.</td></tr>
    <tr><td>23</td><td><strong>dugsiga_payments</strong></td><td>id (Text)</td><td>Rasiidhada lacag-bixinta (Kaash, Bank, EVC Plus, Zaad).</td></tr>
    <tr><td>24</td><td><strong>dugsiga_expenses</strong></td><td>id (Text)</td><td>Kharashaadka baxay (Ijaar, Koronto, Biyo, Dayactir).</td></tr>
    <tr><td>25</td><td><strong>dugsiga_income</strong></td><td>id (Text)</td><td>Dakhliga kale ee aan ardayda ahayn (Deeqo, Kiro, Dukaan).</td></tr>
    <tr><td>26</td><td><strong>dugsiga_budgets</strong></td><td>id (Text)</td><td>Miisaaniyadda qorshaysan (Planned vs Actual Spending).</td></tr>
    <tr><td>27</td><td><strong>dugsiga_payroll</strong></td><td>id (Text)</td><td>Mushahaarka macallimiinta iyo shaqaalaha (Gross, Net, Payslip).</td></tr>
  </tbody>
</table>

<h2>3. Qaybaha Xisaabaadka & Maaliyadda (Finance & Accounting Suite)</h2>
<p>
  Qaybta maaliyadda ee DUGSI PRO 2026 waxaa loo dhisay si waafaqsan mabaadi'da xisaabaadka caalamiga ah:
</p>
<ul>
  <li><strong>Invoicing & Billing:</strong> Qaansheekooyinka waxaa loo jari karaa arday kaliya ama fasal dhan hal mar (Bulk). Waxay wadataa lambar taxane ah (Invoice Number), qiimo-dhimis (Discount), iyo taariikhda bixinta ugu dambaysa (Due Date).</li>
  <li><strong>Payments & Receipts:</strong> Rasiidh rasmi ah ayaa la soo saaraa isla marka lacag la bixiyo (Kaash, EVC Plus, Zaad, ama Bank). Nidaamku wuxuu si toos ah hadhaaga qaansheekada uga jaraa lacagta la bixiyay.</li>
  <li><strong>Expenses & Approvals:</strong> Kharash kasta wuxuu maraa nidaam ogolaansho ah (Draft -> Approved -> Paid). Kharash aan la ogolaan lama dhexgeliyo xisaab-xirka.</li>
  <li><strong>Profit & Loss (P&L):</strong> Warbixin sax ah oo soo saarta Faa'iidada Saafiga ah (Total Realized Revenue - Total Approved Expenses = Net Income).</li>
  <li><strong>Cash Flow Engine:</strong> Xisaabinta dhaqdhaqaaqa lacagta caddaanka ah ee sanduuqa dugsiga ku jirta (Opening Cash + Inflows - Outflows = Closing Cash).</li>
  <li><strong>Payroll Management:</strong> Xisaabinta mushahaarka: Basic Salary + Allowances - Deductions = Net Pay. Marka mushaharka la bixiyo wuxuu si toos ah ugu qormayaa qaybta kharashaadka (Salaries Expense).</li>
</ul>

<h2>4. Amniga, Xuquuqaha & Multi-Tenancy</h2>
<div class="highlight-box">
  <strong>Doorarka Isticmaalayaasha (RBAC):</strong>
  <ul>
    <li><strong>Admin:</strong> Awood buuxda oo 100% ah dhammaan 29-ka qaybood.</li>
    <li><strong>Accountant:</strong> Maamulka xisaabaadka, biilasha, rasiidhada, kharashaadka, iyo payroll-ka.</li>
    <li><strong>Teacher:</strong> Xaadirinta fasallada loo xilsaaray iyo gelinta natiijooyinka imtixaanaadka.</li>
    <li><strong>Staff / Receptionist:</strong> Qaabilaadda ardayda cusub iyo xaadirinta shaqada.</li>
  </ul>
</div>

<p class="footer">
  DUGSI PRO 2026 Enterprise Edition &copy; 2026. Dhammaan xuquuqda way dhowran yihiin.
</p>

</body>
</html>`;

  const rootDocPath = path.join(process.cwd(), "DUGSI_PRO_2026_FULL_DOCUMENTATION.doc");
  const publicDocPath = path.join(process.cwd(), "public", "DUGSI_PRO_2026_FULL_DOCUMENTATION.doc");

  fs.writeFileSync(rootDocPath, content, "utf-8");
  fs.writeFileSync(publicDocPath, content, "utf-8");

  console.log("Successfully generated Word (.doc) documentation at:", rootDocPath, "and", publicDocPath);
  return true;
}

generateWordDocumentation();
