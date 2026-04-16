import bippiMascot from "../assets/Bippi.png";

type Props = {
  mascotName: string;
  statusLabel: string;
};

export function AiMascotHeader({ mascotName, statusLabel }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2">
      <img
        src={bippiMascot}
        alt=""
        className="h-14 w-14 shrink-0 object-contain"
        width={56}
        height={56}
      />
      <div className="min-w-0">
        <p className="font-display text-base font-semibold text-sky-300">
          {mascotName}
        </p>
        <p className="text-xs text-white/70">{statusLabel}</p>
      </div>
    </div>
  );
}
