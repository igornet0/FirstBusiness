import { useI18n } from "../i18n/I18nContext";
import { useSwitchLanguage } from "../i18n/useSwitchLanguage";
import { SUPPORTED_LANGS } from "../i18n/constants";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, t } = useI18n();
  const switchLanguage = useSwitchLanguage();

  return (
    <div
      className={`flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5 ${className}`}
      role="group"
      aria-label={t("lang.switcher")}
    >
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLanguage(code)}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition ${
            lang === code
              ? "bg-zinc-700 text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
          aria-pressed={lang === code}
        >
          {code === "ru" ? t("lang.ru") : t("lang.en")}
        </button>
      ))}
    </div>
  );
}
