import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Clock, Trash2, FileText, Search,
  TrendingUp, Gavel, ChevronRight, Loader2, AlertCircle
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API = "http://localhost:4000";

function getBailColor(pct) {
  if (pct >= 65) return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" };
  if (pct >= 35) return { text: "text-yellow-400",  bg: "bg-yellow-500/10  border-yellow-500/25"  };
  return           { text: "text-red-400",     bg: "bg-red-500/10     border-red-500/25"     };
}

export default function HistoryView({ onBack, onViewReport }) {
  const { user } = useAuth();
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/history`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setHistory(data.history || []); setLoading(false); })
      .catch(() => { setError("Failed to load history."); setLoading(false); });
  }, [user]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await fetch(`${API}/api/history/${id}`, { method: "DELETE", credentials: "include" });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch { setError("Failed to delete."); }
    finally { setDeleting(null); }
  };

  const filtered = history.filter(h =>
    !search || h.input_text?.toLowerCase().includes(search.toLowerCase()) ||
    h.case_type?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Not logged in ──
  if (!user) return (
    <div className="min-h-screen bg-[#08091a] flex flex-col items-center justify-center text-center px-6 pt-20">
      <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6">
        <FileText size={36} className="text-yellow-400" />
      </div>
      <h2 className="text-white font-serif text-2xl font-bold mb-3">Login to View History</h2>
      <p className="text-slate-400 text-sm max-w-xs mb-6">Sign in to save and access your past legal case analyses.</p>
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
            <Clock size={16} className="text-yellow-400" />
            <h1 className="text-white font-serif font-bold text-lg">Case History</h1>
          </div>
          <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            {history.length} case{history.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-4">

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by case type or keywords..."
            className="w-full bg-[#0d1020] border border-white/8 focus:border-yellow-500/40 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-yellow-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold">
              {search ? "No cases match your search" : "No cases analyzed yet"}
            </p>
            <p className="text-slate-600 text-sm mt-1">
              {search ? "Try different keywords" : "Analyze a case to see it here"}
            </p>
            {!search && (
              <button onClick={onBack}
                className="mt-5 px-5 py-2.5 rounded-xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all">
                Analyze a Case
              </button>
            )}
          </div>
        )}

        {/* History list */}
        {!loading && filtered.map((item) => {
          const bc = getBailColor(item.bail_pct);
          return (
            <div key={item.id}
              className="group bg-[#0d1020] border border-white/8 hover:border-yellow-500/20 rounded-2xl p-5 transition-all">
              <div className="flex items-start gap-4">

                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Gavel size={18} className="text-yellow-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-bold text-sm">{item.case_type || "Criminal"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bc.bg} ${bc.text}`}>
                      {item.bail_pct}% Bail
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-snug line-clamp-2 mb-2">
                    {item.input_text || "No query text"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {fmt(item.created_at)}
                    </span>
                    <span>{fmtTime(item.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onViewReport({ aiResponse: item.ai_response, inputText: item.input_text, timestamp: new Date(item.created_at).getTime() })}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-slate-900 hover:border-yellow-500 font-bold text-xs transition-all"
                  >
                    View <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    {deleting === item.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}