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

// ─── PDF Generator — Professional Legal Document Style ───────────────────────
function generatePDF(data, fmtFull) {
  try {
    const doc    = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const W      = doc.internal.pageSize.getWidth();   // 210
    const H      = doc.internal.pageSize.getHeight();  // 297
    const mL     = 18; // left margin
    const mR     = 18; // right margin
    const mT     = 20; // top margin
    const cW     = W - mL - mR; // content width
    let   y      = mT;

    // ── Helpers ───────────────────────────────────────────────────────────
    const nl   = (n=5)  => { y += n; };
    const newPage = ()  => {
      addFooter();
      doc.addPage();
      // White background
      doc.setFillColor(255,255,255);
      doc.rect(0,0,W,H,"F");
      y = mT + 5;
    };
    const chk  = (n=15) => { if (y + n > H - 18) newPage(); };

    // Divider line
    const hr = (color=[180,160,80], thickness=0.4) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(thickness);
      doc.line(mL, y, W-mR, y);
      nl(4);
    };

    // Thin light divider
    const hrLight = () => {
      doc.setDrawColor(220,220,220);
      doc.setLineWidth(0.2);
      doc.line(mL, y, W-mR, y);
      nl(4);
    };

    // Section heading
    const sectionHead = (title) => {
      chk(16);
      nl(2);
      // Gold left border bar
      doc.setFillColor(212,160,23);
      doc.rect(mL, y-3, 3, 6, "F");
      doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.setTextColor(30,30,30);
      doc.text(title, mL+6, y+1);
      nl(8);
      // Underline
      doc.setDrawColor(212,160,23); doc.setLineWidth(0.3);
      doc.line(mL, y, W-mR, y);
      nl(5);
    };

    // Body text
    const bodyText = (txt, x=mL, size=9, color=[60,60,60], style="normal") => {
      doc.setFontSize(size); doc.setFont("helvetica", style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(txt), W-mR-x);
      lines.forEach(line => {
        chk(5);
        doc.text(line, x, y);
        nl(5);
      });
    };

    // Label + value on same line
    const labelVal = (label, val, labelColor=[120,100,40], valColor=[30,30,30]) => {
      chk(6);
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...labelColor);
      doc.text(label, mL, y);
      doc.setFont("helvetica","normal"); doc.setTextColor(...valColor);
      doc.text(String(val), mL+45, y);
      nl(5.5);
    };

    // Footer on each page
    const addFooter = () => {
      const pg = doc.internal.getNumberOfPages();
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(150,150,150);
      // Gold line above footer
      doc.setDrawColor(212,160,23); doc.setLineWidth(0.3);
      doc.line(mL, H-12, W-mR, H-12);
      doc.text("NyayBot AI  |  Justice Made Understandable  |  nyaybot.in", mL, H-7);
      doc.text(`Page ${pg}`, W-mR, H-7, {align:"right"});
      doc.text("This report does not constitute legal advice.", W/2, H-7, {align:"center"});
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 1 — COVER + OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════

    // White background
    doc.setFillColor(255,255,255);
    doc.rect(0,0,W,H,"F");

    // ── Top gold banner ──
    doc.setFillColor(212,160,23);
    doc.rect(0,0,W,28,"F");

    // Logo circle
    doc.setFillColor(30,30,30);
    doc.circle(mL+8, 14, 8, "F");
    doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(212,160,23);
    doc.text("NY", mL+4.5, 16);

    // Title in banner
    doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("NyayBot", mL+22, 12);
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(30,30,30);
    doc.text("AI-POWERED LEGAL CASE REPORT", mL+22, 19);

    // Date top right in banner
    doc.setFontSize(7); doc.setTextColor(30,30,30);
    doc.text(`Generated: ${fmtFull(data.generatedAt)}`, W-mR, 10, {align:"right"});
    doc.text("CONFIDENTIAL", W-mR, 19, {align:"right"});

    y = 36;

    // ── Case overview box ──
    doc.setFillColor(250,247,235);
    doc.roundedRect(mL, y, cW, 38, 2, 2, "F");
    doc.setDrawColor(212,160,23); doc.setLineWidth(0.5);
    doc.roundedRect(mL, y, cW, 38, 2, 2, "S");

    // Overview heading inside box
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(120,90,20);
    doc.text("CASE OVERVIEW", mL+5, y+8);

    // 4-column grid inside box
    const boxCols = [
      {label:"Case Type",       val: data.caseType},
      {label:"Sections Found",  val: String(data.sections.length)},
      {label:"Est. Timeline",   val: `${data.timeline} months`},
      {label:"Detention",       val: data.detentionLegal ? "Within Limits" : "Check Required"},
    ];
    const colW = cW / 4;
    boxCols.forEach((col, i) => {
      const cx = mL + i * colW + 5;
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(130,110,50);
      doc.text(col.label, cx, y+18);
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.setTextColor(i===3 && !data.detentionLegal ? [180,50,50] : i===3 ? [30,120,60] : [30,30,30]);
      doc.text(col.val, cx, y+28);
    });

    // Vertical dividers inside box
    for(let i=1; i<4; i++) {
      doc.setDrawColor(212,160,23); doc.setLineWidth(0.2);
      doc.line(mL+i*colW, y+12, mL+i*colW, y+35);
    }
    y += 44;

    // ── Your Query ──
    if (data.inputQuery) {
      chk(20);
      nl(3);
      doc.setFillColor(245,245,245);
      const qlines = doc.splitTextToSize(data.inputQuery, cW-10);
      const qH = qlines.length * 5 + 14;
      doc.roundedRect(mL, y, cW, qH, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(120,100,40);
      doc.text("YOUR QUERY", mL+5, y+7);
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
      qlines.forEach((line, i) => doc.text(line, mL+5, y+14+(i*5)));
      y += qH + 6;
    }

    // ── Plain Language Summary ──
    sectionHead("PLAIN-LANGUAGE SUMMARY");
    bodyText(data.summary, mL, 9, [50,50,50]);
    nl(2);

    // ── Bail Probability ──
    sectionHead("BAIL PROBABILITY ASSESSMENT");

    // Bail box
    const bailBoxH = 32;
    chk(bailBoxH+5);
    const bailBg = data.bailColor==="emerald"?[235,250,242]:data.bailColor==="yellow"?[253,248,225]:[253,235,235];
    const bailAccent = data.bailColor==="emerald"?[22,163,74]:data.bailColor==="yellow"?[161,120,0]:[185,28,28];
    doc.setFillColor(...bailBg);
    doc.roundedRect(mL, y, cW, bailBoxH, 2, 2, "F");
    doc.setDrawColor(...bailAccent); doc.setLineWidth(0.5);
    doc.roundedRect(mL, y, cW, bailBoxH, 2, 2, "S");

    // Big percentage
    doc.setFontSize(30); doc.setFont("helvetica","bold"); doc.setTextColor(...bailAccent);
    doc.text(`${data.bailPct}%`, mL+8, y+22);

    // Label
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...bailAccent);
    doc.text(data.bailLabel, mL+40, y+14);

    // Progress bar
    doc.setFillColor(220,220,220);
    doc.roundedRect(mL+40, y+17, cW-50, 5, 1, 1, "F");
    doc.setFillColor(...bailAccent);
    doc.roundedRect(mL+40, y+17, (cW-50)*(data.bailPct/100), 5, 1, 1, "F");

    // Reasoning
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(...bailAccent);
    doc.text("Based on AI analysis of case details. Consult a lawyer for accurate assessment.", mL+40, y+27);

    y += bailBoxH + 8;

    // Reasoning bullets
    if (data.sections.some(s=>s.bailable)) {
      chk(6); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(22,120,60);
      doc.text("[+] All identified offences are bailable under IPC.", mL+3, y); nl(5);
    }
    if (data.sections.some(s=>!s.bailable)) {
      chk(6); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(180,40,40);
      doc.text("[-] Non-bailable offences identified — court discretion required.", mL+3, y); nl(5);
    }
    nl(2);

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL SECTIONS
    // ═══════════════════════════════════════════════════════════════════════
    if (data.sections.length > 0) {
      sectionHead("IDENTIFIED LEGAL SECTIONS");
      // Table header
      doc.setFillColor(212,160,23);
      doc.rect(mL, y, cW, 7, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("Section Code", mL+3, y+5);
      doc.text("Description", mL+38, y+5);
      doc.text("Status", W-mR-20, y+5);
      nl(7);

      data.sections.forEach((sec, i) => {
        chk(8);
        if (i % 2 === 0) {
          doc.setFillColor(249,246,235);
          doc.rect(mL, y-3, cW, 8, "F");
        }
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(120,90,20);
        doc.text(sec.code, mL+3, y+2);
        doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
        doc.text(sec.name, mL+38, y+2);
        const statusColor = sec.bailable ? [22,120,60] : [185,28,28];
        doc.setFont("helvetica","bold"); doc.setTextColor(...statusColor);
        doc.text(sec.bailable?"Bailable":"Non-Bailable", W-mR-20, y+2);
        nl(8);
      });
      nl(3);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DETENTION + TIMELINE
    // ═══════════════════════════════════════════════════════════════════════
    sectionHead("ILLEGAL DETENTION CHECK & TIMELINE");
    chk(18);
    const detColor = data.detentionLegal ? [22,120,60] : [185,28,28];
    const detBg    = data.detentionLegal ? [235,250,242] : [253,235,235];
    doc.setFillColor(...detBg);
    doc.roundedRect(mL, y, cW/2-3, 16, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...detColor);
    doc.text("Detention Status", mL+4, y+6);
    doc.setFont("helvetica","normal"); doc.setFontSize(8);
    doc.text(data.detentionLegal?"Within Legal Limits":"Potentially Illegal", mL+4, y+12);

    doc.setFillColor(245,245,245);
    doc.roundedRect(mL+cW/2+3, y, cW/2-3, 16, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(100,80,20);
    doc.text("Estimated Timeline", mL+cW/2+7, y+6);
    doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
    doc.text(`~${data.timeline} months to resolution`, mL+cW/2+7, y+12);
    y += 22;

    // ═══════════════════════════════════════════════════════════════════════
    // HEARINGS
    // ═══════════════════════════════════════════════════════════════════════
    sectionHead("UPCOMING HEARINGS");
    data.hearings.forEach((h, i) => {
      chk(9);
      const ds  = h.date.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
      const isPast = h.date < new Date();
      const isNext = !isPast && i === data.hearings.findIndex(x => !x.past);

      if (isNext) {
        doc.setFillColor(255,248,220);
        doc.roundedRect(mL, y-3, cW, 9, 1, 1, "F");
        doc.setDrawColor(212,160,23); doc.setLineWidth(0.3);
        doc.roundedRect(mL, y-3, cW, 9, 1, 1, "S");
      }

      // Bullet
      doc.setFillColor(isPast?[180,180,180]:isNext?[212,160,23]:[50,130,200]);
      doc.circle(mL+3, y+1, 1.5, "F");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", isNext?"bold":"normal");
      doc.setTextColor(isPast?150:30, isPast?150:30, isPast?150:30);
      doc.text(h.label, mL+8, y+2);

      doc.setFont("helvetica","bold");
      doc.setTextColor(isPast?150:isNext?120:50, isPast?150:isNext?90:50, isPast?150:isNext?20:50);
      doc.text(ds, W-mR-35, y+2);

      if (isNext) {
        doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(160,120,0);
        doc.text("NEXT HEARING", W-mR-5, y+2, {align:"right"});
      }
      nl(9);
    });
    nl(2);

    // ═══════════════════════════════════════════════════════════════════════
    // LEGAL RIGHTS
    // ═══════════════════════════════════════════════════════════════════════
    sectionHead("YOUR LEGAL RIGHTS");
    data.rights.forEach((right, i) => {
      chk(8);
      // Number badge
      doc.setFillColor(212,160,23);
      doc.circle(mL+3, y+0.5, 2.5, "F");
      doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(String(i+1), mL+3, y+1.5, {align:"center"});

      const rlines = doc.splitTextToSize(right, cW-12);
      doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(40,40,40);
      rlines.forEach((line, li) => {
        chk(5);
        doc.text(line, mL+9, y+(li===0?1:0));
        if (li < rlines.length-1) nl(5);
      });
      nl(8);
    });
    nl(2);

    // ═══════════════════════════════════════════════════════════════════════
    // AI ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════
    sectionHead("FULL AI LEGAL ANALYSIS");

    // Clean AI text — remove markdown, emojis and special chars
    const cleanAI = (data.aiText || "No AI analysis available.")
      .replace(/\*\*/g,"").replace(/\*/g,"")
      .replace(/#{1,4}\s/g,"")
      .replace(/`/g,"")
      .replace(/[^\x00-\x7F]/g," ") // remove all non-ASCII (emojis etc)
      .replace(/\s+/g," ")
      .trim();

    const aiParas = cleanAI.split(/\n+/).filter(p => p.trim().length > 3);
    aiParas.forEach(para => {
      chk(10);
      const isHeading = para.length < 60 && !para.endsWith(".");
      if (isHeading) {
        nl(2);
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,60,20);
        const pLines = doc.splitTextToSize(para, cW);
        pLines.forEach(l => { chk(5); doc.text(l, mL, y); nl(5); });
      } else {
        const pLines = doc.splitTextToSize(para, cW);
        doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(50,50,50);
        pLines.forEach(l => { chk(5); doc.text(l, mL, y); nl(5); });
      }
      nl(1);
    });
    nl(3);

    // ═══════════════════════════════════════════════════════════════════════
    // RECOMMENDED LAWYERS
    // ═══════════════════════════════════════════════════════════════════════
    sectionHead("RECOMMENDED LAWYERS NEAR YOU");

    data.lawyers.forEach((lw, i) => {
      chk(38);
      const lwBoxH = lw.proBono ? 36 : 32;

      // Alternating backgrounds
      doc.setFillColor(i%2===0 ? [252,249,240] : [248,252,248]);
      doc.roundedRect(mL, y, cW, lwBoxH, 2, 2, "F");
      doc.setDrawColor(200,190,160); doc.setLineWidth(0.3);
      doc.roundedRect(mL, y, cW, lwBoxH, 2, 2, "S");

      // Left gold accent strip
      doc.setFillColor(212,160,23);
      doc.roundedRect(mL, y, 3, lwBoxH, 1, 1, "F");

      // Number badge
      doc.setFillColor(30,30,30);
      doc.circle(mL+12, y+8, 5, "F");
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(212,160,23);
      doc.text(String(i+1), mL+12, y+10, {align:"center"});

      // Name
      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(20,20,20);
      doc.text(lw.name, mL+22, y+9);

      // Pro bono badge
      if (lw.proBono) {
        doc.setFillColor(22,120,60);
        doc.roundedRect(W-mR-22, y+4, 20, 6, 1, 1, "F");
        doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("PRO BONO", W-mR-18, y+8.5, {align:"center"});
      }

      // Specialisation
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80,70,40);
      doc.text(`${lw.spec}  |  ${lw.area}`, mL+22, y+15);

      // Rating row
      doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
      doc.text(`Rating: ${lw.rating}  |  ${lw.cases} cases  |  ${lw.success}% success  |  ${lw.exp} yrs exp`, mL+22, y+21);

      // Contact row
      doc.text(`Languages: ${lw.langs}`, mL+22, y+27);
      doc.setFont("helvetica","bold"); doc.setTextColor(120,90,20);
      doc.text(lw.fee+"/hearing", W-mR-38, y+27);
      doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
      doc.text(`Ph: ${lw.phone}`, W-mR-38, y+33);

      y += lwBoxH + 5;
    });

    nl(4);

    // ═══════════════════════════════════════════════════════════════════════
    // DISCLAIMER
    // ═══════════════════════════════════════════════════════════════════════
    chk(22);
    doc.setFillColor(255,245,230);
    doc.roundedRect(mL, y, cW, 20, 2, 2, "F");
    doc.setDrawColor(200,130,30); doc.setLineWidth(0.4);
    doc.roundedRect(mL, y, cW, 20, 2, 2, "S");
    doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(150,80,0);
    doc.text("IMPORTANT DISCLAIMER", mL+5, y+7);
    doc.setFont("helvetica","normal"); doc.setTextColor(100,60,0);
    const discText = "This report is generated by NyayBot AI for informational purposes only and does not constitute legal advice. Always consult a qualified and licensed advocate for your specific legal situation. Bail probability estimates are indicative and may vary.";
    const discLines = doc.splitTextToSize(discText, cW-10);
    discLines.forEach((line, i) => doc.text(line, mL+5, y+13+(i*4)));
    y += 25;

    // ── Add footer to all pages ──
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Footer gold line
      doc.setDrawColor(212,160,23); doc.setLineWidth(0.4);
      doc.line(mL, H-13, W-mR, H-13);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(120,100,40);
      doc.text("NyayBot AI  |  Justice Made Understandable  |  nyaybot.in", mL, H-7);
      doc.setTextColor(150,150,150);
      doc.text("This report does not constitute legal advice.", W/2, H-7, {align:"center"});
      doc.setTextColor(120,100,40);
      doc.text(`Page ${i} of ${totalPages}`, W-mR, H-7, {align:"right"});
    }

    doc.save(`NyayBot-Legal-Report-${new Date().toISOString().slice(0,10)}.pdf`);
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