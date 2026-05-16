import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const AlertsContext = createContext(null);
const API = "http://localhost:4000";

export function AlertsProvider({ children }) {
  const { user } = useAuth();
  const [alerts, setAlerts]           = useState([]);
  const [notification, setNotification] = useState(null); // { title, body }
  const intervalRef                   = useRef(null);

  // ── Fetch alerts whenever user logs in ──────────────────────────────────
  useEffect(() => {
    if (!user) { setAlerts([]); return; }
    fetch(`${API}/api/alerts`, { credentials: "include" })
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(() => {});
  }, [user]);

  // ── Global notification checker — runs every 60s ────────────────────────
  useEffect(() => {
    if (!user || alerts.length === 0) return;

    // Request permission on first load
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const check = () => {
      const now = new Date();
      alerts.forEach(alert => {
        const hearingDateTime = new Date(`${alert.court_date}T${alert.court_time}`);
        const diffMs = hearingDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Notify if within 24 hours and not past
        if (diffHours > 0 && diffHours <= 24) {
          const days = Math.floor(diffHours);
          const label = days === 0 ? "TODAY" : "tomorrow";
          const msg = {
            title: "⚖️ NyayBot Court Reminder",
            body: `${alert.case_name} — Hearing ${label} at ${formatTime(alert.court_time)}`,
          };

          // Show in-app toast notification
          setNotification(msg);
          setTimeout(() => setNotification(null), 6000);

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(msg.title, { body: msg.body, icon: "/vite.svg" });
          }
        }
      });
    };

    check(); // run immediately
    intervalRef.current = setInterval(check, 60000);
    return () => clearInterval(intervalRef.current);
  }, [alerts, user]);

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const addAlert    = (alert) => setAlerts(prev => [...prev, alert].sort((a, b) => new Date(a.court_date) - new Date(b.court_date)));
  const removeAlert = (id)    => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}

      {/* ── Global Toast Notification ── */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#0c0f22] border border-yellow-500/40 rounded-2xl p-4 shadow-2xl shadow-black/60 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center shrink-0">
              <span className="text-xl">⚖️</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{notification.title}</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-snug">{notification.body}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}