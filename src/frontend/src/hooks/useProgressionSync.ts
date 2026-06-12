import { createActor } from "@/backend";
import { QuestStatus } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useProgressionSync() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actor) return;
    const unsubs = [
      GameBridge.on("missionCompleted", ({ missionId }) => {
        void actor
          .upsertQuestProgress(missionId, QuestStatus.completed, 0n)
          .then(() =>
            Promise.all([
              queryClient.invalidateQueries({ queryKey: ["profile"] }),
              queryClient.invalidateQueries({ queryKey: ["quests"] }),
            ]),
          );
      }),
      GameBridge.on("locationChanged", (payload) => {
        const locationId =
          typeof payload === "string" ? payload : payload.locationId;
        void actor.savePlayerPosition(locationId);
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [actor, queryClient]);
}
