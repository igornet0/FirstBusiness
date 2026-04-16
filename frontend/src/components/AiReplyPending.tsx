import { useEffect, useState } from "react";

type Props = {
  thinkingLabel: string;
  generatingLabel: string;
};

const PHASE_MS = 2800;

export function AiReplyPending({ thinkingLabel, generatingLabel }: Props) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPhase((p) => (p + 1) % 2);
    }, PHASE_MS);
    return () => window.clearInterval(id);
  }, []);

  const label = phase === 0 ? thinkingLabel : generatingLabel;

  return (
    <div
      className="max-w-[90%] rounded-2xl border border-sky-500/25 bg-slate-800/60 px-4 py-3 shadow-inner"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-4 items-end gap-[5px] pb-0.5" aria-hidden>
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)] [animation-delay:0ms]" />
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)] [animation-delay:110ms]" />
          <span className="inline-block h-2 w-2 animate-bounce-dot rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.45)] [animation-delay:220ms]" />
        </div>
        <p
          className="min-w-0 flex-1 bg-gradient-to-r from-zinc-500 via-white to-zinc-500 bg-[length:200%_100%] bg-clip-text text-sm leading-snug text-transparent animate-shimmer-text"
        >
          {label}
        </p>
      </div>
      <div
        className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-zinc-700/80"
        aria-hidden
      >
        <div className="h-full w-1/3 animate-shimmer-bar rounded-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />
      </div>
    </div>
  );
}
