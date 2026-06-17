import { createActor } from "@/backend";
import { QuestStatus as BackendQuestStatus } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { listLocalCompletedMissions } from "@/game/localMissionProgress";
import { MISSIONS, missionById } from "@/game/missions";
import type { QuestProgress } from "@/types/game";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useQuests() {
  const { actor, isFetching } = useActor(createActor);
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = GameBridge.on("questUpdated", () => {
      void qc.invalidateQueries({ queryKey: ["quests"] });
    });
    return unsub;
  }, [qc]);

  const query = useQuery<QuestProgress[]>({
    queryKey: ["quests"],
    queryFn: async () => {
      if (!actor) {
        const localCompleted = new Set(listLocalCompletedMissions());
        return MISSIONS.map((def) => ({
          questId: def.id,
          title: def.title,
          description: def.objective,
          status: localCompleted.has(def.id) ? "completed" : "available",
          xpReward: def.reward,
          locationId: "town_square",
        }));
      }
      const raw = await actor.listQuests();
      const localCompleted = new Set(listLocalCompletedMissions());
      return MISSIONS.map((def) => {
        const rq = raw.find((item) => item.questId === def.id);
        const completed =
          rq?.status === BackendQuestStatus.completed ||
          localCompleted.has(def.id);
        return {
          questId: def.id,
          title: def.title,
          description: def.objective,
          status: completed
            ? ("completed" as const)
            : rq?.status === BackendQuestStatus.inProgress
              ? ("active" as const)
              : ("available" as const),
          xpReward: def.reward,
          locationId: "town_square",
        };
      });
    },
    enabled: !isFetching,
    staleTime: 1000 * 60 * 5,
  });

  const acceptQuest = useMutation({
    mutationFn: async (questId: string) => {
      if (!actor) return;
      await actor.upsertQuestProgress(
        questId,
        BackendQuestStatus.inProgress,
        BigInt(0),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quests"] }),
  });

  const completeQuest = useMutation({
    mutationFn: async ({
      questId,
      xpReward,
    }: { questId: string; xpReward: number }) => {
      if (!actor) return;
      await actor.upsertQuestProgress(
        questId,
        BackendQuestStatus.completed,
        BigInt(xpReward),
      );
      GameBridge.emit("questUpdated", { questId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quests"] }),
  });

  const quests = query.data ?? [];

  return {
    ...query,
    quests,
    activeQuests: quests.filter((q) => q.status === "active"),
    completedQuests: quests.filter((q) => q.status === "completed"),
    acceptQuest: (questId: string) => acceptQuest.mutate(questId),
    completeQuest: (questId: string) =>
      completeQuest.mutate({
        questId,
        xpReward: missionById(questId)?.reward ?? 0,
      }),
  };
}
