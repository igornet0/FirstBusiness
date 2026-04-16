import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MissionBippiHelp } from "../components/bippi/MissionBippiHelp";
import { useAppStore } from "../store/useAppStore";
import { useI18n } from "../i18n/I18nContext";
import { translateMission } from "../lib/missionI18n";
import { api } from "../lib/api";

const MISSION_HELP_DELAY_MS = 1 * 60 * 1000;
const AUTOSAVE_DEBOUNCE_MS = 600;

type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

export function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = useAppStore((s) => s.me);
  const token = useAppStore((s) => s.token);
  const completeMission = useAppStore((s) => s.completeMission);
  const loading = useAppStore((s) => s.loading);
  const { t, pathWithLang } = useI18n();

  const [answers, setAnswers] = useState<string[]>([]);
  const [answersHydrated, setAnswersHydrated] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [showBippiHelp, setShowBippiHelp] = useState(false);

  const debounceTimersRef = useRef<Map<number, number>>(new Map());
  const pendingSavesRef = useRef(0);
  const saveFailuresRef = useRef(0);

  const mission = useMemo(
    () => me?.missions.find((m) => m.id === id),
    [me?.missions, id]
  );

  const copy = useMemo(
    () => (mission ? translateMission(mission, t) : null),
    [mission, t]
  );

  useEffect(() => {
    debounceTimersRef.current.forEach((tid) => window.clearTimeout(tid));
    debounceTimersRef.current.clear();
    pendingSavesRef.current = 0;
    saveFailuresRef.current = 0;
    setDraftSaveStatus("idle");

    if (
      !mission ||
      mission.status !== "active" ||
      mission.tasks.length === 0
    ) {
      setAnswers([]);
      setAnswersHydrated(true);
      return;
    }
    if (!token) {
      setAnswers(mission.tasks.map(() => ""));
      setAnswersHydrated(true);
      return;
    }

    let cancelled = false;
    setAnswersHydrated(false);

    void (async () => {
      try {
        const { answers: server } = await api.missionAnswers(token, mission.id);
        if (cancelled) return;
        const len = mission.tasks.length;
        const next = Array.from({ length: len }, (_, i) =>
          typeof server[i] === "string" ? server[i] : ""
        );
        setAnswers(next);
      } catch {
        if (!cancelled) setAnswers(mission.tasks.map(() => ""));
      } finally {
        if (!cancelled) setAnswersHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mission?.id, mission?.status, mission?.tasks.length, token]);

  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach((tid) => window.clearTimeout(tid));
      debounceTimersRef.current.clear();
    };
  }, []);

  const runSave = useCallback(
    async (taskIndex: number, value: string) => {
      if (!token || !mission?.id || mission.status !== "active") return;
      pendingSavesRef.current += 1;
      setDraftSaveStatus("saving");
      try {
        await api.upsertMissionAnswer(token, mission.id, taskIndex, value);
      } catch {
        saveFailuresRef.current += 1;
        pendingSavesRef.current -= 1;
        setDraftSaveStatus("error");
        if (pendingSavesRef.current === 0) {
          saveFailuresRef.current = 0;
        }
        return;
      }
      pendingSavesRef.current -= 1;
      if (pendingSavesRef.current === 0) {
        if (saveFailuresRef.current > 0) {
          setDraftSaveStatus("error");
          saveFailuresRef.current = 0;
        } else {
          setDraftSaveStatus("saved");
          window.setTimeout(() => {
            setDraftSaveStatus((s) => (s === "saved" ? "idle" : s));
          }, 2000);
        }
      }
    },
    [token, mission?.id, mission?.status]
  );

  const scheduleSave = useCallback(
    (taskIndex: number, value: string) => {
      const existing = debounceTimersRef.current.get(taskIndex);
      if (existing !== undefined) window.clearTimeout(existing);
      const tid = window.setTimeout(() => {
        debounceTimersRef.current.delete(taskIndex);
        void runSave(taskIndex, value);
      }, AUTOSAVE_DEBOUNCE_MS);
      debounceTimersRef.current.set(taskIndex, tid);
    },
    [runSave]
  );

  useEffect(() => {
    setShowBippiHelp(false);
  }, [mission?.id]);

  useEffect(() => {
    if (!mission?.id || mission.status !== "active") return;
    try {
      if (sessionStorage.getItem(`mission-bippi-help:${mission.id}`) === "1") {
        return;
      }
    } catch {
      /* ignore */
    }
    const timerId = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(`mission-bippi-help:${mission.id}`) === "1") {
          return;
        }
      } catch {
        /* ignore */
      }
      setShowBippiHelp(true);
    }, MISSION_HELP_DELAY_MS);
    return () => window.clearTimeout(timerId);
  }, [mission?.id, mission?.status]);

  if (!me || !id) return null;

  if (!mission || !copy) {
    return (
      <div className="animate-fade-in text-center">
        <p className="text-zinc-400">{t("mission.notFound")}</p>
        <Link
          to={pathWithLang("/dashboard")}
          className="mt-4 inline-block text-emerald-400"
        >
          {t("mission.backDashboard")}
        </Link>
      </div>
    );
  }

  const isLocked = mission.status === "locked";
  const isDone = mission.status === "completed";

  const allFilled =
    answers.length === copy.tasks.length &&
    answers.every((a) => a.trim().length > 0);

  const handleComplete = async () => {
    if (!allFilled || loading) return;
    const trimmed = answers.map((a) => a.trim());
    const result = await completeMission(mission.id, trimmed);
    if (!result) return;
    if (result.activeMissionId) {
      navigate(pathWithLang(`/mission/${result.activeMissionId}`));
    } else {
      navigate(pathWithLang("/dashboard"));
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {showBippiHelp && !isLocked && !isDone ? (
        <MissionBippiHelp
          missionId={mission.id}
          onDismiss={() => setShowBippiHelp(false)}
        />
      ) : null}
      <Link
        to={pathWithLang("/dashboard")}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        {t("mission.backLink")}
      </Link>
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {t("mission.levelLine", {
            levelName: copy.levelName,
            level: mission.level,
          })}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          {copy.title}
        </h1>
        <p className="mt-3 text-zinc-400">{copy.description}</p>
        <p className="mt-4 text-sm text-emerald-500/90">
          {t("mission.reward", { xp: mission.xp })}
        </p>
      </header>

      {isLocked && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          {t("mission.locked")}
        </p>
      )}

      {isDone && (
        <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          {t("mission.completed")}
        </p>
      )}

      {!isLocked && !isDone && (
        <>
          <section className="space-y-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              {t("mission.questionsHeading")}
            </h2>
            <p className="text-sm text-zinc-500">{t("mission.questionsHint")}</p>
            {!answersHydrated ? (
              <p className="text-xs text-zinc-500">{t("mission.loadingAnswers")}</p>
            ) : null}
            {answersHydrated && draftSaveStatus !== "idle" ? (
              <p
                className={
                  draftSaveStatus === "error"
                    ? "text-xs text-amber-500/90"
                    : draftSaveStatus === "saved"
                      ? "text-xs text-emerald-500/80"
                      : "text-xs text-zinc-500"
                }
              >
                {draftSaveStatus === "saving"
                  ? t("mission.draftSaving")
                  : draftSaveStatus === "saved"
                    ? t("mission.draftSaved")
                    : draftSaveStatus === "error"
                      ? t("mission.draftError")
                      : null}
              </p>
            ) : null}
            <ul className="space-y-6">
              {copy.tasks.map((label, i) => (
                <li key={i}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-zinc-200">
                      {label}
                    </span>
                    <textarea
                      value={answers[i] ?? ""}
                      onChange={(e) => {
                        const next = [...answers];
                        next[i] = e.target.value;
                        setAnswers(next);
                        if (answersHydrated) {
                          scheduleSave(i, e.target.value);
                        }
                      }}
                      disabled={loading || !answersHydrated}
                      rows={3}
                      className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700 disabled:opacity-60"
                      placeholder={t("mission.answerPlaceholder")}
                    />
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {allFilled && (
            <div className="pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleComplete()}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60 sm:w-auto"
              >
                {loading ? t("mission.completing") : t("mission.completeLevel")}
              </button>
            </div>
          )}

          {!allFilled && (
            <p className="text-xs text-zinc-500">{t("mission.fillAllHint")}</p>
          )}
        </>
      )}
    </div>
  );
}
