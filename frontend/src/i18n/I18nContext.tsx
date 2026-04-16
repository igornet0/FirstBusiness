import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LANG_STORAGE_KEY, type Lang, normalizeLang } from "./constants";
import { loadLocale, type Messages } from "./loadLocale";

export type TFunction = (
  key: string,
  vars?: Record<string, string | number>
) => string;

type I18nContextValue = {
  lang: Lang;
  ready: boolean;
  t: TFunction;
  pathWithLang: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type Props = {
  langFromUrl: Lang;
  children: ReactNode;
};

export function I18nProvider({ langFromUrl, children }: Props) {
  const [activeLang, setActiveLang] = useState<Lang>(langFromUrl);
  const [activeMessages, setActiveMessages] = useState<Messages>({});
  const [fallbackRu, setFallbackRu] = useState<Messages | null>(null);
  const [ready, setReady] = useState(false);
  const loadingRef = useRef<Lang | null>(null);

  useEffect(() => {
    setActiveLang(langFromUrl);
    localStorage.setItem(LANG_STORAGE_KEY, langFromUrl);
  }, [langFromUrl]);

  useEffect(() => {
    let cancelled = false;
    const lang = activeLang;
    loadingRef.current = lang;

    async function run() {
      setReady(false);
      try {
        if (lang === "ru") {
          const ru = await loadLocale("ru");
          if (cancelled || loadingRef.current !== lang) return;
          setFallbackRu(ru);
          setActiveMessages(ru);
        } else {
          const [ru, en] = await Promise.all([
            loadLocale("ru"),
            loadLocale("en"),
          ]);
          if (cancelled || loadingRef.current !== lang) return;
          setFallbackRu(ru);
          setActiveMessages(en);
        }
      } finally {
        if (!cancelled && loadingRef.current === lang) {
          setReady(true);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeLang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const pick = () => {
        const fromActive = activeMessages[key];
        if (fromActive !== undefined && fromActive !== "") return fromActive;
        const fromRu = fallbackRu?.[key];
        if (fromRu !== undefined && fromRu !== "") return fromRu;
        return key;
      };
      const raw = pick();
      if (!vars) return raw;
      return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? "")
      );
    },
    [activeMessages, fallbackRu]
  );

  const pathWithLang = useCallback(
    (path: string) => {
      const p = path.startsWith("/") ? path : `/${path}`;
      return `/${activeLang}${p}`;
    },
    [activeLang]
  );

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = activeLang;
    const title = t("meta.title");
    if (title && title !== "meta.title") {
      document.title = title;
    }
  }, [ready, activeLang, t]);

  const value = useMemo(
    () => ({
      lang: activeLang,
      ready,
      t,
      pathWithLang,
    }),
    [activeLang, ready, t, pathWithLang]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function readStoredLang(): Lang {
  return normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
}
