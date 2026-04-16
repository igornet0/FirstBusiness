import { Link, Outlet, useLocation } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { useAppStore } from "../store/useAppStore";
import { useI18n } from "../i18n/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppShell() {
  const location = useLocation();
  const me = useAppStore((s) => s.me);
  const logout = useAppStore((s) => s.logout);
  const { t, pathWithLang } = useI18n();

  const dash = pathWithLang("/dashboard");
  const ai = pathWithLang("/ai");
  const isAiPage = location.pathname.includes("/ai");
  const shellMax = isAiPage ? "max-w-6xl" : "max-w-3xl";

  const nav = [
    { to: dash, label: t("nav.dashboard"), match: "/dashboard" },
    { to: ai, label: t("nav.ai"), match: "/ai" },
  ];

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className={`mx-auto flex ${shellMax} flex-col gap-3 px-4 py-3`}>
          <div className="flex items-center justify-between gap-4">
            <Link
              to={dash}
              className="font-display text-lg font-semibold tracking-tight text-white"
            >
              {t("login.title")}
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <LanguageSwitcher />
              <nav className="flex items-center gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      location.pathname.includes(item.match)
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => logout()}
                  className="ml-1 rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                >
                  {t("nav.logout")}
                </button>
              </nav>
            </div>
          </div>
          {me && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {t("header.levelXp", { level: me.level, xp: me.xp })}
                </span>
                <span>{t("header.pathProgress", { pct: me.progressPct })}</span>
              </div>
              <ProgressBar value={me.progressPct} />
            </div>
          )}
        </div>
      </header>
      <main className={`mx-auto ${shellMax} px-4 py-8`}>
        <Outlet />
      </main>
    </div>
  );
}
