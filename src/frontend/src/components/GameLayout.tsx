import { GameBridge } from "@/game/GameBridge";
import { musicManager } from "@/game/MusicManager";
import { useProgressionSync } from "@/hooks/useProgressionSync";
import type { GameLocationId } from "@/types/game";
import { useEffect } from "react";
import type { ReactNode } from "react";

export default function GameLayout({ children }: { children: ReactNode }) {
  useProgressionSync();

  useEffect(
    () =>
      GameBridge.on("locationChanged", (data) => {
        const payload = data as { locationId: GameLocationId } | GameLocationId;
        const locationId =
          typeof payload === "string" ? payload : payload.locationId;
        void musicManager.fadeToTrack(locationId);
      }),
    [],
  );

  return (
    <div className="game-shell crt-overlay" data-ocid="gamelayout.page">
      <main className="game-viewport">{children}</main>
    </div>
  );
}
