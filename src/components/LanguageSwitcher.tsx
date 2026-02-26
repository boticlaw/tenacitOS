"use client";

import { Languages } from "lucide-react";
import { useI18n, type Locale } from "@/i18n/provider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        fontSize: "12px",
        color: "var(--text-muted)",
      }}
      aria-label={t("language.label")}
    >
      <Languages className="w-4 h-4" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        style={{
          backgroundColor: "var(--surface-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          color: "var(--text-primary)",
          padding: "4px 6px",
        }}
      >
        <option value="en">{t("language.english")}</option>
        <option value="es">{t("language.spanish")}</option>
      </select>
    </label>
  );
}
