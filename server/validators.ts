import { z } from "zod";
import express from "express";

// Standard validation error formatter
export function formatZodErrors(err: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "root";
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Xogta la soo diray ma saxna (Invalid request payload)",
          fields: formatZodErrors(parsed.error)
        }
      });
    }
    req.body = parsed.data;
    next();
  };
}

/* =========================================================================
   1. AUTHENTICATION & ACCOUNT SCHEMAS
   ========================================================================= */
export const signupSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah"),
  password: z.string().min(8, "Password-ku waa inuu ka koobnaadaa ugu yaraan 8 xaraf")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah"),
  password: z.string().min(1, "Fadlan geli password-ka")
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah"),
  code: z.string().trim().min(4, "Fadlan geli koodhka xaqiijinta")
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah")
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Fadlan geli email sax ah"),
  token: z.string().trim().min(8, "Token-ka dib u dejintu ma saxna"),
  newPassword: z.string().min(8, "Password-ka cusub waa inuu ugu yaraan yahay 8 xaraf")
});

/* =========================================================================
   2. CORE ACADEMIC & HR SCHEMAS
   ========================================================================= */
export const studentSchema = z.object({
  fullName: z.string().trim().min(2, "Magaca ardayga waa waajib"),
  class: z.string().trim().min(1, "Fasalka waa waajib"),
  gender: z.string().trim().default("Male"),
  guardianPhone: z.string().trim().min(5, "Taleefanka waalidka waa waajib"),
  guardianName: z.string().trim().optional(),
  status: z.string().trim().default("active"),
  photo: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  section: z.string().optional(),
  rollNumber: z.string().optional()
});

export const classSchema = z.object({
  className: z.string().trim().min(1, "Magaca fasalka waa waajib"),
  teacherName: z.string().trim().optional().default(""),
  roomNumber: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  section: z.string().trim().optional().default("A"),
  capacity: z.coerce.number().int().min(1).default(30),
  academicYear: z.string().trim().default("2026-2027")
});

export const subjectSchema = z.object({
  subjectName: z.string().trim().min(1, "Magaca maaddada waa waajib"),
  subjectCode: z.string().trim().optional().default(""),
  className: z.string().trim().optional().default(""),
  teacherName: z.string().trim().optional().default(""),
  category: z.string().trim().optional().default("General"),
  description: z.string().trim().optional().default(""),
  passMarks: z.coerce.number().min(0).default(50),
  maxMarks: z.coerce.number().min(1).default(100)
});

export const examScoreSchema = z.object({
  studentId: z.string().trim().min(1, "ID-ga ardayga waa waajib"),
  studentName: z.string().trim().optional().default(""),
  className: z.string().trim().min(1, "Fasalka waa waajib"),
  subjectName: z.string().trim().min(1, "Maaddada waa waajib"),
  examName: z.string().trim().min(1, "Magaca imtixaanka waa waajib"),
  term: z.string().trim().default("Term 1"),
  marksObtained: z.coerce.number().min(0, "Dhibcuhu ma noqon karaan tiro taban"),
  maxMarks: z.coerce.number().min(1).default(100),
  grade: z.string().trim().optional(),
  examDate: z.string().trim().optional()
});

export const attendanceRecordSchema = z.object({
  date: z.string().trim().min(4, "Taariikhda waa waajib"),
  studentId: z.string().trim().min(1, "ID-ga ardayga waa waajib"),
  status: z.enum(["Present", "Absent", "Late", "Excused", "jooga", "maqan", "soo_daahay"]),
  sessionType: z.string().trim().default("before_break")
});

export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Magaca macallinka waa waajib"),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().email("Fadlan geli email sax ah"),
  qualification: z.string().trim().optional().default(""),
  specialization: z.string().trim().optional().default(""),
  salary: z.coerce.number().min(0).default(0),
  employmentStatus: z.string().trim().default("Full-Time"),
  assignedClasses: z.array(z.string()).optional().default([]),
  assignedSubjects: z.array(z.string()).optional().default([])
});

