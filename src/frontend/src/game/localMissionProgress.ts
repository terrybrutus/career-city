import type { MissionId } from "./missions";

const STORAGE_KEY = "career_city_completed_missions";

export function listLocalCompletedMissions(): MissionId[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markLocalMissionCompleted(missionId: MissionId): void {
  const completed = new Set(listLocalCompletedMissions());
  completed.add(missionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}
