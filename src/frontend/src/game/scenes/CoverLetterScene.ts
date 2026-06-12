import {
  BaseInteriorScene,
  ROOM_H,
  ROOM_W,
} from "@/game/scenes/BaseInteriorScene";
import type { GameLocationId } from "@/types/game";

/**
 * CoverLetterScene — Interior for the Cover Letter Corner.
 * Penny's writer's parlor: bookshelves, typewriter desk,
 * letter samples on the walls, power-phrases chalkboard.
 */
export class CoverLetterScene extends BaseInteriorScene {
  constructor() {
    super({ key: "CoverLetterScene" });
  }

  protected getLocationId(): GameLocationId {
    return "cover_letter_corner";
  }

  protected getToolId(): string {
    return "cover-letter";
  }

  protected buildRoom(): void {
    // ── Floor ──────────────────────────────────────────
    const floor = this.add.graphics();
    floor.setDepth(0);
    // Cool slate tile floor
    floor.fillStyle(0x1a2030, 1);
    floor.fillRect(0, 0, ROOM_W, ROOM_H);
    // Tile grid
    floor.lineStyle(1, 0x0e1520, 0.7);
    for (let x = 0; x < ROOM_W; x += 32) {
      floor.beginPath();
      floor.moveTo(x, 0);
      floor.lineTo(x, ROOM_H);
      floor.strokePath();
    }
    for (let y = 0; y < ROOM_H; y += 32) {
      floor.beginPath();
      floor.moveTo(0, y);
      floor.lineTo(ROOM_W, y);
      floor.strokePath();
    }

    // ── Walls ──────────────────────────────────────────
    const walls = this.add.graphics();
    walls.setDepth(1);
    walls.fillStyle(0x162030, 1);
    walls.fillRect(0, 0, ROOM_W, 64);
    walls.fillStyle(0x1e2a40, 1);
    walls.fillRect(0, 0, ROOM_W, 8);
    walls.fillStyle(0x162030, 1);
    walls.fillRect(0, 0, 16, ROOM_H);
    walls.fillRect(ROOM_W - 16, 0, 16, ROOM_H);
    walls.lineStyle(3, 0x00ffff, 0.45);
    walls.strokeRect(16, 8, ROOM_W - 32, ROOM_H - 16);
    this.addWallRect(0, 0, ROOM_W, 64);
    this.addWallRect(0, 0, 16, ROOM_H);
    this.addWallRect(ROOM_W - 16, 0, 16, ROOM_H);

    // ── Bookshelves (left wall) ────────────────────────
    const books = this.add.graphics();
    books.setDepth(2);
    const bookColors = [
      [0x00ffff, 0x0088aa, 0x44ccdd, 0x006688],
      [0xaaffff, 0x00aacc, 0x66eeff, 0x005577],
    ];
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfY = 76 + shelf * 52;
      books.fillStyle(0x3a2a18, 1);
      books.fillRect(24, shelfY + 38, 72, 5);
      const row = bookColors[shelf % 2] ?? bookColors[0];
      for (let b = 0; b < 6; b++) {
        books.fillStyle(row[b % row.length] ?? 0x00ffff, 0.9);
        const bw = 8 + (b % 3);
        books.fillRect(26 + b * 11, shelfY + 8, bw, 32);
        books.fillStyle(0x000000, 0.2);
        books.fillRect(26 + b * 11, shelfY + 8, 1, 32);
      }
    }
    this.addWallRect(16, 64, 82, ROOM_H - 128);

    // ── Letter samples pinned to right wall ───────────
    const letters = this.add.graphics();
    letters.setDepth(2);
    for (let i = 0; i < 3; i++) {
      const lx = ROOM_W - 80;
      const ly = 76 + i * 68;
      letters.fillStyle(0xf5f0e0, 0.9);
      letters.fillRect(lx, ly, 56, 72);
      letters.lineStyle(1, 0x00ffff, 0.5);
      letters.strokeRect(lx, ly, 56, 72);
      letters.fillStyle(0x222244, 0.5);
      for (let li = 0; li < 6; li++) {
        letters.fillRect(lx + 6, ly + 10 + li * 10, 44, 2);
      }
      // Pin
      letters.fillStyle(0x00ffff, 1);
      letters.fillCircle(lx + 28, ly + 3, 3);
    }
    this.addWallRect(ROOM_W - 86, 64, 70, ROOM_H - 128);

