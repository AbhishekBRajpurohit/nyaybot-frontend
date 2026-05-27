import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Bell, Plus, Trash2, Calendar, Clock,
  Loader2, AlertCircle, CheckCircle, X, BellRing, FileText
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useAlerts, getDaysUntilDate, fmtTime, fmtDate } from "./AlertsContext";

const API = "http://localhost:4000";

// ── Uses the fixed getDaysUntilDate (no UTC / midnight bug) ──────────────────
function getUrgency(days, courtTime) {
  if (days < 0) return { label:"Past",      color:"text-slate-500",  bg:"bg-slate-500/10  border-slate-500/20",  dot:"bg-slate-500" };

  // Today — check if hearing time already passed
  if (days === 0 && courtTime) {
    const [h, m] = courtTime.split(":").map(Number);
    const now = new Date();
    const hearingMs = new Date();
    hearingMs.setHours(h, m, 0, 0);
    if (hearingMs < now) {
      return { label:"Completed", color:"text-slate-500", bg:"bg-slate-500/10 border-slate-500/20", dot:"bg-slate-500" };
    }
    return { label:"TODAY", color:"text-red-400", bg:"bg-red-500/10 border-red-500/25", dot:"bg-red-400 animate-pulse" };
  }

  if (days === 1) return { label:"Tomorrow",        color:"text-orange-400", bg:"bg-orange-500/10 border-orange-500/25", dot:"bg-orange-400 animate-pulse" };
  if (days <= 7)  return { label:`In ${days} days`, color:"text-yellow-400", bg:"bg-yellow-500/10  border-yellow-500/25", dot:"bg-yellow-400"              };
  return                  { label:`In ${days} days`, color:"text-slate-400",  bg:"bg-white/5        border-white/10",     dot:"bg-slate-500"                };
}

