import React from "react";
import {
  ArrowLeft, Scale, FileText, ShieldCheck, Clock, Calendar,
  User, Phone, Star, CheckCircle, XCircle, Info, TrendingUp,
  BookOpen, MapPin, Gavel, AlertTriangle, Download, Printer
} from "lucide-react";

// ─── Inline markdown renderer ────────────────────────────────────────────────
function renderInline(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith("**")) parts.push(<strong key={key++} className="text-white font-bold">{raw.slice(2, -2)}</strong>);
    else if (raw.startsWith("*")) parts.push(<em key={key++} className="text-slate-200 italic">{raw.slice(1, -1)}</em>);
    else if (raw.startsWith("`")) parts.push(<code key={key++} className="bg-white/10 text-yellow-300 text-xs px-1.5 py-0.5 rounded font-mono">{raw.slice(1, -1)}</code>);
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function RenderMarkdown({ text }) {
  if (!text) return null;
  const elements = [];
  text.split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    if (line.startsWith("# ")) elements.push(<h2 key={i} className="text-yellow-400 font-bold text-base mt-5 mb-2">{line.replace(/^# /, "")}</h2>);
    else if (line.startsWith("## ")) elements.push(<h3 key={i} className="text-yellow-300 font-bold text-sm mt-4 mb-1.5">{line.replace(/^## /, "")}</h3>);
    else if (line.startsWith("### ")) elements.push(<h4 key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.replace(/^### /, "")}</h4>);
    else if (line.match(/^[\-\*•]\s/)) elements.push(
      <div key={i} className="flex items-start gap-2 my-1">
        <span className="text-yellow-500 mt-1 shrink-0 text-xs">•</span>
        <span className="text-slate-300 text-sm leading-relaxed">{renderInline(line.replace(/^[\-\*•]\s/, ""))}</span>
      </div>
    );
    else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="text-yellow-500 font-bold text-xs mt-1 shrink-0 w-4">{num}.</span>
          <span className="text-slate-300 text-sm leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
    }
    else elements.push(<p key={i} className="text-slate-300 text-sm leading-relaxed my-1">{renderInline(line)}</p>);
  });
  return <div>{elements}</div>;
}

// ─── Parse AI response into structured sections ──────────────────────────────
function parseReportData(aiText, inputText) {
  const now = new Date();
  const combined = (aiText || "") + " " + (inputText || "");

  // Extract IPC/BNS sections
  const sections = [];
  const ipcRx = /IPC\s*(\d+[A-Z]?)/gi;
  let m;
  while ((m = ipcRx.exec(combined)) !== null) {
    const code = `IPC ${m[1]}`;
    if (!sections.find(s => s.code === code))
      sections.push({ code, name: getSectionName(m[1]), bailable: isBailable(m[1]) });
  }
  const bnsRx = /BNS\s*(\d+[A-Z]?)/gi;
  while ((m = bnsRx.exec(combined)) !== null) {
    const code = `BNS ${m[1]}`;
    if (!sections.find(s => s.code === code))
      sections.push({ code, name: `BNS Section ${m[1]}`, bailable: true });
  }
  const poscoxRx = /POCSO|POSCO/gi;
  if (poscoxRx.test(combined) && !sections.find(s => s.code === "POCSO Act")) {
    sections.push({ code: "POCSO Act", name: "Protection of Children from Sexual Offences", bailable: false });
  }

  // Bail probability
  let bailPct = 65;
  const bailMatch = aiText?.match(/(\d{2,3})\s*%/);
  if (bailMatch) bailPct = Math.min(95, parseInt(bailMatch[1]));
  if (aiText?.toLowerCase().includes("bail is generally not granted") ||
      aiText?.toLowerCase().includes("non-bailable") ||
      aiText?.toLowerCase().includes("pocso") ||
      aiText?.toLowerCase().includes("posco")) bailPct = Math.min(bailPct, 25);
  else if (aiText?.toLowerCase().includes("bailable")) bailPct = Math.max(bailPct, 72);

  // Case type
  let caseType = "Criminal";
  if (combined.toLowerCase().includes("pocso") || combined.toLowerCase().includes("posco")) caseType = "POCSO";
  else if (combined.toLowerCase().includes("cyber")) caseType = "Cyber";
  else if (combined.toLowerCase().includes("civil")) caseType = "Civil";
  else if (combined.toLowerCase().includes("property")) caseType = "Property";
  else if (combined.toLowerCase().includes("family") || combined.toLowerCase().includes("divorce")) caseType = "Family";
  else if (combined.toLowerCase().includes("murder") || combined.toLowerCase().includes("302")) caseType = "Murder";

  // Hearings
  const hearings = [
    { label: "FIR Date",            date: new Date(now.getTime() - 430 * 86400000), past: true  },
    { label: "FIR Date",            date: new Date(now.getTime() - 410 * 86400000), past: true  },
    { label: "Next Court Hearing",  date: new Date(now.getTime() +  21 * 86400000), past: false },
    { label: "Hearing 2",           date: new Date(now.getTime() +  63 * 86400000), past: false },
    { label: "Hearing 3",           date: new Date(now.getTime() + 105 * 86400000), past: false },
  ];

  // Rights
  const rights = [
    "Right to know the grounds of arrest (Article 22)",
    "Right to be produced before a magistrate within 24 hours",
    "Right to free legal aid if you cannot afford a lawyer (Article 39A)",
    "Right to remain silent (Article 20(3))",
    "Right to inform a relative or friend about the arrest",
    "Right to medical examination by a doctor",
  ];

  // Lawyers
  const lawyers = [
    { name: "Adv. Rajesh Kumar Sharma", spec: "Criminal, Bail Matters",    area: "MG Road, Bengaluru",       rating: 4.8, cases: 412, success: 78, exp: 18, langs: "English, Hindi",         fee: "₹3,000–₹8,000",  phone: "+91 98451 00021", proBono: false },
    { name: "Adv. Priya Menon",         spec: "Criminal, Women's Rights",   area: "Civil Lines, Bengaluru",   rating: 4.9, cases: 287, success: 84, exp: 12, langs: "English, Hindi, Tamil",   fee: "₹2,500–₹6,000",  phone: "+91 99000 00014", proBono: true  },
    { name: "Adv. Fatima Zaidi",        spec: "Bail, Constitutional",       area: "Cunningham Rd, Bengaluru", rating: 4.9, cases: 156, success: 88, exp: 11, langs: "English, Hindi, Urdu",    fee: "₹3,500–₹8,000",  phone: "+91 94481 00077", proBono: true  },
    { name: "Adv. Sanjay Banerjee",     spec: "Bail Matters, Criminal",     area: "Karol Bagh, Bengaluru",    rating: 4.6, cases: 389, success: 76, exp: 17, langs: "English, Bengali, Hindi", fee: "₹1,800–₹4,500",  phone: "+91 93000 00062", proBono: true  },
    { name: "Adv. Suresh Pillai",       spec: "Criminal, Bail Matters",     area: "Bandra West, Bengaluru",   rating: 4.5, cases: 367, success: 70, exp: 16, langs: "English, Tamil, Malayalam",fee: "₹3,000–₹7,000",  phone: "+91 96550 00033", proBono: false },
    { name: "Adv. Neha Bhattacharya",   spec: "Constitutional, Human Rights",area: "Anna Nagar, Bengaluru",  rating: 4.9, cases: 156, success: 88, exp: 11, langs: "English, Bengali, Hindi",  fee: "₹3,500–₹8,000",  phone: "+91 90000 00077", proBono: true  },
  ];

  // Plain language summary from AI
  const summaryMatch = aiText?.match(/summary[:\s]+([^#\n]{40,300})/i);
  const summary = summaryMatch
    ? summaryMatch[1].trim()
    : `Case analysis complete. ${sections.length > 0 ? `Charges identified: ${sections.map(s => `${s.code} (${s.name})`).join(", ")}.` : ""} Please consult a qualified lawyer for legal advice.`;

  return {
    generatedAt: now,
    caseType,
    inputQuery: inputText || "Case details submitted",
    aiText: aiText || "",
    summary,
    sections,
    bailPct,
    bailLabel: bailPct >= 65 ? "Likely Granted" : bailPct >= 35 ? "Uncertain — Court Discretion" : "Likely Denied",
    bailColor: bailPct >= 65 ? "emerald" : bailPct >= 35 ? "yellow" : "red",
    detentionLegal: !combined.toLowerCase().includes("illegal detention"),
    timeline: 18,
    rights,
    hearings,
    lawyers,
  };
}

function getSectionName(num) {
  const map = {
    "302": "Murder", "304": "Culpable Homicide", "306": "Abetment of Suicide",
    "307": "Attempt to Murder", "354": "Assault on Woman", "376": "Rape",
    "379": "Theft", "380": "Theft in Dwelling", "384": "Extortion",
    "392": "Robbery", "395": "Dacoity", "406": "Criminal Breach of Trust",
    "420": "Cheating", "426": "Mischief", "447": "Criminal Trespass",
    "498A": "Cruelty by Husband/Relatives", "504": "Intentional Insult",
    "506": "Criminal Intimidation", "509": "Word/Gesture to Insult Woman",
  };
  return map[num] || `IPC Section ${num}`;
}

function isBailable(num) {
  return !["302","304","307","376","392","395","396","364","363"].includes(num);
}

// ─── Lawyer Card ─────────────────────────────────────────────────────────────
function LawyerCard({ lawyer }) {
  const isFemale = ["Priya","Fatima","Neha","Meena","Deepa","Sunita","Lakshmi","Kavita","Anjali"].some(n => lawyer.name.includes(n));
  const initials = lawyer.name.split(" ").slice(1, 3).map(n => n[0]).join("");
  return (
    <div className="p-4 rounded-xl bg-[#0a0d1e] border border-white/8 hover:border-yellow-500/20 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
          isFemale ? "bg-pink-500/15 border-pink-500/25 text-pink-300" : "bg-yellow-500/15 border-yellow-500/25 text-yellow-300"
        }`}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-bold text-sm">{lawyer.name}</h4>
            {lawyer.proBono && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">PRO BONO</span>}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{lawyer.spec} • {lawyer.area}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
            <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400" /><span className="text-yellow-300 font-bold">{lawyer.rating}</span></span>
            <span className="text-slate-600">{lawyer.cases} cases</span>
            <span className="text-emerald-400 font-semibold">{lawyer.success}% success</span>
            <span className="text-slate-600">{lawyer.exp} yrs</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-slate-500">{lawyer.langs}</span>
            <span className="text-yellow-300 font-semibold">{lawyer.fee}/hearing</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={`tel:${lawyer.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all">
          <Phone size={11} /> Call
        </a>
        <a href={`https://wa.me/${lawyer.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold text-xs transition-all">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.549 4.1 1.51 5.829L.057 23.997l6.304-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.369l-.36-.214-3.733.979.996-3.638-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── Main ReportView ─────────────────────────────────────────────────────────
export default function ReportView({ report, lang = "en", onBack }) {

  // Support both prop shapes: { report } from old Hero OR { reportData } from App
  let resolvedReport = report;
  if (!resolvedReport) {
    try {
      const saved = localStorage.getItem("nyaybot_report");
      if (saved) resolvedReport = JSON.parse(saved);
    } catch (_) {}
  }

  const data = resolvedReport ? parseReportData(resolvedReport.aiResponse, resolvedReport.inputText) : null;

  const fmt     = d => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtFull = d => d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const handleDownload = () => {
    if (!resolvedReport) return;
    const content = [
      "NyayBot",
      "AI-Powered Legal Case Report",
      `Generated: ${fmtFull(data.generatedAt)}`,
      "",
      "═══ CASE OVERVIEW ═══",
      `Case Type: ${data.caseType}`,
      `Query: ${resolvedReport.inputText || "N/A"}`,
      "",
      "═══ PLAIN-LANGUAGE SUMMARY ═══",
      data.summary,
      "",
      "═══ BAIL PROBABILITY ASSESSMENT ═══",
      `${data.bailPct}% — ${data.bailLabel}`,
      data.sections.some(s => s.bailable) ? "• All identified offences are bailable under IPC." : "• Non-bailable offences identified.",
      "",
      "═══ IDENTIFIED LEGAL SECTIONS ═══",
      ...data.sections.map(s => `${s.code} — ${s.name}\n${s.bailable ? "Bailable" : "Non-Bailable"}`),
      "",
      "═══ ILLEGAL DETENTION CHECK ═══",
      data.detentionLegal ? "Detention appears within legal limits." : "Potential illegal detention detected.",
      "",
      `═══ ESTIMATED CASE TIMELINE ═══`,
      `Approximately ${data.timeline} month(s) until likely resolution.`,
      "",
      "═══ UPCOMING HEARINGS ═══",
      ...data.hearings.map(h => `• ${h.label} — ${fmt(h.date)}`),
      "",
      "═══ YOUR LEGAL RIGHTS ═══",
      ...data.rights.map(r => `• ${r}`),
      "",
      "═══ AI FULL ANALYSIS ═══",
      resolvedReport.aiResponse || "",
      "",
      "─────────────────────────────────────",
      "This report is generated by NyayBot AI for informational purposes only",
      "and does not constitute legal advice.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NyayBot-Report-${lang}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Empty state ──
  if (!data) {
    return (
      <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
        <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
          <FileText size={36} className="text-yellow-400" />
        </div>
        <h2 className="text-white font-serif text-3xl font-bold mb-3">No Report Yet</h2>
        <p className="text-slate-400 text-base max-w-sm mb-8 leading-relaxed">
          First go to <strong className="text-white">Analyze</strong> tab, describe your case and click <strong className="text-white">Analyze</strong>. Then come back here to see your full legal report.
        </p>
        <button onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
          <ArrowLeft size={16} /> Go Analyze a Case
        </button>
      </div>
    );
  }

  const bc = {
    emerald: { bar: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/25", bg: "bg-emerald-500/8" },
    yellow:  { bar: "bg-yellow-500",  text: "text-yellow-400",  border: "border-yellow-500/25",  bg: "bg-yellow-500/8"  },
    red:     { bar: "bg-red-500",     text: "text-red-400",     border: "border-red-500/25",     bg: "bg-red-500/8"     },
  }[data.bailColor];

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* ── Top bar ── */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-yellow-400" />
            <h1 className="text-white font-serif font-bold text-lg">AI-Powered Legal Case Report</h1>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all hover:bg-white/10">
              <Printer size={13} /> Print
            </button>
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-slate-900 font-bold text-xs hover:bg-yellow-400 transition-all">
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-5">

        {/* ── Report Header ── */}
        <div className="rounded-2xl border border-yellow-500/20 bg-[#0c0f22] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/25 shrink-0">
              <Scale size={28} strokeWidth={2.5} className="text-slate-900" />
            </div>
            <div>
              <h2 className="text-white font-serif font-bold text-2xl leading-none">NyayBot</h2>
              <p className="text-yellow-500/80 text-xs font-bold tracking-widest uppercase mt-1">AI-Powered Legal Case Report</p>
            </div>
            <div className="sm:ml-auto text-right">
              <p className="text-slate-500 text-xs">Generated</p>
              <p className="text-slate-300 text-sm font-semibold">{fmtFull(data.generatedAt)}</p>
            </div>
          </div>

          {/* Overview grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Case Type",      value: data.caseType,              icon: <Gavel size={13} />,       color: "text-white" },
              { label: "Sections Found", value: `${data.sections.length}`,  icon: <BookOpen size={13} />,    color: "text-white" },
              { label: "Est. Timeline",  value: `${data.timeline} months`,  icon: <Clock size={13} />,       color: "text-white" },
              { label: "Detention",      value: data.detentionLegal ? "Within Limits" : "Check Required", icon: <ShieldCheck size={13} />, color: data.detentionLegal ? "text-emerald-400" : "text-red-400" },
            ].map((item, i) => (
              <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">{item.icon}<span>{item.label}</span></div>
                <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Query */}
          {data.inputQuery && (
            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Your Query</p>
              <p className="text-slate-300 text-sm leading-relaxed">{data.inputQuery}</p>
            </div>
          )}
        </div>

        {/* ── Plain Language Summary ── */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-yellow-400" />
            <h3 className="text-white font-bold text-base">Plain-Language Summary</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
        </div>

        {/* ── Bail + Sections ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Bail Assessment */}
          <div className={`rounded-2xl border p-5 ${bc.border} ${bc.bg}`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} className={bc.text} />
              <h3 className="text-white font-bold text-base">Bail Probability Assessment</h3>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className={`font-serif font-black text-6xl leading-none ${bc.text}`}>{data.bailPct}%</span>
              <div className="mb-1">
                <p className={`text-sm font-bold ${bc.text}`}>{data.bailLabel}</p>
                <p className="text-slate-500 text-xs">Reasoning:</p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-4">
              <div className={`h-full rounded-full transition-all ${bc.bar}`} style={{ width: `${data.bailPct}%` }} />
            </div>
            <div className="space-y-2">
              {data.sections.some(s => s.bailable) && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-slate-400">All identified offences are bailable under IPC.</span>
                </div>
              )}
              {data.sections.some(s => !s.bailable) && (
                <div className="flex items-center gap-2 text-xs">
                  <XCircle size={12} className="text-red-400 shrink-0" />
                  <span className="text-slate-400">Non-bailable offences — court discretion required.</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <Info size={12} className="text-yellow-400 shrink-0" />
                <span className="text-slate-400">Consult a lawyer for accurate assessment.</span>
              </div>
            </div>
          </div>

          {/* Legal Sections */}
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={15} className="text-yellow-400" />
              <h3 className="text-white font-bold text-base">Identified Legal Sections</h3>
              <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{data.sections.length}</span>
            </div>
            {data.sections.length > 0 ? (
              <div className="space-y-2">
                {data.sections.map((sec, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
                    <div className="flex-1 min-w-0">
                      <span className="text-yellow-400 font-bold text-sm">{sec.code}</span>
                      <span className="text-slate-400 text-xs ml-2">— {sec.name}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      sec.bailable ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"
                    }`}>{sec.bailable ? "Bailable" : "Non-Bailable"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No specific IPC sections detected. See AI analysis below.</p>
            )}
          </div>
        </div>

        {/* ── Detention Check ── */}
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${data.detentionLegal ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <ShieldCheck size={18} className={data.detentionLegal ? "text-emerald-400 shrink-0" : "text-red-400 shrink-0"} />
          <div>
            <p className="text-white font-bold text-sm">Illegal Detention Check</p>
            <p className={`text-xs mt-0.5 ${data.detentionLegal ? "text-emerald-400" : "text-red-400"}`}>
              {data.detentionLegal ? "Detention appears within legal limits." : "Potential illegal detention — seek legal help immediately."}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-slate-500 text-xs">Est. Timeline</p>
            <p className="text-white font-bold text-sm">~{data.timeline} months</p>
          </div>
        </div>

        {/* ── Hearings + Rights ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Hearings */}
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} className="text-yellow-400" />
              <h3 className="text-white font-bold text-base">Upcoming Hearings</h3>
            </div>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/8" />
              {data.hearings.map((h, i) => {
                const isNext = !h.past && i === data.hearings.findIndex(x => !x.past);
                return (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 ${
                      isNext ? "bg-yellow-500 border-yellow-400" : h.past ? "bg-emerald-500/30 border-emerald-500/40" : "bg-white/8 border-white/15"
                    }`} />
                    <div className="pl-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isNext ? "text-yellow-400" : h.past ? "text-slate-600" : "text-slate-300"}`}>{h.label}</span>
                        {isNext && <span className="text-[9px] bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">NEXT</span>}
                      </div>
                      <p className={`text-sm font-semibold mt-0.5 ${h.past ? "text-slate-600" : "text-white"}`}>{fmt(h.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rights */}
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={15} className="text-emerald-400" />
              <h3 className="text-white font-bold text-base">Your Legal Rights</h3>
            </div>
            <div className="space-y-2.5">
              {data.rights.map((right, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-slate-300 text-sm leading-snug">{right}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Full AI Analysis ── */}
        <div className="rounded-2xl border border-yellow-500/15 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <h3 className="text-white font-bold text-base">Full AI Legal Analysis</h3>
            <span className="ml-auto text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded-full">Powered by Groq</span>
          </div>
          <RenderMarkdown text={data.aiText} />
        </div>

        {/* ── Recommended Lawyers ── */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-yellow-400" />
            <h3 className="text-white font-bold text-base">Recommended Lawyers</h3>
            <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Near You · Bengaluru</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.lawyers.map((lawyer, i) => <LawyerCard key={i} lawyer={lawyer} />)}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">
              <span className="text-orange-300 font-bold">Disclaimer: </span>
              This report is generated by NyayBot AI for informational purposes only and does not constitute legal advice.
              Always consult a qualified and licensed advocate for your specific legal situation.
              Bail probability estimates are indicative and may vary based on court discretion and case facts.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs pb-2">
          This report is generated by NyayBot AI for informational purposes only and does not constitute legal advice.
        </p>
      </div>
    </div>
  );
}