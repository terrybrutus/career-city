import type { GameLocationId } from "@/types/game";

const TRACK_NAMES: Record<GameLocationId, string> = {
  town_square: "Career City Theme",
  resume_tailor: "Vera's Workshop",
  cover_letter_corner: "Penny's Writing Room",
  interview_coach: "Chad's Training Studio",
  item_shop: "Felix's Item Shop",
};

const MOTIFS: Record<GameLocationId, number[]> = {
  town_square: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23],
  resume_tailor: [220, 261.63, 329.63, 392, 329.63, 261.63],
  cover_letter_corner: [293.66, 369.99, 440, 493.88, 440, 369.99],
  interview_coach: [196, 246.94, 293.66, 392, 293.66, 246.94],
  item_shop: [329.63, 415.3, 493.88, 554.37, 493.88, 415.3],
};

export class MusicManager {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentLocationId: GameLocationId | null = null;
  private pendingLocation: GameLocationId | null = null;
  private muted = localStorage.getItem("career_city_muted") === "true";
  private volume = Number.parseFloat(localStorage.getItem("career_city_volume") ?? "0.35") || 0.35;
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
    this.currentLocationId = locationId;
    if (!this.started) {
      this.pendingLocation = locationId;
      return;
    }
    this.stopTimer();
    this.context ??= new AudioContext();
    await this.context.resume();
    this.gain?.disconnect();
    this.gain = this.context.createGain();
    this.gain.gain.value = this.muted ? 0 : this.volume * 0.18;
    this.gain.connect(this.context.destination);
    this.paused = false;
    const notes = MOTIFS[locationId];
    let index = 0;
    const playNote = () => {
      if (!this.context || !this.gain || this.paused) return;
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      oscillator.type = locationId === "interview_coach" ? "square" : "triangle";
      oscillator.frequency.value = notes[index++ % notes.length] ?? 261.63;
      envelope.gain.setValueAtTime(0.001, this.context.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.4, this.context.currentTime + 0.03);
      envelope.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.38);
      oscillator.connect(envelope).connect(this.gain);
      oscillator.start();
      oscillator.stop(this.context.currentTime + 0.4);
    };
    playNote();
    this.timer = setInterval(playNote, 440);
  }

  async playTrack(locationId: GameLocationId): Promise<void> { await this.fadeToTrack(locationId); }
  private stopTimer(): void { if (this.timer) clearInterval(this.timer); this.timer = null; }
  stopAll(): void { this.stopTimer(); this.gain?.disconnect(); this.gain = null; this.currentLocationId = null; }
  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; if (this.context?.state === "suspended") void this.context.resume(); }
  isPaused(): boolean { return this.paused; }
  toggleMute(): boolean { this.muted = !this.muted; localStorage.setItem("career_city_muted", String(this.muted)); this.updateGain(); return this.muted; }
  isMuted(): boolean { return this.muted; }
  setVolume(value: number): void { this.volume = Math.max(0, Math.min(1, value)); localStorage.setItem("career_city_volume", String(this.volume)); this.updateGain(); }
  private updateGain(): void { if (this.gain) this.gain.gain.value = this.muted ? 0 : this.volume * 0.18; }
  getVolume(): number { return this.volume; }
  getCurrentTrackName(): string { return this.currentLocationId ? TRACK_NAMES[this.currentLocationId] : "-"; }
  getCurrentLocationId(): GameLocationId | null { return this.currentLocationId; }
  isStarted(): boolean { return this.started; }
}

export const musicManager = new MusicManager();
