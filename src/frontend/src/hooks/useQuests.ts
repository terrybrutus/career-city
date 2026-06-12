import { createActor } from "@/backend";
import { QuestStatus as BackendQuestStatus } from "@/backend";
import { LOCATIONS } from "@/data/locations";
import { QUEST_DEFINITIONS } from "@/data/quests";
import { GameBridge } from "@/game/GameBridge";
import type { QuestProgress } from "@/types/game";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

function locationIdForQuest(questId: string) {
  const def = QUEST_DEFINITIONS.find((q) => q.id === questId);
  return def?.locationId ?? "town_square";
}

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
        return QUEST_DEFINITIONS.map((def) => ({
          questId: def.id,
          title: def.title,
          description: def.description,
          status: "available" as const,
          xpReward: def.xpReward,
          locationId: def.locationId,
        }));
      }
      const raw = await actor.listQuests();
      return raw.map((rq) => {
        const def = QUEST_DEFINITIONS.find((d) => d.id === rq.questId);
        const locId = locationIdForQuest(rq.questId);
        const loc = LOCATIONS.find((l) => l.id === locId);
        return {
          questId: rq.questId,
          title: def?.title ?? rq.questId,
          description: def?.description ?? "",
          status:
            rq.status === BackendQuestStatus.completed
              ? ("completed" as const)
              : rq.status === BackendQuestStatus.inProgress
                ? ("active" as const)
                : ("available" as const),
          xpReward: Number(rq.xpReward),
          locationId: loc?.id ?? "town_square",
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
      GameBridge.emit("xpGained", xpReward);
      GameBridge.emit("questUpdated", questId);
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
    completeQuest: (questId: string, xpReward: number) =>
      completeQuest.mutate({ questId, xpReward }),
  };
}
