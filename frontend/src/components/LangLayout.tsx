import { Navigate, Outlet, useParams, useLocation } from "react-router-dom";
import { I18nProvider, useI18n } from "../i18n/I18nContext";
import { isLang, type Lang } from "../i18n/constants";
import { readStoredLang } from "../i18n/I18nContext";

function I18nReadyShell({ children }: { children: React.ReactNode }) {
  const { ready } = useI18n();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div
          className="h-9 w-9 animate-pulse rounded-full bg-zinc-800"
          aria-hidden
        />
      </div>
    );
  }
  return <>{children}</>;
}

/**
 * Validates `:lang`, syncs URL → localStorage via I18nProvider, loads locale JSON.
 */
export function LangLayout() {
  const { lang: param } = useParams<{ lang: string }>();
  const location = useLocation();

  if (!param || !isLang(param)) {
    const suffix = location.pathname;
    return <Navigate to={`/${readStoredLang()}${suffix}`} replace />;
  }

  const lang = param as Lang;

  return (
    <I18nProvider langFromUrl={lang} key={lang}>
      <I18nReadyShell>
        <Outlet />
      </I18nReadyShell>
    </I18nProvider>
  );
}
