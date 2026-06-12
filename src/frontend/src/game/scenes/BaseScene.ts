import Phaser from "phaser";
import { loadGameSettings } from "@/game/gameSettings";

/**
 * BaseScene — abstract base class for all game scenes.
 * Provides: camera setup, scanline CRT overlay, player speed.
 */
export abstract class BaseScene extends Phaser.Scene {
  protected scanlineOverlay: Phaser.GameObjects.Graphics | null = null;
  protected playerSpeed = 128; // pixels per second
  private responsiveWorld = { width: 800, height: 600 };

  setupCamera(worldWidth: number, worldHeight: number): void {
    this.responsiveWorld = { width: worldWidth, height: worldHeight };
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor(0x132313);
    this.applyResponsiveCamera();
    this.scale.on("resize", this.applyResponsiveCamera, this);
    this.events.once("shutdown", () => this.scale.off("resize", this.applyResponsiveCamera, this));
  }

  private applyResponsiveCamera(): void {
    const { width, height } = this.scale;
    const zoom = width >= height
      ? Math.max(0.9, Math.min(1.25, height / this.responsiveWorld.height))
      : Math.max(0.72, Math.min(1, width / this.responsiveWorld.width));
    this.cameras.main.setZoom(zoom);
  }

  addScanlineOverlay(): void {
    if (!loadGameSettings().scanlines) return;
    const { width, height } = this.scale;
    this.scanlineOverlay = this.add.graphics();
    this.scanlineOverlay.setDepth(9000);
    this.scanlineOverlay.setScrollFactor(0);

    // CRT scanlines — 1px dark stripe every 2px
    for (let y = 0; y < height + 4; y += 2) {
      this.scanlineOverlay.lineStyle(1, 0x000000, 0.14);
      this.scanlineOverlay.beginPath();
      this.scanlineOverlay.moveTo(0, y);
      this.scanlineOverlay.lineTo(width, y);
      this.scanlineOverlay.strokePath();
    }

    // Vignette darkening at edges
    this.scanlineOverlay.fillStyle(0x000000, 0.22);
    // Left edge
    for (let x = 0; x < 60; x += 4) {
      this.scanlineOverlay.fillRect(0, 0, x, height);
    }
    // Right edge
    for (let x = 0; x < 60; x += 4) {
      this.scanlineOverlay.fillRect(width - x, 0, x, height);
    }
  }

  getPlayerSpeed(): number {
    return this.playerSpeed * loadGameSettings().movementSpeed;
  }

  getJoystickSensitivity(): number {
    return loadGameSettings().joystickSensitivity;
  }

  /** Normalize a movement vector (so diagonal isn't faster) */
  normalizeVector(dx: number, dy: number): { x: number; y: number } {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  /** Clamp a value between min and max */
  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}
