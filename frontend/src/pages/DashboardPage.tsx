import { Link } from "react-router-dom";
import { useAppStore, selectActiveMission } from "../store/useAppStore";
import { useI18n } from "../i18n/I18nContext";
import { translateMission } from "../lib/missionI18n";
import { DashboardBippiWelcome } from "../components/bippi/DashboardBippiWelcome";

export function DashboardPage() {
  const me = useAppStore((s) => s.me);
  const active = selectActiveMission(me);
  const { t, pathWithLang } = useI18n();

  if (!me) return null;

  const activeCopy = active ? translateMission(active, t) : null;

  return (
    <div className="animate-fade-in space-y-8">
      <DashboardBippiWelcome email={me.email} />
      <div>
        <p className="text-sm text-zinc-500">{t("dashboard.signedInAs")}</p>
        <p className="font-medium text-zinc-200">{me.email}</p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          {t("dashboard.yourPath")}
        </h2>
        <p className="mt-2 text-lg font-semibold text-white capitalize">
          {t("dashboard.pathLine", { path: me.path, level: me.level })}
        </p>
        <p className="mt-1 text-sm text-zinc-400">
          {t("dashboard.xpLine", { xp: me.xp, pct: me.progressPct })}
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-white">
          {t("dashboard.currentMission")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("dashboard.missionHint")}
        </p>
        {active && activeCopy ? (
          <div className="mt-6 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-500/90">
              {t("mission.levelLine", {
                levelName: activeCopy.levelName,
                level: active.level,
              })}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">
              {activeCopy.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400">{activeCopy.description}</p>
            <Link
              to={pathWithLang(`/mission/${active.id}`)}
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              {t("dashboard.openMission")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
            <p className="text-zinc-300">{t("dashboard.allDone")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("dashboard.useAi")}</p>
            <Link
              to={pathWithLang("/ai")}
              className="mt-6 inline-flex rounded-xl border border-zinc-600 px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              {t("dashboard.openAi")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
