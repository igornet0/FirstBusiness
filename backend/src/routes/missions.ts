import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { MISSIONS, levelFromXp } from "../data/missions.js";
import {
  completeMissionWithAnswers,
  getMissionAnswersForUser,
  getUserById,
  MISSION_ANSWER_MAX_CHARS,
  toggleTask,
  upsertMissionAnswerDraft,
} from "../db/repositories/userRepository.js";

const router = Router();
router.use(authMiddleware);

function buildMissionStateResponse(user: Awaited<ReturnType<typeof getUserById>>) {
  if (!user) return null;
  const missions = MISSIONS.map((m, i) => {
    const p = user.missionProgress[i]!;
    return {
      id: m.id,
      level: m.level,
      levelName: m.levelName,
      title: m.title,
      description: m.description,
      tasks: m.tasks,
      xp: m.xp,
      completedTasks: p.completedTasks,
      status: p.status,
    };
  });
  const activeMission = missions.find((m) => m.status === "active");
  const completedCount = missions.filter((m) => m.status === "completed").length;
  const progressPct =
    missions.length === 0
      ? 0
      : Math.round((completedCount / missions.length) * 100);
  return {
    xp: user.xp,
    level: levelFromXp(user.xp),
    missions,
    activeMissionId: activeMission?.id ?? null,
    progressPct,
  };
}

router.get("/:missionId/answers", async (req, res) => {
  const userId = req.userId!;
  const { missionId } = req.params;
  const answers = await getMissionAnswersForUser(userId, missionId);
  if (answers === undefined) {
    const row = await getUserById(userId);
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  res.json({ answers });
});

router.put("/:missionId/answers/:taskIndex", async (req, res) => {
  const userId = req.userId!;
  const { missionId, taskIndex } = req.params;
  const idx = Number.parseInt(taskIndex, 10);
  if (Number.isNaN(idx)) {
    res.status(400).json({ error: "Invalid task index" });
    return;
  }
  const body = req.body as { answer?: unknown };
  const answer =
    typeof body.answer === "string" ? body.answer : String(body.answer ?? "");
  if (answer.length > MISSION_ANSWER_MAX_CHARS) {
    res.status(400).json({
      error: `Answer too long (max ${MISSION_ANSWER_MAX_CHARS} characters)`,
    });
    return;
  }
  const result = await upsertMissionAnswerDraft(userId, missionId, idx, answer);
  if (!result.ok) {
    if (result.code === "user_not_found") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (result.code === "mission_not_found") {
      res.status(404).json({ error: "Mission not found" });
      return;
    }
    if (result.code === "mission_not_active") {
      res.status(400).json({
        error: "Mission is not active or already completed",
      });
      return;
    }
    if (result.code === "invalid_task") {
      res.status(400).json({ error: "Invalid task index" });
      return;
    }
    if (result.code === "answer_too_long") {
      res.status(400).json({
        error: `Answer too long (max ${MISSION_ANSWER_MAX_CHARS} characters)`,
      });
      return;
    }
    res.status(400).json({ error: "Cannot save answer" });
    return;
  }
  res.json({ ok: true });
});

router.post("/:missionId/complete", async (req, res) => {
  const userId = req.userId!;
  const { missionId } = req.params;
  const body = req.body as { answers?: unknown };
  if (!Array.isArray(body.answers)) {
    res.status(400).json({ error: "answers must be an array of strings" });
    return;
  }
  const answers = body.answers.map((a) =>
    typeof a === "string" ? a : String(a ?? "")
  );
  const user = await completeMissionWithAnswers(userId, missionId, answers);
  if (!user) {
    const row = await getUserById(userId);
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const def = MISSIONS.find((m) => m.id === missionId);
    if (!def) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }
    const trimmed = answers.map((a) => a.trim());
    if (
      trimmed.length !== def.tasks.length ||
      trimmed.some((a) => !a)
    ) {
      res.status(400).json({
        error: "Provide a non-empty answer for each task",
      });
      return;
    }
    res.status(400).json({
      error:
        "Mission is not active or already completed",
    });
    return;
  }
  const payload = buildMissionStateResponse(user);
  if (!payload) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(payload);
});

router.patch("/:missionId/tasks/:taskIndex", async (req, res) => {
  const userId = req.userId!;
  const { missionId, taskIndex } = req.params;
  const idx = Number.parseInt(taskIndex, 10);
  if (Number.isNaN(idx)) {
    res.status(400).json({ error: "Invalid task index" });
    return;
  }
  const user = await toggleTask(userId, missionId, idx);
  if (!user) {
    res.status(404).json({ error: "User or mission not found" });
    return;
  }
  const payload = buildMissionStateResponse(user);
  if (!payload) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(payload);
});

router.get("/:missionId", async (req, res) => {
  const userId = req.userId!;
  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const def = MISSIONS.find((m) => m.id === req.params.missionId);
  if (!def) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }
  const i = MISSIONS.indexOf(def);
  const p = user.missionProgress[i]!;
  res.json({
    id: def.id,
    level: def.level,
    levelName: def.levelName,
    title: def.title,
    description: def.description,
    tasks: def.tasks,
    xp: def.xp,
    completedTasks: p.completedTasks,
    status: p.status,
  });
});

export default router;
