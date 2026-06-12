import type { GameLocationId } from "@/types/game";

const TRACKS: Record<GameLocationId, { name: string; url: string }> = {
  home: {
    name: "Morning at Home",
    url: "https://opengameart.org/sites/default/files/JRPG_town.ogg",
  },
  town_square: {
    name: "Little Town",
    url: "https://opengameart.org/sites/default/files/little_town.ogg",
  },
  resume_tailor: {
    name: "Vera's Workshop",
    url: "https://opengameart.org/sites/default/files/JRPG_town.ogg",
  },
  cover_letter_corner: {
    name: "Penny's Writing Room",
    url: "https://opengameart.org/sites/default/files/JRPG_princess.ogg",
  },
  interview_coach: {
    name: "Chad's Training Studio",
    url: "https://opengameart.org/sites/default/files/JRPG_royalCourt.ogg",
  },
  item_shop: {
    name: "Felix's Item Shop",
    url: "https://opengameart.org/sites/default/files/Welcome%20to%20the%20Item%20Shop.ogg",
  },
};

export class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private currentLocationId: GameLocationId | null = null;
  private pendingLocation: GameLocationId | null = null;
  private transitionId = 0;
  private muted = localStorage.getItem("career_city_muted") === "true";
  private volume =
    Number.parseFloat(localStorage.getItem("career_city_volume") ?? "0.35") ||
    0.35;
  private started = false;
  private paused = false;

  constructor() {
    const start = () => {
      if (this.started) return;
      this.started = true;
      if (this.pendingLocation) void this.fadeToTrack(this.pendingLocation);
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
  }

  async fadeToTrack(locationId: GameLocationId): Promise<void> {
    this.pendingLocation = locationId;
    if (!this.started || this.currentLocationId === locationId) return;

    const transitionId = ++this.transitionId;
    this.stopCurrent();
    const audio = new Audio(TRACKS[locationId].url);
    audio.loop = true;
    audio.preload = "auto";
    audio.muted = this.muted;
    audio.volume = this.volume;
    this.audio = audio;
    this.currentLocationId = locationId;
    this.paused = false;
    try {
      await audio.play();
      if (transitionId !== this.transitionId) {
        audio.pause();
        audio.src = "";
      }
    } catch {
      if (transitionId === this.transitionId) this.paused = true;
    }
  }

  private stopCurrent(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.audio = null;
  }

  stopAll(): void {
    this.transitionId += 1;
    this.stopCurrent();
    this.currentLocationId = null;
    this.pendingLocation = null;
  }

  pause(): void {
    this.audio?.pause();
    this.paused = true;
  }

  resume(): void {
    if (this.audio) void this.audio.play();
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("career_city_muted", String(this.muted));
    if (this.audio) this.audio.muted = this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    localStorage.setItem("career_city_volume", String(this.volume));
    if (this.audio) this.audio.volume = this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  getCurrentTrackName(): string {
    return this.currentLocationId ? TRACKS[this.currentLocationId].name : "-";
  }

  getCurrentLocationId(): GameLocationId | null {
    return this.currentLocationId;
  }

  isStarted(): boolean {
    return this.started;
  }
}

export const musicManager = new MusicManager();
