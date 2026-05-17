import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback
} from "react";
import { useAuth } from "./AuthContext";

const AlertsContext = createContext(null);
const API = "http://localhost:4000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// Get exact milliseconds until a future moment
// Returns null if the moment is already past
function msUntil(dateStr, timeStr, offsetMs = 0) {
  const hearingMs = new Date(`${dateStr}T${timeStr}`).getTime();
  const targetMs  = hearingMs - offsetMs;          // e.g. 24hrs before
  const nowMs     = Date.now();
  const diff      = targetMs - nowMs;
  return diff > 0 ? diff : null;                   // null = already past
}

// ─── Toast UI ────────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  const urgent = toast.type === "30min";
  return (
    <div style={{ animation: "nyay_slidein 0.35s ease-out" }}>
      <div className={`rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-md
        ${urgent
          ? "bg-red-950/95 border-red-500/60"
          : "bg-[#0c0f22]/98 border-yellow-500/50"
        }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${urgent
            ? "bg-red-500/20 border border-red-500/40"
            : "bg-yellow-500/15 border border-yellow-500/30"
          }`}>
          <span className="text-lg">{urgent ? "🚨" : "⚖️"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">
            {urgent ? "Hearing in 30 minutes!" : "Court Hearing Tomorrow"}
          </p>
          <p className={`text-sm font-semibold mt-0.5 truncate
            ${urgent ? "text-red-300" : "text-yellow-300"}`}>
            {toast.caseName}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
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

      {/* shrinking progress bar */}
      <div
        className={`h-0.5 rounded-full mx-1 mt-1
          ${urgent ? "bg-red-500/50" : "bg-yellow-500/40"}`}
        style={{ animation: "nyay_shrink 8s linear forwards" }}
      />

      <style>{`
        @keyframes nyay_slidein {
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

  // store all scheduled setTimeout IDs so we can cancel them on logout
  const scheduledTimers = useRef([]);

  // track which (alertId + type) combos already fired this session
  const firedRef = useRef(new Set());

  // ── Fetch alerts on login ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setToasts([]);
      cancelAllTimers();
      firedRef.current.clear();
      return;
    }
    fetch(`${API}/api/alerts`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(() => {});
  }, [user]);

  // ── Request browser notification permission ───────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Cancel all pending timers ─────────────────────────────────────────
  function cancelAllTimers() {
    scheduledTimers.current.forEach(id => clearTimeout(id));
    scheduledTimers.current = [];
  }

  // ── Show an in-app toast ──────────────────────────────────────────────
  const showToast = useCallback((alert, type) => {
    const toast = {
      id        : `${alert.id}-${type}-${Date.now()}`,
      alertId   : alert.id,
      type,                                  // "1day" | "30min"
      caseName  : alert.case_name,
      courtDate : alert.court_date,
      courtTime : alert.court_time,
      notes     : alert.notes || "",
    };

    setToasts(prev => {
      // don't stack duplicate toasts for same alert+type
      if (prev.find(t => t.alertId === alert.id && t.type === type)) return prev;
      return [...prev, toast];
    });

    // auto-dismiss after 10s
    const dismissTimer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 10_000);
    scheduledTimers.current.push(dismissTimer);
  }, []);

  // ── Send a browser push notification ─────────────────────────────────
  function sendBrowserNotif(alert, type) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const title = type === "1day"
      ? `⚖️ Court Hearing Tomorrow — ${alert.case_name}`
      : `🚨 Court Hearing in 30 min — ${alert.case_name}`;
    const body  = type === "1day"
      ? `📅 ${fmtDate(alert.court_date)}  🕐 ${fmtTime(alert.court_time)}${alert.notes ? `\n${alert.notes}` : ""}`
      : `Starting at ${fmtTime(alert.court_time)} today. Get ready!`;

    new Notification(title, {
      body,
      icon : "/vite.svg",
      tag  : `nyaybot-${alert.id}-${type}`,  // prevents duplicate browser notifs
    });
  }

  // ── Schedule both notifications for one alert ─────────────────────────
  const scheduleAlert = useCallback((alert) => {
    const MS_1DAY  = 24 * 60 * 60 * 1000;   // 24 hours in ms
    const MS_30MIN = 30 * 60 * 1000;         // 30 minutes in ms

    // ── Notification 1: exactly 24 hours before hearing ──────────────
    const key1day = `${alert.id}-1day`;
    if (!firedRef.current.has(key1day)) {
      const ms1day = msUntil(alert.court_date, alert.court_time, MS_1DAY);
      if (ms1day !== null) {
        console.log(`[NyayBot] Alert "${alert.case_name}" — 1-day notif in ${(ms1day/3600000).toFixed(1)}h`);
        const t = setTimeout(() => {
          firedRef.current.add(key1day);
          showToast(alert, "1day");
          sendBrowserNotif(alert, "1day");
        }, ms1day);
        scheduledTimers.current.push(t);
      }
    }

    // ── Notification 2: exactly 30 minutes before hearing ────────────
    const key30min = `${alert.id}-30min`;
    if (!firedRef.current.has(key30min)) {
      const ms30min = msUntil(alert.court_date, alert.court_time, MS_30MIN);
      if (ms30min !== null) {
        console.log(`[NyayBot] Alert "${alert.case_name}" — 30-min notif in ${(ms30min/60000).toFixed(1)}min`);
        const t = setTimeout(() => {
          firedRef.current.add(key30min);
          showToast(alert, "30min");
          sendBrowserNotif(alert, "30min");
        }, ms30min);
        scheduledTimers.current.push(t);
      }
    }
  }, [showToast]);

  // ── Re-schedule whenever alerts list changes ──────────────────────────
  useEffect(() => {
    if (!user || !alerts.length) return;

    cancelAllTimers();           // cancel old timers before re-scheduling
    alerts.forEach(scheduleAlert);

    // cleanup on unmount or alerts change
    return () => cancelAllTimers();
  }, [alerts, user, scheduleAlert]);

  // ── Public helpers ────────────────────────────────────────────────────
  const addAlert = (alert) => {
    setAlerts(prev =>
      [...prev, alert].sort(
        (a, b) => new Date(a.court_date) - new Date(b.court_date)
      )
    );
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setToasts(prev => prev.filter(t => t.alertId !== id));
    // remove fired keys for this alert
    firedRef.current.delete(`${id}-1day`);
    firedRef.current.delete(`${id}-30min`);
  };

  const dismissToast = (toastId) =>
    setToasts(prev => prev.filter(t => t.id !== toastId));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}

      {/* Global toast stack — above everything, every page */}
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