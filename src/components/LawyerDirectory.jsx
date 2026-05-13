import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Phone, Mail, MapPin, Star, X, SlidersHorizontal, Mic, MicOff, User } from "lucide-react";
import { t } from "../i18n";

const ALL_LAWYERS = [
  { id: 1, name: "Adv. Priya Sharma",  address: "42, MG Road, Bengaluru 560001",        phone: "+91 98451 23456", email: "priya.sharma@legalaid.in",  rating: 4.8, available: true,  age: 38, gender: "female" },
  { id: 2, name: "Adv. Ramesh Nair",   address: "18, Infantry Road, Bengaluru 560001",   phone: "+91 98321 87654", email: "ramesh.nair@nyayalegal.in", rating: 4.6, available: true,  age: 45, gender: "male"   },
  { id: 3, name: "Adv. Fatima Zaidi",  address: "7, Cunningham Road, Bengaluru 560052",  phone: "+91 94481 55567", email: "fatima.zaidi@hrlaw.in",     rating: 4.9, available: false, age: 42, gender: "female" },
  { id: 4, name: "Adv. Suresh Kumar",  address: "5, Residency Road, Bengaluru 560025",   phone: "+91 97410 33221", email: "suresh.kumar@sk-legal.in",  rating: 4.3, available: true,  age: 52, gender: "male"   },
  { id: 5, name: "Adv. Meena Iyer",    address: "33, Lavelle Road, Bengaluru 560001",    phone: "+91 99000 44312", email: "meena.iyer@lawfirm.in",     rating: 4.7, available: true,  age: 35, gender: "female" },
  { id: 6, name: "Adv. Vikram Patel",  address: "21, Brigade Road, Bengaluru 560001",    phone: "+91 96550 78901", email: "vikram.patel@vplaw.in",     rating: 4.5, available: false, age: 48, gender: "male"   },
  { id: 7, name: "Adv. Deepa Reddy",   address: "14, Koramangala 5th Block, Bengaluru",  phone: "+91 91234 56789", email: "deepa.reddy@dlegal.in",     rating: 4.4, available: true,  age: 40, gender: "female" },
  { id: 8, name: "Adv. Arjun Menon",   address: "9, Indiranagar 100ft Road, Bengaluru",  phone: "+91 98765 43210", email: "arjun.menon@menon-law.in",  rating: 4.2, available: true,  age: 33, gender: "male"   },
  { id: 9, name: "Adv. Sunita Joshi",  address: "67, Jayanagar 4th Block, Bengaluru",    phone: "+91 95555 12345", email: "sunita.joshi@joshilaw.in",  rating: 4.6, available: false, age: 55, gender: "female" },
];

