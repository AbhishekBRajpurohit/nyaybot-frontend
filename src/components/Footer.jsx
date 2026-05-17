import React from "react";
import { Scale, Mail, Phone, MapPin, Heart, ExternalLink, Shield, Award, Globe } from "lucide-react";
import { t } from "../i18n";

const FOOTER_LINKS = {
  company: {
    title: "Company",
    links: [
      { label: "About NyayBot", href: "#" },
      { label: "Our Mission", href: "#" },
      { label: "Press & Media", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
  services: {
    title: "Services",
    links: [
      { label: "FIR Analysis", href: "#" },
      { label: "Bail Probability", href: "#" },
      { label: "Find a Lawyer", href: "#" },
      { label: "Court Reminders", href: "#" },
      { label: "Legal Report", href: "#" },
      { label: "Rights Explained", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Disclaimer", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Grievance Redressal", href: "#" },
      { label: "Sitemap", href: "#" },
    ],
  },
  support: {
    title: "Help & Support",
    links: [
      { label: "How It Works", href: "#" },
      { label: "FAQs", href: "#" },
      { label: "Report an Issue", href: "#" },
      { label: "Accessibility", href: "#" },
      { label: "NGO Partnership", href: "#" },
      { label: "Feedback", href: "#" },
    ],
  },
};

const BADGES = [
  { icon: <Shield size={16} className="text-emerald-400" />, label: "SSL Secured" },
  { icon: <Award size={16} className="text-yellow-400" />, label: "Govt. Compliant" },
  { icon: <Globe size={16} className="text-blue-400" />, label: "12 Languages" },
];

const SOCIALS = [
  {
    href: "#", label: "Twitter",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  },
  {
    href: "#", label: "LinkedIn",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  },
  {
    href: "#", label: "Instagram",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  },
  {
    href: "#", label: "YouTube",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  },
];

const LANGUAGES = ["English", "हिंदी", "ಕನ್ನಡ", "தமிழ்", "తెలుగు", "मराठी"];

export default function Footer({ lang = "en" }) {
  return (
    <footer className="bg-[#080b18] border-t border-white/8 text-slate-400 text-sm">

      {/* ── Top band: trust badges ── */}
      <div className="border-b border-white/6 bg-[#0a0d1e]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            {BADGES.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-400">
                {b.icon}
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Globe size={13} className="text-yellow-500" />
            <span className="font-medium text-slate-400 mr-1">Available in:</span>
            {LANGUAGES.map((l, i) => (
              <span key={i} className="hover:text-yellow-400 cursor-pointer transition-colors">
                {l}{i < LANGUAGES.length - 1 && <span className="mx-1 text-white/15">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

        {/* Brand column — spans 2 cols */}
        <div className="lg:col-span-2">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 shrink-0">
              <Scale size={24} strokeWidth={2.5} className="text-slate-900" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-white tracking-tight leading-none block">NyayBot</span>
              <span className="text-[10px] text-yellow-500/80 font-bold tracking-widest uppercase leading-none">Justice · Made Understandable</span>
            </div>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs">
            AI-powered legal guidance for every Indian citizen — in your language, at no cost. Know your rights. Find help. Stay informed.
          </p>

          {/* Contact info */}
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center gap-2.5 text-xs">
              <Mail size={13} className="text-yellow-500 shrink-0" />
              <a href="mailto:support@nyaybot.in" className="hover:text-yellow-400 transition-colors">support@nyaybot.in</a>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Phone size={13} className="text-yellow-500 shrink-0" />
              <a href="tel:+918001234567" className="hover:text-yellow-400 transition-colors">+91 800 123 4567</a>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <MapPin size={13} className="text-yellow-500 shrink-0 mt-0.5" />
              <span>NyayBot Technologies Pvt. Ltd.<br />Bengaluru, Karnataka — 560001, India</span>
            </div>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2">
            {SOCIALS.map((s, i) => (
              <a
                key={i}
                href={s.href}
                aria-label={s.label}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-yellow-400 hover:border-yellow-500/30 hover:bg-yellow-500/8 transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.values(FOOTER_LINKS).map((col, i) => (
          <div key={i} className="lg:col-span-1">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-5">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((link, j) => (
                <li key={j}>
                  <a
                    href={link.href}
                    className="text-slate-500 hover:text-yellow-400 transition-colors text-sm leading-none flex items-center gap-1 group"
                  >
                    {link.label}
                    {link.href !== "#" && (
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/6" />

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} NyayBot Technologies Pvt. Ltd. All rights reserved.</span>
          <span className="hidden sm:block w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1">
            Made with <Heart size={11} className="text-red-500 fill-red-500 mx-0.5" /> in India 🇮🇳
          </span>
          <span className="hidden sm:block w-px h-3 bg-white/10" />
          <span>CIN: U12345KA2024PTC000000</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
          <span className="w-px h-3 bg-white/10" />
          <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          <span className="w-px h-3 bg-white/10" />
          <a href="#" className="hover:text-slate-400 transition-colors">Disclaimer</a>
          <span className="w-px h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All systems operational
          </span>
        </div>
      </div>

      {/* ── Disclaimer strip ── */}
      <div className="bg-[#060810] px-6 py-3 text-center">
        <p className="text-slate-600 text-[11px] max-w-4xl mx-auto leading-relaxed">
          <span className="font-semibold text-slate-500">Disclaimer:</span> NyayBot provides general legal information for awareness purposes only. It does not constitute legal advice and is not a substitute for consultation with a qualified advocate. Always consult a licensed lawyer for your specific legal matters.
        </p>
      </div>
    </footer>
  );
}