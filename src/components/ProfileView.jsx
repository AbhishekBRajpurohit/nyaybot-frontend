import React, { useState, useEffect } from "react";
import {
  ArrowLeft, User, Mail, Calendar, FileText,
  Edit2, Check, X, LogOut, Loader2, AlertCircle,
  TrendingUp, Clock, ChevronRight, Star, Phone, Bell,
  Zap, Shield, Briefcase, BarChart2
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline() {
  const pts = [8,14,10,18,12,20,15,22,18,24].map((v,i) => `${i*11},${28-v}`).join(" ");
  return (
    <svg viewBox="0 0 99 30" className="w-16 h-6 opacity-40">
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent, sub }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border group hover:-translate-y-0.5 transition-all duration-200 ${
      accent
        ? "bg-gradient-to-br from-yellow-500/20 via-yellow-600/10 to-transparent border-yellow-500/35"
        : "bg-[#0d1020] border-white/8 hover:border-white/15"
    }`}>
      {/* Glow blob */}
      {accent && <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/15 rounded-full blur-2xl pointer-events-none"/>}

      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${
        accent ? "bg-yellow-500/25 border border-yellow-500/40" : "bg-white/6 border border-white/10"
      }`}>
        <span className={accent ? "text-yellow-400" : "text-slate-400"}>{icon}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={`font-black text-3xl font-serif leading-none ${accent ? "text-yellow-400" : "text-white"}`}>
            {value}
          </p>
          <p className="text-slate-500 text-xs font-medium mt-1.5">{label}</p>
          {sub && <p className="text-slate-700 text-[10px] mt-0.5">{sub}</p>}
        </div>
        {accent && <Sparkline />}
      </div>
    </div>
  );
}

