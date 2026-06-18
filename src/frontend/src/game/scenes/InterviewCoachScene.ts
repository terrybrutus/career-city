import {
  BaseInteriorScene,
  ROOM_H,
  ROOM_W,
} from "@/game/scenes/BaseInteriorScene";
import type { GameLocationId } from "@/types/game";

/**
 * InterviewCoachScene — Interior for the Interview Coach building.
 * Chad's mock interview room: two chairs facing each other,
 * a spotlight, whiteboard with tips, HR-conference aesthetic.
 */
export class InterviewCoachScene extends BaseInteriorScene {
  constructor() {
    super({ key: "InterviewCoachScene" });
  }

  protected getLocationId(): GameLocationId {
    return "interview_coach";
  }

  protected getToolId(): string {
    return "interview-coach";
  }

  protected buildRoom(): void {
    // ── Floor ──────────────────────────────────────────
    const floor = this.add.graphics();
    floor.setDepth(0);
    // Dark corporate carpet
    floor.fillStyle(0x1a1828, 1);
    floor.fillRect(0, 0, ROOM_W, ROOM_H);
    // Carpet texture — subtle diamond pattern
    floor.fillStyle(0x201e30, 0.6);
    for (let x = 0; x < ROOM_W; x += 24) {
      for (let y = 0; y < ROOM_H; y += 24) {
        const even = (Math.floor(x / 24) + Math.floor(y / 24)) % 2 === 0;
        if (even) floor.fillRect(x, y, 24, 24);
      }
    }

    // ── Walls ──────────────────────────────────────────
    const walls = this.add.graphics();
    walls.setDepth(1);
    walls.fillStyle(0x22203a, 1);
    walls.fillRect(0, 0, ROOM_W, 64);
    walls.fillStyle(0x2a2848, 1);
    walls.fillRect(0, 0, ROOM_W, 8);
    walls.fillStyle(0x22203a, 1);
    walls.fillRect(0, 0, 16, ROOM_H);
    walls.fillRect(ROOM_W - 16, 0, 16, ROOM_H);
    walls.lineStyle(3, 0xffaa00, 0.45);
    walls.strokeRect(16, 8, ROOM_W - 32, ROOM_H - 16);
    this.addWallRect(0, 0, ROOM_W, 64);
    this.addWallRect(0, 0, 16, ROOM_H);
    this.addWallRect(ROOM_W - 16, 0, 16, ROOM_H);

    // ── Spotlight pool on floor ───────────────────────
    const spot = this.add.graphics();
    spot.setDepth(1);
    spot.fillStyle(0xffee88, 0.08);
    spot.fillEllipse(ROOM_W / 2, ROOM_H / 2 + 20, 280, 200);
    spot.fillStyle(0xffee88, 0.05);
    spot.fillEllipse(ROOM_W / 2, ROOM_H / 2 + 20, 200, 140);
    // Ceiling fixture (lamp)
    spot.fillStyle(0x666666, 1);
    spot.fillRect(ROOM_W / 2 - 8, 8, 16, 14);
    spot.fillStyle(0xffffcc, 0.85);
    spot.fillTriangle(ROOM_W / 2 - 22, 22, ROOM_W / 2 + 22, 22, ROOM_W / 2, 8);

    // ── Whiteboard (back-left) ────────────────────────
    const wbX = 40;
    const wbY = 72;
    const wb = this.add.graphics();
    wb.setDepth(2);
    wb.fillStyle(0xf0f0ee, 1);
    wb.fillRect(wbX, wbY, 180, 120);
    wb.lineStyle(3, 0x555555, 1);
    wb.strokeRect(wbX, wbY, 180, 120);
    wb.lineStyle(1, 0xddddcc, 0.6);
    for (let li = 0; li < 7; li++) {
      wb.beginPath();
      wb.moveTo(wbX + 8, wbY + 18 + li * 14);
      wb.lineTo(wbX + 172, wbY + 18 + li * 14);
      wb.strokePath();
    }
    this.add
      .text(wbX + 90, wbY + 10, "INTERVIEW TIPS", {
        fontSize: "11px",
        color: "#333344",
        fontFamily: '"Space Grotesk", monospace',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);
    [
      "STAR method always wins",
      "Eye contact: maintained",
      "Salary: deflect, deflect",
      "Confidence = fake it",
      "Ask 2 good questions",
    ].forEach((tip, i) => {
      this.add
        .text(wbX + 90, wbY + 28 + i * 16, tip, {
          fontSize: "9px",
          color: "#1a1a33",
          fontFamily: '"Space Grotesk", monospace',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(3);
    });
    this.addWallRect(wbX, wbY, 180, 120);

    // ── Two interview chairs facing each other ────────
    // Left chair: seatback on LEFT, opening faces RIGHT.
    // Right chair: seatback on RIGHT, opening faces LEFT.
    // Like two people seated across from each other.
    const chairs = this.add.graphics();
    chairs.setDepth(2);
    const chairY = ROOM_H / 2 + 40;
    const lcX = ROOM_W / 2 - 90; // left chair center X
    const rcX = ROOM_W / 2 + 90; // right chair center X

    // Left chair (interviewee) — seatback on left, faces right
    chairs.fillStyle(0x2a2030, 1);
    chairs.fillRect(lcX - 20, chairY - 12, 40, 36);
    chairs.fillStyle(0x3a3050, 1);
    chairs.fillRect(lcX - 18, chairY - 10, 36, 32);
    chairs.fillStyle(0x2a2030, 1);
    chairs.fillRect(lcX - 22, chairY - 34, 10, 26); // seatback on LEFT
    chairs.fillStyle(0x1a1428, 1);
    chairs.fillRect(lcX - 20, chairY + 24, 6, 10);
    chairs.fillRect(lcX + 14, chairY + 24, 6, 10);

    // Right chair (interviewer) — seatback on right, faces left
    chairs.fillStyle(0x3a2820, 1);
    chairs.fillRect(rcX - 20, chairY - 12, 40, 36);
    chairs.fillStyle(0x4a3830, 1);
    chairs.fillRect(rcX - 18, chairY - 10, 36, 32);
    chairs.fillStyle(0x3a2820, 1);
    chairs.fillRect(rcX + 12, chairY - 34, 10, 26); // seatback on RIGHT
    chairs.fillStyle(0x2a1a10, 1);
    chairs.fillRect(rcX - 20, chairY + 24, 6, 10);
    chairs.fillRect(rcX + 14, chairY + 24, 6, 10);

    // Table between them
    chairs.fillStyle(0x3a3028, 1);
    chairs.fillRect(ROOM_W / 2 - 24, chairY - 8, 48, 32);
    chairs.fillStyle(0x4a4038, 1);
    chairs.fillRect(ROOM_W / 2 - 22, chairY - 6, 44, 5);
    chairs.fillStyle(0x88ccee, 0.7);
    chairs.fillRect(ROOM_W / 2 - 6, chairY, 10, 14);

    this.addWallRect(lcX - 24, chairY - 36, 44, 72);
    this.addWallRect(rcX - 22, chairY - 36, 44, 72);
    this.addWallRect(ROOM_W / 2 - 24, chairY - 8, 48, 32);

    // ── Award plaques (right wall) ────────────────
    const plaques = this.add.graphics();
    plaques.setDepth(2);
    for (let i = 0; i < 3; i++) {
      const px = ROOM_W - 82;
      const py = 76 + i * 68;
      plaques.fillStyle(0xaa8833, 1);
      plaques.fillRect(px, py, 60, 52);
      plaques.lineStyle(2, 0xffcc44, 0.8);
      plaques.strokeRect(px, py, 60, 52);
      plaques.fillStyle(0xffcc44, 0.15);
      plaques.fillRect(px + 4, py + 4, 52, 44);
      this.add
        .text(px + 30, py + 20, "*", {
          fontSize: "16px",
          color: "#ffcc44",
          fontFamily: "monospace",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(3);
      this.add
        .text(
          px + 30,
          py + 38,
          ["TOP HIRE", "ACE PREP", "STAR TALK"][i] ?? "",
          {
            fontSize: "8px",
            color: "#ffcc44",
            fontFamily: '"Space Grotesk", monospace',
          },
        )
        .setOrigin(0.5, 0.5)
        .setDepth(3);
    }
    this.addWallRect(ROOM_W - 88, 64, 72, ROOM_H - 128);

    // ── Room labels ──────────────────────────
    this.add
      .text(ROOM_W / 2, 36, "INTERVIEW COACH", {
        fontSize: "20px",
        color: "#ffaa00",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);
    this.add
      .text(ROOM_W / 2, 56, "Chad's Hot Seat", {
        fontSize: "13px",
        color: "#ffcc88",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // ── NPC: Chad — same look as exterior, stands near right chair ─
    this.setupInteriorNPC(
      rcX - 20,
      chairY - 90,
      "chad_coach",
      "male",
      0x3366cc,
      0x5a3010,
    );
  }
}
