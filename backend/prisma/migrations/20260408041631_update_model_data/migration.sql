-- Исторически этот шаг шёл до создания MissionAnswer (см. 20260409120000_add_mission_answer).
-- ALTER на несуществующей таблице ломал `migrate deploy` на пустой БД.
-- Колонка updatedAt для MissionAnswer задаётся в 20260410120000_mission_answer_draft_unique.
SELECT 1;
