import React from "react";
import { ArrowLeft, FileText, Scale, Clock, Download, Users } from "lucide-react";
import { t } from "../i18n";

// ── Simple Markdown Renderer ─────────────────────────────────────────────────
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={i} className="text-yellow-400 font-bold text-lg mt-6 mb-2">{line.replace(/^# /, "")}</h2>);
    } else if (line.startsWith("## ")) {
      elements.push(<h3 key={i} className="text-yellow-300 font-bold text-base mt-4 mb-1">{line.replace(/^## /, "")}</h3>);
    } else if (line.startsWith("### ")) {
      elements.push(<h4 key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.replace(/^### /, "")}</h4>);
    } else if (line.match(/^[\-\*\•]\s/)) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1.5">
          <span className="text-yellow-500 mt-1 shrink-0">•</span>
          <span className="text-slate-300 text-sm leading-relaxed">{line.replace(/^[\-\*\•]\s/, "")}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1.5">
          <span className="text-yellow-500 font-bold text-xs mt-1 shrink-0 w-5">{num}.</span>
          <span className="text-slate-300 text-sm leading-relaxed">{line.replace(/^\d+\.\s/, "")}</span>
        </div>
      );
    } else {
      elements.push(<p key={i} className="text-slate-300 text-sm leading-relaxed my-1">{line}</p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

// ── Main ReportView Component ────────────────────────────────────────────────
export default function ReportView({ report, lang = "en", onBack }) {
  const timestamp = report?.timestamp
    ? new Date(report.timestamp).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <section className="relative min-h-screen bg-[#0a0a0a] pt-24 pb-16">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.08)_0%,transparent_65%)]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 text-sm font-semibold mb-8 px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20 transition-all"
        >
          <ArrowLeft size={15} /> {t(lang, "hero_back")}
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-yellow-500/15 border border-yellow-500/30 rounded-2xl flex items-center justify-center shrink-0">
            <Scale size={22} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white">
              {t(lang, "hero_ai_response")}
            </h1>
            {timestamp && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={12} className="text-slate-500" />
                <span className="text-slate-500 text-xs">{timestamp}</span>
              </div>
            )}
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Powered by Groq
            </span>
          </div>
        </div>

        {/* Input text (what user asked) */}
        {report?.inputText && (
          <div className="mb-6 bg-white/4 border border-white/8 rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Your Query</p>
            <p className="text-slate-300 text-sm leading-relaxed">{report.inputText}</p>
          </div>
        )}

        {/* No report fallback */}
        {!report?.aiResponse ? (
          <div className="bg-[#111827] border border-white/8 rounded-2xl p-10 text-center">
            <FileText size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-semibold mb-2">No report yet</p>
            <p className="text-slate-600 text-sm mb-6">
              Analyze a case first to see your AI legal report here.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-sm transition-all"
            >
              Go Analyze a Case
            </button>
          </div>
        ) : (
          <>
            {/* AI Response */}
            <div className="bg-[#0d1a0d] border border-yellow-500/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/6">
                <Scale size={16} className="text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                  AI Legal Analysis
                </span>
              </div>
              <RenderMarkdown text={report.aiResponse} />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const content = `NyayBot AI Legal Report\n${"=".repeat(40)}\nDate: ${timestamp}\n\nQuery:\n${report.inputText || "N/A"}\n\nAnalysis:\n${report.aiResponse}`;
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `NyayBot_Report_${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-yellow-500/20"
              >
                <Download size={15} /> Download Report
              </button>

              <button
                onClick={onBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 font-semibold text-sm transition-all"
              >
                <FileText size={15} /> Analyze Another Case
              </button>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-white/3 border border-white/6 rounded-xl">
              <p className="text-slate-600 text-xs leading-relaxed">
                <strong className="text-slate-500">Disclaimer:</strong> This AI-generated analysis is for informational purposes only and does not constitute legal advice. Please consult a qualified advocate for your specific situation.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}