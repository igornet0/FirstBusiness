import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { useI18n } from "../i18n/I18nContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token);
  const me = useAppStore((s) => s.me);
  const fetchMe = useAppStore((s) => s.fetchMe);
  const location = useLocation();
  const { t, pathWithLang } = useI18n();

  useEffect(() => {
    if (token && !me) {
      void fetchMe();
    }
  }, [token, me, fetchMe]);

  if (!token) {
    return (
      <Navigate
        to={pathWithLang("/login")}
        state={{ from: location }}
        replace
      />
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">
        {t("common.loading")}
      </div>
    );
  }

  return <>{children}</>;
}
