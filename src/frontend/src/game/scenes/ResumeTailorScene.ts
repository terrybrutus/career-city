import {
  BaseInteriorScene,
  ROOM_H,
  ROOM_W,
} from "@/game/scenes/BaseInteriorScene";
import type { GameLocationId } from "@/types/game";

/**
 * ResumeTailorScene — Interior for the Resume Tailor building.
 * Vera's cozy workshop: wooden floor, fabric bolts on the walls,
 * a central drafting desk covered in resume drafts.
 */
export class ResumeTailorScene extends BaseInteriorScene {
  constructor() {
    super({ key: "ResumeTailorScene" });
  }

  protected getLocationId(): GameLocationId {
    return "resume_tailor";
  }

  protected getToolId(): string {
    return "resume-tailor";
  }

  protected buildRoom(): void {
    // ── Floor ──────────────────────────────────────────
    const floor = this.add.graphics();
    floor.setDepth(0);
    // Warm wood plank floor
    floor.fillStyle(0x3a1f0a, 1);
    floor.fillRect(0, 0, ROOM_W, ROOM_H);
    // Plank lines (horizontal)
    floor.lineStyle(1, 0x2a1408, 0.6);
    for (let y = 0; y < ROOM_H; y += 20) {
      floor.beginPath();
      floor.moveTo(0, y);
      floor.lineTo(ROOM_W, y);
      floor.strokePath();
    }
    // Plank vertical joints (staggered)
    floor.lineStyle(1, 0x2a1408, 0.4);
    for (let row = 0; row < ROOM_H / 20; row++) {
      const offset = row % 2 === 0 ? 0 : 60;
      for (let x = offset; x < ROOM_W; x += 120) {
        floor.beginPath();
        floor.moveTo(x, row * 20);
        floor.lineTo(x, (row + 1) * 20);
        floor.strokePath();
      }
    }

    // ── Walls (perimeter) ──────────────────────────────
    const walls = this.add.graphics();
    walls.setDepth(1);
    // Back wall (top)
    walls.fillStyle(0x4a2a0f, 1);
    walls.fillRect(0, 0, ROOM_W, 64);
    walls.fillStyle(0x5a3a18, 1);
    walls.fillRect(0, 0, ROOM_W, 8); // ceiling strip
    // Side walls
    walls.fillStyle(0x4a2a0f, 1);
    walls.fillRect(0, 0, 16, ROOM_H);
    walls.fillRect(ROOM_W - 16, 0, 16, ROOM_H);
    // Wall trim
    walls.lineStyle(3, 0xff00ff, 0.5);
    walls.strokeRect(16, 8, ROOM_W - 32, ROOM_H - 16);
    // Register walls for collision
    this.addWallRect(0, 0, ROOM_W, 64); // back wall
    this.addWallRect(0, 0, 16, ROOM_H); // left wall
    this.addWallRect(ROOM_W - 16, 0, 16, ROOM_H); // right wall

    // ── Fabric bolt shelves (left wall) ───────────────
    const shelves = this.add.graphics();
    shelves.setDepth(2);
    const boltColors = [0xff00ff, 0xaa22dd, 0xff44aa, 0xddaaff, 0xff88cc];
    for (let i = 0; i < 5; i++) {
      const bx = 24;
      const by = 72 + i * 40;
      // Shelf plank
      shelves.fillStyle(0x5a3a1a, 1);
      shelves.fillRect(bx, by + 28, 64, 5);
      // Fabric bolt roll
      shelves.fillStyle(boltColors[i] ?? 0xff00ff, 0.85);
      shelves.fillEllipse(bx + 16, by + 20, 24, 14);
      shelves.fillRect(bx + 4, by + 8, 24, 14);
      shelves.fillStyle(0x000000, 0.15);
      shelves.fillRect(bx + 4, by + 8, 4, 14);
    }
    this.addWallRect(16, 64, 72, ROOM_H - 128);

    // ── Sewing dummy (right side) ─────────────────────
    const dummy = this.add.graphics();
    dummy.setDepth(2);
    dummy.fillStyle(0x5a3a1a, 1);
    dummy.fillRect(ROOM_W - 90, 80, 4, 120); // pole
    dummy.fillStyle(0xddaaaa, 1);
    dummy.fillEllipse(ROOM_W - 88, 96, 30, 48); // form body
    dummy.fillStyle(0xff00ff, 0.5);
    dummy.fillRect(ROOM_W - 102, 88, 28, 8); // shoulders
    this.addWallRect(ROOM_W - 106, 72, 36, 140);

    // ── Central drafting desk ─────────────────────────
    const desk = this.add.graphics();
    desk.setDepth(2);
    const deskX = ROOM_W / 2 - 80;
    const deskY = ROOM_H / 2 - 30;
    // Desk surface
    desk.fillStyle(0x5a3218, 1);
    desk.fillRect(deskX, deskY, 160, 80);
    desk.fillStyle(0x6a4228, 1);
    desk.fillRect(deskX + 2, deskY + 2, 156, 10); // top edge highlight
    // Resume papers on desk
    desk.fillStyle(0xf5f0e0, 0.95);
    desk.fillRect(deskX + 15, deskY + 12, 50, 60);
    desk.fillRect(deskX + 70, deskY + 8, 50, 60);
    // Text lines on paper
    desk.fillStyle(0x333333, 0.5);
    for (let li = 0; li < 5; li++) {
      desk.fillRect(deskX + 20, deskY + 22 + li * 9, 38, 2);
      desk.fillRect(deskX + 75, deskY + 18 + li * 9, 38, 2);
    }
    // Desk lamp
    desk.fillStyle(0x888888, 1);
    desk.fillRect(deskX + 130, deskY - 28, 4, 32);
    desk.fillStyle(0xffffaa, 0.9);
    desk.fillEllipse(deskX + 132, deskY - 30, 24, 12);
    // Lamp glow pool
    desk.fillStyle(0xffffcc, 0.12);
    desk.fillEllipse(deskX + 100, deskY + 30, 80, 40);
    // Ink pot + quill
    desk.fillStyle(0x1a1a2a, 1);
    desk.fillCircle(deskX + 18, deskY + 10, 6);
    desk.fillStyle(0x888866, 1);
    desk.fillRect(deskX + 16, deskY - 2, 2, 14);
    // Desk legs
    desk.fillStyle(0x3a1a08, 1);
    desk.fillRect(deskX, deskY + 78, 8, 20);
    desk.fillRect(deskX + 152, deskY + 78, 8, 20);

    this.addWallRect(deskX, deskY, 160, 80);

    // ── Room label ────────────────────────────────────
    this.add
      .text(ROOM_W / 2, 36, "RESUME TAILOR", {
        fontSize: "20px",
        color: "#ff00ff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    this.add
      .text(ROOM_W / 2, 56, "Vera's Workshop", {
        fontSize: "13px",
        color: "#ddaaff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // ── NPC: Vera — same look as exterior ─────────────
    // Female, teal body, purple hair — matches NPC_POSITIONS in TownScene
    this.setupInteriorNPC(
      ROOM_W / 2 - 40,
      deskY - 30,
      "vera_hr",
      "female",
      0x00aaaa,
      0x8844bb,
    );
  }
}
