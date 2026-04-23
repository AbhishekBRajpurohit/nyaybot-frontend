import React from "react";

export default function CTA({ onAnalyzeClick }) {
  return (
    <section className="max-w-4xl mx-auto px-4 pb-24">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl">
        <div className="mb-8 md:mb-0 md:pr-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">Ready to begin?</h2>
          <p className="text-slate-300">Tell NyayBot about your case in your own words. We'll handle the legalese.</p>
        </div>
        <button 
          onClick={onAnalyzeClick}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 px-8 rounded-xl shadow-lg transition whitespace-nowrap"
        >
          Analyze My Case →
        </button>
      </div>
    </section>
  );
}