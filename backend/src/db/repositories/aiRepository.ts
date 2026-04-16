import type { MessageRole, AiMode as PrismaAiMode } from "@prisma/client";
import type { AiMode } from "../../store/aiTypes.js";
import type { AiConversationRecord, AiMessageRecord } from "../../types/ai.js";
import { prisma } from "../client.js";

function toAppMode(m: PrismaAiMode): AiMode {
  return m as AiMode;
}

function toPrismaMode(m: AiMode): PrismaAiMode {
  return m as PrismaAiMode;
}

function toMessageRole(r: "user" | "mascot"): MessageRole {
  return r === "user" ? "user" : "mascot";
}

function preview(text: string, max = 120): string {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

const TITLE_MAX = 80;

function convToRecord(c: {
  id: string;
  userId: string;
  title: string;
  mode: PrismaAiMode;
  createdAt: Date;
  updatedAt: Date;
  lastMessagePreview: string;
}): AiConversationRecord {
  return {
    id: c.id,
    userId: c.userId,
    title: c.title,
    mode: toAppMode(c.mode),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    lastMessagePreview: c.lastMessagePreview,
  };
}

function msgToRecord(m: {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}): AiMessageRecord {
  return {
    id: m.id,
    conversationId: m.conversationId,
    role: m.role === "user" ? "user" : "mascot",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function createAiConversation(
  userId: string,
  mode: AiMode,
  title?: string
): Promise<AiConversationRecord> {
  const now = new Date();
  const c = await prisma.aiConversation.create({
    data: {
      userId,
      title: title?.trim() || "Chat",
      mode: toPrismaMode(mode),
      createdAt: now,
      updatedAt: now,
      lastMessagePreview: "",
    },
  });
  return convToRecord(c);
}

export async function listAiConversations(
  userId: string,
  opts?: { mode?: AiMode; limit?: number }
): Promise<AiConversationRecord[]> {
  const limit = Math.min(opts?.limit ?? 50, 100);
  const items = await prisma.aiConversation.findMany({
    where: {
      userId,
      ...(opts?.mode ? { mode: toPrismaMode(opts.mode) } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return items.map(convToRecord);
}

export async function getAiConversation(
  userId: string,
  conversationId: string
): Promise<AiConversationRecord | undefined> {
  const c = await prisma.aiConversation.findFirst({
    where: { id: conversationId, userId },
  });
  return c ? convToRecord(c) : undefined;
}

export async function getAiMessages(
  userId: string,
  conversationId: string
): Promise<AiMessageRecord[] | undefined> {
  const c = await getAiConversation(userId, conversationId);
  if (!c) return undefined;
  const list = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return list.map(msgToRecord);
}

export async function updateAiConversationTitle(
  userId: string,
  conversationId: string,
  title: string
): Promise<AiConversationRecord | undefined> {
  const c = await getAiConversation(userId, conversationId);
  if (!c) return undefined;
  const t = title.trim().replace(/\s+/g, " ");
  const nextTitle =
    t.length > TITLE_MAX ? `${t.slice(0, TITLE_MAX - 1)}…` : t || c.title;
  const updated = await prisma.aiConversation.update({
    where: { id: conversationId },
    data: { title: nextTitle },
  });
  return convToRecord(updated);
}

export async function appendAiMessage(
  userId: string,
  conversationId: string,
  role: "user" | "mascot",
  content: string
): Promise<AiMessageRecord | undefined> {
  const c = await getAiConversation(userId, conversationId);
  if (!c) return undefined;
  const msg = await prisma.$transaction(async (tx) => {
    const created = await tx.aiMessage.create({
      data: {
        conversationId,
        role: toMessageRole(role),
        content,
      },
    });
    await tx.aiConversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: created.createdAt,
        lastMessagePreview: preview(content),
      },
    });
    return created;
  });
  return msgToRecord(msg);
}

export async function getRecentAiMessagesForLlm(
  conversationId: string,
  max: number
): Promise<AiMessageRecord[]> {
  const list = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: max,
  });
  return list.reverse().map(msgToRecord);
}

/** Учёт запроса к legacy `POST /api/ai` (без строки в `AiMessage`). */
export async function recordLegacyAiUserRequest(userId: string): Promise<void> {
  await prisma.aiUserRequestLog.create({
    data: { userId },
  });
}

export async function popLastAiMessage(
  userId: string,
  conversationId: string
): Promise<AiMessageRecord | undefined> {
  const c = await getAiConversation(userId, conversationId);
  if (!c) return undefined;
  const last = await prisma.aiMessage.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return undefined;
  const removed = await prisma.$transaction(async (tx) => {
    await tx.aiMessage.delete({ where: { id: last.id } });
    const newLast = await tx.aiMessage.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });
    if (newLast) {
      await tx.aiConversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: newLast.createdAt,
          lastMessagePreview: preview(newLast.content),
        },
      });
    } else {
      const conv = await tx.aiConversation.findUnique({
        where: { id: conversationId },
      });
      if (conv) {
        await tx.aiConversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: conv.createdAt,
            lastMessagePreview: "",
          },
        });
      }
    }
    return last;
  });
  return msgToRecord(removed);
}
