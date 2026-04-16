import type { AiMode } from "../store/aiTypes.js";

export type AiConversationRecord = {
  id: string;
  userId: string;
  title: string;
  mode: AiMode;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
};

export type AiMessageRecord = {
  id: string;
  conversationId: string;
  role: "user" | "mascot";
  content: string;
  createdAt: string;
};
