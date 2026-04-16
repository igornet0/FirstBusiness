import type { AiConversationDto } from "../lib/api";
import { BippiMarkdownPreview } from "./BippiMarkdown";

type Props = {
  title: string;
  newChatLabel: string;
  onNewChat: () => void;
  items: AiConversationDto[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
  loadingLabel: string;
  loading?: boolean;
};

export function AiConversationList({
  title,
  newChatLabel,
  onNewChat,
  items,
  activeId,
  onSelect,
  emptyLabel,
  loadingLabel,
  loading,
}: Props) {
  return (
    <div className="flex min-h-[180px] flex-col rounded-2xl border border-zinc-800 bg-zinc-950/40">
      <div className="flex items-center justify-between gap-1 border-b border-zinc-800 px-2 py-1.5">
        <h3 className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {title}
        </h3>
        <button
          type="button"
          onClick={onNewChat}
          className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white transition hover:bg-white/20"
        >
          {newChatLabel}
        </button>
      </div>
      <ul className="max-h-[min(240px,36vh)] flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
        {loading ? (
          <li className="px-2 py-3 text-sm text-zinc-500">{loadingLabel}</li>
        ) : items.length === 0 ? (
          <li className="px-2 py-3 text-sm text-zinc-500">{emptyLabel}</li>
        ) : (
          items.map((c) => (
            <li key={c.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(c.id);
                  }
                }}
                className={`mb-0.5 w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
                  activeId === c.id
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                }`}
              >
                <span className="line-clamp-2 font-medium leading-snug">{c.title}</span>
                {c.lastMessagePreview ? (
                  <div className="mt-0.5 text-left">
                    <BippiMarkdownPreview content={c.lastMessagePreview} />
                  </div>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
