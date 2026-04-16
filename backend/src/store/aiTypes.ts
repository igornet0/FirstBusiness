export type AiMode = "chat" | "ideas" | "offer" | "analyze";

const MODES: AiMode[] = ["chat", "ideas", "offer", "analyze"];

export function isAiMode(s: string): s is AiMode {
  return MODES.includes(s as AiMode);
}
