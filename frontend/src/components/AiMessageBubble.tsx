import type { AiMessageDto } from "../lib/api";
import { BippiMarkdown } from "./BippiMarkdown";

type Props = {
  message: AiMessageDto;
};

export function AiMessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <li
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-emerald-600/90 text-white"
            : "border border-sky-500/30 bg-slate-800/80 text-slate-100"
        }`}
      >
        {isUser ? (
          <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
        ) : (
          <BippiMarkdown content={message.content} />
        )}
      </div>
    </li>
  );
}
