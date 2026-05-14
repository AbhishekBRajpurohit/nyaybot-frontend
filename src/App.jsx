import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import LawyerDirectory from "./components/LawyerDirectory";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import { LANG_CODES } from "./i18n";

export default function App() {
  const [activeView, setActiveView] = useState("home");
  const [langLabel, setLangLabel] = useState("English");

  const lang = LANG_CODES[langLabel] || "en";

  const navbar = (
    <Navbar
      activeView={activeView}
      onNavigate={setActiveView}
      lang={lang}
      langLabel={langLabel}
      onLangChange={setLangLabel}
    />
  );

  if (activeView === "lawyers") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
        {navbar}
        <LawyerDirectory onBack={() => setActiveView("home")} lang={lang} />
      </div>
    );
  }

  if (activeView === "analyze") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
        {navbar}
        <Hero
          mode="analyze"
          lang={lang}
          onBack={() => setActiveView("home")}
          onShowLawyers={() => setActiveView("lawyers")}
        />
      </div>
    );
  }

  if (activeView === "upload") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
        {navbar}
        <Hero
          mode="upload"
          lang={lang}
          onBack={() => setActiveView("home")}
          onShowLawyers={() => setActiveView("lawyers")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-white">
      {navbar}
      <Hero
        mode="home"
        lang={lang}
        onFIRAnalysis={() => setActiveView("analyze")}
        onUploadFIR={() => setActiveView("upload")}
        onShowLawyers={() => setActiveView("lawyers")}
      />
      <StatsBar lang={lang} />
      <HowItWorks lang={lang} />
      <CTA lang={lang} onGetStarted={() => setActiveView("analyze")} />
      <Footer lang={lang} />
    </div>
  );
}