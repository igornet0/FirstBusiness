import { Router } from "express";
import {
  createUser,
  findUserByEmail,
  verifyPassword,
} from "../db/repositories/userRepository.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password || password.length < 6) {
    res.status(400).json({ error: "Valid email and password (min 6) required" });
    return;
  }
  try {
    const user = await createUser(email, password);
    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, xp: user.xp },
    });
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ sub: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, xp: user.xp },
  });
});

export default router;
