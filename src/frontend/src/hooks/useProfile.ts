import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import type { UserProfile } from "@/types/game";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const XP_PER_LEVEL = 1000;

function xpToNextLevel(totalXp: number): number {
  const level = Math.floor(totalXp / XP_PER_LEVEL);
  return (level + 1) * XP_PER_LEVEL - totalXp;
}

function computeLevelTitle(level: number): string {
  const titles = [
    "Intern",
    "Junior Dev",
    "Associate",
    "Mid-Level",
    "Senior Dev",
    "Lead Dev",
    "Staff Eng",
    "Principal",
    "Director",
    "VP Eng",
    "CTO",
    "LEGENDARY",
  ];
  return titles[Math.min(level, titles.length - 1)];
}

export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = GameBridge.on("xpGained", () => {
      void qc.invalidateQueries({ queryKey: ["profile"] });
    });
    return unsub;
  }, [qc]);

  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) {
        return {
          username: "PLAYER_01",
          careerLevel: 1,
          xp: 0,
          xpToNextLevel: XP_PER_LEVEL,
          levelTitle: "Intern",
          resumeScore: 0,
          interviewScore: 0,
          networkScore: 0,
          inventory: [],
        };
      }
      const raw = await actor.getMyProfile();
      const xp = Number(raw.totalXp);
      const level = Number(raw.careerLevel);
      return {
        username: raw.id.toText?.() ?? "PLAYER_01",
        careerLevel: level,
        xp,
        xpToNextLevel: xpToNextLevel(xp),
        levelTitle: raw.levelTitle || computeLevelTitle(level),
        resumeScore: 0,
        interviewScore: 0,
        networkScore: 0,
        inventory: raw.inventory ?? [],
      };
    },
    enabled: !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}
