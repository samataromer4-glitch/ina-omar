import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FaqSection() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is DUGSI PRO 2026?',
      a: 'DUGSI PRO 2026 is a modern, web-based School Management System engineered to digitize and organize everyday school operations: student enrollment, twice-daily roll call attendance, tuition fees, examination scores, and printable PDF report cards.'
    },
    {
      q: 'Who is DUGSI PRO 2026 designed for?',
      a: 'It is built specifically for school principals, head teachers, administrators, registrars, and bursars managing primary schools, secondary schools, academies, and community learning centers.'
    },
    {
      q: 'What school operations can be managed in the system?',
      a: 'The platform contains modules for Student Directory & Profiles, Classes & Classrooms, Course Subjects & Codes, Multi-Session Roll Call (Before & After Break), Tuition Invoicing & Fee Audit History, Examination Score Entry with Automated Letter Grades, and Official Printable PDF Reports.'
    },
    {
      q: 'How do I create a new school account?',
      a: 'Click any "Get Started" button on this website to open the registration page. Simply enter your official school administrator email and a secure password. Your school account and isolated workspace are created immediately.'
    },
    {
      q: 'How do existing users log in?',
      a: 'Click the "Login" button in the top navigation bar or footer. Enter your registered school email and password to access your active administrative dashboard.'
    },
    {
      q: 'Can DUGSI PRO 2026 be used on mobile devices and tablets?',
      a: 'Yes. The application is fully responsive. Teachers can take daily roll call directly on smartphones or tablets, while administrators can review records on office laptops or desktop workstations.'
    },
    {
      q: 'How is our school data kept private and isolated?',
      a: 'Every school account operates with multi-tenant data isolation tied to a unique School ID. Your student lists, attendance logs, tuition records, and exam scores are never accessible by or mixed with other institutions.'
    },
    {
      q: 'Can we import our existing student list from Excel?',
      a: 'Yes. DUGSI PRO 2026 includes a built-in Excel import tool. You can download our standardized spreadsheet template, populate it with your student names, classes, and guardian phone numbers, and import hundreds of students in seconds.'
    },
    {
      q: 'How does the automated exam grading system work?',
      a: 'You can configure your passing threshold and letter grade boundaries (Grade A, B, C, D, Fail) in Settings. When teachers record exam marks per subject, the system calculates student percentages and automatically assigns the correct letter grade.'
    },
    {
      q: 'How do I get started right now?',
      a: 'Click the "Get Started" button on this page, complete the brief registration form, and begin setting up your classes and students right away.'
    }
  ];

  return (
    <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="text-center mb-16">
        <span className="text-xs uppercase tracking-widest text-[#a78bfa] font-bold block mb-3">
          Clear Answers
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed">
          Everything you need to know about adopting DUGSI PRO 2026 for your school.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openFaqIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-[#0c0f17] overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                className="w-full px-6 py-4.5 flex items-center justify-between text-left font-bold text-sm sm:text-base text-white hover:text-[#a78bfa] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#94a3b8] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-5 text-xs sm:text-sm text-[#94a3b8] leading-relaxed border-t border-white/[0.04] pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

    </section>
  );
}
