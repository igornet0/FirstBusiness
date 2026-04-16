import type { MissionDto } from "./api";
import type { TFunction } from "../i18n/I18nContext";

export function translateMission(
  mission: MissionDto,
  t: TFunction
): {
  levelName: string;
  title: string;
  description: string;
  tasks: string[];
} {
  const levelName = t(`level.${mission.level}.name`);
  const titleKey = `mission.${mission.id}.title`;
  const descKey = `mission.${mission.id}.description`;
  const titleT = t(titleKey);
  const descT = t(descKey);
  return {
    levelName,
    title: titleT === titleKey ? mission.title : titleT,
    description: descT === descKey ? mission.description : descT,
    tasks: mission.tasks.map((fallback, i) => {
      const k = `mission.${mission.id}.task.${i}`;
      const v = t(k);
      return v === k ? fallback : v;
    }),
  };
}
