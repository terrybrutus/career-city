import { loadGameSettings } from "@/game/gameSettings";
import Phaser from "phaser";

export abstract class BaseScene extends Phaser.Scene {
  protected playerSpeed = 128;
  private responsiveWorld = { width: 800, height: 600 };

  setupCamera(worldWidth: number, worldHeight: number): void {
    this.responsiveWorld = { width: worldWidth, height: worldHeight };
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor(0x132313);
    this.applyResponsiveCamera();
    this.scale.on("resize", this.applyResponsiveCamera, this);
    this.events.once("shutdown", () =>
      this.scale.off("resize", this.applyResponsiveCamera, this),
    );
  }

  private applyResponsiveCamera(): void {
    const { width, height } = this.scale;
    this.cameras.main.setZoom(
      Math.max(
        width / this.responsiveWorld.width,
        height / this.responsiveWorld.height,
      ),
    );
  }

  getPlayerSpeed(): number {
    return this.playerSpeed * loadGameSettings().movementSpeed;
  }

  getJoystickSensitivity(): number {
    return loadGameSettings().joystickSensitivity;
  }

  normalizeVector(dx: number, dy: number): { x: number; y: number } {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}
