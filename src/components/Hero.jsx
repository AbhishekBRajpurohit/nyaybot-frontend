import React, { useState, useEffect } from "react";
import { FileText, Scale, ShieldAlert, Users, Play, ArrowRight } from "lucide-react";

const TYPING_PHRASES = [
  "Mera bail ho sakta hai?",
  "What are my rights?",
  "How long can they hold me?",
  "Find me a lawyer nearby.",
];

export default function Hero({ onAnalyzeClick }) {
  // Typing Animation State
  const [typedText, setTypedText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  // Typing Animation Effect
  useEffect(() => {
    const phrase = TYPING_PHRASES[phraseIdx];
    let timeout;
    if (!deleting && charIdx < phrase.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), 60);
    } else if (!deleting && charIdx === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), 35);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % TYPING_PHRASES.length);
    }
    setTypedText(phrase.substring(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx]);

  const cards = [
    { icon: <FileText size={28} />, title: "FIR Analysis" },
    { icon: <Scale size={28} />, title: "Bail Probability" },
    { icon: <ShieldAlert size={28} />, title: "Detention Alert" },
    { icon: <Users size={28} />, title: "Local Lawyers" }
  ];

  return (
    <div className="bg-[#0d1225]">
      {/* UPDATED: Changed the background URL to your new image */}
      <header className="relative bg-[url('/hero-justice.jpg')] bg-cover bg-center bg-no-repeat text-white overflow-hidden pb-32">
        
        {/* UPDATED: Gradient Overlay. Dark at top for text, lighter at bottom for the golden glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1225]/90 via-[#0d1225]/75 to-[#0d1225]/40 backdrop-blur-[1px]"></div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center pt-40 px-4 max-w-5xl mx-auto">
          
          {/* Top Pill */}
          <div className="border border-slate-500/50 bg-slate-800/60 backdrop-blur-md rounded-full px-4 py-1.5 mb-8 text-xs text-slate-200 flex items-center space-x-2">
            <Scale size={14} className="text-yellow-500" />
            <span>Justice, made understandable.</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6 max-w-4xl text-white tracking-tight drop-shadow-lg">
            AI Legal Assistant <br /> for Every Citizen
          </h1>
          
          <p className="text-lg text-slate-200 max-w-2xl mb-10 leading-relaxed font-light drop-shadow-md">
            Speak, type, or upload your FIR. NyayBot explains your rights, predicts 
            bail probability, and finds a lawyer near you — in your language.
          </p>

          {/* Typewriter Input Mockup */}
          <div className="w-full max-w-xl bg-white/5 border border-white/20 rounded-2xl p-1.5 mb-10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0d1225]/90 rounded-xl border border-white/5">
              <Scale size={20} className="text-yellow-500" />
              <span className="text-slate-200 text-base flex-1 text-left font-medium">
                {typedText}
                <span className="inline-block w-0.5 h-5 bg-yellow-500 ml-1 translate-y-1 animate-pulse" />
              </span>
              <button 
                onClick={onAnalyzeClick}
                className="flex items-center space-x-1 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-sm rounded-lg transition-all duration-200 whitespace-nowrap shadow-lg shadow-yellow-500/25"
              >
                <span>Analyze</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <button 
              onClick={onAnalyzeClick}
              className="group px-8 py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(250,204,21,0.25)] hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] hover:-translate-y-1"
            >
              Analyze My Case
            </button>
            <button className="flex items-center space-x-2 px-8 py-3.5 rounded-xl border border-white/20 text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/40 font-medium text-lg transition-all duration-200 backdrop-blur-sm">
              <Play size={20} className="text-yellow-500 fill-yellow-500" />
              <span>Watch Demo</span>
            </button>
          </div>

        </div>
      </header>

      {/* Translucent Overlap Cards */}
      <section className="max-w-5xl mx-auto -mt-16 relative z-20 grid grid-cols-2 md:grid-cols-4 gap-6 px-4 pb-10">
        {cards.map((item, index) => (
          <div key={index} className="bg-[#141a2e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-200 hover:bg-[#1e2642] hover:border-yellow-500/40 transition duration-300 cursor-pointer shadow-2xl group">
            <div className="text-yellow-500 mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
            <span className="text-base font-medium tracking-wide">{item.title}</span>
          </div>
        ))}
      </section>
    </div>
  );
}