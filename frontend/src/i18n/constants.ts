export const LANG_STORAGE_KEY = "lang";

export const SUPPORTED_LANGS = ["ru", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function isLang(v: string | null | undefined): v is Lang {
  return v === "ru" || v === "en";
}

export function normalizeLang(v: string | null | undefined): Lang {
  if (isLang(v)) return v;
  return "ru";
}