export const teacherActivateSchema = z.object({
  token: z.string().trim().min(10, "Activation token waa waajib"),
  password: z.string().min(8, "Password-ku waa inuu ugu yaraan 8 xaraf yahay")
});

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Magaca shaqaalaha waa waajib"),
  role: z.string().trim().min(1, "Doorka shaqaalaha waa waajib"),
  department: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  salary: z.coerce.number().min(0).default(0),
  employmentStatus: z.string().trim().default("Full-Time")
});

export const guardianSchema = z.object({
  name: z.string().trim().min(2, "Magaca waalidka waa waajib"),
  phone: z.string().trim().min(5, "Taleefanka waalidka waa waajib"),
  relationship: z.string().trim().default("Father"),
  whatsapp: z.string().trim().optional().default(""),
  email: z.string().trim().optional().default(""),
  studentIds: z.array(z.string()).optional().default([])
});

export const admissionSchema = z.object({
  applicantName: z.string().trim().min(2, "Magaca ardayga waa waajib"),
  desiredClass: z.string().trim().min(1, "Fasalka waa waajib"),
  guardianName: z.string().trim().optional().default(""),
  guardianPhone: z.string().trim().min(5, "Taleefanka waalidka waa waajib"),
  guardianRelationship: z.string().trim().default("Father"),
  gender: z.string().trim().default("Male"),
  dateOfBirth: z.string().trim().optional(),
  admissionDate: z.string().trim().optional()
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Cinwaanka ogeysiiska waa waajib"),
  message: z.string().trim().min(2, "Farriinta ogeysiiska waa waajib"),
  audience: z.string().trim().default("Everyone"),
  priority: z.string().trim().default("Normal"),
  targetClass: z.string().trim().optional()
});

export const libraryBookSchema = z.object({
  title: z.string().trim().min(1, "Cinwaanka buugga waa waajib"),
  author: z.string().trim().min(1, "Qoraaga buugga waa waajib"),
  category: z.string().trim().optional().default("General"),
  isbn: z.string().trim().optional().default(""),
  totalCopies: z.coerce.number().int().min(1).default(1)
});

export const inventoryItemSchema = z.object({
  itemName: z.string().trim().min(1, "Magaca qalabka waa waajib"),
  category: z.string().trim().default("General"),
  quantity: z.coerce.number().int().min(1).default(1),
  condition: z.string().trim().default("Good"),
  purchaseCost: z.coerce.number().min(0).default(0),
  location: z.string().trim().optional().default("")
});

/* =========================================================================
   3. FINANCE & ACCOUNTING SCHEMAS
   ========================================================================= */
export const feeStructureSchema = z.object({
  name: z.string().trim().min(1, "Magaca qaab-dhismeedka waa waajib"),
  category: z.string().trim().min(1, "Qaybta lacagta waa waajib"),
  amount: z.coerce.number().positive("Lacagtu waa inay ka weynaataa 0"),
  className: z.string().trim().default("All Classes"),
  academicYear: z.string().trim().default("2026-2027"),
  term: z.string().trim().default("All Terms"),
  description: z.string().trim().optional().default("")
});

export const invoiceCreateSchema = z.object({
  studentId: z.string().trim().min(1, "ID-ga ardayga waa waajib"),
  studentName: z.string().trim().optional(),
  className: z.string().trim().optional(),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  amount: z.coerce.number().positive("Lacagta guud waa inay ka weynaataa 0").optional(),
  subtotal: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).default(0),
  items: z.array(z.object({
    id: z.string().optional(),
    feeStructureId: z.string().optional(),
    name: z.string().min(1, "Item name required"),
    amount: z.coerce.number().positive("Item amount must be positive"),
    quantity: z.coerce.number().int().min(1).default(1)
  })).optional(),
  issueDate: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  notes: z.string().trim().optional().default("")
}).refine(data => (data.amount && data.amount > 0) || (data.items && data.items.length > 0), {
  message: "Fadlan geli qaddarka biilka ama waxyaabaha ku jira (Provide amount or invoice items)"
});

