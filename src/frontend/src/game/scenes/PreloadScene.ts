import { ASSETS, ASSET_KEYS } from "@/data/assets";
import { GameBridge } from "@/game/GameBridge";
import Phaser from "phaser";

/**
 * PreloadScene — loads game assets with a Zelda/Pokemon-style loading screen.
 * Falls back gracefully if any asset URL fails (procedural rendering takes over).
 */
export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.createLoadingUI(cx, cy);

    // All assets are procedural — no external URLs to load.
    // Immediately fire progress to 100% so loading screen completes.
    this.percentText.setText("100%");
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffbf00, 1);
    this.progressBar.fillRect(cx - 156, cy + 20, 308, 24);
    this.assetText.setText("Procedural rendering ready");
  }

  create(): void {
    this.createPlayerAnimations();
    GameBridge.emit("assetsLoaded");
    this.scene.start("TownScene");
  }

  private createLoadingUI(cx: number, cy: number): void {
    this.cameras.main.setBackgroundColor(0x0a0a0f);

    // Title
    this.add
      .text(cx, cy - 100, "CAREER CITY", {
        fontSize: "32px",
        color: "#39FF14",
        fontFamily: '"Space Grotesk", monospace',
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#39FF14",
          blur: 24,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 58, "RETRO RPG FOR JOB SEEKERS", {
        fontSize: "13px",
        color: "#666666",
        fontFamily: '"Space Grotesk", monospace',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    // Loading label
    this.loadingText = this.add
      .text(cx, cy - 10, "LOADING ASSETS...", {
        fontSize: "13px",
        color: "#ffbf00",
        fontFamily: '"Space Grotesk", monospace',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    // Progress box (amber border)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x0a0a0a, 0.95);
    this.progressBox.fillRect(cx - 160, cy + 16, 320, 32);
    this.progressBox.lineStyle(4, 0xffbf00, 1);
    this.progressBox.strokeRect(cx - 160, cy + 16, 320, 32);
    // Pixel corners
    this.progressBox.fillStyle(0xffbf00, 1);
    for (const [fx, fy] of [
      [cx - 160, cy + 16],
      [cx + 156, cy + 16],
      [cx - 160, cy + 44],
      [cx + 156, cy + 44],
    ] as [number, number][]) {
      this.progressBox.fillRect(fx, fy, 4, 4);
    }

    this.progressBar = this.add.graphics();

    this.percentText = this.add
      .text(cx, cy + 62, "0%", {
        fontSize: "13px",
        color: "#ffbf00",
        fontFamily: '"Space Grotesk", monospace',
      })
      .setOrigin(0.5);

    this.assetText = this.add
      .text(cx, cy + 86, "", {
        fontSize: "11px",
        color: "#444444",
        fontFamily: '"Space Grotesk", monospace',
      })
      .setOrigin(0.5);
  }

  private createPlayerAnimations(): void {
    // No spritesheet animations — player is drawn procedurally each frame
    // via drawPlayerCharacter(). No animation registration needed.
  }
}
