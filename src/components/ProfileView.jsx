import React, { useState, useEffect } from "react";
import {
  ArrowLeft, User, Mail, Shield, Calendar, FileText,
  Edit2, Check, X, LogOut, Loader2, AlertCircle,
  TrendingUp, Clock, ChevronRight, Star, Phone, Bell,
  Award, Activity, Briefcase
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:4000";

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all group hover:-translate-y-0.5 ${
      accent
        ? "bg-gradient-to-br from-yellow-500/15 to-yellow-600/5 border-yellow-500/30"
        : "bg-white/4 border-white/8 hover:border-white/15"
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
        accent ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-white/8 border border-white/10"
      }`}>
        <span className={accent ? "text-yellow-400" : "text-slate-400"}>{icon}</span>
      </div>
      <p className={`font-black text-3xl font-serif leading-none mb-1 ${accent ? "text-yellow-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-slate-500 text-xs font-medium">{label}</p>
      {/* Subtle glow for accent card */}
      {accent && (
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
      )}
    </div>
  );
}

// ── Case History Row ──────────────────────────────────────────────────────────
function CaseRow({ c, onClick }) {
  const bailColor = c.bail_pct >= 65 ? "text-emerald-400" : c.bail_pct >= 35 ? "text-yellow-400" : "text-red-400";
  const bailBg    = c.bail_pct >= 65 ? "bg-emerald-500/10 border-emerald-500/20" : c.bail_pct >= 35 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/20";
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/6 hover:border-yellow-500/25 hover:bg-white/5 transition-all cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <Briefcase size={15} className="text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{c.case_type || "Criminal"}</p>
        <p className="text-slate-600 text-xs truncate mt-0.5">{c.input_text}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${bailBg} ${bailColor}`}>
          {c.bail_pct}%
        </span>
        <span className="text-slate-700 text-xs hidden sm:block">
          {new Date(c.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}
        </span>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-yellow-400 transition-colors" />
      </div>
    </div>
  );
}

// ── Main ProfileView ──────────────────────────────────────────────────────────
export default function ProfileView({ onBack, onViewReport }) {
  const { user, logout, refreshUser }  = useAuth();
  const [profile, setProfile]          = useState(null);
  const [loading, setLoading]          = useState(true);
  const [error, setError]              = useState("");
  const [success, setSuccess]          = useState("");

  // Name
  const [editName, setEditName]        = useState(false);
  const [newName, setNewName]          = useState("");
  const [savingName, setSavingName]    = useState(false);

  // Phone
  const [editPhone, setEditPhone]      = useState(false);
  const [newPhone, setNewPhone]        = useState("");
  const [savingPhone, setSavingPhone]  = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setNewName(data.user?.name || "");
        setNewPhone(data.user?.phone_number || "");
        setLoading(false);
      })
      .catch(() => { setError("Failed to load profile."); setLoading(false); });
  }, [user]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    setSavingName(true); setError("");
    try {
      const res  = await fetch(`${API}/api/profile/name`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        credentials:"include", body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setProfile(prev => ({ ...prev, user: { ...prev.user, name: data.user.name } }));
      setEditName(false);
      setSuccess("Name updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update name."); }
    finally { setSavingName(false); }
  };

  const handleSavePhone = async () => {
    const digits = newPhone.replace(/\D/g, "");
    if (!digits || digits.length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    const formatted = `+91${digits.slice(-10)}`;
    setSavingPhone(true); setError("");
    try {
      const res  = await fetch(`${API}/api/profile/phone`, {
        method:"PUT", headers:{"Content-Type":"application/json"},
        credentials:"include", body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setProfile(prev => ({ ...prev, user: { ...prev.user, phone_number: data.user.phone_number } }));
      setNewPhone(data.user.phone_number || "");
      setEditPhone(false);
      await refreshUser();
      setSuccess("Phone number saved! SMS & WhatsApp alerts enabled.");
      setTimeout(() => setSuccess(""), 4000);
    } catch { setError("Failed to save phone."); }
    finally { setSavingPhone(false); }
  };

  const handleLogout = async () => { await logout(); onBack(); };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <User size={36} className="text-yellow-400" />
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to View Profile</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">Sign in to access your profile and case history.</p>
      <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* ── Background decoration ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <h1 className="text-white font-serif font-bold text-xl">My Profile</h1>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 mb-4">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm flex-1">{error}</p>
            <button onClick={() => setError("")}><X size={14} className="text-red-500 hover:text-red-300" /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mb-4">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-yellow-400 animate-spin" />
              <p className="text-slate-500 text-sm">Loading profile...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ══ HERO CARD ══════════════════════════════════════════════ */}
            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#0c0f22]">
              {/* Gold top strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />

              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-6">

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="relative">
                      {profile?.user?.avatar ? (
                        <img src={profile.user.avatar} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-yellow-500/40 shadow-xl shadow-yellow-500/10" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-slate-900 font-black text-4xl font-serif shadow-xl shadow-yellow-500/20 border-2 border-yellow-400/30">
                          {profile?.user?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      {/* Online dot */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0c0f22] shadow-lg" />
                    </div>
                    {/* Provider badge */}
                    <div className={`mt-2.5 text-center text-[10px] font-bold px-3 py-1 rounded-full border ${
                      profile?.user?.provider === "google"
                        ? "bg-blue-500/15 border-blue-500/25 text-blue-400"
                        : "bg-white/8 border-white/15 text-slate-400"
                    }`}>
                      {profile?.user?.provider === "google" ? "Google" : "Email"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-4">

                    {/* Name */}
                    <div>
                      {editName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text" value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSaveName()} autoFocus
                            className="flex-1 bg-white/8 border border-yellow-500/50 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:outline-none focus:border-yellow-500"
                          />
                          <button onClick={handleSaveName} disabled={savingName}
                            className="p-2.5 rounded-xl bg-yellow-500 text-slate-900 hover:bg-yellow-400 transition-all">
                            {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                          </button>
                          <button onClick={() => { setEditName(false); setNewName(profile?.user?.name || ""); }}
                            className="p-2.5 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-all">
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <h2 className="text-white font-serif font-bold text-2xl sm:text-3xl leading-tight">{profile?.user?.name}</h2>
                          <button onClick={() => setEditName(true)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center shrink-0">
                          <Mail size={13} className="text-yellow-500/70" />
                        </div>
                        <span className="text-slate-400 truncate text-xs">{profile?.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center shrink-0">
                          <Calendar size={13} className="text-yellow-500/70" />
                        </div>
                        <span className="text-slate-400 text-xs">
                          Since {new Date(profile?.user?.created_at || new Date()).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center shrink-0">
                          <Shield size={13} className="text-yellow-500/70" />
                        </div>
                        <span className="text-slate-400 text-xs">
                          {profile?.user?.provider === "google" ? "Google OAuth" : "Email & Password"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-white/6 flex items-center justify-center shrink-0">
                          <Activity size={13} className="text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 text-xs font-medium">Active Account</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ STATS ══════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<FileText size={16} />}
                value={profile?.totalCases || 0}
                label="Cases Analyzed"
                accent={true}
              />
              <StatCard
                icon={<Star size={16} />}
                value={profile?.totalCases > 0 ? "4.9" : "—"}
                label="AI Accuracy"
              />
              <StatCard
                icon={<Award size={16} />}
                value={profile?.user?.provider === "google" ? "OAuth" : "Email"}
                label="Auth Method"
              />
            </div>

            {/* ══ PHONE NUMBER CARD ══════════════════════════════════════ */}
            <div className="rounded-2xl border border-white/8 bg-[#0d1020] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Phone size={15} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Phone Number</h3>
                  <p className="text-slate-500 text-xs">For SMS & WhatsApp court reminders</p>
                </div>
                {profile?.user?.phone_number && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Info banner */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/6 border border-yellow-500/15 mb-4">
                  <Bell size={13} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Receive <strong className="text-white">SMS + WhatsApp</strong> reminders
                    automatically — <strong className="text-white">1 day before</strong> and
                    <strong className="text-white"> 30 minutes before</strong> every court hearing.
                  </p>
                </div>

                {editPhone ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 shrink-0">
                        <span className="text-base">🇮🇳</span>
                        <span className="text-white text-sm font-bold">+91</span>
                      </div>
                      <input
                        type="tel"
                        value={newPhone.replace(/^\+91/, "").replace(/\D/g, "")}
                        onChange={e => setNewPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                        placeholder="9876543210"
                        maxLength={10} autoFocus
                        className="flex-1 bg-white/5 border border-yellow-500/40 focus:border-yellow-500 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-slate-600 text-xs">Enter 10-digit number without country code</p>
                    <div className="flex gap-2">
                      <button onClick={handleSavePhone} disabled={savingPhone}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60">
                        {savingPhone ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        {savingPhone ? "Saving..." : "Save Number"}
                      </button>
                      <button onClick={() => { setEditPhone(false); setNewPhone(profile?.user?.phone_number || ""); }}
                        className="px-5 py-3 rounded-xl bg-white/6 border border-white/10 text-slate-400 hover:text-white text-sm transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      profile?.user?.phone_number
                        ? "bg-emerald-500/6 border-emerald-500/20"
                        : "bg-white/3 border-white/8 border-dashed"
                    }`}>
                      <Phone size={16} className={profile?.user?.phone_number ? "text-emerald-400" : "text-slate-600"} />
                      {profile?.user?.phone_number ? (
                        <div>
                          <p className="text-white font-bold text-sm">{profile.user.phone_number}</p>
                          <p className="text-emerald-400 text-xs mt-0.5">SMS & WhatsApp reminders enabled ✓</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-500 text-sm font-medium">No number added yet</p>
                          <p className="text-slate-700 text-xs mt-0.5">Add to get court date reminders</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditPhone(true); setNewPhone(profile?.user?.phone_number?.replace(/^\+91/,"") || ""); }}
                      className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 hover:border-yellow-500 font-bold text-sm transition-all whitespace-nowrap"
                    >
                      <Edit2 size={13} />
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
                  <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center">
                    <Clock size={15} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">Recent Cases</h3>
                    <p className="text-slate-500 text-xs">Your last {profile.recentCases.length} analyzed cases</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-600 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                    {profile.totalCases} total
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {profile.recentCases.map(c => (
                    <CaseRow key={c.id} c={c} onClick={() => onViewReport && onViewReport({
                      aiResponse: c.ai_response,
                      inputText: c.input_text,
                      timestamp: new Date(c.created_at).getTime(),
                    })} />
                  ))}
                </div>
              </div>
            )}

            {/* ══ DANGER ZONE ════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-white/6 bg-[#0d1020] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
                <div className="w-9 h-9 rounded-xl bg-red-500/8 border border-red-500/15 flex items-center justify-center">
                  <Shield size={15} className="text-red-400" />
                </div>
                <h3 className="text-white font-bold text-sm">Account</h3>
              </div>
              <div className="p-5">
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-red-500/20 bg-red-500/6 text-red-400 hover:bg-red-500/12 hover:border-red-500/35 font-bold text-sm transition-all group">
                  <LogOut size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  Sign Out of NyayBot
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}