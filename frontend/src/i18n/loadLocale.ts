import type { Lang } from "./constants";

export type Messages = Record<string, string>;

/** Lazy-load one locale JSON (Vite code-splits per language). */
export function loadLocale(lang: Lang): Promise<Messages> {
  if (lang === "ru") {
    return import("../locales/ru.json").then((m) => m.default as Messages);
  }
  return import("../locales/en.json").then((m) => m.default as Messages);
}
