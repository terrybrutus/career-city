import { GameBridge } from "@/game/GameBridge";
import { useEffect, useState } from "react";

const STORAGE_KEY = "career_city_passport_v1";

export const CREDENTIALS = {
  resume: "Tailored Resume",
  interview: "Interview Badge",
  coverLetter: "Cover Letter Seal",
  chapter: "Career Compass",
} as const;

export interface CareerProgress {
  credentials: string[];
  discoveredNpcs: string[];
  visitedLocations: string[];
  skills: Record<
    "resumeCraft" | "interviewing" | "storytelling" | "networking",
    number
  >;
  chapterComplete: boolean;
}

const DEFAULT_PROGRESS: CareerProgress = {
  credentials: [],
  discoveredNpcs: [],
  visitedLocations: ["town_square"],
  skills: {
    resumeCraft: 0,
    interviewing: 0,
    storytelling: 0,
    networking: 0,
  },
  chapterComplete: false,
};

export function loadCareerProgress(): CareerProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      ...DEFAULT_PROGRESS,
      ...saved,
      credentials: Array.isArray(saved.credentials) ? saved.credentials : [],
      discoveredNpcs: Array.isArray(saved.discoveredNpcs)
        ? saved.discoveredNpcs
        : [],
      visitedLocations: Array.isArray(saved.visitedLocations)
        ? saved.visitedLocations
        : ["town_square"],
      skills: { ...DEFAULT_PROGRESS.skills, ...saved.skills },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveCareerProgress(progress: CareerProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  GameBridge.emit("careerProgressUpdated", progress);
}

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

export function updateCareerProgress(
  update: (current: CareerProgress) => CareerProgress,
) {
  const current = loadCareerProgress();
  const next = update(current);
  saveCareerProgress(next);
  return next;
}

export function useCareerProgress() {
  const [progress, setProgress] = useState(loadCareerProgress);

  useEffect(
    () =>
      GameBridge.on("careerProgressUpdated", () =>
        setProgress(loadCareerProgress()),
      ),
    [],
  );

  return progress;
}

export function CareerProgressTracker() {
  useEffect(() => {
    const unsubs = [
      GameBridge.on("npcInteracted", (data) => {
        const npcId = (data as { npcId?: string })?.npcId;
        if (!npcId) return;
        updateCareerProgress((current) => ({
          ...current,
          discoveredNpcs: addUnique(current.discoveredNpcs, npcId),
          skills: {
            ...current.skills,
            networking: Math.min(3, current.skills.networking + 1),
          },
        }));
      }),
      GameBridge.on("locationChanged", (data) => {
        const locationId =
          typeof data === "string"
            ? data
            : (data as { locationId?: string })?.locationId;
        if (!locationId) return;
        updateCareerProgress((current) => ({
          ...current,
          visitedLocations: addUnique(current.visitedLocations, locationId),
        }));
      }),
      GameBridge.on("xpGained", (data) => {
        const reason = (data as { reason?: string })?.reason;
        if (reason === "resume_tailored") {
          updateCareerProgress((current) => ({
            ...current,
            credentials: addUnique(current.credentials, CREDENTIALS.resume),
            skills: { ...current.skills, resumeCraft: 2 },
          }));
        }
        if (reason === "cover_letter_generated") {
          updateCareerProgress((current) => ({
            ...current,
            credentials: addUnique(
              current.credentials,
              CREDENTIALS.coverLetter,
            ),
            skills: { ...current.skills, storytelling: 2 },
          }));
        }
        if (reason === "interview_answer") {
          updateCareerProgress((current) => ({
            ...current,
            credentials: addUnique(current.credentials, CREDENTIALS.interview),
            skills: {
              ...current.skills,
              interviewing: Math.min(3, current.skills.interviewing + 1),
            },
          }));
        }
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  return null;
}
