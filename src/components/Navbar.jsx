import React, { useState, useEffect } from "react";
import {
  Scale,
  Globe,
  Home,
  Search,
  Users,
  FileText,
  History,
  Bell,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { t } from "../i18n";
import { useAuth } from "./AuthContext";

const LANGUAGES = [
  "English",
  "Hindi (हिंदी)",
  "Kannada (ಕನ್ನಡ)",
  "Tamil (தமிழ்)",
  "Telugu (తెలుగు)",
  "Marathi (मराठी)",
];

export default function Navbar({
  activeView = "home",
  onNavigate,
  lang = "en",
  langLabel = "English",
  onLangChange,
  onSignInClick,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const NAV_ITEMS = [
    { id: "home", label: t(lang, "nav_home"), Icon: Home },
    { id: "analyze", label: t(lang, "nav_analyze"), Icon: Search },
    { id: "lawyers", label: t(lang, "nav_lawyers"), Icon: Users },
    { id: "report", label: t(lang, "nav_report"), Icon: FileText },
    { id: "history", label: t(lang, "nav_history"), Icon: History },
    { id: "alerts", label: t(lang, "nav_alerts"), Icon: Bell },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
          onClick={() => onNavigate("home")}
        >
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            <Scale size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-3xl font-serif font-bold tracking-tight text-white leading-none">
              NyayBot
            </span>
            <span className="text-[10px] text-yellow-500/90 font-semibold tracking-widest uppercase mt-1.5 leading-none">
              {t(lang, "tagline")}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center space-x-1 bg-white/5 border border-white/10 rounded-2xl px-2 py-1.5 backdrop-blur-md shadow-lg shrink-0">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1a2240] text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} className="opacity-70" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4 shrink-0">
          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:border-yellow-500/40 hover:text-white transition-all duration-200 whitespace-nowrap"
            >
              <Globe size={16} className="text-yellow-500" />
              <span className="font-medium">{langLabel}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#141929] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      onLangChange(l);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors whitespace-nowrap ${
                      langLabel === l
                        ? "bg-yellow-500/20 text-yellow-400 font-medium"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-yellow-500/40 hover:bg-white/10 transition-all"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-xs">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-white text-sm font-medium max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-slate-400 transition-transform ${
                    userOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#141929] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-white text-sm font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setUserOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold text-sm transition-all duration-200 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-400/40 hover:-translate-y-0.5 whitespace-nowrap"
            >
              {t(lang, "nav_signin")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
