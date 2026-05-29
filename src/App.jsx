import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ReportView from "./components/ReportView";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import LawyerDirectory from "./components/LawyerDirectory";
import HistoryView from "./components/HistoryView";
import AlertsView from "./components/AlertsView";
import ProfileView from "./components/ProfileView";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { LANG_CODES } from "./i18n";
import { useAuth } from "./components/AuthContext";

export default function App() {
  const [activeView, setActiveView]   = useState("home");
  const [previousView, setPreviousView] = useState("home"); // track where we came from
  const [langLabel, setLangLabel]     = useState("English");
  const [showAuth, setShowAuth]       = useState(false);
  const { user }                      = useAuth();

  // ── Report state ──────────────────────────────────────────────────────────
  // Only load from localStorage if user is logged in
  const [report, setReport] = useState(null);

  // When user logs in → try to load saved report
  // When user logs out → clear report
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem("nyaybot_report");
        if (saved) setReport(JSON.parse(saved));
      } catch { setReport(null); }
    } else {
      // User logged out — clear report and localStorage
      setReport(null);
      try { localStorage.removeItem("nyaybot_report"); } catch (_) {}
      // If on a protected view, send back home
      if (["report", "history", "alerts", "profile"].includes(activeView)) {
        setActiveView("home");
      }
    }
  }, [user]);

  const lang = LANG_CODES[langLabel] || "en";

  const handleReportReady = (data) => {
    setPreviousView("analyze");
    setReport(data);
    setActiveView("report");
  };

  const handleViewReport = (data) => {
    setPreviousView(activeView); // remember where we came from
    setReport(data);
    setActiveView("report");
  };

  // Navigate — if user not logged in and tries protected view, show auth modal
  const handleNavigate = (view) => {
    const protectedViews = ["history", "alerts", "profile","report"];
    if (protectedViews.includes(view) && !user) {
      setShowAuth(true);
      return;
    }
    // Report view only if there is actual report data
    if (view === "report" && !report) {
      setActiveView("analyze");
      return;
    }
    setActiveView(view);
  };

  const sharedNavbar = (
    <Navbar
      activeView={activeView}
      onNavigate={handleNavigate}
      lang={lang}
      langLabel={langLabel}
      onLangChange={setLangLabel}
      onSignInClick={() => setShowAuth(true)}
    />
  );

  const authModal = showAuth && <AuthModal onClose={() => setShowAuth(false)} />;

  // ── Lawyers ──
  if (activeView === "lawyers") return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {sharedNavbar}
      <LawyerDirectory onBack={() => setActiveView("home")} lang={lang} />
      {authModal}
    </div>
  );

  // ── Analyze ──
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
      {authModal}
    </div>
  );

  // ── Upload ──
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
      {authModal}
    </div>
  );

  // ── Report — only show if report data exists ──
  if (activeView === "report") return (
    <div className="min-h-screen bg-[#08091a] font-sans text-white">
      {sharedNavbar}
      <ReportView
        lang={lang}
        report={report}
        onBack={() => setActiveView(previousView || "home")}
      />
      {authModal}
    </div>
  );

  // ── History — protected ──
  if (activeView === "history") return (
    <div className="min-h-screen bg-[#08091a] font-sans text-white">
      {sharedNavbar}
      <HistoryView
        onBack={() => setActiveView("home")}
        onViewReport={handleViewReport}
      />
      {authModal}
    </div>
  );

  // ── Alerts — protected ──
  if (activeView === "alerts") return (
    <div className="min-h-screen bg-[#08091a] font-sans text-white">
      {sharedNavbar}
      <AlertsView
        onBack={() => setActiveView("home")}
        onViewReport={handleViewReport}
      />
      {authModal}
    </div>
  );

  // ── Profile — protected ──
  if (activeView === "profile") return (
    <div className="min-h-screen bg-[#08091a] font-sans text-white">
      {sharedNavbar}
      <ProfileView
        onBack={() => setActiveView("home")}
        onViewReport={handleViewReport}
      />
      {authModal}
    </div>
  );

  // ── Home ──
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
      {authModal}
    </div>
  );
}