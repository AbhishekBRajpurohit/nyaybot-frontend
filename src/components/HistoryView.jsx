import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Clock,
  Trash2,
  ChevronRight,
  Scale,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const API = "http://localhost:4000";

export default function HistoryView({ onBack, onOpenReport, lang = "en" }) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch(`${API}/api/reports`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to server. Make sure the backend is running on port 4000.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this report permanently?")) return;
    setDeleting(id);
    try {
      const res  = await fetch(`${API}/api/reports/${id}`, {
        method:      "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(data.error || "Delete failed.");
      }
    } catch {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleOpen = (r) => {
    const payload = {
      aiResponse: r.ai_response,
      inputText:  r.input_text,
      reportId:   r.id,
      timestamp:  new Date(r.created_at).getTime(),
    };
    localStorage.setItem("nyaybot_report", JSON.stringify(payload));
    if (onOpenReport) onOpenReport(payload);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const bailStyle = (pct) => {
    if (pct == null) return "";
    if (pct >= 65) return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
    if (pct >= 35) return "bg-yellow-500/10 border-yellow-500/25 text-yellow-400";
    return "bg-red-500/10 border-red-500/25 text-red-400";
  };

  return (
    <div className="min-h-screen bg-[#08091a] pt-20 pb-16 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-yellow-400 transition-colors text-sm font-semibold px-3 py-2 rounded-xl hover:bg-yellow-500/8 border border-transparent hover:border-yellow-500/20"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-yellow-400" />
            <h1 className="text-white font-serif font-bold text-xl">
              Report History
            </h1>
          </div>
          <span className="ml-auto text-xs text-slate-500 bg-white/5 border border-white/8 px-3 py-1.5 rounded-full tabular-nums">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <Loader2 size={36} className="text-yellow-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading your reports…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && reports.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
              <FileText size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-bold text-lg">No reports yet</p>
            <p className="text-slate-600 text-sm max-w-xs leading-relaxed">
              Go to{" "}
              <strong className="text-slate-400">Analyze</strong>, describe
              your case and click{" "}
              <strong className="text-slate-400">Analyze</strong> to generate
              your first report.
            </p>
            <button
              onClick={onBack}
              className="mt-3 px-6 py-2.5 rounded-2xl bg-yellow-500 text-slate-900 font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
            >
              Analyze a Case
            </button>
          </div>
        )}

        {/* Report list */}
        {!loading && !error && reports.length > 0 && (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => handleOpen(r)}
                className="group bg-[#0d1020] border border-white/8 hover:border-yellow-500/25 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-[0_0_24px_rgba(234,179,8,0.06)] active:scale-[0.99]"
              >
                <div className="flex items-start gap-4">

                  {/* Scale icon */}
                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale size={20} className="text-yellow-400" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {r.case_type && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 uppercase tracking-wide">
                          {r.case_type}
                        </span>
                      )}
                      {r.bail_pct != null && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${bailStyle(
                            r.bail_pct
                          )}`}
                        >
                          Bail {r.bail_pct}%
                        </span>
                      )}
                    </div>

                    {/* Query preview */}
                    <p className="text-slate-300 text-sm leading-snug line-clamp-2 mb-2">
                      {r.input_text?.trim() || "No description provided"}
                    </p>

                    {/* Date */}
                    <p className="text-slate-600 text-xs">
                      {formatDate(r.created_at)}
                    </p>
                  </div>

                  {/* Delete + arrow */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      disabled={deleting === r.id}
                      title="Delete report"
                      className="p-2 rounded-xl text-slate-700 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-40"
                    >
                      {deleting === r.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                    <ChevronRight
                      size={16}
                      className="text-slate-700 group-hover:text-yellow-400 transition-colors"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}