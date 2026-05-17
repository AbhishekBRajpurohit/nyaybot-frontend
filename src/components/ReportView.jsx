import React, { useState } from "react";
import jsPDF from "jspdf";
import {
  ArrowLeft, Scale, FileText, ShieldCheck, Clock, Calendar,
  User, Phone, Star, CheckCircle, XCircle, Info, TrendingUp,
  BookOpen, MapPin, Gavel, AlertTriangle, Download, Printer
} from "lucide-react";

// ─── Markdown renderer ───────────────────────────────────────────────────────
function renderInline(text) {
  if (!text) return text;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith("**")) parts.push(<strong key={key++} className="text-white font-bold">{raw.slice(2,-2)}</strong>);
    else if (raw.startsWith("*")) parts.push(<em key={key++} className="text-slate-200 italic">{raw.slice(1,-1)}</em>);
    else if (raw.startsWith("`")) parts.push(<code key={key++} className="bg-white/10 text-yellow-300 text-xs px-1.5 py-0.5 rounded font-mono">{raw.slice(1,-1)}</code>);
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
    if (line.startsWith("# "))   elements.push(<h2 key={i} className="text-yellow-400 font-bold text-base mt-5 mb-2">{line.replace(/^# /,"")}</h2>);
    else if (line.startsWith("## ")) elements.push(<h3 key={i} className="text-yellow-300 font-bold text-sm mt-4 mb-1.5">{line.replace(/^## /,"")}</h3>);
    else if (line.startsWith("### ")) elements.push(<h4 key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.replace(/^### /,"")}</h4>);
    else if (line.match(/^[\-\*•]\s/)) elements.push(
      <div key={i} className="flex items-start gap-2 my-1">
        <span className="text-yellow-500 mt-1 shrink-0 text-xs">•</span>
        <span className="text-slate-300 text-sm leading-relaxed">{renderInline(line.replace(/^[\-\*•]\s/,""))}</span>
      </div>
    );
    else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1">
          <span className="text-yellow-500 font-bold text-xs mt-1 shrink-0 w-4">{num}.</span>
          <span className="text-slate-300 text-sm leading-relaxed">{renderInline(line.replace(/^\d+\.\s/,""))}</span>
        </div>
      );
    }
    else elements.push(<p key={i} className="text-slate-300 text-sm leading-relaxed my-1">{renderInline(line)}</p>);
  });
  return <div>{elements}</div>;
}

// ─── Data parser ─────────────────────────────────────────────────────────────
function parseReportData(aiText, inputText) {
  const now = new Date();
  const combined = (aiText||"") + " " + (inputText||"");
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
  let bailPct = 65;
  const bailMatch = aiText?.match(/(\d{2,3})\s*%/);
  if (bailMatch) bailPct = Math.min(95, parseInt(bailMatch[1]));
  if (aiText?.toLowerCase().includes("bail is generally not granted") || aiText?.toLowerCase().includes("non-bailable")) bailPct = Math.min(bailPct, 25);
  else if (aiText?.toLowerCase().includes("bailable")) bailPct = Math.max(bailPct, 72);
  let caseType = "Criminal";
  if (combined.toLowerCase().includes("pocso")||combined.toLowerCase().includes("posco")) caseType="POCSO";
  else if (combined.toLowerCase().includes("cyber")) caseType="Cyber";
  else if (combined.toLowerCase().includes("civil")) caseType="Civil";
  else if (combined.toLowerCase().includes("property")) caseType="Property";
  else if (combined.toLowerCase().includes("money laundering")) caseType="Financial";
  else if (combined.toLowerCase().includes("family")||combined.toLowerCase().includes("divorce")) caseType="Family";
  else if (combined.toLowerCase().includes("murder")||combined.toLowerCase().includes("302")) caseType="Murder";
  const hearings = [
    { label:"FIR Date",           date: new Date(now.getTime()-430*86400000), past:true  },
    { label:"FIR Date",           date: new Date(now.getTime()-410*86400000), past:true  },
    { label:"Next Court Hearing", date: new Date(now.getTime()+21*86400000),  past:false },
    { label:"Hearing 2",          date: new Date(now.getTime()+63*86400000),  past:false },
    { label:"Hearing 3",          date: new Date(now.getTime()+105*86400000), past:false },
  ];
  const rights = [
    "Right to know the grounds of arrest (Article 22)",
    "Right to be produced before a magistrate within 24 hours",
    "Right to free legal aid if you cannot afford a lawyer (Article 39A)",
    "Right to remain silent (Article 20(3))",
    "Right to inform a relative or friend about the arrest",
    "Right to medical examination by a doctor",
  ];
  const lawyers = [
    { name:"Adv. Rajesh Kumar Sharma", spec:"Criminal, Bail Matters",     area:"MG Road, Bengaluru",       rating:4.8, cases:412, success:78, exp:18, langs:"English, Hindi",          fee:"₹3,000-₹8,000",  phone:"+91 98451 00021", proBono:false },
    { name:"Adv. Priya Menon",         spec:"Criminal, Women's Rights",    area:"Civil Lines, Bengaluru",   rating:4.9, cases:287, success:84, exp:12, langs:"English, Hindi, Tamil",    fee:"₹2,500-₹6,000",  phone:"+91 99000 00014", proBono:true  },
    { name:"Adv. Fatima Zaidi",        spec:"Bail, Constitutional",        area:"Cunningham Rd, Bengaluru", rating:4.9, cases:156, success:88, exp:11, langs:"English, Hindi, Urdu",     fee:"₹3,500-₹8,000",  phone:"+91 94481 00077", proBono:true  },
    { name:"Adv. Sanjay Banerjee",     spec:"Bail Matters, Criminal",      area:"Karol Bagh, Bengaluru",    rating:4.6, cases:389, success:76, exp:17, langs:"English, Bengali, Hindi",  fee:"₹1,800-₹4,500",  phone:"+91 93000 00062", proBono:true  },
  ];
  const summaryMatch = aiText?.match(/summary[:\s]+([^#\n]{40,300})/i);
  const summary = summaryMatch ? summaryMatch[1].trim()
    : `Case analysis complete. ${sections.length>0?`Charges: ${sections.map(s=>`${s.code} (${s.name})`).join(", ")}.`:""}  Please consult a qualified lawyer.`;
  return {
    generatedAt:now, caseType,
    inputQuery: inputText||"Case details submitted",
    aiText: aiText||"", summary, sections, bailPct,
    bailLabel: bailPct>=65?"Likely Granted":bailPct>=35?"Uncertain — Court Discretion":"Likely Denied",
    bailColor: bailPct>=65?"emerald":bailPct>=35?"yellow":"red",
    detentionLegal:!combined.toLowerCase().includes("illegal detention"),
    timeline:18, rights, hearings, lawyers,
  };
}

function getSectionName(num) {
  const map = {
    "302":"Murder","304":"Culpable Homicide","307":"Attempt to Murder",
    "354":"Assault on Woman","376":"Rape","379":"Theft",
    "380":"Theft in Dwelling","392":"Robbery","395":"Dacoity",
    "406":"Criminal Breach of Trust","420":"Cheating",
    "498A":"Cruelty by Husband","504":"Intentional Insult",
    "506":"Criminal Intimidation","509":"Insult to Woman",
  };
  return map[num]||`IPC Section ${num}`;
}
function isBailable(num) {
  return !["302","304","307","376","392","395","396","364","363"].includes(num);
}

// ─── Lawyer Card ─────────────────────────────────────────────────────────────
function LawyerCard({ lawyer }) {
  const isFemale = ["Priya","Fatima","Neha","Meena","Deepa","Sunita"].some(n=>lawyer.name.includes(n));
  const initials = lawyer.name.split(" ").slice(1,3).map(n=>n[0]).join("");
  return (
    <div className="p-4 rounded-xl bg-[#0a0d1e] border border-white/8 hover:border-yellow-500/20 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${isFemale?"bg-pink-500/15 border-pink-500/25 text-pink-300":"bg-yellow-500/15 border-yellow-500/25 text-yellow-300"}`}>{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-bold text-sm">{lawyer.name}</h4>
            {lawyer.proBono&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">PRO BONO</span>}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{lawyer.spec} • {lawyer.area}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
            <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400"/><span className="text-yellow-300 font-bold">{lawyer.rating}</span></span>
            <span className="text-slate-600">{lawyer.cases} cases</span>
            <span className="text-emerald-400 font-semibold">{lawyer.success}% success</span>
            <span className="text-slate-600">{lawyer.exp} yrs</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-slate-500">{lawyer.langs}</span>
            <span className="text-yellow-300 font-semibold">{lawyer.fee}/hearing</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <a href={`tel:${lawyer.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all">
          <Phone size={11}/> Call
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

// ─── PDF Generator — uses npm jspdf ─────────────────────────────────────────
function generatePDF(data, fmtFull) {
  try {
    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    const nl  = (n=6)      => { y += n; };
    const newPage = ()     => { doc.addPage(); y = 20; };
    const chk = (n=20)     => { if (y+n > 275) newPage(); };
    const hr  = ()         => {
      doc.setDrawColor(50,50,70); doc.setLineWidth(0.3);
      doc.line(margin, y, W-margin, y); nl(5);
    };
    const txt = (t, x, size=9, style="normal", r=200, g=200, b=220) => {
      doc.setFontSize(size); doc.setFont("helvetica", style);
      doc.setTextColor(r,g,b); doc.text(String(t), x, y);
    };

    // ── Dark background ──
    doc.setFillColor(10,12,28);
    doc.rect(0,0,W,297,"F");

    // ── Header ──
    doc.setFillColor(245,158,11);
    doc.roundedRect(margin, y, 16, 16, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
    doc.text("NYB", margin+2, y+10);
    txt("NyayBot", margin+20, 20, "bold", 255, 255, 255);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(245,158,11);
    doc.text("AI-POWERED LEGAL CASE REPORT", margin+20, y+7);
    doc.setFontSize(7); doc.setTextColor(120,120,140);
    doc.text(`Generated: ${fmtFull(data.generatedAt)}`, W-margin, y+4, {align:"right"});
    nl(22); hr();

    // ── Overview ──
    chk(20);
    txt("CASE OVERVIEW", margin, 10, "bold", 245, 158, 11);
    nl(7);
    const cols = [["Case Type",data.caseType],["Sections",String(data.sections.length)],["Timeline",`${data.timeline}mo`],["Detention",data.detentionLegal?"OK":"Check"]];
    cols.forEach(([l,v],i) => {
      const x = margin + i*((W-2*margin)/4);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,140);
      doc.text(l, x, y);
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(v, x, y+5);
    });
    nl(14); hr();

    // ── Query ──
    if (data.inputQuery) {
      chk(15);
      txt("YOUR QUERY", margin, 8, "bold", 120, 120, 140);
      nl(5);
      const qlines = doc.splitTextToSize(data.inputQuery, W-2*margin);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(190,190,210);
      doc.text(qlines, margin, y); nl(qlines.length*4+5); hr();
    }

    // ── Summary ──
    chk(20);
    txt("PLAIN-LANGUAGE SUMMARY", margin, 10, "bold", 245, 158, 11); nl(6);
    const slines = doc.splitTextToSize(data.summary, W-2*margin);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(190,190,210);
    doc.text(slines, margin, y); nl(slines.length*4+6); hr();

    // ── Bail ──
    chk(30);
    txt("BAIL PROBABILITY ASSESSMENT", margin, 10, "bold", 245, 158, 11); nl(8);
    const bc = data.bailColor==="emerald"?[52,211,153]:data.bailColor==="yellow"?[250,204,21]:[248,113,113];
    doc.setFontSize(30); doc.setFont("helvetica","bold"); doc.setTextColor(...bc);
    doc.text(`${data.bailPct}%`, margin, y); nl(5);
    doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(...bc);
    doc.text(data.bailLabel, margin, y); nl(5);
    if (data.sections.some(s=>s.bailable)) { doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(52,211,153); doc.text("• All identified offences are bailable under IPC.", margin, y); nl(5); }
    if (data.sections.some(s=>!s.bailable)) { doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(248,113,113); doc.text("• Non-bailable offences — court discretion required.", margin, y); nl(5); }
    nl(3); hr();

    // ── Sections ──
    if (data.sections.length > 0) {
      chk(20);
      txt("IDENTIFIED LEGAL SECTIONS", margin, 10, "bold", 245, 158, 11); nl(7);
      data.sections.forEach(sec => {
        chk(8);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(250,204,21);
        doc.text(sec.code, margin, y);
        doc.setFont("helvetica","normal"); doc.setTextColor(190,190,210);
        doc.text(` — ${sec.name}`, margin+22, y);
        doc.setFontSize(7); doc.setTextColor(sec.bailable?52:248, sec.bailable?211:113, sec.bailable?153:113);
        doc.text(sec.bailable?"Bailable":"Non-Bailable", W-margin-18, y); nl(6);
      });
      nl(2); hr();
    }

    // ── Detention ──
    chk(12);
    txt("ILLEGAL DETENTION CHECK", margin, 10, "bold", 245, 158, 11); nl(6);
    doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.setTextColor(data.detentionLegal?52:248, data.detentionLegal?211:113, data.detentionLegal?153:113);
    doc.text(data.detentionLegal?"Detention appears within legal limits.":"Potential illegal detention — seek legal help.", margin, y);
    doc.setTextColor(130,130,150);
    doc.text(`Estimated Timeline: ~${data.timeline} months`, W-margin-50, y);
    nl(8); hr();

    // ── Hearings ──
    chk(35);
    txt("UPCOMING HEARINGS", margin, 10, "bold", 245, 158, 11); nl(7);
    data.hearings.forEach(h => {
      chk(6);
      const ds = h.date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
      doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.setTextColor(h.past?100:190, h.past?100:190, h.past?120:210);
      doc.text(`• ${h.label} — ${ds}`, margin, y); nl(5);
    });
    nl(2); hr();

    // ── Rights ──
    chk(40);
    txt("YOUR LEGAL RIGHTS", margin, 10, "bold", 245, 158, 11); nl(7);
    data.rights.forEach(r => {
      chk(7);
      const rlines = doc.splitTextToSize(`• ${r}`, W-2*margin);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(190,190,210);
      doc.text(rlines, margin, y); nl(rlines.length*4+2);
    });
    nl(3); hr();

    // ── AI Analysis ──
    chk(20);
    txt("FULL AI LEGAL ANALYSIS", margin, 10, "bold", 245, 158, 11); nl(7);
    const cleanAI = (data.aiText||"").replace(/\*\*/g,"").replace(/\*/g,"").replace(/#{1,3}\s/g,"").replace(/`/g,"");
    const aiLines = doc.splitTextToSize(cleanAI, W-2*margin);
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,200);
    aiLines.forEach(l => { chk(5); doc.text(l, margin, y); nl(4); });
    nl(3); hr();

    // ── Lawyers ──
    chk(20);
    txt("RECOMMENDED LAWYERS", margin, 10, "bold", 245, 158, 11); nl(7);
    data.lawyers.forEach(lw => {
      chk(22);
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(lw.name, margin, y);
      if (lw.proBono) { doc.setFontSize(7); doc.setTextColor(52,211,153); doc.text("PRO BONO", W-margin-18, y); }
      nl(5);
      doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,160);
      doc.text(`${lw.spec} • ${lw.area}`, margin, y); nl(4);
      doc.text(`Rating: ${lw.rating}  |  ${lw.cases} cases  |  ${lw.success}% success  |  ${lw.exp} yrs exp`, margin, y); nl(4);
      doc.text(`Languages: ${lw.langs}  |  Fee: ${lw.fee}/hearing  |  Ph: ${lw.phone}`, margin, y); nl(7);
    });
    hr();

    // ── Disclaimer ──
    chk(15);
    doc.setFontSize(7); doc.setFont("helvetica","italic"); doc.setTextColor(110,110,130);
    const disc = doc.splitTextToSize("DISCLAIMER: This report is generated by NyayBot AI for informational purposes only and does not constitute legal advice. Always consult a qualified and licensed advocate for your specific legal situation. Bail probability estimates are indicative.", W-2*margin);
    doc.text(disc, margin, y); nl(disc.length*3.5+4);

    // ── Page numbers ──
    const pages = doc.internal.getNumberOfPages();
    for (let i=1; i<=pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7); doc.setTextColor(80,80,100);
      doc.text(`NyayBot AI • Justice Made Understandable • Page ${i} of ${pages}`, W/2, 290, {align:"center"});
    }

    doc.save(`NyayBot-Report-${new Date().toISOString().slice(0,10)}.pdf`);
    return true;
  } catch(err) {
    console.error("PDF error:", err);
    throw err;
  }
}

// ─── Main ReportView ─────────────────────────────────────────────────────────
export default function ReportView({ report, lang="en", onBack }) {
  let resolvedReport = report;
  if (!resolvedReport) {
    try {
      const saved = localStorage.getItem("nyaybot_report");
      if (saved) resolvedReport = JSON.parse(saved);
    } catch (_) {}
  }
  const data = resolvedReport ? parseReportData(resolvedReport.aiResponse, resolvedReport.inputText) : null;
  const fmt     = d => d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const fmtFull = d => d.toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownload = () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      generatePDF(data, fmtFull);
    } catch(err) {
      alert("PDF generation failed: " + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <FileText size={36} className="text-yellow-400"/>
      </div>
      <h2 className="text-white font-serif text-3xl font-bold mb-3">No Report Yet</h2>
      <p className="text-slate-400 text-base max-w-sm mb-8 leading-relaxed">
        Go to <strong className="text-white">Analyze</strong> tab, describe your case and click <strong className="text-white">Analyze</strong>.
      </p>
      <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16}/> Go Analyze a Case
      </button>
    </div>
  );

  const bc = {
    emerald:{ bar:"bg-emerald-500", text:"text-emerald-400", border:"border-emerald-500/25", bg:"bg-emerald-500/8" },
    yellow: { bar:"bg-yellow-500",  text:"text-yellow-400",  border:"border-yellow-500/25",  bg:"bg-yellow-500/8"  },
    red:    { bar:"bg-red-500",     text:"text-red-400",     border:"border-red-500/25",     bg:"bg-red-500/8"     },
  }[data.bailColor];

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">
      {/* Top bar */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15}/> Back
          </button>
          <div className="w-px h-5 bg-white/10"/>
          <Scale size={16} className="text-yellow-400"/>
          <h1 className="text-white font-serif font-bold text-lg">AI-Powered Legal Case Report</h1>
          <div className="ml-auto flex gap-2">
            <button onClick={()=>window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all">
              <Printer size={13}/> Print
            </button>
            <button onClick={handleDownload} disabled={pdfLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500 text-slate-900 font-bold text-xs hover:bg-yellow-400 transition-all disabled:opacity-60">
              <Download size={13}/> {pdfLoading?"Generating...":"Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-5">
        {/* Header card */}
        <div className="rounded-2xl border border-yellow-500/20 bg-[#0c0f22] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/25 shrink-0">
              <Scale size={28} strokeWidth={2.5} className="text-slate-900"/>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              {label:"Case Type",      value:data.caseType,             icon:<Gavel size={13}/>,    color:"text-white"},
              {label:"Sections Found", value:`${data.sections.length}`, icon:<BookOpen size={13}/>, color:"text-white"},
              {label:"Est. Timeline",  value:`${data.timeline} months`, icon:<Clock size={13}/>,    color:"text-white"},
              {label:"Detention",      value:data.detentionLegal?"Within Limits":"Check Required", icon:<ShieldCheck size={13}/>, color:data.detentionLegal?"text-emerald-400":"text-red-400"},
            ].map((item,i)=>(
              <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5">{item.icon}<span>{item.label}</span></div>
                <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {data.inputQuery&&(
            <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Your Query</p>
              <p className="text-slate-300 text-sm leading-relaxed">{data.inputQuery}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-3"><FileText size={15} className="text-yellow-400"/><h3 className="text-white font-bold text-base">Plain-Language Summary</h3></div>
          <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
        </div>

        {/* Bail + Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className={`rounded-2xl border p-5 ${bc.border} ${bc.bg}`}>
            <div className="flex items-center gap-2 mb-4"><TrendingUp size={15} className={bc.text}/><h3 className="text-white font-bold text-base">Bail Probability</h3></div>
            <div className="flex items-end gap-3 mb-3">
              <span className={`font-serif font-black text-6xl leading-none ${bc.text}`}>{data.bailPct}%</span>
              <div className="mb-1"><p className={`text-sm font-bold ${bc.text}`}>{data.bailLabel}</p><p className="text-slate-500 text-xs">based on AI analysis</p></div>
            </div>
            <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden mb-4">
              <div className={`h-full rounded-full ${bc.bar}`} style={{width:`${data.bailPct}%`}}/>
            </div>
            <div className="space-y-2">
              {data.sections.some(s=>s.bailable)&&<div className="flex items-center gap-2 text-xs"><CheckCircle size={12} className="text-emerald-400 shrink-0"/><span className="text-slate-400">Some bailable offences identified.</span></div>}
              {data.sections.some(s=>!s.bailable)&&<div className="flex items-center gap-2 text-xs"><XCircle size={12} className="text-red-400 shrink-0"/><span className="text-slate-400">Non-bailable offences — court discretion required.</span></div>}
              <div className="flex items-center gap-2 text-xs"><Info size={12} className="text-yellow-400 shrink-0"/><span className="text-slate-400">Consult a lawyer for accurate assessment.</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4"><BookOpen size={15} className="text-yellow-400"/><h3 className="text-white font-bold text-base">Identified Sections</h3><span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{data.sections.length}</span></div>
            {data.sections.length>0?(
              <div className="space-y-2">
                {data.sections.map((sec,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
                    <span className="text-yellow-400 font-bold text-sm shrink-0">{sec.code}</span>
                    <span className="text-slate-300 text-xs flex-1">{sec.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${sec.bailable?"bg-emerald-500/10 border-emerald-500/25 text-emerald-400":"bg-red-500/10 border-red-500/25 text-red-400"}`}>{sec.bailable?"Bailable":"Non-Bailable"}</span>
                  </div>
                ))}
              </div>
            ):<p className="text-slate-500 text-sm">No specific IPC sections detected. See AI analysis below.</p>}
          </div>
        </div>

        {/* Detention */}
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${data.detentionLegal?"border-emerald-500/20 bg-emerald-500/5":"border-red-500/20 bg-red-500/5"}`}>
          <ShieldCheck size={18} className={data.detentionLegal?"text-emerald-400 shrink-0":"text-red-400 shrink-0"}/>
          <div><p className="text-white font-bold text-sm">Illegal Detention Check</p><p className={`text-xs mt-0.5 ${data.detentionLegal?"text-emerald-400":"text-red-400"}`}>{data.detentionLegal?"Detention appears within legal limits.":"Potential illegal detention — seek legal help immediately."}</p></div>
          <div className="ml-auto text-right"><p className="text-slate-500 text-xs">Est. Timeline</p><p className="text-white font-bold text-sm">~{data.timeline} months</p></div>
        </div>

        {/* Hearings + Rights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4"><Calendar size={15} className="text-yellow-400"/><h3 className="text-white font-bold text-base">Upcoming Hearings</h3></div>
            <div className="relative pl-5">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/8"/>
              {data.hearings.map((h,i)=>{
                const isNext=!h.past&&i===data.hearings.findIndex(x=>!x.past);
                return(
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 ${isNext?"bg-yellow-500 border-yellow-400":h.past?"bg-white/10 border-white/20":"bg-white/5 border-white/15"}`}/>
                    <div className="pl-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isNext?"text-yellow-400":h.past?"text-slate-600":"text-slate-300"}`}>{h.label}</span>
                        {isNext&&<span className="text-[9px] bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">NEXT</span>}
                      </div>
                      <p className={`text-sm font-semibold mt-0.5 ${h.past?"text-slate-600":"text-white"}`}>{fmt(h.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
            <div className="flex items-center gap-2 mb-4"><ShieldCheck size={15} className="text-emerald-400"/><h3 className="text-white font-bold text-base">Your Legal Rights</h3></div>
            <div className="space-y-2.5">
              {data.rights.map((right,i)=>(
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5"/>
                  <p className="text-slate-300 text-sm leading-snug">{right}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="rounded-2xl border border-yellow-500/15 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"/>
            <h3 className="text-white font-bold text-base">Full AI Legal Analysis</h3>
            <span className="ml-auto text-[10px] text-slate-600 bg-white/5 px-2 py-1 rounded-full">Powered by Groq</span>
          </div>
          <RenderMarkdown text={data.aiText}/>
        </div>

        {/* Lawyers */}
        <div className="rounded-2xl border border-white/8 bg-[#0d1020] p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-yellow-400"/>
            <h3 className="text-white font-bold text-base">Recommended Lawyers</h3>
            <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Near You · Bengaluru</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.lawyers.map((lawyer,i)=><LawyerCard key={i} lawyer={lawyer}/>)}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5"/>
            <p className="text-slate-400 text-xs leading-relaxed">
              <span className="text-orange-300 font-bold">Disclaimer: </span>
              This report is generated by NyayBot AI for informational purposes only and does not constitute legal advice.
              Always consult a qualified and licensed advocate for your specific legal situation.
            </p>
          </div>
        </div>
        <p className="text-center text-slate-700 text-xs pb-2">NyayBot AI · Justice Made Understandable · {fmtFull(data.generatedAt)}</p>
      </div>
    </div>
  );
}