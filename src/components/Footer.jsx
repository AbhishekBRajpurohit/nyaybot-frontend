import React from "react";
import { Scale, Mail, Phone, MapPin, ExternalLink, Heart, Shield, ChevronRight } from "lucide-react";

// Replace `t(lang, key)` with your own i18n import if needed
const t = (lang, key) => key;

export default function Footer({ lang = "en" }) {
  const year = new Date().getFullYear();

  const sections = [
    {
      title: "Services",
      links: [
        { label: "FIR Analysis", href: "#" },
        { label: "Legal Document Review", href: "#" },
        { label: "Know Your Rights", href: "#" },
        { label: "Bail Guidance", href: "#" },
        { label: "Find Local Lawyers", href: "#" },
      ],
    },
    {
      title: "Legal Areas",
      links: [
        { label: "Criminal Law (BNS/IPC)", href: "#" },
        { label: "Family & Civil Law", href: "#" },
        { label: "Consumer Rights", href: "#" },
        { label: "Labour & Employment", href: "#" },
        { label: "Property Disputes", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About NyayBot", href: "#" },
        { label: "Our Mission", href: "#" },
        { label: "Blog & Updates", href: "#" },
        { label: "Press Kit", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Disclaimer", href: "#" },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #07091a 0%, #04050f 100%)",
        borderTop: "1px solid rgba(212,160,23,0.12)",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* Top strip */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(212,160,23,0.08) 0%, rgba(212,160,23,0.04) 50%, rgba(212,160,23,0.08) 100%)",
          borderBottom: "1px solid rgba(212,160,23,0.1)",
          padding: "20px 40px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
        }}
      >
        {[
          { icon: <Mail size={14} />, label: "support@nyaybot.in" },
          { icon: <Phone size={14} />, label: "+91 9078456234" },
          { icon: <MapPin size={14} />, label: "Bengaluru, Karnataka, India" },
        ].map(({ icon, label }) => (
          <span
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#94a3b8",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <span style={{ color: "#d4a017" }}>{icon}</span>
            {label}
          </span>
        ))}
      </div>

      {/* Main grid */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "56px 40px 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr",
            gap: "40px",
            alignItems: "start",
          }}
        >
          {/* Brand column */}
          <div>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.08) 100%)",
                  border: "1px solid rgba(212,160,23,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scale size={20} color="#d4a017" />
              </div>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "'Georgia', serif",
                  letterSpacing: "-0.5px",
                }}
              >
                Nyay<span style={{ color: "#d4a017" }}>Bot</span>
              </span>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: "13.5px",
                lineHeight: "1.7",
                marginBottom: "24px",
                maxWidth: "260px",
              }}
            >
              India's AI-powered legal companion. Understand your rights, analyse FIRs, and connect with lawyers — all in your language.
            </p>

            {/* Trust badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "Free for every citizen",
                "Available in 3 languages",
                "Powered by Indian Law (BNS/BNSS)",
              ].map((badge) => (
                <span
                  key={badge}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  <Shield size={12} color="#d4a017" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map((section) => (
            <div key={section.title}>
              <p
                style={{
                  color: "#e2e8f0",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "18px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {section.title}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{
                        color: "#64748b",
                        fontSize: "13.5px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "color 0.15s",
                        fontWeight: 400,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#d4a017";
                        e.currentTarget.querySelector(".arrow").style.opacity = "1";
                        e.currentTarget.querySelector(".arrow").style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#64748b";
                        e.currentTarget.querySelector(".arrow").style.opacity = "0";
                        e.currentTarget.querySelector(".arrow").style.transform = "translateX(0px)";
                      }}
                    >
                      <span
                        className="arrow"
                        style={{
                          opacity: 0,
                          transition: "all 0.15s",
                          display: "inline-flex",
                          color: "#d4a017",
                        }}
                      >
                        <ChevronRight size={12} />
                      </span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.2) 30%, rgba(212,160,23,0.2) 70%, transparent)",
            margin: "44px 0 28px",
          }}
        />

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <p style={{ color: "#334155", fontSize: "12.5px", margin: 0, fontWeight: 400 }}>
            © {year} NyayBot. All rights reserved. · For informational purposes only — not a substitute for professional legal advice.
          </p>

          {/* Made with love in India */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span style={{ color: "#475569", fontSize: "12px", fontWeight: 500 }}>Made with</span>
            <Heart
              size={12}
              fill="#d4a017"
              color="#d4a017"
              style={{ animation: "heartbeat 1.4s ease-in-out infinite" }}
            />
            <span style={{ color: "#475569", fontSize: "12px", fontWeight: 500 }}>in</span>
            {/* Indian flag colours text */}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                background: "linear-gradient(90deg, #FF9933 0%, #FF9933 33%, #ffffff 33%, #ffffff 66%, #138808 66%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              India
            </span>
            <span style={{ fontSize: "14px" }}>🇮🇳</span>
          </div>
        </div>
      </div>

      {/* Heartbeat animation */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.25); }
          28% { transform: scale(1); }
          42% { transform: scale(1.18); }
          56% { transform: scale(1); }
        }
      `}</style>
    </footer>
  );
}