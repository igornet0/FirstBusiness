import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { prisma } from "../client.js";
import { MISSIONS } from "../../data/missions.js";
import {
  completeMissionOnUser,
  initialMissionProgress,
  toggleTaskOnUser,
} from "../../mission/missionLogic.js";
import type {
  MissionProgress,
  UserRecord,
  UserRole,
} from "../../types/user.js";

function parseMissionProgress(raw: unknown): MissionProgress[] {
  if (!Array.isArray(raw)) return initialMissionProgress();
  const out: MissionProgress[] = [];
  for (let i = 0; i < MISSIONS.length; i++) {
    const m = MISSIONS[i]!;
    const row = raw[i] as Record<string, unknown> | undefined;
    if (!row || typeof row !== "object") {
      out.push({
        missionId: m.id,
        completedTasks: m.tasks.map(() => false),
        status: i === 0 ? "active" : "locked",
      });
      continue;
    }
    const completedTasks = Array.isArray(row.completedTasks)
      ? row.completedTasks.map((b) => Boolean(b))
      : m.tasks.map(() => false);
    const status =
      row.status === "locked" ||
      row.status === "active" ||
      row.status === "completed"
        ? row.status
        : i === 0
          ? "active"
          : "locked";
    out.push({
      missionId: typeof row.missionId === "string" ? row.missionId : m.id,
      completedTasks:
        completedTasks.length === m.tasks.length
          ? completedTasks
          : m.tasks.map((_, j) => Boolean(completedTasks[j])),
      status,
    });
  }
  return out;
}

function toUserRole(value: string): UserRole {
  if (value === "admin" || value === "user" || value === "bot") {
    return value;
  }
  return "user";
}

function toActiveBool(isActive: boolean | number): boolean {
  return typeof isActive === "boolean" ? isActive : isActive !== 0;
}

export function toUserRecord(u: {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  xp: number;
  path: string;
  isActive: boolean | number;
  dailyRequets: number;
  missionProgress: unknown;
  createdAt: Date;
}): UserRecord {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    role: toUserRole(u.role),
    xp: u.xp,
    path: "saas",
    isActive: toActiveBool(u.isActive),
    dailyRequets: u.dailyRequets,
    missionProgress: parseMissionProgress(u.missionProgress),
    createdAt: u.createdAt.toISOString(),
  };
}

export async function createUser(
  email: string,
  password: string,
  role: UserRole = "user"
): Promise<UserRecord> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existing) {
    throw new Error("Email already registered");
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const missionJson = initialMissionProgress() as unknown as InputJsonValue;
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      role,
      xp: 0,
      path: "saas",
      missionProgress: missionJson,
      dailyRequets: 5,
    },
  });
  return toUserRecord(user);
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | undefined> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return user ? toUserRecord(user) : undefined;
}

export async function getUserById(
  id: string
): Promise<UserRecord | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserRecord(user) : undefined;
}

/** Лимит запросов к ИИ за скользящие 24 ч (поле `dailyRequets` в БД). */
export async function getUserDailyAiLimit(
  userId: string
): Promise<number | undefined> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyRequets: true },
  });
  return row?.dailyRequets;
}

export function verifyPassword(user: UserRecord, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash);
}

/** Максимальная длина текста ответа на задачу (черновик и финал). */
export const MISSION_ANSWER_MAX_CHARS = 20_000;

/**
 * Возвращает массив ответов по индексам задач (длина = числу задач).
 * Пустая строка, если ответа ещё нет в БД.
 */
export async function getMissionAnswersForUser(
  userId: string,
  missionId: string
): Promise<string[] | undefined> {
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) return undefined;
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) return undefined;
  const rows = await prisma.missionAnswer.findMany({
    where: { userId, missionId },
    orderBy: { taskIndex: "asc" },
  });
  const out = def.tasks.map(() => "");
  for (const r of rows) {
    if (r.taskIndex >= 0 && r.taskIndex < out.length) {
      out[r.taskIndex] = r.answer;
    }
  }
  return out;
}

export type UpsertDraftResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "user_not_found"
        | "mission_not_found"
        | "mission_not_active"
        | "invalid_task"
        | "answer_too_long";
    };

/** Автосохранение черновика ответа (только для активной миссии). */
export async function upsertMissionAnswerDraft(
  userId: string,
  missionId: string,
  taskIndex: number,
  answer: string
): Promise<UpsertDraftResult> {
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) return { ok: false, code: "user_not_found" };
  const user = toUserRecord(row);
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) return { ok: false, code: "mission_not_found" };
  const idx = MISSIONS.indexOf(def);
  const p = user.missionProgress[idx]!;
  if (p.status !== "active") {
    return { ok: false, code: "mission_not_active" };
  }
  if (taskIndex < 0 || taskIndex >= def.tasks.length) {
    return { ok: false, code: "invalid_task" };
  }
  const text = typeof answer === "string" ? answer : "";
  if (text.length > MISSION_ANSWER_MAX_CHARS) {
    return { ok: false, code: "answer_too_long" };
  }

  await prisma.missionAnswer.upsert({
    where: {
      userId_missionId_taskIndex: { userId, missionId, taskIndex },
    },
    create: {
      userId,
      missionId,
      taskIndex,
      question: def.tasks[taskIndex]!,
      answer: text,
      isDraft: true,
    },
    update: {
      question: def.tasks[taskIndex]!,
      answer: text,
      isDraft: true,
    },
  });
  return { ok: true };
}

export async function completeMissionWithAnswers(
  userId: string,
  missionId: string,
  answers: string[]
): Promise<UserRecord | undefined> {
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) return undefined;
  const user = toUserRecord(row);
  const def = MISSIONS.find((m) => m.id === missionId);
  if (!def) return undefined;

  const trimmed = answers.map((a) =>
    typeof a === "string" ? a.trim() : ""
  );
  if (trimmed.length !== def.tasks.length || trimmed.some((a) => !a)) {
    return undefined;
  }

  const updated = completeMissionOnUser(user, missionId, trimmed);
  if (!updated) return undefined;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (let i = 0; i < def.tasks.length; i++) {
      const question = def.tasks[i]!;
      const answer = trimmed[i]!;
      await tx.missionAnswer.upsert({
        where: {
          userId_missionId_taskIndex: { userId, missionId, taskIndex: i },
        },
        create: {
          userId,
          missionId,
          taskIndex: i,
          question,
          answer,
          isDraft: false,
        },
        update: {
          question,
          answer,
          isDraft: false,
        },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        xp: updated.xp,
        missionProgress: updated.missionProgress as unknown as InputJsonValue,
      },
    });
  });
  return updated;
}

export async function toggleTask(
  userId: string,
  missionId: string,
  taskIndex: number
): Promise<UserRecord | undefined> {
  const row = await prisma.user.findUnique({ where: { id: userId } });
  if (!row) return undefined;
  const user = toUserRecord(row);
  const xpBefore = user.xp;
  const mpBefore = JSON.stringify(user.missionProgress);
  const updated = toggleTaskOnUser(user, missionId, taskIndex);
  if (!updated) return undefined;
  if (
    updated.xp === xpBefore &&
    JSON.stringify(updated.missionProgress) === mpBefore
  ) {
    return updated;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: updated.xp,
      missionProgress: updated.missionProgress as unknown as InputJsonValue,
    },
  });
  return updated;
}
