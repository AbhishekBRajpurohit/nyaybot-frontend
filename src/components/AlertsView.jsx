import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Bell, Plus, Trash2, Calendar, Clock,
  FileText, Loader2, AlertCircle, CheckCircle, X, BellRing
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:4000";

function getDaysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function getUrgency(days) {
  if (days < 0)  return { label: "Past",      color: "text-slate-500",  bg: "bg-slate-500/10 border-slate-500/20",  dot: "bg-slate-500"  };
  if (days === 0) return { label: "TODAY",     color: "text-red-400",    bg: "bg-red-500/10    border-red-500/25",    dot: "bg-red-400 animate-pulse"    };
  if (days === 1) return { label: "Tomorrow",  color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/25", dot: "bg-orange-400 animate-pulse" };
  if (days <= 7)  return { label: `${days}d`,  color: "text-yellow-400", bg: "bg-yellow-500/10  border-yellow-500/25", dot: "bg-yellow-400" };
  return           { label: `${days}d`,  color: "text-slate-400",  bg: "bg-white/5       border-white/10",     dot: "bg-slate-500"  };
}

export default function AlertsView({ onBack }) {
  const { user } = useAuth();
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Form state
  const [caseName, setCaseName]   = useState("");
  const [courtDate, setCourtDate] = useState("");
  const [courtTime, setCourtTime] = useState("");
  const [notes, setNotes]         = useState("");

  // Fetch alerts
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/alerts`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setAlerts(data.alerts || []); setLoading(false); })
      .catch(() => { setError("Failed to load alerts."); setLoading(false); });
  }, [user]);

  // Check browser notifications permission and notify for upcoming hearings
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();

    // Check every minute for alerts within 24 hours
    const interval = setInterval(() => {
      alerts.forEach(alert => {
        const days = getDaysUntil(alert.court_date);
        if (days === 0 || days === 1) {
          if (Notification.permission === "granted") {
            new Notification("⚖️ NyayBot Court Reminder", {
              body: `${alert.case_name} — Court hearing ${days === 0 ? "TODAY" : "tomorrow"} at ${alert.court_time}`,
              icon: "/vite.svg",
            });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [alerts]);

  const handleAdd = async () => {
    setError("");
    if (!caseName.trim() || !courtDate || !courtTime) {
      setError("Please fill in case name, date and time."); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ caseName: caseName.trim(), courtDate, courtTime, notes }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setAlerts(prev => [...prev, data.alert].sort((a, b) => new Date(a.court_date) - new Date(b.court_date)));
      setCaseName(""); setCourtDate(""); setCourtTime(""); setNotes("");
      setShowForm(false);
      setSuccess("Alert added! You'll be notified before your hearing.");
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed to add alert."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/api/alerts/${id}`, { method: "DELETE", credentials: "include" });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch { setError("Failed to delete."); }
    finally { setDeleting(null); }
  };

  const fmt = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = t => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  // ── Not logged in ──
  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <Bell size={36} className="text-yellow-400" />
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to Set Alerts</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">Sign in to add court date reminders and never miss a hearing.</p>
      <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* ── Top bar ── */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <BellRing size={16} className="text-yellow-400" />
            <h1 className="text-white font-serif font-bold text-lg">Court Date Alerts</h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus size={15} /> Add Alert
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4">

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-xs">{success}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Add Alert Form */}
        {showForm && (
          <div className="bg-[#0d1020] border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus size={15} className="text-yellow-400" /> New Court Date Alert
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Case Name *</label>
                <input
                  type="text"
                  value={caseName}
                  onChange={e => setCaseName(e.target.value)}
                  placeholder="e.g. IPC 379 Theft Case"
                  className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Court Date *</label>
                  <input
                    type="date"
                    value={courtDate}
                    onChange={e => setCourtDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Court Time *</label>
                  <input
                    type="time"
                    value={courtTime}
                    onChange={e => setCourtTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Court name, judge, documents to carry..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all resize-none"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
                {saving ? "Saving..." : "Set Alert"}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-yellow-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && alerts.length === 0 && !showForm && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">No court alerts set</p>
            <p className="text-slate-600 text-sm mt-1">Add your hearing dates to get reminded</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all"
            >
              Add First Alert
            </button>
          </div>
        )}

        {/* Alerts list */}
        {!loading && alerts.map(alert => {
          const days = getDaysUntil(alert.court_date);
          const u = getUrgency(days);
          return (
            <div key={alert.id}
              className={`bg-[#0d1020] border rounded-2xl p-5 transition-all ${days <= 1 && days >= 0 ? "border-orange-500/30" : "border-white/8 hover:border-yellow-500/20"}`}>
              <div className="flex items-start gap-4">
                {/* Urgency dot + icon */}
                <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                  <div className={`w-3 h-3 rounded-full ${u.dot}`} />
                  <div className="w-px h-6 bg-white/8" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-white font-bold text-sm">{alert.case_name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.bg} ${u.color}`}>
                      {u.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-yellow-500/60" /> {fmt(alert.court_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="text-yellow-500/60" /> {fmtTime(alert.court_time)}
                    </span>
                  </div>
                  {alert.notes && (
                    <p className="text-slate-500 text-xs mt-1 leading-snug">{alert.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(alert.id)}
                  disabled={deleting === alert.id}
                  className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all shrink-0"
                >
                  {deleting === alert.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}