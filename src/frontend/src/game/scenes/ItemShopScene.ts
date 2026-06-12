import {
  BaseInteriorScene,
  ROOM_H,
  ROOM_W,
} from "@/game/scenes/BaseInteriorScene";
import type { GameLocationId } from "@/types/game";

/**
 * ItemShopScene — Interior for the Item Shop.
 * Felix's career power-up shop: shop counter, RPG-style item shelves,
 * potions/scrolls/badges for sale, merchant energy.
 */
export class ItemShopScene extends BaseInteriorScene {
  constructor() {
    super({ key: "ItemShopScene" });
  }

  protected getLocationId(): GameLocationId {
    return "item_shop";
  }

  protected getToolId(): string {
    return "item-shop";
  }

  protected buildRoom(): void {
    // ── Floor ──────────────────────────────────────────
    const floor = this.add.graphics();
    floor.setDepth(0);
    // Stone tile floor with slight purple tint
    floor.fillStyle(0x1a1828, 1);
    floor.fillRect(0, 0, ROOM_W, ROOM_H);
    floor.lineStyle(1, 0x141220, 0.8);
    for (let x = 0; x < ROOM_W; x += 40) {
      floor.beginPath();
      floor.moveTo(x, 0);
      floor.lineTo(x, ROOM_H);
      floor.strokePath();
    }
    for (let y = 0; y < ROOM_H; y += 40) {
      floor.beginPath();
      floor.moveTo(0, y);
      floor.lineTo(ROOM_W, y);
      floor.strokePath();
    }

    // ── Walls ──────────────────────────────────────────
    const walls = this.add.graphics();
    walls.setDepth(1);
    walls.fillStyle(0x1e1628, 1);
    walls.fillRect(0, 0, ROOM_W, 64);
    walls.fillStyle(0x261e38, 1);
    walls.fillRect(0, 0, ROOM_W, 8);
    walls.fillStyle(0x1e1628, 1);
    walls.fillRect(0, 0, 16, ROOM_H);
    walls.fillRect(ROOM_W - 16, 0, 16, ROOM_H);
    walls.lineStyle(3, 0x8844ff, 0.5);
    walls.strokeRect(16, 8, ROOM_W - 32, ROOM_H - 16);
    this.addWallRect(0, 0, ROOM_W, 64);
    this.addWallRect(0, 0, 16, ROOM_H);
    this.addWallRect(ROOM_W - 16, 0, 16, ROOM_H);

    // ── Item shelves (left wall) ───────────────────────
    const shelves = this.add.graphics();
    shelves.setDepth(2);
    const items = [
      { color: 0xff4444, label: "HP" },
      { color: 0x4488ff, label: "MP" },
      { color: 0xffcc00, label: "XP" },
      { color: 0x44ff88, label: "SP" },
    ];
    for (let s = 0; s < 3; s++) {
      const sy = 72 + s * 68;
      shelves.fillStyle(0x3a2050, 1);
      shelves.fillRect(22, sy + 56, 80, 5);
      for (let i = 0; i < 4; i++) {
        const item = items[i % items.length]!;
        const ix = 28 + i * 18;
        // Potion bottle
        shelves.fillStyle(item.color, 0.85);
        shelves.fillEllipse(ix + 6, sy + 40, 12, 18);
        shelves.fillRect(ix + 3, sy + 20, 6, 10);
        // Cork
        shelves.fillStyle(0xaa8844, 1);
        shelves.fillRect(ix + 4, sy + 18, 4, 4);
        // Label
        shelves.fillStyle(0xffffff, 0.9);
        shelves.fillRect(ix + 1, sy + 32, 10, 8);
      }
    }
    this.addWallRect(16, 64, 90, ROOM_H - 128);

    // ── Right wall item display (scrolls & badges) ───
    const display = this.add.graphics();
    display.setDepth(2);
    const badgeColors = [0x8844ff, 0x4488ff, 0xffcc00, 0xff4488];
    for (let i = 0; i < 4; i++) {
      const dx = ROOM_W - 90;
      const dy = 72 + i * 62;
      // Scroll
      display.fillStyle(0xf5e8d0, 0.9);
      display.fillRect(dx, dy, 64, 48);
      display.fillStyle(0xc8a46a, 1);
      display.fillRect(dx, dy, 64, 6);
      display.fillRect(dx, dy + 42, 64, 6);
      display.lineStyle(1, 0xaa8844, 0.6);
      display.strokeRect(dx, dy, 64, 48);
      display.fillStyle(0x333344, 0.5);
      for (let li = 0; li < 3; li++) {
        display.fillRect(dx + 6, dy + 14 + li * 10, 52, 2);
      }
      // Badge star
      display.fillStyle(badgeColors[i % badgeColors.length] ?? 0x8844ff, 1);
      display.fillCircle(dx + 55, dy + 6, 8);
    }
    this.addWallRect(ROOM_W - 96, 64, 80, ROOM_H - 128);

    // ── Shop counter (center-back) ────────────────────
    const counter = this.add.graphics();
    counter.setDepth(2);
    const ctrX = ROOM_W / 2 - 120;
    const ctrY = ROOM_H / 2 - 50;
    counter.fillStyle(0x2a1840, 1);
    counter.fillRect(ctrX, ctrY, 240, 60);
    counter.fillStyle(0x3a2850, 1);
    counter.fillRect(ctrX + 2, ctrY + 2, 236, 10);
    counter.lineStyle(2, 0x8844ff, 0.8);
    counter.strokeRect(ctrX, ctrY, 240, 60);
    // Items on counter
    const counterItems = [
      { x: ctrX + 24, color: 0xff4444 },
      { x: ctrX + 60, color: 0xffcc00 },
      { x: ctrX + 96, color: 0x4488ff },
      { x: ctrX + 132, color: 0x44ff88 },
      { x: ctrX + 168, color: 0x8844ff },
    ];
    for (const ci of counterItems) {
      counter.fillStyle(ci.color, 0.9);
      counter.fillEllipse(ci.x, ctrY + 20, 20, 26);
      counter.fillRect(ci.x - 4, ctrY + 8, 8, 10);
      counter.fillStyle(0xaa8844, 1);
      counter.fillRect(ci.x - 3, ctrY + 6, 6, 4);
    }
    // Price tag on counter
    counter.fillStyle(0xffffcc, 0.85);
    counter.fillRect(ctrX + 196, ctrY + 28, 36, 20);
    counter.lineStyle(1, 0x888844, 0.7);
    counter.strokeRect(ctrX + 196, ctrY + 28, 36, 20);
    this.addWallRect(ctrX, ctrY, 240, 60);

    // ── Hanging sign above counter ────────────────────
    const sign = this.add.graphics();
    sign.setDepth(3);
    sign.fillStyle(0x2a1840, 1);
    sign.fillRect(ROOM_W / 2 - 80, 66, 160, 28);
    sign.lineStyle(2, 0x8844ff, 0.8);
    sign.strokeRect(ROOM_W / 2 - 80, 66, 160, 28);
    // Chains
    sign.lineStyle(1, 0xaaaaaa, 0.6);
    sign.beginPath();
    sign.moveTo(ROOM_W / 2 - 70, 66);
    sign.lineTo(ROOM_W / 2 - 70, 60);
    sign.moveTo(ROOM_W / 2 + 70, 66);
    sign.lineTo(ROOM_W / 2 + 70, 60);
    sign.strokePath();
    this.add
      .text(ROOM_W / 2, 82, "◈ FELIX'S EMPORIUM ◈", {
        fontSize: "11px",
        color: "#cc88ff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4);
    this.addWallRect(ROOM_W / 2 - 80, 60, 160, 36);

    // ── Room labels ───────────────────────────────────
    this.add
      .text(ROOM_W / 2, 36, "ITEM SHOP", {
        fontSize: "20px",
        color: "#8844ff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 4,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);
    this.add
      .text(ROOM_W / 2, 56, "Felix's Career Emporium", {
        fontSize: "13px",
        color: "#cc88ff",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // ── NPC: Felix — same look as exterior ────────────
    // Male, green jacket, dark hair — matches TownScene
    this.setupInteriorNPC(
      ROOM_W / 2 + 40,
      ctrY - 30,
      "felix_shop",
      "male",
      0x338844,
      0x222222,
    );
  }
}
