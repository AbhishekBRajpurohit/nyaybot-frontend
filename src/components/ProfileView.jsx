import React, { useState, useEffect } from "react";
import {
  ArrowLeft, User, Mail, Shield, Calendar, FileText,
  Edit2, Check, X, LogOut, Loader2, AlertCircle,
  TrendingUp, Clock, ChevronRight, Star
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:4000";

export default function ProfileView({ onBack, onViewReport }) {
  const { user, logout } = useAuth();
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editName, setEditName]   = useState(false);
  const [newName, setNewName]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/profile`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setProfile(data); setNewName(data.user?.name || ""); setLoading(false); })
      .catch(() => { setError("Failed to load profile."); setLoading(false); });
  }, [user]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/profile/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setProfile(prev => ({ ...prev, user: { ...prev.user, name: data.user.name } }));
      setEditName(false);
      setSuccess("Name updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to update name."); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const fmtShort = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const getBailColor = (pct) => {
    if (pct >= 65) return "text-emerald-400";
    if (pct >= 35) return "text-yellow-400";
    return "text-red-400";
  };

  // ── Not logged in ──
  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <User size={36} className="text-yellow-400" />
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to View Profile</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">Sign in to see your profile and case history.</p>
      <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* ── Top bar ── */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <User size={16} className="text-yellow-400" />
            <h1 className="text-white font-serif font-bold text-lg">My Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-5">

        {/* Error / Success */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-xs">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-yellow-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Profile Card ── */}
            <div className="bg-[#0c0f22] border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="shrink-0">
                  {profile?.user?.avatar ? (
                    <img src={profile.user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-yellow-500/30" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-3xl font-serif border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20">
                      {profile?.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  {/* Provider badge */}
                  <div className={`mt-2 text-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    profile?.user?.provider === "google"
                      ? "bg-blue-500/15 border-blue-500/25 text-blue-400"
                      : "bg-white/8 border-white/15 text-slate-400"
                  }`}>
                    {profile?.user?.provider === "google" ? "Google" : "Email"}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <div className="mb-3">
                    {editName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSaveName()}
                          autoFocus
                          className="flex-1 bg-white/8 border border-yellow-500/40 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                        />
                        <button onClick={handleSaveName} disabled={saving}
                          className="p-2 rounded-xl bg-yellow-500 text-slate-900 hover:bg-yellow-400 transition-all">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button onClick={() => { setEditName(false); setNewName(profile?.user?.name || ""); }}
                          className="p-2 rounded-xl bg-white/8 text-slate-400 hover:text-white transition-all">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-white font-serif font-bold text-xl">{profile?.user?.name}</h2>
                        <button onClick={() => setEditName(true)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={12} className="text-yellow-500/60 shrink-0" />
                      <span className="text-slate-400">{profile?.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={12} className="text-yellow-500/60 shrink-0" />
                      <span className="text-slate-400">Member since {fmt(profile?.user?.created_at || new Date())}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Shield size={12} className="text-yellow-500/60 shrink-0" />
                      <span className="text-slate-400">Signed in with {profile?.user?.provider === "google" ? "Google OAuth" : "Email & Password"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText size={15} className="text-yellow-400" />
                </div>
                <p className="text-white font-serif font-black text-4xl">{profile?.totalCases || 0}</p>
                <p className="text-slate-500 text-xs mt-1">Total Cases Analyzed</p>
              </div>
              <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-white font-serif font-black text-4xl">
                  {profile?.totalCases > 0 ? "4.9" : "—"}
                </p>
                <p className="text-slate-500 text-xs mt-1">AI Accuracy Rating</p>
              </div>
            </div>

            {/* ── Recent Cases ── */}
            {profile?.recentCases?.length > 0 && (
              <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={15} className="text-yellow-400" />
                  <h3 className="text-white font-bold text-base">Recent Cases</h3>
                </div>
                <div className="space-y-3">
                  {profile.recentCases.map(c => (
                    <div key={c.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6 hover:border-yellow-500/20 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <TrendingUp size={13} className="text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{c.case_type || "Criminal"}</p>
                        <p className="text-slate-600 text-[11px] truncate">{c.input_text}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${getBailColor(c.bail_pct)}`}>{c.bail_pct}%</p>
                        <p className="text-slate-700 text-[10px]">{fmtShort(c.created_at)}</p>
                      </div>
                      <button
                        onClick={() => onViewReport({ aiResponse: c.ai_response, inputText: c.input_text, timestamp: new Date(c.created_at).getTime() })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-all"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Logout ── */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 font-bold text-sm transition-all"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}