function VoiceModal({ state, onClose, onSpeak, lang }) {
  if (!state) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[340px] mx-4 p-8 flex flex-col items-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>
        {state === "listening" ? (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-6">{t(lang, "lawyers_listening")}</h2>
            <div className="flex gap-2 mb-6">
              {[0,1,2,3,4].map((i) => (
                <span
                  key={i}
                  className="w-4 h-4 rounded-full animate-bounce"
                  style={{ backgroundColor: i % 2 === 0 ? "#f97316" : "#3b82f6", animationDelay: `${i * 0.12}s`, animationDuration: "0.8s" }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">{t(lang, "lawyers_try_again")}</h2>
            <div className="my-6">
              <button
                onClick={onSpeak}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 transition-all active:scale-95"
              >
                <Mic size={36} className="text-white" />
              </button>
            </div>
            <span className="text-slate-500 text-sm font-medium">{t(lang, "lawyers_click_speak")}</span>
          </>
        )}
      </div>
    </div>
  );
}

function LawyerCard({ lawyer, lang }) {
  const initials = lawyer.name.split(" ").slice(1, 3).map((n) => n[0]).join("");
  const isFemale = lawyer.gender === "female";

  return (
    <div className="group bg-[#111827] border border-white/8 hover:border-yellow-500/30 rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_0_30px_rgba(234,179,8,0.07)] flex flex-col sm:flex-row sm:items-center gap-5">

      {/* Left: avatar + name + meta */}
      <div className="flex items-center gap-4 sm:w-64 shrink-0">
        <div className="relative shrink-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg font-serif border ${
            isFemale
              ? "bg-gradient-to-br from-pink-500/20 to-purple-600/10 border-pink-500/20 text-pink-300"
              : "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-300"
          }`}>
            {initials}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#111827] ${lawyer.available ? "bg-emerald-400" : "bg-slate-600"}`} />
        </div>
        <div>
          <h3 className="text-white font-bold text-[15px] leading-snug group-hover:text-yellow-100 transition-colors">{lawyer.name}</h3>
          <p className={`text-xs font-medium mt-0.5 ${lawyer.available ? "text-emerald-400" : "text-slate-500"}`}>
            {lawyer.available ? t(lang, "lawyers_available") : t(lang, "lawyers_busy")}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-300 font-bold text-xs">{lawyer.rating}</span>
            </div>
            {/* Age badge */}
            <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 font-medium">
              {t(lang, "lawyers_age")}: {lawyer.age}
            </span>
            {/* Gender badge */}
            <span className={`text-[10px] rounded-full px-2 py-0.5 font-semibold border ${
              isFemale
                ? "bg-pink-500/10 border-pink-500/25 text-pink-400"
                : "bg-blue-500/10 border-blue-500/25 text-blue-400"
            }`}>
              <User size={8} className="inline mr-0.5" />
              {isFemale ? t(lang, "lawyers_female") : t(lang, "lawyers_male")}
            </span>
          </div>
        </div>
      </div>

      {/* Center: contact info */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-yellow-500/60 mt-0.5 shrink-0" />
          <span className="text-slate-400 text-xs leading-snug">{lawyer.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={13} className="text-yellow-500/60 shrink-0" />
          <a href={`tel:${lawyer.phone}`} className="text-slate-400 text-xs hover:text-yellow-400 transition-colors">{lawyer.phone}</a>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={13} className="text-yellow-500/60 shrink-0" />
          <a href={`mailto:${lawyer.email}`} className="text-slate-400 text-xs hover:text-yellow-400 transition-colors truncate">{lawyer.email}</a>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex sm:flex-col gap-2 shrink-0">
        <a href={`tel:${lawyer.phone}`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap">
          <Phone size={13} /> {t(lang, "lawyers_call")}
        </a>
        <a
          href={`https://wa.me/${lawyer.phone.replace(/\D/g,"")}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold text-xs transition-all shadow-md shadow-green-500/20 whitespace-nowrap"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.549 4.1 1.51 5.829L.057 23.997l6.304-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.369l-.36-.214-3.733.979.996-3.638-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
          {t(lang, "lawyers_whatsapp")}
        </a>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 hover:border-yellow-500 font-bold text-xs transition-all whitespace-nowrap">
          <Mail size={13} /> {t(lang, "lawyers_enquiry")}
        </button>
      </div>
    </div>
  );
}

export default function LawyerDirectory({ onBack, lang = "en" }) {
  const [search, setSearch] = useState("");
  const [showAvailOnly, setShowAvailOnly] = useState(false);
  const [filtered, setFiltered] = useState(ALL_LAWYERS);
  const [voiceState, setVoiceState] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      ALL_LAWYERS.filter((l) => {
        const match =
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          (l.gender && l.gender.includes(q));
        return match && (!showAvailOnly || l.available);
      })
    );
  }, [search, showAvailOnly]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-IN";
    r.onstart = () => setVoiceState("listening");
    r.onresult = (e) => { setSearch(e.results[0][0].transcript); setVoiceState(null); };
    r.onerror = () => setVoiceState("error");
    r.onend = () => setVoiceState((prev) => prev === "listening" ? "error" : prev);
    r.start();
    recognitionRef.current = r;
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceState(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white pt-20">
      <VoiceModal state={voiceState} onClose={stopListening} onSpeak={startListening} lang={lang} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title row */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20"
          >
            <ArrowLeft size={16} /> {t(lang, "hero_back")}
          </button>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-2xl font-serif font-bold text-white">{t(lang, "lawyers_title")}</h1>
          <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full tabular-nums">
            {filtered.length} {filtered.length !== 1 ? t(lang, "lawyers_count_n") : t(lang, "lawyers_count_1")}
          </span>
        </div>

        {/* Search bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, "lawyers_search_placeholder")}
              className="w-full bg-[#111827] border border-white/8 focus:border-yellow-500/40 rounded-2xl pl-10 pr-20 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button onClick={() => setSearch("")} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-white/8 transition-all">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={startListening}
                className={`p-1.5 rounded-lg transition-all ${voiceState === "listening" ? "text-red-400 bg-red-500/15" : "text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"}`}
              >
                {voiceState === "listening" ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAvailOnly((v) => !v)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold border transition-all duration-200 whitespace-nowrap ${
              showAvailOnly
                ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-400"
                : "bg-[#111827] border-white/8 text-slate-400 hover:text-slate-200 hover:border-white/15"
            }`}
          >
            <SlidersHorizontal size={15} /> {t(lang, "lawyers_available_only")}
          </button>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-lg">{t(lang, "lawyers_none")}</p>
            <p className="text-slate-600 text-sm mt-2">{t(lang, "lawyers_none_sub")}</p>
            <button
              onClick={() => { setSearch(""); setShowAvailOnly(false); }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all hover:bg-white/10"
            >
              {t(lang, "lawyers_clear")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((l) => (
              <LawyerCard key={l.id} lawyer={l} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}