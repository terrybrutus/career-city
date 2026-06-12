import { musicManager } from "@/game/MusicManager";
import { useCallback, useState } from "react";

/**
 * useMusicVolume — React hook for music volume control.
 * Syncs with MusicManager singleton + localStorage.
 */
export function useMusicVolume() {
  const [volume, setVolumeState] = useState(() => musicManager.getVolume());
  const [isMuted, setIsMuted] = useState(() => musicManager.isMuted());

  const setVolume = useCallback((v: number) => {
    musicManager.setVolume(v);
    setVolumeState(v);
  }, []);

  const toggleMute = useCallback(() => {
    const nowMuted = musicManager.toggleMute();
    setIsMuted(nowMuted);
    return nowMuted;
  }, []);

  return {
    volume,
    setVolume,
    isMuted,
    toggleMute,
  };
}
