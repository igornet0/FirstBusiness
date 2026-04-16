import { deepseekChat } from "./deepseek.js";

const CLASSIFIER_SYSTEM_BASE = `You are a strict JSON classifier for a business-coach chatbot.

Output ONLY a single JSON object. No markdown fences, no explanation, no text before or after.

Schema:
{"topic":"<string>","isBusiness":<true|false>}

topic: 3–8 words summarizing the user's message.

LANG_TOPIC_RULE

isBusiness: true if the message is about business, startups, SaaS, entrepreneurship, product, marketing/sales in a business context, fundraising, management, career decisions related to work, or building/growing a product. Also true if the user refers to missions, XP, or this app.

isBusiness: false for clearly off-topic content: weather, unrelated politics, sports trivia, pure entertainment, homework with no business angle, random chitchat, medical/relationship advice with no business context, etc.

If the message is ambiguous, prefer true when any professional or business angle exists.`;

function classifierTopicLangRule(lang: "ru" | "en"): string {
  if (lang === "ru") {
    return `The "topic" field MUST be written in Russian (русский), matching the app's Russian UI.`;
  }
  return `The "topic" field MUST be written in English, matching the app's English UI.`;
}

function classifierSystemForLang(lang: "ru" | "en"): string {
  return CLASSIFIER_SYSTEM_BASE.replace(
    "LANG_TOPIC_RULE",
    classifierTopicLangRule(lang)
  );
}

export type TopicClassification = {
  topic: string;
  isBusiness: boolean;
};

export function parseTopicClassification(raw: string): TopicClassification | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]) as Record<string, unknown>;
    const topic = typeof o.topic === "string" ? o.topic.trim() : "";
    const isBusiness = o.isBusiness;
    if (!topic || typeof isBusiness !== "boolean") return null;
    return {
      topic: topic.slice(0, 120),
      isBusiness,
    };
  } catch {
    return null;
  }
}

export function fallbackTopicClassification(
  userText: string,
  lang: "ru" | "en"
): TopicClassification {
  const line = userText.trim().split(/\r?\n/)[0] ?? userText;
  const short = line.replace(/\s+/g, " ").slice(0, 60);
  const defaultTitle = lang === "ru" ? "Чат" : "Chat";
  return {
    topic: short || defaultTitle,
    isBusiness: true,
  };
}

export async function classifyTopicAndBusiness(
  userMessage: string,
  lang: "ru" | "en"
): Promise<TopicClassification> {
  const raw = await deepseekChat([
    { role: "system", content: classifierSystemForLang(lang) },
    { role: "user", content: userMessage.slice(0, 8000) },
  ]);
  return (
    parseTopicClassification(raw) ??
    fallbackTopicClassification(userMessage, lang)
  );
}

export const OFF_TOPIC_MESSAGES_RU = [
  "Это не про бизнес и запуск — я помогаю с идеями, оффером и миссиями. Спроси что-нибудь про свой проект или текущую миссию.",
  "Похоже, тема не про предпринимательство. Напиши про то, что строишь, или какую миссию проходишь — тогда смогу помочь по делу.",
  "Тут я отвечаю на вопросы о запуске и миссиях. Переформулируй запрос в бизнес-контексте — и продолжим.",
  "Звучит не про бизнес. Расскажи короче: идея, аудитория или шаг — и разберём вместе.",
  "Эта тема вне фокуса коуча. Задай вопрос про продукт, клиентов, оффер или миссию на сайте.",
];

export const OFF_TOPIC_MESSAGES_EN = [
  "That doesn't look like a business or launch question — I help with ideas, offers, and missions. Ask something about your project or a mission you're on.",
  "Seems off-topic for this coach. Tell me what you're building or which mission you're working on, and I can help.",
  "I answer questions about launch and missions here. Rephrase in a business context and we can continue.",
  "That topic is outside what I cover. Ask about your product, customers, offer, or a mission on the site.",
  "This sounds unrelated to business. Share a short idea, audience, or next step — and we'll go from there.",
];

export function randomOffTopicMessage(lang: "ru" | "en"): string {
  const list = lang === "ru" ? OFF_TOPIC_MESSAGES_RU : OFF_TOPIC_MESSAGES_EN;
  return list[Math.floor(Math.random() * list.length)]!;
}
