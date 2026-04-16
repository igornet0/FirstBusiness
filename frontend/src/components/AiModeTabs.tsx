import type { AiMode } from "../lib/api";

const MODE_KEYS = ["chat", "ideas", "offer", "analyze"] as const;

type Props = {
  mode: AiMode;
  onChange: (mode: AiMode) => void;
  label: (key: (typeof MODE_KEYS)[number]) => string;
};

export function AiModeTabs({ mode, onChange, label }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="AI mode">
      {MODE_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={mode === k}
          onClick={() => onChange(k)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            mode === k
              ? "bg-white text-slate-900"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          {label(k)}
        </button>
      ))}
    </div>
  );
}
