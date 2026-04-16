import { Router } from "express";
import { MISSIONS, levelFromXp } from "../data/missions.js";
import { getUserById } from "../db/repositories/userRepository.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  const userId = req.userId!;
  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
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
  res.json({
    email: user.email,
    role: user.role,
    xp: user.xp,
    level: levelFromXp(user.xp),
    path: user.path,
    missions,
    activeMissionId: activeMission?.id ?? null,
    progressPct,
  });
});

export default router;
