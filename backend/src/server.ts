import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import missionsRoutes from "./routes/missions.js";
import aiRoutes from "./routes/ai.js";
import { disconnectPrisma } from "./db/client.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "128kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/missions", missionsRoutes);
app.use("/api/ai", aiRoutes);

const server = app.listen(PORT, () => {
  console.log(`First Bysenes API http://localhost:${PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, closing…`);
  server.close(() => {
    void disconnectPrisma().finally(() => process.exit(0));
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
