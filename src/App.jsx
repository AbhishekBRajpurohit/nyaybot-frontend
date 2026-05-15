import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ReportView from "./components/ReportView";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import LawyerDirectory from "./components/LawyerDirectory";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { LANG_CODES } from "./i18n";

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [langLabel, setLangLabel]   = useState("English");
  const [showAuth, setShowAuth]     = useState(false);

  // report = { aiResponse, inputText, timestamp }
  const [report, setReport] = useState(() => {
    try {
      const saved = localStorage.getItem("nyaybot_report");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const lang = LANG_CODES[langLabel] || "en";

  const handleReportReady = (data) => {
    setReport(data);
    setActiveView("report");
  };

  const sharedNavbar = (
    <Navbar
      activeView={activeView}
      onNavigate={setActiveView}
      lang={lang}
      langLabel={langLabel}
      onLangChange={setLangLabel}
      onSignInClick={() => setShowAuth(true)}
    />
  );

  if (activeView === "lawyers") return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {sharedNavbar}
      <LawyerDirectory onBack={() => setActiveView("home")} lang={lang} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );

  if (activeView === "analyze") return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {sharedNavbar}
      <Hero
        mode="analyze"
        lang={lang}
        onBack={() => setActiveView("home")}
        onShowLawyers={() => setActiveView("lawyers")}
        onReportReady={handleReportReady}
      />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );

  if (activeView === "upload") return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {sharedNavbar}
      <Hero
        mode="upload"
        lang={lang}
        onBack={() => setActiveView("home")}
        onShowLawyers={() => setActiveView("lawyers")}
        onReportReady={handleReportReady}
      />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );

  if (activeView === "report") return (
    <div className="min-h-screen bg-[#08091a] font-sans text-white">
      {sharedNavbar}
      <ReportView
        lang={lang}
        report={report}
        onBack={() => setActiveView("home")}
      />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {sharedNavbar}
      <Hero
        lang={lang}
        onFIRAnalysis={() => setActiveView("analyze")}
        onUploadFIR={() => setActiveView("upload")}
        onShowLawyers={() => setActiveView("lawyers")}
      />
      <StatsBar lang={lang} />
      <HowItWorks lang={lang} />
      <CTA lang={lang} onAnalyzeClick={() => setActiveView("analyze")} />
      <Footer lang={lang} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}