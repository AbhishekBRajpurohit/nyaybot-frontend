import React from "react";
import { FileSearch, Users, BellRing, FileText } from "lucide-react";
import { t } from "../i18n";

export default function HowItWorks({ lang = "en" }) {
  const steps = [
    { icon: <FileSearch size={32} className="text-yellow-400" />, titleKey: "step1_title", descKey: "step1_desc" },
    { icon: <Users      size={32} className="text-yellow-400" />, titleKey: "step2_title", descKey: "step2_desc" },
    { icon: <BellRing   size={32} className="text-yellow-400" />, titleKey: "step3_title", descKey: "step3_desc" },
    { icon: <FileText   size={32} className="text-yellow-400" />, titleKey: "step4_title", descKey: "step4_desc" },
  ];

  return (
    <section className="max-w-7xl mx-auto py-24 px-4 text-center">
      <div className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
        {t(lang, "how_badge")}
      </div>
      <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">{t(lang, "how_title")}</h2>
      <p className="text-slate-500 mb-16 text-lg max-w-2xl mx-auto">{t(lang, "how_subtitle")}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
        {steps.map((step, index) => (
          <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition duration-300 group">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition duration-300 shadow-md shadow-slate-900/20">
              {step.icon}
            </div>
            <h3 className="font-bold text-2xl mb-4 text-slate-900">{t(lang, step.titleKey)}</h3>
            <p className="text-slate-500 text-base mb-8 leading-relaxed">{t(lang, step.descKey)}</p>
            <a href="#" className="text-yellow-600 font-bold text-base hover:text-yellow-700 flex items-center">
              {t(lang, "open")} <span className="ml-2 group-hover:translate-x-1 transition">→</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}