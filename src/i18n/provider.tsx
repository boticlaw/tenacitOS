"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";

export type Locale = "en" | "es";

type Messages = Record<string, unknown>;

const DICTIONARY: Record<Locale, Messages> = { en, es };
const COOKIE_NAME = "superbotijo-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatDateTime: (value: Date | number | string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (typeof acc === "object" && acc !== null && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function interpolate(text: string, values?: Record<string, string | number>) {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const local = localStorage.getItem(COOKIE_NAME);
  if (local === "en" || local === "es") return local;

  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (cookie === "en" || cookie === "es") return cookie;

  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);
  const initRef = useRef(false);
  const mountedRef = useRef(false);

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(COOKIE_NAME, newLocale);
      document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    
    if (!initRef.current) {
      initRef.current = true;
      const detected = detectLocale();
      requestAnimationFrame(() => {
        if (detected !== locale) {
          setLocaleState(detected);
        }
        setHydrated(true);
      });
    }
  }, [locale]);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale, hydrated]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = DICTIONARY[locale] || DICTIONARY.en;

    return {
      locale,
      setLocale: handleSetLocale,
      t: (key: string, values?: Record<string, string | number>) => {
        const raw = getByPath(messages, key) ?? getByPath(DICTIONARY.en, key) ?? key;
        return typeof raw === "string" ? interpolate(raw, values) : key;
      },
      formatNumber: (value: number) => new Intl.NumberFormat(locale).format(value),
      formatDateTime: (value: Date | number | string) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value)),
    };
  }, [locale, handleSetLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function getDefaultLocaleForTest(opts: { localStorageLocale?: string | null; cookieLocale?: string | null; navigatorLanguage?: string | null; }): Locale {
  if (opts.localStorageLocale === "en" || opts.localStorageLocale === "es") return opts.localStorageLocale;
  if (opts.cookieLocale === "en" || opts.cookieLocale === "es") return opts.cookieLocale;
  return (opts.navigatorLanguage || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

export function getInitialLocaleForTest(): Locale {
  return detectLocale();
}
