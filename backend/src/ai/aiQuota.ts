import { prisma } from "../db/client.js";
import { getUserDailyAiLimit } from "../db/repositories/userRepository.js";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function rolling24hWindowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

export type AiQuotaResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Скользящее окно 24 ч: сумма user-сообщений в чатах + legacy-запросы из `AiUserRequestLog`.
 */
export async function checkAiQuota(
  userId: string,
  lang: "ru" | "en"
): Promise<AiQuotaResult> {
  const limit = await getUserDailyAiLimit(userId);
  if (limit === undefined) {
    return { ok: false, message: "User not found" };
  }
  const effectiveLimit = Math.max(0, limit);
  const since = rolling24hWindowStart();

  const [msgCount, logCount] = await Promise.all([
    prisma.aiMessage.count({
      where: {
        role: "user",
        conversation: { userId },
        createdAt: { gte: since },
      },
    }),
    prisma.aiUserRequestLog.count({
      where: { userId, createdAt: { gte: since } },
    }),
  ]);
  const usage = msgCount + logCount;

  if (usage < effectiveLimit) {
    return { ok: true };
  }

  const [oldestMsg, oldestLog] = await Promise.all([
    prisma.aiMessage.findFirst({
      where: {
        role: "user",
        conversation: { userId },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.aiUserRequestLog.findFirst({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  const candidates = [oldestMsg?.createdAt, oldestLog?.createdAt].filter(
    (d): d is Date => d != null
  );
  const oldest =
    candidates.length === 0
      ? null
      : new Date(Math.min(...candidates.map((d) => d.getTime())));

  const retryAt = oldest
    ? new Date(oldest.getTime() + WINDOW_MS)
    : new Date(Date.now() + WINDOW_MS);

  return {
    ok: false,
    message: formatAiQuotaRetryMessage(lang, retryAt),
  };
}

export function formatAiQuotaRetryMessage(
  lang: "ru" | "en",
  retryAt: Date
): string {
  const ms = Math.max(0, retryAt.getTime() - Date.now());
  const totalMin = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (lang === "ru") {
    if (h > 0 && m > 0) {
      return `Лимит запросов к ИИ исчерпан. Попробуйте через ${h} ч ${m} мин.`;
    }
    if (h > 0) {
      return `Лимит запросов к ИИ исчерпан. Попробуйте через ${h} ч.`;
    }
    return `Лимит запросов к ИИ исчерпан. Попробуйте через ${m} мин.`;
  }

  if (h > 0 && m > 0) {
    return `AI request limit reached. Try again in ${h} h ${m} min.`;
  }
  if (h > 0) {
    return `AI request limit reached. Try again in ${h} h.`;
  }
  return `AI request limit reached. Try again in ${m} min.`;
}