    // ── Chalkboard (back wall, center) ────────────────
    const board = this.add.graphics();
    board.setDepth(2);
    const brdX = ROOM_W / 2 - 100;
    const brdY = 70;
    board.fillStyle(0x1a3320, 1);
    board.fillRect(brdX, brdY, 200, 100);
    board.lineStyle(3, 0x8b6914, 1);
    board.strokeRect(brdX, brdY, 200, 100);
    board.lineStyle(1, 0xffffff, 0.2);
    for (let cl = 0; cl < 5; cl++) {
      board.beginPath();
      board.moveTo(brdX + 10, brdY + 20 + cl * 14);
      board.lineTo(brdX + 190, brdY + 20 + cl * 14);
      board.strokePath();
    }
    this.add
      .text(ROOM_W / 2, brdY + 12, "POWER PHRASES", {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setAlpha(0.8)
      .setOrigin(0.5, 0.5)
      .setDepth(3);
    [
      "Results-driven",
      "Passionate about…",
      "Synergistic growth",
      "Team player",
    ].forEach((phrase, i) => {
      this.add
        .text(ROOM_W / 2, brdY + 28 + i * 15, phrase, {
          fontSize: "10px",
          color: "#ccffcc",
          fontFamily: '"Space Grotesk", monospace',
        })
        .setAlpha(0.75)
        .setOrigin(0.5, 0.5)
        .setDepth(3);
    });
    this.addWallRect(brdX, brdY, 200, 100);

    // ── Typewriter desk ───────────────────────────────
    const desk = this.add.graphics();
    desk.setDepth(2);
    const deskX = ROOM_W / 2 - 60;
    const deskY = ROOM_H / 2;
    desk.fillStyle(0x2a3040, 1);
    desk.fillRect(deskX, deskY, 120, 70);
    desk.fillStyle(0x333848, 1);
    desk.fillRect(deskX + 2, deskY + 2, 116, 8);
    // Typewriter body
    desk.fillStyle(0x444444, 1);
    desk.fillRect(deskX + 20, deskY + 10, 80, 40);
    desk.fillStyle(0x222222, 1);
    desk.fillRect(deskX + 24, deskY + 14, 72, 24);
    // Key rows
    desk.fillStyle(0x888888, 0.9);
    for (let k = 0; k < 6; k++) {
      desk.fillRect(deskX + 26 + k * 11, deskY + 40, 8, 6);
    }
    // Paper in typewriter
    desk.fillStyle(0xf5f0e0, 0.9);
    desk.fillRect(deskX + 30, deskY + 6, 60, 14);
    // Desk legs
    desk.fillStyle(0x1a2030, 1);
    desk.fillRect(deskX, deskY + 68, 8, 18);
    desk.fillRect(deskX + 112, deskY + 68, 8, 18);
    this.addWallRect(deskX, deskY, 120, 70);

    // ── Room labels ───────────────────────────────────
    this.add
      .text(ROOM_W / 2, 36, "COVER LETTER CORNER", {
        fontSize: "18px",
        color: "#00ffff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);
    this.add
      .text(ROOM_W / 2, 56, "Penny's Writing Parlor", {
        fontSize: "13px",
        color: "#aaffff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // ── NPC: Penny — same look as exterior ────────────
    // Female, rose/pink body, golden hair — matches TownScene
    this.setupInteriorNPC(
      ROOM_W / 2 + 20,
      deskY - 40,
      "penny_writer",
      "female",
      0xcc3366,
      0xddaa22,
    );
  }
}
