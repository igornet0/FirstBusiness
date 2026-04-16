/** Роли пользователя (совпадают с Prisma enum `UserRole`). */
export const USER_ROLES = ["admin", "user", "bot"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export type MissionProgress = {
  missionId: string;
  completedTasks: boolean[];
  status: "locked" | "active" | "completed";
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  xp: number;
  path: "saas";
  isActive: boolean;
  /** Лимит запросов к ИИ за скользящее 24ч окно (имя поля как в Prisma). */
  dailyRequets: number;
  missionProgress: MissionProgress[];
  createdAt: string;
};
