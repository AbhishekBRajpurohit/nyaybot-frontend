import React from "react";

const STATS = [
  { num: "76%", label: "of India's prisoners are undertrials", accent: true },
  { num: "6+", label: "Regional languages supported" },
  { num: "24/7", label: "Free legal AI assistance" },
  { num: "BNS·BNSS", label: "Updated legal knowledge base" },
];

export default function StatsBar() {
  return (
    <section className="relative z-20 bg-[#0d1225] border-y border-white/5 py-14 px-6 shadow-2xl">
      {/* We remove divide-x on mobile so the 2x2 grid doesn't have broken borders, and add it back on medium screens */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-12 md:gap-y-0 md:divide-x divide-white/10">
        {STATS.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center px-4 md:px-8 group"
          >
            <span
              className={`font-serif text-4xl md:text-5xl font-black mb-3 transition-all duration-300 transform group-hover:scale-110 ${
                s.accent
                  ? "text-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                  : "text-white group-hover:text-slate-200"
              }`}
            >
              {s.num}
            </span>
            <span className="text-sm text-slate-400 leading-snug max-w-[160px] font-medium group-hover:text-slate-300 transition-colors">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}