import React from "react";
import { t } from "../i18n";

export default function Footer({ lang = "en" }) {
  return (
    <footer className="text-center pb-8 text-slate-500 text-sm">
      <p className="font-bold mb-2">{t(lang, "footer_title")}</p>
      <p>{t(lang, "footer_disclaimer")}</p>
    </footer>
  );
}