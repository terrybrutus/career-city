import type { GameLocationId } from "@/types/game";

/**
 * MusicManager — HTML5 Audio-based music player.
 * Uses external OGG URLs for all tracks. Fades between tracks smoothly.
 * Respects browser autoplay policy: starts on first user interaction.
 */

const TRACK_URLS: Record<GameLocationId, string> = {
  town_square: "https://opengameart.org/sites/default/files/little%20town.ogg",
  resume_tailor: "https://opengameart.org/sites/default/files/JRPG_town.ogg",
  cover_letter_corner:
    "https://opengameart.org/sites/default/files/JRPG_princess.ogg",
  interview_coach:
    "https://opengameart.org/sites/default/files/JRPG_royalCourt.ogg",
  item_shop: "https://opengameart.org/sites/default/files/JRPG_town.ogg",
};

const TRACK_NAMES: Record<GameLocationId, string> = {
  town_square: "Little Town",
  resume_tailor: "Resume Tailor",
  cover_letter_corner: "Cover Letter Corner",
  interview_coach: "Interview Coach",
  item_shop: "Item Shop",
};

export class MusicManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentLocationId: GameLocationId | null = null;
  private muted: boolean;
  private volume: number;
  private started = false;
  private pendingLocation: GameLocationId | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private isFading = false;

  constructor() {
    this.muted = localStorage.getItem("career_city_muted") === "true";
    this.volume = Number.parseFloat(
      localStorage.getItem("career_city_volume") ?? "0.35",
    );
    if (Number.isNaN(this.volume)) this.volume = 0.35;

    const startOnInteraction = () => {
      if (!this.started) {
        this.started = true;
        if (this.pendingLocation) {
          void this.fadeToTrack(this.pendingLocation);
          this.pendingLocation = null;
        }
      }
      window.removeEventListener("click", startOnInteraction);
      window.removeEventListener("keydown", startOnInteraction);
      window.removeEventListener("touchstart", startOnInteraction);
      window.removeEventListener("pointerdown", startOnInteraction);
    };
    window.addEventListener("click", startOnInteraction);
    window.addEventListener("keydown", startOnInteraction);
    window.addEventListener("touchstart", startOnInteraction);
    window.addEventListener("pointerdown", startOnInteraction);
  }

  private clearFade(): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.isFading = false;
  }

  private fadeOutCurrent(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }
      this.clearFade();
      this.isFading = true;
      const audio = this.currentAudio;
      const step = 0.05;
      const intervalMs = 40; // ~25 steps * 40ms = ~1s fade
      this.fadeInterval = setInterval(() => {
        if (audio.volume > step) {
          audio.volume = Math.max(0, audio.volume - step);
        } else {
          audio.volume = 0;
          audio.pause();
          this.clearFade();
          resolve();
        }
      }, intervalMs);
    });
  }

  private fadeInAudio(audio: HTMLAudioElement): void {
    this.clearFade();
    audio.volume = 0;
    const target = this.muted ? 0 : this.volume;
    const step = 0.04;
    const intervalMs = 40; // ~25 steps * 40ms = ~1s fade
    this.fadeInterval = setInterval(() => {
      if (audio.volume < target - step) {
        audio.volume = Math.min(target, audio.volume + step);
      } else {
        audio.volume = target;
        this.clearFade();
      }
    }, intervalMs);
  }

  async fadeToTrack(locationId: GameLocationId): Promise<void> {
    if (!this.started) {
      this.pendingLocation = locationId;
      return;
    }
    if (
      this.currentLocationId === locationId &&
      this.currentAudio &&
      !this.currentAudio.paused
    ) {
      return;
    }

    // Fade out current track
    if (this.currentAudio && !this.currentAudio.paused) {
      await this.fadeOutCurrent();
    }

    // Stop and remove old audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }

    this.currentLocationId = locationId;
    const url = TRACK_URLS[locationId];
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    this.currentAudio = audio;

    // Play and fade in
    try {
      await audio.play();
      this.fadeInAudio(audio);
    } catch {
      // Autoplay blocked — will start on next interaction
    }
  }

  async playTrack(locationId: GameLocationId): Promise<void> {
    if (this.currentLocationId === locationId) return;
    await this.fadeToTrack(locationId);
  }

  stopAll(): void {
    this.clearFade();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = "";
      this.currentAudio = null;
    }
    this.currentLocationId = null;
  }

  pause(): void {
    if (!this.currentAudio) return;
    this.clearFade();
    this.currentAudio.pause();
  }

  resume(): void {
    if (!this.currentAudio || this.muted) return;
    void this.currentAudio.play();
    this.currentAudio.volume = this.volume;
  }

  isPaused(): boolean {
    if (!this.currentAudio) return true;
    return this.currentAudio.paused;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("career_city_muted", String(this.muted));
    if (this.currentAudio) {
      this.currentAudio.volume = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    localStorage.setItem("career_city_volume", String(this.volume));
    if (this.currentAudio && !this.muted) {
      this.currentAudio.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  getCurrentTrackName(): string {
    if (!this.currentLocationId) return "\u2014";
    return TRACK_NAMES[this.currentLocationId] ?? "\u2014";
  }

  getCurrentLocationId(): GameLocationId | null {
    return this.currentLocationId;
  }

  isStarted(): boolean {
    return this.started;
  }
}

// Singleton
export const musicManager = new MusicManager();
