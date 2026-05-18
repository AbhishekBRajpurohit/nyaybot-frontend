import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback
} from "react";
import { useAuth } from "./AuthContext";

const AlertsContext = createContext(null);
const API = "http://localhost:4000";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function fmtTime(t) {
  if (!t) return "";
  // handle "HH:MM:SS" or "HH:MM"
  const parts = t.split(":");
  const hr = parseInt(parts[0]);
  const min = parts[1] || "00";
  return `${hr > 12 ? hr - 12 : hr || 12}:${min} ${hr >= 12 ? "PM" : "AM"}`;
}

// Safely extract YYYY-MM-DD from any date format (ISO, postgres timestamp, plain date)
function extractDateStr(d) {
  if (!d) return "";
  const s = String(d);
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO timestamp like 2026-05-17T00:00:00.000Z or 2026-05-17T00:00:00
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return s;
}

function fmtDate(d) {
  const dateStr = extractDateStr(d);
  if (!dateStr) return "—";
  const [y, mo, day] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Compare DATES only — fixes midnight rollover + postgres timestamp bug
function getDaysUntilDate(rawDate) {
  const dateStr = extractDateStr(rawDate);
  if (!dateStr) return NaN;
  const now    = new Date();
  const todayMs  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [y, mo, d] = dateStr.split("-").map(Number);
  const targetMs = new Date(y, mo - 1, d).getTime();
  return Math.round((targetMs - todayMs) / 86_400_000);
}

// ms until a specific future moment; null if already past
function msUntil(rawDate, timeStr, subtractMs = 0) {
  const dateStr = extractDateStr(rawDate);
  if (!dateStr || !timeStr) return null;
  const timeClean = timeStr.split(":").slice(0,2).join(":");
  const hearing = new Date(`${dateStr}T${timeClean}`).getTime();
  const trigger = hearing - subtractMs;
  const diff    = trigger - Date.now();
  return diff > 0 ? diff : null;
}

// ─── Toast component ──────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  const urgent = toast.type === "30min";
  return (
    <div style={{ animation: "nyay_in 0.35s ease-out" }}>
      <div className={`
        rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-md
        ${urgent
          ? "bg-red-950/95  border-red-500/60"
          : "bg-[#0c0f22]/98 border-yellow-500/50"}
      `}>
        {/* icon */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${urgent
            ? "bg-red-500/20  border border-red-500/40"
            : "bg-yellow-500/15 border border-yellow-500/30"}
        `}>
          <span className="text-lg">{urgent ? "🚨" : "⚖️"}</span>
        </div>

        {/* body */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">
            {urgent ? "Hearing in 30 minutes!" : "Court Hearing Tomorrow"}
          </p>
          <p className={`text-sm font-semibold mt-0.5 truncate
            ${urgent ? "text-red-300" : "text-yellow-300"}`}>
            {toast.caseName}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            📅 {fmtDate(toast.courtDate)}&nbsp;&nbsp;🕐 {fmtTime(toast.courtTime)}
          </p>
          {toast.notes && (
            <p className="text-slate-500 text-xs mt-0.5 truncate">{toast.notes}</p>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-500 hover:text-white transition-colors shrink-0 text-lg leading-none"
        >×</button>
      </div>

      {/* shrinking timer bar */}
      <div
        className={`h-0.5 rounded-full mx-1 mt-1
          ${urgent ? "bg-red-500/50" : "bg-yellow-500/40"}`}
        style={{ animation: "nyay_shrink 10s linear forwards" }}
      />

      <style>{`
        @keyframes nyay_in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes nyay_shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AlertsProvider({ children }) {
  const { user }            = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [toasts, setToasts] = useState([]);

  const timersRef = useRef([]);         // all pending setTimeout IDs
  const firedRef  = useRef(new Set());  // "alertId-type" already triggered

  // ── helpers ──────────────────────────────────────────────────────────────
  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function addTimer(fn, ms) {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }

  // ── show in-app toast ─────────────────────────────────────────────────
  const showToast = useCallback((alert, type) => {
    const id = `${alert.id}-${type}-${Date.now()}`;
    setToasts(prev => {
      if (prev.find(t => t.alertId === alert.id && t.type === type)) return prev;
      return [...prev, {
        id,
        alertId   : alert.id,
        type,
        caseName  : alert.case_name,
        courtDate : alert.court_date,
        courtTime : alert.court_time,
        notes     : alert.notes || "",
      }];
    });
    // auto-dismiss after 10 s
    addTimer(() => setToasts(p => p.filter(t => t.id !== id)), 10_000);
  }, []);

  // ── send browser notification ─────────────────────────────────────────
  function sendBrowserNotif(alert, type) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const title = type === "1day"
      ? `⚖️ Court Hearing Tomorrow — ${alert.case_name}`
      : `🚨 Hearing in 30 min — ${alert.case_name}`;
    const body = type === "1day"
      ? `📅 ${fmtDate(alert.court_date)}  🕐 ${fmtTime(alert.court_time)}${alert.notes ? "\n" + alert.notes : ""}`
      : `Starts at ${fmtTime(alert.court_time)} today. Prepare now!`;
    new Notification(title, { body, icon: "/vite.svg", tag: `nyaybot-${alert.id}-${type}` });
  }

  // ── schedule both notifications for a single alert ────────────────────
  const scheduleOne = useCallback((alert) => {
    // ── 1-day-before notification ─────────────────────────────────────
    const key1 = `${alert.id}-1day`;
    if (!firedRef.current.has(key1)) {
      const ms = msUntil(alert.court_date, alert.court_time, 24 * 3600_000);
      if (ms !== null) {
        console.log(`[NyayBot] Scheduled 1-day notif for "${alert.case_name}" in ${(ms / 3600000).toFixed(2)}h`);
        addTimer(() => {
          firedRef.current.add(key1);
          showToast(alert, "1day");
          sendBrowserNotif(alert, "1day");
        }, ms);
      }
    }

    // ── 30-minute-before notification ─────────────────────────────────
    const key2 = `${alert.id}-30min`;
    if (!firedRef.current.has(key2)) {
      const ms = msUntil(alert.court_date, alert.court_time, 30 * 60_000);
      if (ms !== null) {
        console.log(`[NyayBot] Scheduled 30-min notif for "${alert.case_name}" in ${(ms / 60000).toFixed(1)}min`);
        addTimer(() => {
          firedRef.current.add(key2);
          showToast(alert, "30min");
          sendBrowserNotif(alert, "30min");
        }, ms);
      }
    }
  }, [showToast]);

  // ── fetch on login ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setToasts([]);
      clearTimers();
      firedRef.current.clear();
      return;
    }
    fetch(`${API}/api/alerts`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(() => {});
  }, [user]);

  // ── re-schedule whenever alerts list changes ──────────────────────────
  useEffect(() => {
    if (!user || !alerts.length) return;
    clearTimers();
    alerts.forEach(scheduleOne);
    return clearTimers;
  }, [alerts, user, scheduleOne]);

  // ── request browser permission ────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── public API ────────────────────────────────────────────────────────
  const addAlert = (alert) =>
    setAlerts(prev =>
      [...prev, alert].sort((a, b) =>
        new Date(a.court_date) - new Date(b.court_date)
      )
    );

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setToasts(prev => prev.filter(t => t.alertId !== id));
    firedRef.current.delete(`${id}-1day`);
    firedRef.current.delete(`${id}-30min`);
  };

  const dismissToast = (toastId) =>
    setToasts(prev => prev.filter(t => t.id !== toastId));

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}

      {/* Fixed toast stack — always on top of every page */}
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

// Export getDaysUntilDate so AlertsView can import it
export { getDaysUntilDate, fmtTime, fmtDate };