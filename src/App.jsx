import React from "react";
import Navbar from "./components/Navbar"; // <-- Import Navbar here
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function App() {
  const handleAnalyzeCase = async () => {
    console.log("Connecting to Express.js Backend...");
    alert("Backend connection simulated! This will soon talk to PostgreSQL.");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 1. Place the Navbar at the very top of the app */}
      <Navbar /> 
      
      <Hero onAnalyzeClick={handleAnalyzeCase} />
      <StatsBar />
      <HowItWorks />
      <CTA onAnalyzeClick={handleAnalyzeCase} />
      <Footer />
    </div>
  );
}