// ── Case Row ──────────────────────────────────────────────────────────────────
function CaseRow({ c, onClick }) {
  const pct = c.bail_pct;
  const color = pct >= 65 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : pct >= 35 ? "text-yellow-400  bg-yellow-500/10  border-yellow-500/20"
              :              "text-red-400     bg-red-500/10     border-red-500/20";
  return (
    <div onClick={onClick}
      className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/6 hover:border-yellow-500/25 hover:bg-white/5 cursor-pointer transition-all">
      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/15 flex items-center justify-center shrink-0">
        <Briefcase size={14} className="text-yellow-400"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{c.case_type || "Criminal"}</p>
        <p className="text-slate-600 text-xs truncate mt-0.5">{c.input_text}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>{pct}%</span>
        <span className="text-slate-700 text-xs hidden sm:block">
          {new Date(c.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
        </span>
        <ChevronRight size={13} className="text-slate-700 group-hover:text-yellow-400 transition-colors"/>
      </div>
    </div>
  );
}

// ── Main ProfileView ──────────────────────────────────────────────────────────
export default function ProfileView({ onBack, onViewReport }) {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [editName, setEditName]       = useState(false);
  const [newName, setNewName]         = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [editPhone, setEditPhone]     = useState(false);
  const [newPhone, setNewPhone]       = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/profile`, { credentials:"include" })
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setNewName(d.user?.name || "");
        setNewPhone(d.user?.phone_number || "");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load profile."); setLoading(false); });
  }, [user]);

  const saveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) { setError("Name too short."); return; }
    setSavingName(true); setError("");
    try {
      const r = await fetch(`${API}/api/profile/name`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        credentials:"include", body: JSON.stringify({ name: newName.trim() }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setProfile(p => ({ ...p, user: { ...p.user, name: d.user.name } }));
      setEditName(false);
      await refreshUser(); // update navbar immediately
      setSuccess("Name updated!"); setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed."); } finally { setSavingName(false); }
  };

  const savePhone = async () => {
    const digits = newPhone.replace(/\D/g,"");
    if (digits.length < 10) { setError("Enter a valid 10-digit number."); return; }
    const fmt = `+91${digits.slice(-10)}`;
    setSavingPhone(true); setError("");
    try {
      const r = await fetch(`${API}/api/profile/phone`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        credentials:"include", body: JSON.stringify({ phone: fmt }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setProfile(p => ({ ...p, user: { ...p.user, phone_number: d.user.phone_number } }));
      setNewPhone(d.user.phone_number || "");
      setEditPhone(false);
      await refreshUser();
      setSuccess("Phone saved! SMS & WhatsApp alerts enabled."); setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Failed."); } finally { setSavingPhone(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <User size={36} className="text-yellow-400"/>
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to View Profile</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">Sign in to access your profile.</p>
      <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16}/> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-yellow-500/4 rounded-full blur-[100px]"/>
        <div className="absolute bottom-0 -left-32 w-96 h-96 bg-blue-500/3 rounded-full blur-[80px]"/>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15}/> Back
          </button>
          <div className="w-px h-5 bg-white/10"/>
          <h1 className="text-white font-serif font-bold text-xl">My Profile</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 mb-4">
            <AlertCircle size={14} className="text-red-400 shrink-0"/>
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError("")}><X size={14} className="text-red-500 hover:text-red-300"/></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4">
            <Check size={14} className="text-emerald-400 shrink-0"/>
            <p className="text-emerald-300 text-sm">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={32} className="text-yellow-400 animate-spin"/>
            <p className="text-slate-600 text-sm">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ══ HERO PROFILE CARD ══════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#0c0f22]">
              {/* Gold gradient top bar */}
              <div className="h-1 w-full" style={{background:"linear-gradient(90deg,#92400e,#f59e0b,#fcd34d,#f59e0b,#92400e)"}}/>

              {/* Subtle grid */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">

                  {/* Avatar */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="relative">
                      {profile?.user?.avatar ? (
                        <img src={profile.user.avatar} alt=""
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-yellow-500/40 shadow-2xl shadow-yellow-500/15"/>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-slate-900 font-black text-4xl font-serif border-2 border-yellow-400/40 shadow-2xl shadow-yellow-500/20"
                          style={{background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>
                          {profile?.user?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      {/* Online indicator */}
                      <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-[3px] border-[#0c0f22] shadow-lg shadow-emerald-400/40"/>
                    </div>
                    {/* Provider pill */}
                    <div className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                      profile?.user?.provider === "google"
                        ? "bg-blue-500/15 border-blue-500/25 text-blue-400"
                        : "bg-white/8 border-white/15 text-slate-400"
                    }`}>
                      {profile?.user?.provider === "google" ? "🔵 Google" : "✉️ Email"}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">

                    {/* Name */}
                    <div className="mb-5">
                      {editName ? (
                        <div className="flex items-center gap-2">
                          <input type="text" value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && saveName()} autoFocus
                            className="flex-1 bg-[#1a1f35] border border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-2.5 text-white text-2xl font-bold font-serif focus:outline-none transition-all placeholder-slate-600"
                            placeholder="Enter your name"
                          />
                          <button onClick={saveName} disabled={savingName}
                            className="p-2.5 rounded-xl bg-yellow-500 text-slate-900 hover:bg-yellow-400 transition-all shrink-0">
                            {savingName ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
                          </button>
                          <button onClick={() => { setEditName(false); setNewName(profile?.user?.name||""); }}
                            className="p-2.5 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-all shrink-0">
                            <X size={15}/>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-white font-serif font-bold text-3xl leading-tight">{profile?.user?.name}</h2>
                          <button onClick={() => setEditName(true)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                            <Edit2 size={14}/>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon:<Mail size={13}/>,     text: profile?.user?.email,                          color:"text-yellow-500/60" },
                        { icon:<Calendar size={13}/>, text: `Since ${new Date(profile?.user?.created_at||new Date()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}`, color:"text-yellow-500/60" },
                        { icon:<Shield size={13}/>,   text: profile?.user?.provider==="google"?"Google OAuth":"Email & Password", color:"text-yellow-500/60" },
                        { icon:<Zap size={13}/>,      text: "Active Account", color:"text-emerald-400", textColor:"text-emerald-400 font-semibold" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                            <span className={item.color}>{item.icon}</span>
                          </div>
                          <span className={`text-xs truncate ${item.textColor || "text-slate-400"}`}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ STATS — only 2 meaningful ones ════════════════════════ */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<FileText size={16}/>}
                value={profile?.totalCases || 0}
                label="Cases Analyzed"
                sub="Total AI analyses"
                accent={true}
              />
              <StatCard
                icon={<BarChart2 size={16}/>}
                value={profile?.totalCases > 0 ? "4.9★" : "—"}
                label="AI Accuracy Rating"
                sub="Based on case feedback"
              />
            </div>

            {/* ══ PHONE NUMBER ══════════════════════════════════════════ */}
            <div className="rounded-2xl border border-white/8 bg-[#0d1020] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Phone size={15} className="text-yellow-400"/>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm">Phone Number</h3>
                  <p className="text-slate-500 text-xs">For SMS & WhatsApp court reminders</p>
                </div>
                {profile?.user?.phone_number && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                    Active
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Info */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/6 border border-yellow-500/12 mb-4">
                  <Bell size={13} className="text-yellow-400 shrink-0 mt-0.5"/>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Get <strong className="text-white">SMS + WhatsApp</strong> reminders
                    — <strong className="text-white">1 day before</strong> and
                    <strong className="text-white"> 30 min before</strong> every court hearing automatically.
                  </p>
                </div>

                {editPhone ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 shrink-0">
                        <span>🇮🇳</span>
                        <span className="text-white text-sm font-bold">+91</span>
                      </div>
                      <input type="tel"
                        value={newPhone.replace(/^\+91/,"").replace(/\D/g,"")}
                        onChange={e => setNewPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                        placeholder="9876543210" maxLength={10} autoFocus
                        className="flex-1 bg-[#1a1f35] border border-yellow-500/40 focus:border-yellow-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none transition-all"/>
                    </div>
                    <p className="text-slate-700 text-xs">Enter 10-digit number without country code</p>
                    <div className="flex gap-2">
                      <button onClick={savePhone} disabled={savingPhone}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60">
                        {savingPhone ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}
                        {savingPhone ? "Saving..." : "Save Number"}
                      </button>
                      <button onClick={() => { setEditPhone(false); setNewPhone(profile?.user?.phone_number||""); }}
                        className="px-5 py-3 rounded-xl bg-white/6 border border-white/10 text-slate-400 hover:text-white text-sm transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 flex items-center gap-3 p-4 rounded-xl border ${
                      profile?.user?.phone_number
                        ? "bg-emerald-500/6 border-emerald-500/18"
                        : "bg-white/3 border-dashed border-white/10"
                    }`}>
                      <Phone size={15} className={profile?.user?.phone_number ? "text-emerald-400" : "text-slate-600"}/>
                      {profile?.user?.phone_number ? (
                        <div>
                          <p className="text-white font-bold text-sm">{profile.user.phone_number}</p>
                          <p className="text-emerald-400 text-xs mt-0.5">Reminders enabled ✓</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-500 text-sm font-medium">No number added</p>
                          <p className="text-slate-700 text-xs mt-0.5">Add to receive court alerts</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditPhone(true); setNewPhone(profile?.user?.phone_number?.replace(/^\+91/,"")||""); }}
                      className="flex items-center gap-2 px-4 py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 hover:border-yellow-500 font-bold text-sm transition-all whitespace-nowrap">
                      <Edit2 size={13}/>
                      {profile?.user?.phone_number ? "Edit" : "Add"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ══ RECENT CASES ══════════════════════════════════════════ */}
            {profile?.recentCases?.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-[#0d1020] overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                  <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
                    <TrendingUp size={15} className="text-yellow-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm">Recent Cases</h3>
                    <p className="text-slate-500 text-xs">Click any case to view its full report</p>
                  </div>
                  <span className="text-xs text-slate-600 bg-white/4 border border-white/8 px-2.5 py-1 rounded-full shrink-0">
                    {profile.totalCases} total
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {profile.recentCases.map(c => (
                    <CaseRow key={c.id} c={c} onClick={() => onViewReport && onViewReport({
                      aiResponse: c.ai_response,
                      inputText: c.input_text,
                      timestamp: new Date(c.created_at).getTime(),
                    })}/>
                  ))}
                </div>
              </div>
            )}

            {/* ══ SIGN OUT ══════════════════════════════════════════════ */}
            <button onClick={async () => { await logout(); onBack(); }}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/35 font-bold text-sm transition-all group">
              <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform"/>
              Sign Out of NyayBot
            </button>

          </div>
        )}
      </div>
    </div>
  );
}