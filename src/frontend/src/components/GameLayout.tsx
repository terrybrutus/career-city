import HUD from "@/components/HUD";
import type { TextSize } from "@/components/HUD";
import QuestLog from "@/components/QuestLog";
import { GameBridge } from "@/game/GameBridge";
import { musicManager } from "@/game/MusicManager";
import { useProfile } from "@/hooks/useProfile";
import { useProgressionSync } from "@/hooks/useProgressionSync";
import { useQuests } from "@/hooks/useQuests";
import type { GameLocationId } from "@/types/game";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const DEFAULT_POS = { x: 400, y: 300 };

interface Props {
  children: ReactNode;
  currentLocation?: GameLocationId;
}

export default function GameLayout({
  children,
  currentLocation: _currentLocation = "town_square",
}: Props) {
  useProgressionSync();
  const { data: profile } = useProfile();
  const { data: quests } = useQuests();

  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [activeLocation, setActiveLocation] =
    useState<GameLocationId>("town_square");
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [careerToolOpen, setCareerToolOpen] = useState(false);
  const playerPos = useRef(DEFAULT_POS);
  const [playerPosTick, setPlayerPosTick] = useState(0);

  // Listen to GameBridge events
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(
      GameBridge.on("playerMoved", (data) => {
        const pos = data as { x: number; y: number };
        playerPos.current = pos;
        setPlayerPosTick((t) => t + 1);
      }),
    );

    unsubs.push(
      GameBridge.on("careerToolOpen", () => {
        setCareerToolOpen(true);
        setIsQuestLogOpen(false);
      }),
    );
    unsubs.push(
      GameBridge.on("careerToolClose", () => setCareerToolOpen(false)),
    );

    unsubs.push(
      GameBridge.on("locationChanged", (data) => {
        const payload = data as { locationId: GameLocationId } | GameLocationId;
        const locationId =
          typeof payload === "string" ? payload : payload.locationId;
        void musicManager.fadeToTrack(locationId);
        setActiveLocation(locationId);
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, []);

  // Keyboard shortcuts: Q=quest log, Escape=close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (careerToolOpen) return;
      if (e.key === "q" || e.key === "Q") {
        setIsQuestLogOpen((v) => !v);
      } else if (e.key === "Escape") {
        setIsQuestLogOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [careerToolOpen]);

  // Auto-minimize overlays on mobile (portrait)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) {
      setIsQuestLogOpen(false);
    }
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsQuestLogOpen(false);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleQuestClick = useCallback((_questId: string) => {
    // Quest navigation happens via in-game exploration
  }, []);

  const activeQuest = quests?.find((q) => q.status === "active") ?? null;

  // Suppress unused tick warning—intentional for reactivity
  void playerPosTick;
  // Suppress unused activeLocation warning—used for future HUD updates
  void activeLocation;

  return (
    <div
      data-ocid="gamelayout.page"
      className={crtEnabled ? "crt-overlay scanline" : ""}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Game canvas area — fills viewport minus safe-area bottom */}
      <main
        style={{
          position: "absolute",
          inset: 0,
          bottom: 72,
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {children}
      </main>

      {/* QuestLog overlay */}
      <QuestLog
        quests={quests ?? []}
        onQuestClick={handleQuestClick}
        isOpen={isQuestLogOpen}
        onToggle={() => setIsQuestLogOpen((v) => !v)}
      />

      {/* HUD fixed bottom */}
      {profile && (
        <HUD
          profile={profile}
          xpToNextLevel={profile.xpToNextLevel}
          onToggleMinimap={() => setIsQuestLogOpen((v) => !v)}
          activeQuest={activeQuest}
          crtEnabled={crtEnabled}
          onCrtToggle={setCrtEnabled}
          textSize={textSize}
          onTextSize={setTextSize}
        />
      )}
    </div>
  );
}
