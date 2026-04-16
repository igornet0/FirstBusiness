type Props = { value: number; className?: string };

export function ProgressBar({ value, className = "" }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
