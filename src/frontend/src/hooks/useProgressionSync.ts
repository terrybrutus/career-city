import { createActor } from "@/backend";
import { GameBridge } from "@/game/GameBridge";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const AWARD_STORAGE_KEY = "career_city_awarded_xp_reasons";
const ONE_TIME_REASONS = new Set([
  "resume_tailored",
  "cover_letter_generated",
  "interview_answer",
  "chapter_complete",
]);

function getAwardedReasons() {
  try {
    const saved = JSON.parse(localStorage.getItem(AWARD_STORAGE_KEY) ?? "[]");
    return new Set<string>(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set<string>();
  }
}

export function useProgressionSync() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actor) return;
    return GameBridge.on("xpGained", (data) => {
      const payload = data as { amount?: number; reason?: string };
      if (!Number.isFinite(payload?.amount) || (payload.amount ?? 0) <= 0)
        return;
      if (payload.reason && ONE_TIME_REASONS.has(payload.reason)) {
        const awarded = getAwardedReasons();
        if (awarded.has(payload.reason)) return;
        awarded.add(payload.reason);
        localStorage.setItem(AWARD_STORAGE_KEY, JSON.stringify([...awarded]));
      }
      void actor
        .updateXP(BigInt(Math.floor(payload.amount!)))
        .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }));
    });
  }, [actor, queryClient]);
}
