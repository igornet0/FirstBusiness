import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LangLayout } from "./components/LangLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MissionPage } from "./pages/MissionPage";
import { AiPage } from "./pages/AiPage";
import { useAppStore } from "./store/useAppStore";
import { readStoredLang } from "./i18n/I18nContext";
import { normalizeLang } from "./i18n/constants";

function RootRedirect() {
  const token = useAppStore((s) => s.token);
  const lang = readStoredLang();
  return (
    <Navigate
      to={token ? `/${lang}/dashboard` : `/${lang}/login`}
      replace
    />
  );
}

function LangIndexRedirect() {
  const token = useAppStore((s) => s.token);
  const { lang } = useParams<{ lang: string }>();
  const L = normalizeLang(lang);
  return (
    <Navigate
      to={token ? `/${L}/dashboard` : `/${L}/login`}
      replace
    />
  );
}

function InsideLangCatchAll() {
  const { lang } = useParams<{ lang: string }>();
  const L = normalizeLang(lang);
  return <Navigate to={`/${L}/dashboard`} replace />;
}

/** Paths without /en/ or /ru/ prefix → `/${storedLang}${path}`. */
function OutsideLangRedirect() {
  const loc = useLocation();
  if (loc.pathname === "/") {
    return <RootRedirect />;
  }
  if (/^\/(en|ru)(\/|$)/.test(loc.pathname)) {
    const parts = loc.pathname.split("/").filter(Boolean);
    const L = parts[0] === "en" ? "en" : "ru";
    return <Navigate to={`/${L}/dashboard`} replace />;
  }
  const lang = readStoredLang();
  return (
    <Navigate
      to={`/${lang}${loc.pathname}${loc.search}${loc.hash}`}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:lang" element={<LangLayout />}>
          <Route index element={<LangIndexRedirect />} />
          <Route path="login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="mission/:id" element={<MissionPage />} />
            <Route path="ai" element={<AiPage />} />
          </Route>
          <Route path="*" element={<InsideLangCatchAll />} />
        </Route>
        <Route path="*" element={<OutsideLangRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
