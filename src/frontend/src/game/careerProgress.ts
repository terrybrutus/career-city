import { GameBridge } from "@/game/GameBridge";
import { useQuests } from "@/hooks/useQuests";
import { useEffect } from "react";

export const CREDENTIALS = {
  resume: "Tailored Resume",
  interview: "Interview Badge",
  coverLetter: "Cover Letter Seal",
  chapter: "Career Compass",
} as const;

const credentialMissions: Record<string, string> = {
  craft_resume: CREDENTIALS.resume,
  practice_interview: CREDENTIALS.interview,
  craft_cover_letter: CREDENTIALS.coverLetter,
  chapter_one_complete: CREDENTIALS.chapter,
};

export function useCareerProgress() {
  const { completedQuests } = useQuests();
  const completed = new Set(completedQuests.map((quest) => quest.questId));
  return {
    credentials: Object.entries(credentialMissions)
      .filter(([mission]) => completed.has(mission))
      .map(([, credential]) => credential),
    skills: {
      resumeCraft: completed.has("craft_resume") ? 2 : 0,
      interviewing: completed.has("practice_interview") ? 2 : 0,
      storytelling: completed.has("craft_cover_letter") ? 2 : 0,
      networking: completed.has("meet_sam") ? 1 : 0,
    },
    chapterComplete: completed.has("chapter_one_complete"),
  };
}

export function CareerProgressTracker() {
  useEffect(() => {
    const people = new Set<string>();
    const places = new Set<string>(["town_square"]);
    const unsubs = [
      GameBridge.on("npcInteracted", ({ npcId }) => {
        people.add(npcId);
        if (npcId === "sam_sage") {
          GameBridge.emit("missionCompleted", { missionId: "meet_sam" });
        }
        if (people.size >= 6) {
          GameBridge.emit("missionCompleted", { missionId: "meet_everyone" });
        }
      }),
      GameBridge.on("interiorEntered", ({ locationId }) => {
        places.add(locationId);
        if (locationId === "resume_tailor") {
          GameBridge.emit("missionCompleted", {
            missionId: "visit_resume_tailor",
          });
        }
        if (locationId === "item_shop") {
          GameBridge.emit("missionCompleted", { missionId: "visit_item_shop" });
        }
        if (places.size >= 5) {
          GameBridge.emit("missionCompleted", {
            missionId: "explore_every_building",
          });
        }
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);
  return null;
}
