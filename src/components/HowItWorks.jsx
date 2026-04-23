import React from "react";
import { FileSearch, Users, BellRing, FileText } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <FileSearch size={32} className="text-yellow-400" />,
      title: "Smart FIR Analysis",
      desc: "Speak, paste or upload your FIR. AI extracts charges, dates and key facts."
    },
    {
      icon: <Users size={32} className="text-yellow-400" />,
      title: "Lawyer Matching",
      desc: "Find verified local lawyers ranked by rating, success rate and experience."
    },
    {
      icon: <BellRing size={32} className="text-yellow-400" />,
      title: "Court Reminders",
      desc: "Never miss a hearing. Get WhatsApp & SMS alerts before every court date."
    },
    {
      icon: <FileText size={32} className="text-yellow-400" />,
      title: "Lawyer-Ready Report",
      desc: "One-click PDF with FIR summary, bail probability, timeline and more."
    }
  ];

  return (
    <section className="max-w-7xl mx-auto py-24 px-4 text-center">
      <div className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
        How It Works
      </div>
      <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Justice in four simple steps</h2>
      <p className="text-slate-500 mb-16 text-lg max-w-2xl mx-auto">
        Built for undertrials, families and NGOs — explained in plain language, in your language.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
        {steps.map((step, index) => (
          <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition duration-300 group">
            {/* BIGGER ICON CONTAINER */}
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition duration-300 shadow-md shadow-slate-900/20">
              {step.icon}
            </div>
            
            <h3 className="font-bold text-2xl mb-4 text-slate-900">{step.title}</h3>
            <p className="text-slate-500 text-base mb-8 leading-relaxed">
              {step.desc}
            </p>
            <a href="#" className="text-yellow-600 font-bold text-base hover:text-yellow-700 flex items-center">
              Open <span className="ml-2 group-hover:translate-x-1 transition">→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}