export default function AlertsView({ onBack, onViewReport }) {
  const { user }                          = useAuth();
  const { alerts, addAlert, removeAlert } = useAlerts();

  const [history, setHistory]             = useState([]);
  const [showForm, setShowForm]           = useState(false);
  const [deleting, setDeleting]           = useState(null);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState("");

  // form fields
  const [caseName, setCaseName]           = useState("");
  const [courtDate, setCourtDate]         = useState("");
  const [courtTime, setCourtTime]         = useState("");
  const [notes, setNotes]                 = useState("");
  const [linkedHistoryId, setLinkedHistoryId] = useState("");

  // fetch history for linking
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/history`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {});
  }, [user]);

  const resetForm = () => {
    setCaseName(""); setCourtDate(""); setCourtTime("");
    setNotes(""); setLinkedHistoryId("");
  };

  const handleLinkCase = (id) => {
    setLinkedHistoryId(id);
    if (id) {
      const found = history.find(h => String(h.id) === id);
      if (found) setCaseName(found.input_text?.slice(0, 60) || found.case_type || "");
    }
  };

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
        body: JSON.stringify({
          caseName: caseName.trim(), courtDate, courtTime,
          notes, historyId: linkedHistoryId || null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      addAlert(data.alert);
      resetForm(); setShowForm(false);
      setSuccess("✅ Alert set! You'll be notified 1 day before and 30 minutes before the hearing.");
      setTimeout(() => setSuccess(""), 5000);
    } catch { setError("Failed to add alert."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/api/alerts/${id}`, { method: "DELETE", credentials: "include" });
      removeAlert(id);
    } catch { setError("Failed to delete."); }
    finally { setDeleting(null); }
  };

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <Bell size={36} className="text-yellow-400" />
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to Set Alerts</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6 leading-relaxed">
        Sign in to add court date reminders and never miss a hearing.
      </p>
      <button onClick={onBack}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 transition-all">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16">

      {/* ── Top bar ── */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (showForm) {
                // First back click — close the form, stay on alerts page
                setShowForm(false);
                resetForm();
                setError("");
              } else {
                // Second back click — go to home
                onBack();
              }
            }}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20">
            <ArrowLeft size={15} />
            {showForm ? "Back to Alerts" : "Back"}
          </button>
          <div className="w-px h-5 bg-white/10" />
          <BellRing size={16} className="text-yellow-400" />
          <h1 className="text-white font-serif font-bold text-xl">Court Date Alerts</h1>
          <span className="text-sm text-slate-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => { setShowForm(true); setError(""); }}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            <Plus size={15} /> Add Alert
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4">

        {/* Info */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/8 border border-yellow-500/20">
          <Bell size={15} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-slate-400 text-sm leading-relaxed">
            You will receive <strong className="text-white">2 notifications</strong> per alert -
            one <strong className="text-white">1 day before</strong> and one
            <strong className="text-white"> 30 minutes before</strong> the hearing - as both
            browser popup and in-app toast on any page.
          </p>
        </div>

        {/* Success / Error */}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-300 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-[#0d1020] border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Plus size={15} className="text-yellow-400" /> New Court Date Alert
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); setError(""); }}
                className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Link to history case */}
              {history.length > 0 && (
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                    Link to Existing Case (optional)
                  </label>
                  <select
                    value={linkedHistoryId}
                    onChange={e => handleLinkCase(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                  >
                    <option value="">- Select a case from history -</option>
                    {history.map(h => (
                      <option key={h.id} value={h.id} className="bg-[#0d1020]">
                        {h.case_type} - {h.input_text?.slice(0, 50) || "No text"}
                      </option>
                    ))}
                  </select>
                  {linkedHistoryId && (
                    <p className="mt-1 text-emerald-400 text-xs flex items-center gap-1">
                      <CheckCircle size={11} /> Linked - "View case report" will appear on this alert
                    </p>
                  )}
                </div>
              )}

              {/* Case name */}
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Case Name *</label>
                <input type="text" value={caseName} onChange={e => setCaseName(e.target.value)}
                  placeholder="e.g. IPC 379 Theft Case — Sessions Court Bengaluru"
                  className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all" />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Court Date *</label>
                  <input type="date" value={courtDate} onChange={e => setCourtDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Court Time *</label>
                  <input type="time" value={courtTime} onChange={e => setCourtTime(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Court name, judge name, documents to carry..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 focus:border-yellow-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all resize-none" />
              </div>

              <button onClick={handleAdd} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
                {saving ? "Saving..." : "Set Alert"}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {alerts.length === 0 && !showForm && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-lg">No court alerts set</p>
            <p className="text-slate-600 text-base mt-1">Add hearing dates to get notified automatically</p>
            <button onClick={() => setShowForm(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all">
              Add First Alert
            </button>
          </div>
        )}

        {/* Alerts list */}
        {alerts.map(alert => {
          // ── FIX: use getDaysUntilDate (no midnight rollover bug) ──
          const days = getDaysUntilDate(alert.court_date);
          const u    = getUrgency(days, alert.court_time);
          const linked = alert.history_id
            ? history.find(h => String(h.id) === String(alert.history_id))
            : null;

          return (
            <div key={alert.id}
              className={`bg-[#0d1020] border rounded-2xl p-5 transition-all ${
                days >= 0 && days <= 1
                  ? "border-orange-500/30"
                  : "border-white/8 hover:border-yellow-500/20"
              }`}>
              <div className="flex items-start gap-4">

                {/* Urgency dot + line */}
                <div className="flex flex-col items-center gap-1 pt-1.5 shrink-0">
                  <div className={`w-3.5 h-3.5 rounded-full ${u.dot}`} />
                  <div className="w-px h-8 bg-white/8" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-white font-bold text-base">{alert.case_name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${u.bg} ${u.color}`}>
                      {u.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-5 text-sm text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-yellow-500/60" />
                      {fmtDate(alert.court_date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-yellow-500/60" />
                      {fmtTime(alert.court_time)}
                    </span>
                  </div>

                  {alert.notes && (
                    <p className="text-slate-500 text-sm mb-1.5 leading-snug">{alert.notes}</p>
                  )}

                  {/* Notification schedule info */}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[11px] text-slate-600 bg-white/4 border border-white/8 px-2 py-0.5 rounded-full">
                      🔔 1 day before
                    </span>
                    <span className="text-[11px] text-slate-600 bg-white/4 border border-white/8 px-2 py-0.5 rounded-full">
                      🔔 30 min before
                    </span>
                  </div>

                  {/* Linked case */}
                  {linked && (
                    <button
                      onClick={() => onViewReport && onViewReport({
                        aiResponse: linked.ai_response,
                        inputText: linked.input_text,
                        timestamp: new Date(linked.created_at).getTime(),
                      })}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg transition-all mt-2"
                    >
                      <FileText size={11} /> View linked case report
                    </button>
                  )}
                </div>

                <button onClick={() => handleDelete(alert.id)} disabled={deleting === alert.id}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all shrink-0">
                  {deleting === alert.id
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />
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