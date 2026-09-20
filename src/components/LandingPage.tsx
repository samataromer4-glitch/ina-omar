import React from 'react';
import AnnouncementBar from './landing/AnnouncementBar';
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import TrustStatement from './landing/TrustStatement';
import ProductOverview from './landing/ProductOverview';
import FeaturesOverview from './landing/FeaturesOverview';
import ProductShowcase from './landing/ProductShowcase';
import FeatureDetailSections from './landing/FeatureDetailSections';
import HowItWorks from './landing/HowItWorks';
import SchoolWorkflow from './landing/SchoolWorkflow';
import BenefitsSection from './landing/BenefitsSection';
import WhyDugsiPro from './landing/WhyDugsiPro';
import PricingSection from './landing/PricingSection';
import FaqSection from './landing/FaqSection';
import FinalCta from './landing/FinalCta';
import Footer from './landing/Footer';

interface LandingPageProps {
  onNavigate: (route: 'login' | 'signup' | 'dashboard') => void;
  isAuthenticated?: boolean;
  userEmail?: string;
}

export default function LandingPage({ onNavigate, isAuthenticated = false, userEmail }: LandingPageProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] font-sans antialiased selection:bg-[#6366f1]/30 selection:text-white">
      
      {/* 01. ANNOUNCEMENT BAR */}
      <AnnouncementBar 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 02. NAVBAR */}
      <Navbar 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
        userEmail={userEmail}
        onScrollTo={scrollToSection} 
      />

      {/* 03. HERO SECTION */}
      <Hero 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 04. TRUST / PRODUCT STATEMENT */}
      <TrustStatement />

      {/* 05. PRODUCT OVERVIEW & ARCHITECTURE */}
      <ProductOverview 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 06 & 07. MAIN FEATURES & CATEGORIES */}
      <FeaturesOverview />

      {/* 08. DASHBOARD PREVIEW & PRODUCT SHOWCASE */}
      <ProductShowcase />

      {/* 09 - 16. DEEP DIVE FEATURE SECTIONS */}
      {/* 09. Students Management */}
      {/* 10. Attendance */}
      {/* 11. Fees & Payments */}
      {/* 12. Exams & Results */}
      {/* 13. Teachers & Staff */}
      {/* 14. Classes & Subjects */}
      {/* 15. Reports & Analytics */}
      {/* 16. User Roles & Permissions */}
      <FeatureDetailSections 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 17. HOW IT WORKS (3 SIMPLE STEPS) */}
      <HowItWorks 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 18. PRACTICAL BENEFITS */}
      <BenefitsSection />

      {/* 19. WHY DUGSI PRO 2026 */}
      <WhyDugsiPro />

      {/* 20. SCHOOL WORKFLOW PIPELINE */}
      <SchoolWorkflow />

      {/* 21. PRICING PLANS */}
      <PricingSection 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 22. FREQUENTLY ASKED QUESTIONS */}
      <FaqSection />

      {/* 23. FINAL CALL TO ACTION */}
      <FinalCta 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />

      {/* 24. FOOTER */}
      <Footer 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated}
        onScrollTo={scrollToSection} 
      />

    </div>
  );
}
