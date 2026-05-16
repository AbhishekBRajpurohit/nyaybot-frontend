import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback
} from "react";
import { useAuth } from "./AuthContext";

const AlertsContext = createContext(null);
const API = "http://localhost:4000";

// ─── helpers ────────────────────────────────────────────────────────────────
function getDiffHours(courtDate, courtTime) {
  const dt  = new Date(`${courtDate}T${courtTime}`);
  const now = new Date();
  return (dt - now) / 3_600_000;
}

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Toast UI ───────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  const urgent = toast.diffHours <= 2;
  return (
    <div style={{ animation: "nyay_slide_in 0.35s ease-out" }}>
      <div
        className={`rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-md
          ${urgent
            ? "bg-red-950/95 border-red-500/60"
            : "bg-[#0c0f22]/98 border-yellow-500/50"
          }`}
      >
        {/* icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${urgent ? "bg-red-500/20 border border-red-500/40" : "bg-yellow-500/15 border border-yellow-500/30"}`}>
          <span className="text-lg">⚖️</span>
        </div>

        {/* body */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">
            Court Reminder
          </p>
          <p className={`text-sm font-semibold mt-0.5 truncate
            ${urgent ? "text-red-300" : "text-yellow-300"}`}>
            {toast.caseName}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            📅 {fmtDate(toast.courtDate)}&nbsp;&nbsp;🕐 {fmtTime(toast.courtTime)}
          </p>
          <p className={`text-xs font-bold mt-1
            ${urgent ? "text-red-400" : "text-yellow-500"}`}>
            {toast.label}
          </p>
          {toast.notes && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">{toast.notes}</p>
          )}
        </div>

        {/* dismiss */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-white transition-colors shrink-0 text-lg leading-none mt-0.5"
        >×</button>
      </div>

      {/* shrinking progress bar */}
      <div
        className={`h-0.5 rounded-full mx-1 mt-1
          ${urgent ? "bg-red-500/50" : "bg-yellow-500/40"}`}
        style={{ animation: "nyay_shrink 8s linear forwards" }}
      />

      <style>{`
        @keyframes nyay_slide_in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes nyay_shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function AlertsProvider({ children }) {
  const { user }            = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  // track which alert IDs we already notified this session
  const notifiedRef = useRef(new Set());
  const timerRef    = useRef(null);

  // ── fetch alerts whenever user changes ────────────────────────────────
  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setToasts([]);
      notifiedRef.current.clear();
      return;
    }
    fetch(`${API}/api/alerts`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(() => {});
  }, [user]);

  // ── request browser notification permission ───────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── core check function ───────────────────────────────────────────────
  const checkAndNotify = useCallback(() => {
    if (!alerts.length) return;

    alerts.forEach(alert => {
      const diff = getDiffHours(alert.court_date, alert.court_time);

      // only care about hearings within 24 hours that haven't passed
      if (diff < 0 || diff > 24) return;

      const isUrgent = diff <= 2;
      // re-notify urgent every check; others only once per session
      if (!isUrgent && notifiedRef.current.has(alert.id)) return;
      notifiedRef.current.add(alert.id);

      const label =
        diff <= 0.5 ? "🚨 Starting NOW!"  :
        diff <= 1   ? "⚠️ In less than 1 hour" :
        diff <= 2   ? "⚠️ In ~2 hours"    :
        diff <= 6   ? "Today"             : "Tomorrow";

      const toast = {
        id        : `${alert.id}-${Date.now()}`,
        alertId   : alert.id,
        caseName  : alert.case_name,
        courtDate : alert.court_date,
        courtTime : alert.court_time,
        notes     : alert.notes,
        label,
        diffHours : diff,
      };

      // add to visible toasts (avoid duplicate for same alert)
      setToasts(prev => {
        if (prev.find(t => t.alertId === alert.id)) return prev;
        return [...prev, toast];
      });

      // auto-dismiss after 8s
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 8000);

      // browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`⚖️ Court Reminder — ${alert.case_name}`, {
          body : `${label}\n📅 ${fmtDate(alert.court_date)}  🕐 ${fmtTime(alert.court_time)}`,
          icon : "/vite.svg",
          tag  : `nyaybot-${alert.id}`,   // deduplicate browser notifs
        });
      }
    });
  }, [alerts]);

  // ── run immediately when alerts load; repeat every 60 s ──────────────
  useEffect(() => {
    if (!user || !alerts.length) return;

    checkAndNotify();                                    // fire right away
    clearInterval(timerRef.current);
    timerRef.current = setInterval(checkAndNotify, 60_000);
    return () => clearInterval(timerRef.current);
  }, [alerts, user, checkAndNotify]);

  // ── public helpers ────────────────────────────────────────────────────
  const addAlert = (alert) =>
    setAlerts(prev =>
      [...prev, alert].sort(
        (a, b) => new Date(a.court_date) - new Date(b.court_date)
      )
    );

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setToasts(prev => prev.filter(t => t.alertId !== id));
    notifiedRef.current.delete(id);
  };

  const dismissToast = (toastId) =>
    setToasts(prev => prev.filter(t => t.id !== toastId));

  // ── render ────────────────────────────────────────────────────────────
  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}

      {/* Toast stack — fixed bottom-right, always on top of everything */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
          style={{ maxWidth: "360px", width: "calc(100vw - 3rem)" }}
        >
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast toast={t} onDismiss={dismissToast} />
            </div>
          ))}
        </div>
      )}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}