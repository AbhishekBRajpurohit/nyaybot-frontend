import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Check existing session on page load ──────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/me`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { setUser(data.user); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Check for ?auth=success from Google OAuth redirect ────────────────
  // ✅ FIX: Added delay + retry logic so session cookie saves properly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "success") {
      // Wait 500ms for session to save on server
      setTimeout(() => {
        fetch(`${API}/api/me`, { credentials: "include" })
          .then(r => r.json())
          .then(data => {
            if (data.user) {
              setUser(data.user);
              window.history.replaceState({}, "", window.location.pathname);
            } else {
              // Try again after 1 more second
              setTimeout(() => {
                fetch(`${API}/api/me`, { credentials: "include" })
                  .then(r => r.json())
                  .then(d => {
                    setUser(d.user);
                    window.history.replaceState({}, "", window.location.pathname);
                  })
                  .catch(() => {});
              }, 1000);
            }
          })
          .catch(() => {});
      }, 500);
    }
    if (params.get("auth") === "failed") {
      console.error("Google login failed");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Register ──────────────────────────────────────────────────────────
  const register = async (email, password, name) => {
    const res = await fetch(`${API}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUser(data.user);
    return data.user;
  };

  // ── Login ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setUser(data.user);
    return data.user;
  };

  // ── Refresh user from server ──────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const res = await fetch(`${API}/api/me`, { credentials: "include" });
      const data = await res.json();
      if (data.user) setUser(data.user);
    } catch (_) {}
  };

  // ── Google OAuth ──────────────────────────────────────────────────────
  // ✅ FIX: Direct to backend URL for Google OAuth
  const loginWithGoogle = () => {
    window.location.href = `${API}/auth/google`;
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}