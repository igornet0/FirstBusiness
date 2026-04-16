import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import bippiMascot from "../../assets/Bippi.png";
import bippiBubbleRu from "../../assets/Bippi-long-message.png";
import bippiBubbleEn from "../../assets/Bippi-long-message-en.png";

type Props = {
  missionId: string;
  onDismiss: () => void;
};

export function MissionBippiHelp({ missionId, onDismiss }: Props) {
  const { t, pathWithLang } = useI18n();
  const [question, setQuestion] = useState("");
  const [typedLength, setTypedLength] = useState(0);
  const helpText = t("mission.bippiHelpBody");
  const typedText = helpText.slice(0, typedLength);
  const isTyping = typedLength < helpText.length;

  const bippiBubbleByKey: Record<string, string> = {
    "Bippi-long-message": bippiBubbleRu,
    "Bippi-long-message-en": bippiBubbleEn,
  };
  const bippiBubble =
    bippiBubbleByKey[t("bippi.longMessage")] ?? bippiBubbleRu;

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(`mission-bippi-help:${missionId}`, "1");
    } catch {
      /* ignore */
    }
    onDismiss();
  }, [missionId, onDismiss]);

  const heading = t("mission.bippiHelpTitle");
  const headingParts = heading.split(/(Bippi|Биппи)/);

  useEffect(() => {
    setTypedLength(0);
    const timer = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= helpText.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 22);

    return () => {
      window.clearInterval(timer);
    };
  }, [helpText]);

  return (
    <section
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))] z-40 flex max-w-[min(36rem,calc(100vw-2rem))] flex-col rounded-2xl border border-white/20 bg-slate-950/90 p-1 shadow-lg shadow-black/40 backdrop-blur-sm sm:p-1.5"
      aria-labelledby="bippi-mission-help-heading"
    >
      <div className="flex flex-col items-center justify-start gap-0 sm:flex-row sm:items-center sm:justify-start sm:gap-0">
        <img
          src={bippiMascot}
          alt=""
          className="relative z-10 h-40 w-auto shrink-0 scale-110 object-contain sm:-mr-4 sm:h-44 sm:scale-[1.15]"
          width={196}
          height={196}
        />
        <div className="min-w-0 flex-1 sm:min-w-0 sm:max-w-[42rem]">
          <div className="relative -ml-10 w-[min(580px,100%)] max-w-full sm:-ml-24">
            <img
              src={bippiBubble}
              alt=""
              className="block h-[350px] w-full max-w-[1020px] origin-left scale-[1.08] select-none sm:scale-110"
            />
            <div className="absolute left-[70px] right-[8%] top-[10%] bottom-[12%] flex flex-col justify-center overflow-hidden py-0.5 sm:left-[70px] sm:right-[9%]">
              <h2
                id="bippi-mission-help-heading"
                className="mt-[25px] mb-px flex h-[10px] w-[200px] flex-wrap justify-start gap-1 px-[15px] py-0.5 font-display text-[11px] font-semibold leading-tight text-white sm:text-xs"
              >
                {headingParts.map((part, index) => {
                  if (!part) return null;
                  const isBippi = part === "Bippi" || part === "Биппи";
                  return (
                    <span
                      key={`${part}-${index}`}
                      className={isBippi ? "text-sky-300" : ""}
                    >
                      {part}
                    </span>
                  );
                })}
              </h2>
              <p className="mt-[32px] w-[230px] max-h-[120px] overflow-y-auto whitespace-pre-line px-[19px] text-[10px] leading-snug text-white [scrollbar-width:thin] sm:max-h-[140px] sm:text-[11px]">
                {typedText}
                {isTyping ? (
                  <span className="ml-0.5 inline-block text-white/90">|</span>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 w-full max-w-[min(36rem,calc(100vw-2.5rem))] px-1 sm:px-2">
        <label htmlFor="mission-bippi-question" className="sr-only">
          {t("mission.bippiHelpQuestionLabel")}
        </label>
        <textarea
          id="mission-bippi-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder={t("mission.bippiHelpQuestionPlaceholder")}
          className="w-full resize-y rounded-xl border border-white/20 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/40 sm:text-sm"
        />
      </div>

      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-end gap-2 sm:mt-2">
        <Link
          to={pathWithLang("/ai")}
          state={{ prefilledMessage: question.trim() }}
          className="rounded-lg border border-white/35 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
          onClick={dismiss}
        >
          {t("mission.bippiHelpOpenAi")}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-sky-100 sm:px-4 sm:py-2 sm:text-sm"
        >
          {t("mission.bippiHelpDismiss")}
        </button>
      </div>
    </section>
  );
}
