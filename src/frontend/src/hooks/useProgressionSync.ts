import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useProgressionSync() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actor) return;
    return GameBridge.on("xpGained", (data) => {
      const payload = data as { amount?: number };
      if (!Number.isFinite(payload?.amount) || (payload.amount ?? 0) <= 0)
        return;
      void actor
        .updateXP(BigInt(Math.floor(payload.amount!)))
        .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }));
    });
  }, [actor, queryClient]);
}
