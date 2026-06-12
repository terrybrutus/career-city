import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import type { UserProfile } from "@/types/game";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100,
  10500, 12000, 13600, 15300, 17100, 19000,
];

function xpToNextLevel(totalXp: number): number {
  return (
    (THRESHOLDS.find((threshold) => threshold > totalXp) ?? totalXp) - totalXp
  );
}

export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = GameBridge.on("missionCompleted", () => {
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
          xpToNextLevel: 100,
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
        levelTitle: raw.levelTitle,
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
