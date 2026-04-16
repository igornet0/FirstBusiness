import { Router } from "express";
import type { Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { deepseekChat, type ChatMessage } from "../ai/deepseek.js";
import {
  classifyTopicAndBusiness,
  fallbackTopicClassification,
  randomOffTopicMessage,
} from "../ai/topicClassifier.js";
import { isAiMode, type AiMode } from "../store/aiTypes.js";
import { checkAiQuota } from "../ai/aiQuota.js";
import {
  appendAiMessage,
  createAiConversation,
  getAiConversation,
  getAiMessages,
  getRecentAiMessagesForLlm,
  listAiConversations,
  popLastAiMessage,
  recordLegacyAiUserRequest,
  updateAiConversationTitle,
} from "../db/repositories/aiRepository.js";

const router = Router();
router.use(authMiddleware);

const SYSTEM = `You are a concise business coach for early-stage founders building a SaaS.
You help with: generating business ideas, improving offers, and analyzing user input.
Keep answers actionable and short unless the user asks for detail. No fluff.`;

const BIPPI_SYSTEM = `${SYSTEM}

You speak as Bippi, a friendly virtual mascot assistant on this site. Stay in character briefly (warm, encouraging), but prioritize useful business advice over roleplay.

Format answers with Markdown when it helps readability: use **bold** for key terms, short bullet or numbered lists, \`inline code\` for terms or values, and fenced code blocks only for real code or copy-paste snippets.`;

function languageInstruction(lang: "ru" | "en"): string {
  if (lang === "ru") {
    return `\n\nReply language: Russian only (русский). Write the entire answer in natural Russian, including all Markdown. If the user writes in English or another language, still reply in Russian unless they explicitly ask for another language.`;
  }
  return `\n\nReply language: English only. Write the entire answer in natural English, including all Markdown. If the user writes in Russian or another language, still reply in English unless they explicitly ask for another language.`;
}

function bippiSystemForLang(lang: "ru" | "en"): string {
  return `${BIPPI_SYSTEM}${languageInstruction(lang)}`;
}

function legacySystemForLang(lang: "ru" | "en"): string {
  return `${SYSTEM}${languageInstruction(lang)}`;
}

const MAX_CONTEXT_MESSAGES = 24;

function buildUserMessageForMode(
  raw: string,
  mode: AiMode,
  lang: "ru" | "en"
): string {
  const userMessage = raw.trim();
  if (mode === "ideas") {
    if (lang === "ru") {
      return `Сгенерируй 5 различных SaaS-идей по этому контексту или ограничениям:\n${userMessage}\nПронумеруй 1–5, каждая идея — одна строка.`;
    }
    return `Generate 5 distinct SaaS business ideas based on this context or constraints:\n${userMessage}\nNumber them 1-5 with one line each.`;
  }
  if (mode === "offer") {
    if (lang === "ru") {
      return `Улучши этот оффер для ясности и конверсии. Ответ структурируй так: (1) усиленный заголовок (2) 3 пункта ценности (3) одно типичное возражение и ответ на него:\n${userMessage}`;
    }
    return `Improve this offer for clarity and conversion. Reply with: (1) tightened headline (2) 3 bullets of value (3) one objection + answer):\n${userMessage}`;
  }
  if (mode === "analyze") {
    if (lang === "ru") {
      return `Проанализируй ввод фаундера. Перечисли: допущения, риски, следующие 3 конкретных шага:\n${userMessage}`;
    }
    return `Analyze this founder input. List: assumptions, risks, next 3 concrete steps:\n${userMessage}`;
  }
  return userMessage;
}

function toLlmMessages(
  history: { role: "user" | "mascot"; content: string }[],
  mode: AiMode,
  lang: "ru" | "en"
): ChatMessage[] {
  const msgs: ChatMessage[] = [{ role: "system", content: bippiSystemForLang(lang) }];
  if (history.length === 0) return msgs;

  const rest = history.slice(0, -1);
  const last = history[history.length - 1]!;
  for (const m of rest) {
    if (m.role === "user") {
      msgs.push({ role: "user", content: m.content });
    } else {
      msgs.push({ role: "assistant", content: m.content });
    }
  }
  if (last.role !== "user") {
    msgs.push({ role: "assistant", content: last.content });
    return msgs;
  }
  msgs.push({
    role: "user",
    content: buildUserMessageForMode(last.content, mode, lang),
  });
  return msgs;
}

function publicConversation(c: {
  id: string;
  userId: string;
  title: string;
  mode: AiMode;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
}) {
  const { userId: _u, ...rest } = c;
  void _u;
  return rest;
}

function handleAiError(res: Response, e: unknown): void {
  const msg = e instanceof Error ? e.message : "AI request failed";
  if (msg.includes("not configured")) {
    res.status(503).json({ error: msg });
    return;
  }
  res.status(502).json({ error: msg });
}

/** GET /api/ai/conversations */
router.get("/conversations", async (req, res) => {
  const userId = req.userId!;
  const modeRaw = typeof req.query.mode === "string" ? req.query.mode : undefined;
  const mode = modeRaw && isAiMode(modeRaw) ? modeRaw : undefined;
  const limitRaw = req.query.limit;
  const limit =
    typeof limitRaw === "string" ? Number.parseInt(limitRaw, 10) : undefined;
  const items = await listAiConversations(userId, {
    mode,
    limit: Number.isFinite(limit) ? limit : undefined,
  });
  res.json({ items: items.map(publicConversation) });
});

/** POST /api/ai/conversations */
router.post("/conversations", async (req, res) => {
  const userId = req.userId!;
  const modeStr =
    typeof req.body?.mode === "string" ? req.body.mode : "chat";
  const mode: AiMode = isAiMode(modeStr) ? modeStr : "chat";
  const title =
    typeof req.body?.title === "string" ? req.body.title : undefined;
  const conv = await createAiConversation(userId, mode, title);
  res.status(201).json(publicConversation(conv));
});

/** GET /api/ai/conversations/:id/messages */
router.get("/conversations/:id/messages", async (req, res) => {
  const userId = req.userId!;
  const { id } = req.params;
  const list = await getAiMessages(userId, id);
  if (list === undefined) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json({ items: list });
});

/** POST /api/ai/conversations/:id/messages */
router.post("/conversations/:id/messages", async (req, res) => {
  const userId = req.userId!;
  const { id: conversationId } = req.params;
  const conv = await getAiConversation(userId, conversationId);
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const content =
    typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content || content.length > 12000) {
    res.status(400).json({ error: "content required (max 12000 chars)" });
    return;
  }

  const modeStr =
    typeof req.body?.mode === "string" ? req.body.mode : conv.mode;
  const mode: AiMode = isAiMode(modeStr) ? modeStr : conv.mode;

  const lang: "ru" | "en" =
    typeof req.body?.lang === "string" && req.body.lang === "ru"
      ? "ru"
      : "en";

  const quota = await checkAiQuota(userId, lang);
  if (!quota.ok) {
    const status = quota.message === "User not found" ? 404 : 429;
    res.status(status).json({ error: quota.message });
    return;
  }

  const userMsg = await appendAiMessage(userId, conversationId, "user", content);
  if (!userMsg) {
    res.status(500).json({ error: "Failed to save message" });
    return;
  }

  let classification;
  try {
    classification = await classifyTopicAndBusiness(content, lang);
  } catch {
    classification = fallbackTopicClassification(content, lang);
  }

  await updateAiConversationTitle(userId, conversationId, classification.topic);

  if (!classification.isBusiness) {
    const offTopicText = randomOffTopicMessage(lang);
    const mascotMsg = await appendAiMessage(
      userId,
      conversationId,
      "mascot",
      offTopicText
    );
    if (!mascotMsg) {
      await popLastAiMessage(userId, conversationId);
      res.status(500).json({ error: "Failed to save reply" });
      return;
    }
    const updated = await getAiConversation(userId, conversationId);
    res.json({
      userMessage: userMsg,
      mascotMessage: mascotMsg,
      conversation: updated ? publicConversation(updated) : undefined,
    });
    return;
  }

  const recent = await getRecentAiMessagesForLlm(
    conversationId,
    MAX_CONTEXT_MESSAGES
  );
  const history = recent.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const llmMessages = toLlmMessages(history, mode, lang);
    const reply = await deepseekChat(llmMessages);
    const mascotMsg = await appendAiMessage(
      userId,
      conversationId,
      "mascot",
      reply
    );
    if (!mascotMsg) {
      await popLastAiMessage(userId, conversationId);
      res.status(500).json({ error: "Failed to save reply" });
      return;
    }
    const updated = await getAiConversation(userId, conversationId);
    res.json({
      userMessage: userMsg,
      mascotMessage: mascotMsg,
      conversation: updated ? publicConversation(updated) : undefined,
    });
  } catch (e) {
    await popLastAiMessage(userId, conversationId);
    handleAiError(res, e);
  }
});

/** Legacy: POST /api/ai */
router.post("/", async (req, res) => {
  const mode: AiMode =
    typeof req.body?.mode === "string" && isAiMode(req.body.mode)
      ? req.body.mode
      : "chat";
  const lang: "ru" | "en" =
    typeof req.body?.lang === "string" && req.body.lang === "ru"
      ? "ru"
      : "en";
  const userMessage =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!userMessage || userMessage.length > 12000) {
    res.status(400).json({ error: "message required (max 12000 chars)" });
    return;
  }

  const quota = await checkAiQuota(req.userId!, lang);
  if (!quota.ok) {
    const status = quota.message === "User not found" ? 404 : 429;
    res.status(status).json({ error: quota.message });
    return;
  }

  await recordLegacyAiUserRequest(req.userId!);

  const prompt = buildUserMessageForMode(userMessage, mode, lang);

  try {
    const reply = await deepseekChat([
      { role: "system", content: legacySystemForLang(lang) },
      { role: "user", content: prompt },
    ]);
    res.json({ reply });
  } catch (e) {
    handleAiError(res, e);
  }
});

export default router;
