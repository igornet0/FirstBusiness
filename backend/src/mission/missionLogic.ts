import { MISSIONS } from "../data/missions.js";
import type { MissionProgress, UserRecord } from "../types/user.js";

export function initialMissionProgress(): MissionProgress[] {
  return MISSIONS.map((m, i) => ({
    missionId: m.id,
    completedTasks: m.tasks.map(() => false),
    status: i === 0 ? "active" : "locked",
  }));
}

export function recomputeStatuses(user: UserRecord): void {
  const progress = user.missionProgress;
  for (let i = 0; i < progress.length; i++) {
    const p = progress[i]!;
    const def = MISSIONS[i]!;
    if (p.status === "completed") continue;
    const allDone = p.completedTasks.every(Boolean);
    if (allDone && p.completedTasks.length === def.tasks.length) {
      p.status = "completed";
      const gained = def.xp;
      user.xp += gained;
      const next = progress[i + 1];
      if (next && next.status === "locked") {
        next.status = "active";
      }
      continue;
    }
    if (p.status === "locked") continue;
    const prev = progress[i - 1];
    if (i === 0 || prev?.status === "completed") {
      p.status = "active";
    } else {
      p.status = "locked";
    }
  }
}

/** Завершить активную миссию: все задачи выполнены, ответы уже провалидированы (длина и непустота). */
export function completeMissionOnUser(
  user: UserRecord,
  missionId: string,
  answers: string[]
): UserRecord | undefined {
  const idx = MISSIONS.findIndex((m) => m.id === missionId);
  if (idx === -1) return undefined;
  const p = user.missionProgress[idx]!;
  const def = MISSIONS[idx]!;
  if (p.status !== "active") return undefined;
  if (answers.length !== def.tasks.length || answers.some((a) => !a)) {
    return undefined;
  }
  p.completedTasks = def.tasks.map(() => true);
  recomputeStatuses(user);
  return user;
}

export function toggleTaskOnUser(
  user: UserRecord,
  missionId: string,
  taskIndex: number
): UserRecord | undefined {
  const idx = MISSIONS.findIndex((m) => m.id === missionId);
  if (idx === -1) return undefined;
  const p = user.missionProgress[idx]!;
  const def = MISSIONS[idx]!;
  if (p.status !== "active") return user;
  if (taskIndex < 0 || taskIndex >= def.tasks.length) return user;
  p.completedTasks[taskIndex] = !p.completedTasks[taskIndex];
  recomputeStatuses(user);
  return user;
}
