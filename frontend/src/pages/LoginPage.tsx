import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useI18n } from "../i18n/I18nContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

function translateError(
  raw: string | null,
  t: (k: string) => string
): string | null {
  if (!raw) return null;
  if (raw.startsWith("errors.")) return t(raw);
  return raw;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const login = useAppStore((s) => s.login);
  const register = useAppStore((s) => s.register);
  const error = useAppStore((s) => s.error);
  const loading = useAppStore((s) => s.loading);
  const navigate = useNavigate();
  const { t, pathWithLang } = useI18n();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      navigate(pathWithLang("/dashboard"), { replace: true });
    } catch {
      /* error in store */
    }
  }

  const displayError = translateError(error, t);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 animate-fade-in">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="font-display text-center text-3xl font-bold text-white">
          {t("login.title")}
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          {t("login.tagline")}
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <div>
            <label htmlFor="email" className="text-xs font-medium text-zinc-400">
              {t("login.email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none ring-emerald-500/0 transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-medium text-zinc-400"
            >
              {t("login.password")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none ring-emerald-500/0 transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          {displayError && (
            <p className="text-sm text-red-400" role="alert">
              {displayError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading
              ? t("common.ellipsis")
              : mode === "login"
                ? t("login.submitLogin")
                : t("login.submitRegister")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              {t("login.noAccount")}{" "}
              <button
                type="button"
                className="text-emerald-400 hover:underline"
                onClick={() => setMode("register")}
              >
                {t("login.register")}
              </button>
            </>
          ) : (
            <>
              {t("login.hasAccount")}{" "}
              <button
                type="button"
                className="text-emerald-400 hover:underline"
                onClick={() => setMode("login")}
              >
                {t("login.logInLink")}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