export const bulkInvoiceCreateSchema = z.object({
  feeStructureId: z.string().trim().optional(),
  className: z.string().trim().min(1, "Fasalka waa waajib"),
  name: z.string().trim().min(1, "Magaca biilka waa waajib"),
  amount: z.coerce.number().positive("Lacagtu waa inay ka weynaataa 0"),
  dueDate: z.string().trim().optional(),
  category: z.string().trim().optional().default("Tuition")
});

export const paymentCreateSchema = z.object({
  invoiceId: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  amount: z.coerce.number().positive("Qaddarka lacag-bixintu waa inuu ka weynaadaa 0"),
  paymentMethod: z.string().trim().default("Cash"),
  reference: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  paymentDate: z.string().trim().optional()
});

export const discountCreateSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice ID waa waajib"),
  value: z.coerce.number().positive("Qiimo dhimistu waa inay ka weynaataa 0"),
  discountType: z.enum(["fixed", "percentage"]).default("fixed"),
  reason: z.string().trim().min(2, "Sababta qiimo-dhimista waa waajib"),
  approvedBy: z.string().trim().optional().default("Admin")
});

export const refundCreateSchema = z.object({
  paymentId: z.string().trim().min(1, "Payment ID waa waajib"),
  refundAmount: z.coerce.number().positive("Qaddarka lacag-celinta waa inuu ka weynaadaa 0"),
  reason: z.string().trim().min(2, "Sababta lacag-celinta waa waajib"),
  paymentMethod: z.string().trim().default("Cash"),
  approvedBy: z.string().trim().optional().default("Admin")
});

export const expenseCreateSchema = z.object({
  category: z.string().trim().min(1, "Qaybta kharashka waa waajib"),
  description: z.string().trim().min(1, "Faahfaahinta kharashka waa waajib"),
  amount: z.coerce.number().positive("Qaddarka kharashku waa inuu ka weynaadaa 0"),
  vendorPayee: z.string().trim().min(1, "Qofka/shirkadda lacagta qaadatay waa waajib"),
  date: z.string().trim().optional(),
  paymentMethod: z.string().trim().default("Cash"),
  referenceNumber: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
  status: z.enum(["Approved", "Pending"]).default("Approved")
});

export const incomeCreateSchema = z.object({
  category: z.string().trim().min(1, "Qaybta dakhliga waa waajib"),
  description: z.string().trim().min(1, "Faahfaahinta dakhliga waa waajib"),
  amount: z.coerce.number().positive("Qaddarka dakhligu waa inuu ka weynaadaa 0"),
  payer: z.string().trim().min(1, "Qofka/ururka lacagta bixiyay waa waajib"),
  date: z.string().trim().optional(),
  paymentMethod: z.string().trim().default("Cash"),
  reference: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default("")
});

export const budgetCreateSchema = z.object({
  academicYear: z.string().trim().default("2026-2027"),
  period: z.string().trim().default("Annual"),
  category: z.string().trim().min(1, "Qaybta miisaaniyadda waa waajib"),
  type: z.enum(["Expense", "Income"]).default("Expense"),
  plannedAmount: z.coerce.number().positive("Qaddarka qorshaysan waa inuu ka weynaadaa 0"),
  notes: z.string().trim().optional().default("")
});

export const payrollCreateSchema = z.object({
  employeeType: z.enum(["Teacher", "Staff"]).default("Teacher"),
  employeeId: z.string().trim().min(1, "ID-ga shaqaalaha waa waajib"),
  employeeName: z.string().trim().min(1, "Magaca shaqaalaha waa waajib"),
  roleOrDepartment: z.string().trim().optional().default(""),
  basicSalary: z.coerce.number().min(0, "Mushaharka aasaasiga ah waa inuu 0 ama ka weyn yahay"),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  payrollPeriod: z.string().trim().min(1, "Muddada mushaharka (Period) waa waajib"),
  paymentMethod: z.string().trim().default("EVC Plus"),
  notes: z.string().trim().optional().default("")
});
