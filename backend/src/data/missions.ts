export type MissionDef = {
  id: string;
  level: 1 | 2 | 3 | 4 | 5;
  levelName: string;
  title: string;
  description: string;
  tasks: string[];
  xp: number;
};

/** SaaS path — linear order; one active mission at a time. */
export const MISSIONS: MissionDef[] = [
  {
    id: "saas-idea-1",
    level: 1,
    levelName: "Idea",
    title: "Sharpen your SaaS idea",
    description:
      "Turn a vague thought into a one-line product you could explain in 30 seconds.",
    tasks: [
      "Write one sentence: who is it for?",
      "Write one sentence: what pain does it remove?",
      "Name the outcome users get in one phrase",
    ],
    xp: 100,
  },
  {
    id: "saas-validation-1",
    level: 2,
    levelName: "Validation",
    title: "Validate the problem",
    description: "Confirm strangers care before you build.",
    tasks: [
      "Write to 10 potential users",
      "Get 3 responses",
      "Summarize the main problem in 3 bullets",
    ],
    xp: 200,
  },
  {
    id: "saas-mvp-1",
    level: 3,
    levelName: "MVP",
    title: "Define MVP scope",
    description: "Ship the smallest thing that proves value.",
    tasks: [
      "List 3 must-have features (only)",
      "Pick one core user flow to implement first",
      "Set a ship date within 14 days",
    ],
    xp: 250,
  },
  {
    id: "saas-launch-1",
    level: 4,
    levelName: "Launch",
    title: "Prepare launch",
    description: "Make it easy for the right people to try you.",
    tasks: [
      "Write a 2-sentence landing promise",
      "Set up a waitlist or signup",
      "Post once where your ICP hangs out",
    ],
    xp: 200,
  },
  {
    id: "saas-customer-1",
    level: 5,
    levelName: "First Customer",
    title: "Land your first customer",
    description: "Revenue or a firm pilot counts.",
    tasks: [
      "Run 5 short calls or DMs with qualified leads",
      "Send one clear offer (price + scope)",
      "Close one paying user or signed pilot",
    ],
    xp: 300,
  },
];

/** Minimum total XP required to *enter* each level (display / gating). */
export const LEVEL_XP_THRESHOLD: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 550,
  5: 800,
};

export function levelFromXp(xp: number): number {
  if (xp >= LEVEL_XP_THRESHOLD[5]) return 5;
  if (xp >= LEVEL_XP_THRESHOLD[4]) return 4;
  if (xp >= LEVEL_XP_THRESHOLD[3]) return 3;
  if (xp >= LEVEL_XP_THRESHOLD[2]) return 2;
  return 1;
}
