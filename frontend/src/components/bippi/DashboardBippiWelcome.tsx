import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/I18nContext";
import bippiMascot from "../../assets/Bippi.png";
import bippiBubbleRu from "../../assets/Bippi-long-message.png";
import bippiBubbleEn from "../../assets/Bippi-long-message-en.png";

const TYPE_SPEED_MS = 22;

const storageKey = (email: string) =>
  `first-bysenes-profile-bippi-welcome:${email}`;

function hasSeenProfileBippiWelcome(email: string): boolean {
  try {
    return localStorage.getItem(storageKey(email)) === "1";
  } catch {
    return true;
  }
}

function markProfileBippiWelcomeSeen(email: string) {
  try {
    localStorage.setItem(storageKey(email), "1");
  } catch {
    /* ignore */
  }
}

type Props = {
  email: string;
};

export function DashboardBippiWelcome({ email }: Props) {
  const { t, pathWithLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [typedLength, setTypedLength] = useState(0);
  const bippiBubbleByKey: Record<string, string> = {
    "Bippi-long-message": bippiBubbleRu,
    "Bippi-long-message-en": bippiBubbleEn,
  };
  const bippiBubble =
    bippiBubbleByKey[t("bippi.longMessage")] ?? bippiBubbleRu;
  const welcomeText = t("dashboard.bippiWelcomeText");
  const typedText = welcomeText.slice(0, typedLength);
  const isTyping = typedLength < welcomeText.length;
  const heading = t("dashboard.bippiWelcomeTitle");
  const headingParts = heading.split(/(Bippi|Биппи)/);

  useEffect(() => {
    setOpen(!hasSeenProfileBippiWelcome(email));
  }, [email]);

  useEffect(() => {
    if (!open) {
      setTypedLength(0);
      return;
    }

    setTypedLength(0);
    const timer = window.setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= welcomeText.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, TYPE_SPEED_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [open, welcomeText]);

  const dismiss = useCallback(() => {
    markProfileBippiWelcomeSeen(email);
    setOpen(false);
  }, [email]);

  if (!open) return null;

  return (
    <section
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-[calc(1rem+env(safe-area-inset-left,0px))] z-40 flex max-w-[min(36rem,calc(100vw-2rem))] flex-col rounded-2xl border border-white/20 bg-slate-950/90 p-1 shadow-lg shadow-black/40 backdrop-blur-sm sm:p-1.5"
      aria-labelledby="bippi-welcome-heading"
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
                id="bippi-welcome-heading"
                className="mt-[25px] mb-px flex h-[10px] w-[200px] flex-wrap justify-start gap-1 px-[15px] py-0.5 font-display text-[11px] font-semibold leading-tight text-white sm:text-xs"
              >
                {headingParts.map((part, index) => {
                  if (!part) return null;
                  const isBippi = part === "Bippi" || part === "Биппи";
                  return (
                    <span key={`${part}-${index}`} className={isBippi ? "text-sky-300" : ""}>
                      {part}
                    </span>
                  );
                })}
              </h2>
              <p className="mt-[12px] w-[230px] max-h-full overflow-y-auto whitespace-pre-line px-[19px] text-[10px] leading-snug text-white [scrollbar-width:thin] sm:text-[11px]">
                {typedText}
                {isTyping ? <span className="ml-0.5 inline-block text-white/90">|</span> : null}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-0.5 flex shrink-0 flex-wrap items-center justify-end gap-2 sm:mt-1">
        <Link
          to={pathWithLang("/ai")}
          className="rounded-lg border border-white/35 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
          onClick={dismiss}
        >
          {t("dashboard.bippiWelcomeOpenAi")}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-sky-100 sm:px-4 sm:py-2 sm:text-sm"
        >
          {t("dashboard.bippiWelcomeDismiss")}
        </button>
      </div>
    </section>
  );
}
