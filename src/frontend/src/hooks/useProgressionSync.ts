import { createActor } from "@/backend";
import { QuestStatus } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { markLocalMissionCompleted } from "@/game/localMissionProgress";
import type { MissionId } from "@/game/missions";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function useProgressionSync() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const pending = useRef(new Set<string>());

  useEffect(() => {
    const complete = async (missionId: string) => {
      markLocalMissionCompleted(missionId as MissionId);
      if (!actor) {
        pending.current.add(missionId);
        GameBridge.emit("questUpdated", { questId: missionId });
        return;
      }
      await actor.upsertQuestProgress(missionId, QuestStatus.completed, 0n);
      pending.current.delete(missionId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["quests"] }),
      ]);
      GameBridge.emit("questUpdated", { questId: missionId });
    };
    if (actor) {
      for (const missionId of pending.current) void complete(missionId);
    }
    const unsubs = [
      GameBridge.on("missionCompleted", ({ missionId }) => {
        void complete(missionId);
      }),
      GameBridge.on("locationChanged", (payload) => {
        const locationId =
          typeof payload === "string" ? payload : payload.locationId;
        if (actor) void actor.savePlayerPosition(locationId);
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [actor, queryClient]);
}
