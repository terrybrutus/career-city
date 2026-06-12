import { NPCS } from "@/data/npcs";
import { GameBridge } from "@/game/GameBridge";
import { BaseScene } from "@/game/scenes/BaseScene";
import { isTypingInField } from "@/game/utils/inputFocusGuard";
import type { NPC } from "@/types/game";
import Phaser from "phaser";

// ─────────────────────────────────────────────
// Map layout constants (virtual pixels)
// ─────────────────────────────────────────────
const MAP_W = 800;
const MAP_H = 600;
const TILE = 32;

type BuildingDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  accentColor: number;
  accentHex: string;
  route: string;
};

// Town area centers Ed can migrate to
const ED_AREA_CENTERS = [
  { x: 400, y: 300 }, // town center
  { x: 150, y: 150 }, // near resume tailor
  { x: 650, y: 150 }, // near interview coach
  { x: 650, y: 450 }, // near cover letter
  { x: 150, y: 450 }, // near item shop
  { x: 400, y: 150 }, // north path
  { x: 400, y: 500 }, // south path
];

// Bench in the bottom-left corner of the town square box
// Moved ~40px left per user request
const BENCH_X = 316;
const BENCH_Y = 314;

const BUILDINGS: BuildingDef[] = [
  {
    id: "resume_tailor",
    label: "RESUME\nTAILOR",
    x: 48,
    y: 60,
    w: 140,
    h: 100,
    accentColor: 0xff00ff,
    accentHex: "#ff00ff",
    route: "/resume",
  },
  {
    id: "cover_letter_corner",
    label: "COVER\nLETTER",
    x: 608,
    y: 380,
    w: 140,
    h: 100,
    accentColor: 0x00ffff,
    accentHex: "#00ffff",
    route: "/coverletter",
  },
  {
    id: "interview_coach",
    label: "INTERVIEW\nCOACH",
    x: 608,
    y: 60,
    w: 140,
    h: 100,
    accentColor: 0xffaa00,
    accentHex: "#ffaa00",
    route: "/interview",
  },
  {
    id: "item_shop",
    label: "ITEM\nSHOP",
    x: 48,
    y: 380,
    w: 140,
    h: 100,
    accentColor: 0x8844ff,
    accentHex: "#8844ff",
    route: "/",
  },
];

type NPCDef = {
  npcId: string;
  x: number;
  y: number;
  gender: "male" | "female";
  primaryColor: number;
  hairColor: number;
};

// NPC home positions — placed BESIDE building doors, not in front of doorways
const NPC_POSITIONS: NPCDef[] = [
  // Vera — female, Resume Tailor: shifted LEFT of door (building bottom y:160, door cx ~118)
  {
    npcId: "vera_hr",
    x: 80, // was 115, shifted left ~30
    y: 178,
    gender: "female",
    primaryColor: 0x00aaaa,
    hairColor: 0x8844bb,
  },
  // Chad — male, Interview Coach: shifted RIGHT and DOWN (building bottom y:160, door cx ~678)
  {
    npcId: "chad_coach",
    x: 705, // was 675, shifted right +30; also down +25 handled by y
    y: 200, // was 175, down +25
    gender: "male",
    primaryColor: 0x3366cc,
    hairColor: 0x5a3010,
  },
  // Penny — female, Cover Letter Corner: shifted LEFT (building bottom y:480, door cx ~678)
  {
    npcId: "penny_writer",
    x: 640, // was 675, shifted left ~35
    y: 498,
    gender: "female",
    primaryColor: 0xcc3366,
    hairColor: 0xddaa22,
  },
  // Felix — male, Item Shop: shifted RIGHT of door (building bottom y:480, door cx ~118)
  {
    npcId: "felix_shop",
    x: 148, // was 115, shifted right +33
    y: 498,
    gender: "male",
    primaryColor: 0x338844,
    hairColor: 0x222222,
  },
];

// ─────────────────────────────────────────────
// TownScene
// ─────────────────────────────────────────────
export class TownScene extends BaseScene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private buildingZones: Phaser.GameObjects.Zone[] = [];
  // Door entry state — prevent double-firing
  private hasEnteredBuilding = false;
  private npcObjects: Array<{
    container: Phaser.GameObjects.Container;
    npcId: string;
    x: number;
    y: number;
  }> = [];
  // Pokemon-style interaction prompt (Phaser Graphics + Text)
  private promptBg: Phaser.GameObjects.Graphics | null = null;
  private promptText: Phaser.GameObjects.Text | null = null;
  private lastNearBuilding: string | null = null;
  private lastNearNPC: string | null = null;
  // Proximity tip bubbles (appear above NPC heads)
  private tipBubble: Phaser.GameObjects.Container | null = null;
  private lastTipNpcId: string | null = null;
  private npcTipIndices: Record<string, number> = {};
  // Joystick state
  private joystickActive = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickVec = { x: 0, y: 0 };
  private joystickGraphics!: Phaser.GameObjects.Graphics;
  private joystickOuter!: Phaser.GameObjects.Graphics;
  private isTouchDevice = false;
  private playerFacing: "up" | "down" | "left" | "right" = "down";
  // Transition lock — prevents double-firing (entry or exit) within 600ms
  private transitionLock = false;
  private interactionLocked = false;

  // Ed — wandering NPC
  private edContainer: Phaser.GameObjects.Container | null = null;
  private edAreaX = 400;
  private edAreaY = 300;
  private edTargetX = 400;
  private edTargetY = 300;
  private edPauseTimer = 0;
  private edPausing = true;
  private edWalkTimer = 0;
  private edWalking = false;
  private edDialogueIndex = 0;

  // Sam — bench NPC with sit/walk/return cycle
  private samContainer: Phaser.GameObjects.Container | null = null;
  private samX = BENCH_X;
  private samY = BENCH_Y;
  private samTargetX = BENCH_X;
  private samTargetY = BENCH_Y;
  private samState: "sitting" | "walking" | "returning" = "sitting";
  private samStateTimer = 0;
  private samDialogueIndex = 0;

  constructor() {
    super({ key: "TownScene" });
  }

  create(data?: { returnX?: number; returnY?: number }): void {
    this.setupCamera(MAP_W, MAP_H);

    // Draw layered world
    this.drawGround();
    this.drawPaths();
    this.drawTownSquare();
    this.drawBuildings();
    this.createBenchAndSam();
    this.createNPCs();
    this.createEdWanderer();
    this.createPlayer(data?.returnX, data?.returnY);
    this.setupInput();
    this.setupJoystick();

    // Camera follows player
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Fade in from black when returning from an interior
    if (data?.returnX !== undefined) {
      this.cameras.main.fadeIn(320, 0, 0, 0);
    }

    // Start town music

    // Emit location event
    GameBridge.emit("locationChanged", "town_square");

    // Init Ed with a pause before first walk
    this.edPausing = true;
    this.edPauseTimer = 3000 + Math.random() * 3000;

    // Sam is always seated
    this.samState = "sitting";

    // Reset door entry flag (must be reset every create() since Phaser
    // does not re-run the constructor on scene restart)
    this.hasEnteredBuilding = false;
    this.transitionLock = false;
    this.interactionLocked = false;

    const lockInteraction = () => {
      this.interactionLocked = true;
    };
    const unlockInteraction = () => {
      this.interactionLocked = false;
    };
    GameBridge.on("dialogueOpened", lockInteraction);
    GameBridge.on("careerToolOpen", lockInteraction);
    GameBridge.on("dialogueClosed", unlockInteraction);
    GameBridge.on("careerToolClose", unlockInteraction);
    this.events.once("shutdown", () => {
      GameBridge.off("dialogueOpened", lockInteraction);
      GameBridge.off("careerToolOpen", lockInteraction);
      GameBridge.off("dialogueClosed", unlockInteraction);
      GameBridge.off("careerToolClose", unlockInteraction);
      if (this.input.keyboard) {
        this.input.keyboard.off("keydown-E", this.handleInteract, this);
        this.input.keyboard.off("keydown-ENTER", this.handleInteract, this);
        this.input.keyboard.off("keydown-SPACE", this.handleInteract, this);
      }
    });

    // Draw subtle door indicator overlays (purely additive, no collision logic)
    this.drawDoorZoneIndicators();
  }

  update(time: number, delta: number): void {
    if (!this.interactionLocked) {
      this.handleMovement(delta);
      this.checkBuildingDoorEntry();
    }
    this.checkProximity();
    this.updateTipBubblePosition();
    this.updateJoystickVisual();
    this.updateEdWander(time, delta);
    this.updateSamCycle(delta);
  }

  // ─────────────────────────────────────────────
  // Building collision helper — full footprint, used by all entities
  // ─────────────────────────────────────────────
  private collidedWithBuilding(cx: number, cy: number): boolean {
    const hw = 8;
    const hh = 8;
    for (const b of BUILDINGS) {
      if (
        cx + hw > b.x &&
        cx - hw < b.x + b.w &&
        cy + hh > b.y &&
        cy - hh < b.y + b.h
      ) {
        return true;
      }
    }
    return false;
  }

  // NPC AABB collision — treat each NPC as a 20x20 solid box
  private collidesWithNPC(cx: number, cy: number, excludeId: string): boolean {
    const hw = 10;
    const hh = 10;
    for (const n of this.npcObjects) {
      if (n.npcId === excludeId) continue;
      if (
        cx + hw > n.x - hw &&
        cx - hw < n.x + hw &&
        cy + hh > n.y - hh &&
        cy - hh < n.y + hh
      ) {
        return true;
      }
    }
    return false;
  }

  // ─────────────────────────────────────────────
  // World Drawing
  // ─────────────────────────────────────────────

  private drawGround(): void {
    const g = this.add.graphics();
    g.setDepth(0);

    // Base dark grass
    g.fillStyle(0x1a2f1a, 1);
    g.fillRect(0, 0, MAP_W, MAP_H);

    // Grass texture — scattered darker patches
    g.fillStyle(0x162614, 0.7);
    for (let x = 0; x < MAP_W; x += TILE) {
      for (let y = 0; y < MAP_H; y += TILE) {
        const h = ((x * 31 + y * 17) % 100) / 100;
        if (h > 0.6) {
          g.fillRect(x + 4, y + 4, 6, 6);
          g.fillRect(x + 20, y + 14, 4, 4);
        }
        if (h > 0.8) {
          g.fillRect(x + 10, y + 20, 8, 3);
        }
      }
    }

    // Lighter grass highlights
    g.fillStyle(0x224022, 0.4);
    for (let x = 8; x < MAP_W; x += TILE * 2) {
      for (let y = 8; y < MAP_H; y += TILE * 2) {
        const h = ((x * 13 + y * 29) % 100) / 100;
        if (h > 0.5) g.fillRect(x, y, 3, 3);
      }
    }

    // Map border
    g.lineStyle(4, 0x0a1a0a, 1);
    g.strokeRect(0, 0, MAP_W, MAP_H);
  }

  private drawPaths(): void {
    const g = this.add.graphics();
    g.setDepth(1);

    const pathColor = 0x3a3a4a;
    const pathEdge = 0x2a2a38;

    g.fillStyle(pathColor, 1);
    // Horizontal main street
    g.fillRect(0, 270, MAP_W, 48);
    // Vertical main street
    g.fillRect(370, 0, 60, MAP_H);

    // Branch paths to buildings
    g.fillRect(60, 160, 80, 110); // top-left
    g.fillRect(620, 160, 80, 110); // top-right
    g.fillRect(60, 318, 80, 82); // bottom-left
    g.fillRect(620, 318, 80, 82); // bottom-right

    g.lineStyle(2, pathEdge, 0.9);
    g.strokeRect(0, 270, MAP_W, 48);
    g.strokeRect(370, 0, 60, MAP_H);

    g.fillStyle(0x454555, 0.25);
    for (let x = 0; x < MAP_W; x += 16) {
      g.fillRect(x, 270, 1, 48);
    }
    for (let y = 0; y < MAP_H; y += 16) {
      g.fillRect(370, y, 60, 1);
    }
  }

  private drawTownSquare(): void {
    const cx = 392;
    const cy = 294;
    const g = this.add.graphics();
    g.setDepth(2);

    // Slightly larger town square area (was 120x100, now 140x110)
    g.fillStyle(0x1f3a1f, 1);
    g.fillRect(cx - 70, cy - 55, 140, 110);

    // Corner TREES replacing lime-green squares
    const treePositions: [number, number][] = [
      [cx - 64, cy - 48],
      [cx + 61, cy - 48],
      [cx - 64, cy + 45],
      [cx + 61, cy + 45],
    ];
    for (const [tx, ty] of treePositions) {
      const tg = this.add.graphics();
      tg.setDepth(4);
      // Shadow
      tg.fillStyle(0x000000, 0.2);
      tg.fillEllipse(tx, ty + 10, 16, 5);
      // Trunk
      tg.fillStyle(0x8b4513, 1);
      tg.fillRect(tx - 3, ty, 6, 9);
      // Dark back canopy (depth illusion)
      tg.fillStyle(0x145214, 1);
      tg.fillCircle(tx + 1, ty - 6, 11);
      // Main canopy
      tg.fillStyle(0x228b22, 1);
      tg.fillCircle(tx, ty - 7, 10);
      // Highlight
      tg.fillStyle(0x39c139, 0.6);
      tg.fillCircle(tx - 2, ty - 10, 5);
    }

    // Fountain
    g.fillStyle(0x2a4a6a, 1);
    g.fillCircle(cx, cy, 18);
    g.lineStyle(3, 0x4488aa, 1);
    g.strokeCircle(cx, cy, 18);
    g.fillStyle(0x3399cc, 0.8);
    g.fillCircle(cx, cy, 12);
    g.fillStyle(0x88ccee, 0.9);
    g.fillCircle(cx, cy, 5);
    g.fillStyle(0xffffff, 0.7);
    for (const [dx, dy] of [
      [-8, -6],
      [9, -4],
      [0, -12],
      [-5, 8],
      [8, 7],
    ] as [number, number][]) {
      g.fillCircle(cx + dx, cy + dy, 2);
    }

    // Sign post
    g.fillStyle(0x5a3a1a, 1);
    g.fillRect(cx + 25, cy - 40, 4, 20);
    g.fillStyle(0x2a2a0a, 1);
    g.fillRect(cx + 18, cy - 46, 36, 10);
    g.lineStyle(2, 0x39ff14, 0.8);
    g.strokeRect(cx + 18, cy - 46, 36, 10);
  }

  private drawBuildings(): void {
    for (const b of BUILDINGS) {
      this.drawBuilding(b);
    }
  }

  private drawBuilding(b: BuildingDef): void {
    const g = this.add.graphics();
    g.setDepth(3);
    const { x, y, w, h, accentColor } = b;

    // Shadow
    g.fillStyle(0x000000, 0.4);
    g.fillRect(x + 4, y + 4, w, h);

    // Foundation
    g.fillStyle(0x1a1a2a, 1);
    g.fillRect(x, y, w, h);

    // Walls
    g.fillStyle(0x2a2a3a, 1);
    g.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Roof area
    const roofH = Math.floor(h * 0.35);
    g.fillStyle(accentColor, 0.85);
    g.fillRect(x + 2, y + 2, w - 4, roofH);

    g.fillStyle(0xffffff, 0.12);
    g.fillRect(x + 4, y + 4, w - 8, 4);

    // Brick lines
    g.lineStyle(1, 0x3a3a4a, 0.5);
    for (let row = roofH + 4; row < h - 4; row += 8) {
      g.beginPath();
      g.moveTo(x + 4, y + row);
      g.lineTo(x + w - 4, y + row);
      g.strokePath();
    }

    // Door
    const doorW = 14;
    const doorH = 20;
    const doorX = x + Math.floor((w - doorW) / 2);
    const doorY = y + h - doorH - 2;
    g.fillStyle(0x3a1a0a, 1);
    g.fillRect(doorX, doorY, doorW, doorH);
    g.lineStyle(2, accentColor, 0.9);
    g.strokeRect(doorX, doorY, doorW, doorH);
    g.fillStyle(accentColor, 1);
    g.fillCircle(doorX + doorW - 3, doorY + doorH / 2, 2);

    // Windows
    const winY = y + roofH + 6;
    const winSize = 10;
    for (const [wx, wy] of [
      [x + 10, winY],
      [x + w - 10 - winSize, winY],
    ] as [number, number][]) {
      g.fillStyle(accentColor, 0.2);
      g.fillRect(wx, wy, winSize, winSize);
      g.lineStyle(2, accentColor, 0.8);
      g.strokeRect(wx, wy, winSize, winSize);
      g.lineStyle(1, accentColor, 0.4);
      g.beginPath();
      g.moveTo(wx + winSize / 2, wy);
      g.lineTo(wx + winSize / 2, wy + winSize);
      g.moveTo(wx, wy + winSize / 2);
      g.lineTo(wx + winSize, wy + winSize / 2);
      g.strokePath();
    }

    // Outline
    g.lineStyle(3, accentColor, 1);
    g.strokeRect(x, y, w, h);
    g.lineStyle(1, accentColor, 0.3);
    g.strokeRect(x - 2, y - 2, w + 4, h + 4);

    // Building label ABOVE building with a gap
    this.add
      .text(x + w / 2, y - 8, b.label, {
        fontSize: "17px",
        color: b.accentHex,
        fontFamily: '"Space Grotesk", monospace',
        align: "center",
        stroke: "#000000",
        strokeThickness: 3,
        lineSpacing: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(4);
  }

  // ─────────────────────────────────────────────
  // Bench + Sam the Sage
  // ─────────────────────────────────────────────
  private createBenchAndSam(): void {
    // Bench in bottom-left corner of the town square box, facing RIGHT
    const bx = BENCH_X;
    const by = BENCH_Y;

    const bg = this.add.graphics();
    bg.setDepth(3);
    // Seat plank (horizontal, side view)
    bg.fillStyle(0x5a3a1a, 1);
    bg.fillRect(bx - 14, by - 8, 40, 6);
    // Back-rest (left side, vertical plank)
    bg.fillStyle(0x4a2a10, 1);
    bg.fillRect(bx - 14, by - 22, 6, 16);
    // Legs (two visible in side view)
    bg.fillStyle(0x3a2a10, 1);
    bg.fillRect(bx - 10, by - 2, 4, 10); // left leg
    bg.fillRect(bx + 16, by - 2, 4, 10); // right leg
    // Armrest on back-rest top
    bg.fillStyle(0x6a4a22, 1);
    bg.fillRect(bx - 18, by - 22, 8, 4);
    // NO yellow outline — removed per user request

    // Sam NPC container — permanently seated at bench, facing RIGHT
    // Position Sam on the bench seat — at bench seat height (by-8), slightly offset right
    const container = this.add.container(bx + 12, by - 6);
    container.setDepth(5);

    const g = this.add.graphics();
    // Draw Sam facing RIGHT (sideways seated pose)
    this.drawMaleCharacterFacingRight(g, 0x4a7a5a, 0xaaaaaa);
    container.add(g);

    const npc = NPCS.find((n) => n.id === "sam_sage");
    if (npc) {
      const label = this.add.text(0, -20, npc.name, {
        fontSize: "16px",
        color: npc.color,
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 3,
      });
      label.setOrigin(0.5, 1);
      container.add(label);
    }

    this.samContainer = container;
    this.samX = bx + 12;
    this.samY = by - 6;
    this.npcObjects.push({
      container,
      npcId: "sam_sage",
      x: this.samX,
      y: this.samY,
    });
  }

  // ─────────────────────────────────────────────
  // Sam sit/walk/return-to-bench cycle
  // ─────────────────────────────────────────────
  private updateSamCycle(_delta: number): void {
    // Sam is permanently seated — lock position and state
    this.samState = "sitting";
    if (this.samContainer) {
      this.samContainer.x = this.samX;
      this.samContainer.y = this.samY;
    }
    this.syncSamPosition();
  }

  private pickSamWanderTarget(): void {
    const wR = 80;
    let tries = 0;
    let tx = BENCH_X;
    let ty = BENCH_Y;
    do {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * wR;
      tx = this.clamp(BENCH_X + Math.cos(angle) * dist, 30, MAP_W - 30);
      ty = this.clamp(BENCH_Y + Math.sin(angle) * dist, 30, MAP_H - 30);
      tries++;
    } while (this.collidedWithBuilding(tx, ty) && tries < 20);
    this.samTargetX = tx;
    this.samTargetY = ty;
  }

  private moveSamToward(
    tx: number,
    ty: number,
    speed: number,
    delta: number,
  ): void {
    if (!this.samContainer) return;
    const dx = tx - this.samX;
    const dy = ty - this.samY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;
    const step = speed * (delta / 1000);
    const nx = this.samX + (dx / dist) * step;
    const ny = this.samY + (dy / dist) * step;
    // Collision: buildings AND other NPCs
    if (
      !this.collidedWithBuilding(nx, ny) &&
      !this.collidesWithNPC(nx, ny, "sam_sage")
    ) {
      this.samX = nx;
      this.samY = ny;
    } else if (
      !this.collidedWithBuilding(nx, this.samY) &&
      !this.collidesWithNPC(nx, this.samY, "sam_sage")
    ) {
      this.samX = nx;
    } else if (
      !this.collidedWithBuilding(this.samX, ny) &&
      !this.collidesWithNPC(this.samX, ny, "sam_sage")
    ) {
      this.samY = ny;
    }
    this.samContainer.x = this.samX;
    this.samContainer.y = this.samY;
    this.syncSamPosition();
  }

  private syncSamPosition(): void {
    const obj = this.npcObjects.find((n) => n.npcId === "sam_sage");
    if (obj) {
      obj.x = this.samX;
      obj.y = this.samY;
    }
  }

  // ─────────────────────────────────────────────
  // NPCs (static building guardians)
  // ─────────────────────────────────────────────
  private createNPCs(): void {
    for (const def of NPC_POSITIONS) {
      const container = this.add.container(def.x, def.y);
      container.setDepth(5);

      const g = this.add.graphics();
      if (def.gender === "female") {
        this.drawFemaleCharacter(g, def.primaryColor, def.hairColor);
      } else {
        this.drawMaleCharacter(g, def.primaryColor, def.hairColor);
      }
      container.add(g);

      const npc = NPCS.find((n) => n.id === def.npcId);
      if (npc) {
        // Name label TIGHT to head — y:-20 (just above the head top at y:-16)
        const label = this.add.text(0, -20, npc.name, {
          fontSize: "16px",
          color: npc.color,
          fontFamily: '"Space Grotesk", monospace',
          stroke: "#000000",
          strokeThickness: 3,
        });
        label.setOrigin(0.5, 1);
        container.add(label);
      }

      this.npcObjects.push({
        container,
        npcId: def.npcId,
        x: def.x,
        y: def.y,
      });
    }
  }

  // ─────────────────────────────────────────────
  // Ed — wandering NPC in the grass
  // ─────────────────────────────────────────────
  private createEdWanderer(): void {
    const startX = 400;
    const startY = 480;
    const container = this.add.container(startX, startY);
    container.setDepth(5);

    const g = this.add.graphics();
    // Ed: messy auburn hair, brown casual jacket
    this.drawMaleCharacter(g, 0x6a4a2a, 0xaa4422);
    container.add(g);

    const npc = NPCS.find((n) => n.id === "ed_recruiter");
    if (npc) {
      const label = this.add.text(0, -20, npc.name, {
        fontSize: "16px",
        color: npc.color,
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 3,
      });
      label.setOrigin(0.5, 1);
      container.add(label);
    }

    this.edContainer = container;
    this.edAreaX = startX;
    this.edAreaY = startY;
    this.edTargetX = startX;
    this.edTargetY = startY;
    this.npcObjects.push({
      container,
      npcId: "ed_recruiter",
      x: startX,
      y: startY,
    });
  }

  private pickEdNewTarget(): void {
    // 30% chance to migrate to a new area of town
    if (Math.random() < 0.3) {
      const area =
        ED_AREA_CENTERS[Math.floor(Math.random() * ED_AREA_CENTERS.length)];
      this.edAreaX = area.x;
      this.edAreaY = area.y;
    }
    const radius = 120;
    let tries = 0;
    let tx = this.edAreaX;
    let ty = this.edAreaY;
    do {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * radius;
      tx = this.clamp(this.edAreaX + Math.cos(angle) * dist, 30, MAP_W - 30);
      ty = this.clamp(this.edAreaY + Math.sin(angle) * dist, 30, MAP_H - 30);
      tries++;
    } while (this.collidedWithBuilding(tx, ty) && tries < 20);
    this.edTargetX = tx;
    this.edTargetY = ty;
    this.edPausing = false;
    this.edWalking = true;
    this.edWalkTimer = 3000 + Math.random() * 1000; // walk 3-4 seconds
  }

  private updateEdWander(_time: number, delta: number): void {
    if (!this.edContainer) return;

    if (this.edPausing) {
      this.edPauseTimer -= delta;
      if (this.edPauseTimer <= 0) this.pickEdNewTarget();
      return;
    }

    // Check if Ed is too close to player — pause until player moves
    const pd = Math.hypot(
      this.edContainer.x - this.player.x,
      this.edContainer.y - this.player.y,
    );
    if (pd < 22) {
      // Don't advance timer while blocked
      return;
    }

    if (this.edWalking) {
      this.edWalkTimer -= delta;
      if (this.edWalkTimer <= 0) {
        // Time's up — pause 6-8 seconds
        this.edPausing = true;
        this.edWalking = false;
        this.edPauseTimer = 6000 + Math.random() * 2000;
        this.syncEdPosition();
        return;
      }
    }

    const dx = this.edTargetX - this.edContainer.x;
    const dy = this.edTargetY - this.edContainer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) {
      // Reached target — pause 6-8 seconds
      this.edPausing = true;
      this.edWalking = false;
      this.edPauseTimer = 6000 + Math.random() * 2000;
      this.syncEdPosition();
      return;
    }

    const speed = 40; // slow enough to catch
    let nx = this.edContainer.x + (dx / dist) * speed * (delta / 1000);
    let ny = this.edContainer.y + (dy / dist) * speed * (delta / 1000);

    const blocked =
      this.collidedWithBuilding(nx, ny) ||
      this.collidesWithNPC(nx, ny, "ed_recruiter");
    if (blocked) {
      // Try sliding along each axis
      const blockX =
        this.collidedWithBuilding(nx, this.edContainer.y) ||
        this.collidesWithNPC(nx, this.edContainer.y, "ed_recruiter");
      const blockY =
        this.collidedWithBuilding(this.edContainer.x, ny) ||
        this.collidesWithNPC(this.edContainer.x, ny, "ed_recruiter");
      if (!blockX) {
        ny = this.edContainer.y;
      } else if (!blockY) {
        nx = this.edContainer.x;
      } else {
        // Fully blocked — pause and pick new target
        this.edPausing = true;
        this.edWalking = false;
        this.edPauseTimer = 6000 + Math.random() * 2000;
        this.syncEdPosition();
        return;
      }
    }

    this.edContainer.x = nx;
    this.edContainer.y = ny;
    this.syncEdPosition();
  }

  private syncEdPosition(): void {
    if (!this.edContainer) return;
    const obj = this.npcObjects.find((n) => n.npcId === "ed_recruiter");
    if (obj) {
      obj.x = this.edContainer.x;
      obj.y = this.edContainer.y;
    }
  }

  // ─────────────────────────────────────────────
  // Character Drawing — Gender-Distinct Pixel Art
  // ─────────────────────────────────────────────

  /** Female character: longer hair, dress/skirt, narrower shoulders */
  private drawFemaleCharacter(
    g: Phaser.GameObjects.Graphics,
    bodyColor: number,
    hairColor: number,
  ): void {
    // Ground shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 14, 16, 5);

    // Hair (back layer — flowing below shoulders)
    g.fillStyle(hairColor, 1);
    g.fillRect(-6, -20, 12, 6); // top hair
    g.fillRect(-7, -16, 3, 14); // left side flowing hair
    g.fillRect(4, -16, 3, 14); // right side flowing hair
    g.fillRect(-6, -2, 3, 4); // hair tips left
    g.fillRect(3, -2, 3, 4); // hair tips right

    // Head
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -18, 10, 10);

    // Eyes
    g.fillStyle(0x333333, 1);
    g.fillRect(-3, -14, 2, 2);
    g.fillRect(1, -14, 2, 2);
    // Eyelash accents
    g.fillStyle(0x000000, 1);
    g.fillRect(-4, -15, 1, 1);
    g.fillRect(3, -15, 1, 1);

    // Hair on top
    g.fillStyle(hairColor, 1);
    g.fillRect(-5, -20, 10, 4);
    g.fillRect(-7, -18, 2, 4);
    g.fillRect(5, -18, 2, 4);

    // Dress body (wider at bottom)
    g.fillStyle(bodyColor, 1);
    g.fillRect(-5, -8, 10, 10); // torso
    // Skirt (trapezoid)
    g.fillRect(-7, 2, 14, 8); // skirt flare
    g.fillRect(-6, 8, 12, 4); // skirt hem

    // Arms (slimmer)
    g.fillStyle(bodyColor, 1);
    g.fillRect(-8, -7, 3, 7);
    g.fillRect(5, -7, 3, 7);

    // Hands
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-8, 0, 3, 3);
    g.fillRect(5, 0, 3, 3);

    // Legs (visible below skirt)
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-4, 12, 3, 5);
    g.fillRect(1, 12, 3, 5);

    // Shoes
    g.fillStyle(0x3a2a5a, 1);
    g.fillRect(-5, 17, 5, 3);
    g.fillRect(0, 17, 5, 3);
  }

  /** Male character facing RIGHT — side/profile view for seated pose */
  private drawMaleCharacterFacingRight(
    g: Phaser.GameObjects.Graphics,
    bodyColor: number,
    hairColor: number,
  ): void {
    // Shadow under bench area
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(2, 8, 14, 4);

    // Head (right-facing profile — slightly to the right)
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(0, -14, 9, 9);

    // Short hair
    g.fillStyle(hairColor, 1);
    g.fillRect(0, -15, 9, 4); // top
    g.fillRect(7, -13, 3, 5); // back of head

    // Eye (single visible in profile)
    g.fillStyle(0x000000, 1);
    g.fillRect(5, -11, 2, 2);

    // Nose hint
    g.fillStyle(0xd4a882, 1);
    g.fillRect(1, -10, 2, 1);

    // Body/torso (side view — compressed width)
    g.fillStyle(bodyColor, 1);
    g.fillRect(-2, -5, 8, 8);

    // Arm resting forward (sitting)
    g.fillStyle(bodyColor, 1);
    g.fillRect(3, -2, 6, 4);

    // Hands
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(8, -1, 3, 3);

    // Legs (bent — knees up, sitting on bench)
    g.fillStyle(0x1a2a4a, 1);
    g.fillRect(-2, 3, 7, 5); // thigh
    g.fillRect(3, 5, 5, 4); // lower leg (bent forward)

    // Shoes
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(4, 8, 6, 3);
  }

  /** Male character: short hair, pants, wider shoulders */
  private drawMaleCharacter(
    g: Phaser.GameObjects.Graphics,
    bodyColor: number,
    hairColor: number,
  ): void {
    // Ground shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 14, 18, 5);

    // Head
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -16, 10, 10);

    // Short hair
    g.fillStyle(hairColor, 1);
    g.fillRect(-5, -17, 10, 5); // top
    g.fillRect(-6, -15, 2, 4); // sideburn left
    g.fillRect(4, -15, 2, 4); // sideburn right

    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillRect(-3, -13, 2, 2);
    g.fillRect(1, -13, 2, 2);

    // Body (shirt/jacket) — wider shoulders
    g.fillStyle(bodyColor, 1);
    g.fillRect(-6, -6, 12, 10);

    // Collar/neckline detail
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(-2, -6, 4, 3);

    // Arms — slightly wider
    g.fillStyle(bodyColor, 1);
    g.fillRect(-9, -5, 3, 8);
    g.fillRect(6, -5, 3, 8);

    // Hands
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-9, 3, 3, 3);
    g.fillRect(6, 3, 3, 3);

    // Pants
    g.fillStyle(0x1a2a4a, 1);
    g.fillRect(-5, 4, 4, 7);
    g.fillRect(1, 4, 4, 7);

    // Shoes
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(-6, 11, 5, 3);
    g.fillRect(1, 11, 5, 3);
  }

  // ─────────────────────────────────────────────
  // Player
  // ─────────────────────────────────────────────
  private createPlayer(spawnX?: number, spawnY?: number): void {
    const sx = spawnX ?? 392;
    const sy = spawnY ?? 294;
    this.player = this.add.container(sx, sy);
    this.player.setDepth(6);

    this.playerBody = this.add.graphics();
    this.drawPlayerCharacter(this.playerBody);
    this.player.add(this.playerBody);

    const glow = this.add.graphics();
    glow.fillStyle(0x39ff14, 0.12);
    glow.fillCircle(0, 0, 18);
    this.player.add(glow);
    this.player.sendToBack(glow);
  }

  private drawPlayerCharacter(
    g: Phaser.GameObjects.Graphics,
    facing: "up" | "down" | "left" | "right" = "down",
  ): void {
    g.clear();
    const flip = facing === "left";
    const sx = flip ? -1 : 1;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 12, 18, 6);

    // Body — green outfit
    g.fillStyle(0x226622, 1);
    g.fillRect(-6 * sx, -6, 12, 10);

    // Head
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -16, 10, 10);

    // Hair (darker cap)
    g.fillStyle(0x5a3a10, 1);
    g.fillRect(-5, -17, 10, 4);
    g.fillRect(-6, -15, 2, 3);
    g.fillRect(4, -15, 2, 3);

    // Eyes
    g.fillStyle(0x000000, 1);
    if (facing !== "up") {
      const eyeOff = facing === "right" ? 2 : facing === "left" ? -2 : 0;
      g.fillRect(-3 + eyeOff, -13, 2, 2);
      g.fillRect(1 + eyeOff, -13, 2, 2);
    }

    // Legs
    g.fillStyle(0x1a1a5a, 1);
    g.fillRect(-5, 4, 4, 6);
    g.fillRect(1, 4, 4, 6);

    // Shoes
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(-6, 10, 5, 3);
    g.fillRect(1, 10, 5, 3);

    // Sword
    g.fillStyle(0xaaaaaa, 1);
    const toolX = facing === "left" ? -12 : 8;
    g.fillRect(toolX, -2, 2, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(toolX - 1, -2, 4, 3);
  }

  // ─────────────────────────────────────────────
  // Input
  // ─────────────────────────────────────────────
  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard.on("keydown-E", this.handleInteract, this);
    this.input.keyboard.on("keydown-ENTER", this.handleInteract, this);
    this.input.keyboard.on("keydown-SPACE", this.handleInteract, this);
  }

  private setupJoystick(): void {
    this.isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    this.joystickOuter = this.add.graphics();
    this.joystickGraphics = this.add.graphics();
    this.joystickOuter.setScrollFactor(0).setDepth(8000).setAlpha(0);
    this.joystickGraphics.setScrollFactor(0).setDepth(8001).setAlpha(0);

    if (!this.isTouchDevice) return;

    const interact = this.add
      .text(this.scale.width - 76, this.scale.height - 82, "INTERACT", {
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#173117",
        padding: { x: 14, y: 12 },
        fontFamily: '"Space Grotesk", monospace',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(8100)
      .setInteractive();
    interact.on("pointerdown", () => this.handleInteract());
    const positionInteract = () =>
      interact.setPosition(this.scale.width - 76, this.scale.height - 82);
    this.scale.on("resize", positionInteract);
    this.events.once("shutdown", () =>
      this.scale.off("resize", positionInteract),
    );

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.x > this.scale.width / 2) return;
      this.joystickActive = true;
      this.joystickOrigin = { x: p.x, y: p.y };
      this.joystickVec = { x: 0, y: 0 };
      this.joystickOuter.setAlpha(0.7);
      this.joystickGraphics.setAlpha(1);
    });

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.joystickActive) return;
      const dx = p.x - this.joystickOrigin.x;
      const dy = p.y - this.joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 60;
      if (dist > 0) {
        const magnitude = Math.min(
          1,
          (dist / maxDist) * this.getJoystickSensitivity(),
        );
        this.joystickVec = {
          x: (dx / dist) * magnitude,
          y: (dy / dist) * magnitude,
        };
      }
    });

    this.input.on("pointerup", (_p: Phaser.Input.Pointer) => {
      this.joystickActive = false;
      this.joystickVec = { x: 0, y: 0 };
      this.joystickOuter.setAlpha(0);
      this.joystickGraphics.setAlpha(0);
    });
  }

  private updateJoystickVisual(): void {
    if (!this.isTouchDevice || !this.joystickActive) return;

    const ox = this.joystickOrigin.x;
    const oy = this.joystickOrigin.y;
    const radius = 60;
    const innerR = 18;
    const thumbX = ox + this.joystickVec.x * radius;
    const thumbY = oy + this.joystickVec.y * radius;

    this.joystickOuter.clear();
    this.joystickOuter.lineStyle(3, 0xffffff, 0.4);
    this.joystickOuter.strokeCircle(ox, oy, radius);
    this.joystickOuter.fillStyle(0x000000, 0.35);
    this.joystickOuter.fillCircle(ox, oy, radius);

    this.joystickGraphics.clear();
    this.joystickGraphics.fillStyle(0xffffff, 0.85);
    this.joystickGraphics.fillCircle(thumbX, thumbY, innerR);
    this.joystickGraphics.lineStyle(2, 0x39ff14, 0.9);
    this.joystickGraphics.strokeCircle(thumbX, thumbY, innerR);
  }

  // ─────────────────────────────────────────────
  // Movement
  // ─────────────────────────────────────────────
  private handleMovement(delta: number): void {
    // ── TYPING GUARD: freeze movement while user is in a form field ──────────
    if (isTypingInField()) return;

    const speed = this.getPlayerSpeed() * (delta / 1000);
    let dx = 0;
    let dy = 0;

    if (this.joystickActive && this.isTouchDevice) {
      dx = this.joystickVec.x * speed;
      dy = this.joystickVec.y * speed;
    } else {
      if (this.cursors?.left?.isDown || this.wasd?.left?.isDown) dx -= speed;
      if (this.cursors?.right?.isDown || this.wasd?.right?.isDown) dx += speed;
      if (this.cursors?.up?.isDown || this.wasd?.up?.isDown) dy -= speed;
      if (this.cursors?.down?.isDown || this.wasd?.down?.isDown) dy += speed;
    }

    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      this.playerFacing = dx > 0 ? "right" : "left";
    } else if (dy !== 0) {
      this.playerFacing = dy > 0 ? "down" : "up";
    }

    const newX = this.clamp(this.player.x + dx, 16, MAP_W - 16);
    const newY = this.clamp(this.player.y + dy, 16, MAP_H - 16);

    // Building collision (with door gap) only — NPCs are solid but don't stop player at doors
    const blockedByBuilding = this.checkBuildingCollision(newX, newY);
    if (!blockedByBuilding) {
      this.player.x = newX;
      this.player.y = newY;
    } else {
      // Slide along each axis independently
      if (!this.checkBuildingCollision(newX, this.player.y)) {
        this.player.x = newX;
      } else if (!this.checkBuildingCollision(this.player.x, newY)) {
        this.player.y = newY;
      }
    }

    if (dx !== 0 || dy !== 0) {
      this.drawPlayerCharacter(this.playerBody, this.playerFacing);
      GameBridge.emit("playerMoved", { x: this.player.x, y: this.player.y });
    }
  }

  private checkBuildingCollision(x: number, y: number): boolean {
    return this.collidedWithBuilding(x, y);
  }

  // ─────────────────────────────────────────────
  // Proximity Detection
  // ─────────────────────────────────────────────
  private checkProximity(): void {
    const px = this.player.x;
    const py = this.player.y;
    const BUILDING_RADIUS = 68;
    const NPC_RADIUS = 56;

    let nearBuilding: BuildingDef | null = null;
    for (const b of BUILDINGS) {
      const bcx = b.x + b.w / 2;
      const bcy = b.y + b.h / 2;
      const d = Math.hypot(px - bcx, py - bcy);
      if (d < BUILDING_RADIUS) {
        nearBuilding = b;
        break;
      }
    }

    let nearNPC: { npcId: string; x: number; y: number } | null = null;
    for (const n of this.npcObjects) {
      const d = Math.hypot(px - n.x, py - n.y);
      if (d < NPC_RADIUS) {
        nearNPC = { npcId: n.npcId, x: n.x, y: n.y };
        break;
      }
    }

    const newBuilding = nearBuilding?.id ?? null;
    const newNPC = nearNPC?.npcId ?? null;

    const changed =
      newBuilding !== this.lastNearBuilding || newNPC !== this.lastNearNPC;

    if (changed) {
      this.lastNearBuilding = newBuilding;
      this.lastNearNPC = newNPC;
      // Destroy old bottom prompt
      if (this.promptBg) {
        this.promptBg.destroy();
        this.promptBg = null;
      }
      if (this.promptText) {
        this.promptText.destroy();
        this.promptText = null;
      }
    }

    // Speech bubble above NPC head — appears automatically on proximity enter
    if (!nearNPC && this.lastTipNpcId !== null) {
      this.lastTipNpcId = null;
      if (this.tipBubble) {
        this.tipBubble.destroy();
        this.tipBubble = null;
      }
    }

    if (nearNPC) {
      if (this.lastTipNpcId !== nearNPC.npcId) {
        this.tipBubble?.destroy();
        this.lastTipNpcId = nearNPC.npcId;
        this.showNPCTipBubble(nearNPC.npcId, nearNPC.x, nearNPC.y);
      }
      this.updateNPCInteractPrompt(nearNPC.npcId);
    }
  }

  private showNPCTipBubble(npcId: string, wx: number, wy: number): void {
    const npcData = NPCS.find((n) => n.id === npcId);
    if (
      !npcData ||
      !Array.isArray(npcData.proximityTips) ||
      npcData.proximityTips.length === 0
    )
      return;

    const tipIdx =
      (this.npcTipIndices[npcId] ?? 0) % npcData.proximityTips.length;
    this.npcTipIndices[npcId] = tipIdx + 1;
    const tipText = npcData.proximityTips[tipIdx] ?? "";
    if (!tipText) return;

    // Position bubble well above the NPC head (90px up) so it never overlaps the door
    const bubbleOffsetY = 90;
    const container = this.add.container(wx, wy - bubbleOffsetY);
    container.setDepth(7200);

    const padX = 16;
    const padY = 10;

    // Create text first so we can measure it, then size the background to fit
    const txt = this.add.text(0, 0, tipText, {
      fontSize: "13px",
      color: "#ffffff",
      fontFamily: '"Space Grotesk", monospace',
      stroke: "#000000",
      strokeThickness: 2,
      wordWrap: { width: 200 },
      align: "center",
    });
    // Center origin so text sits in the middle of the bg box
    txt.setOrigin(0.5, 0.5);
    txt.x = 0;
    txt.y = 0;

    // Size bg AFTER measuring text
    const bw = txt.width + padX * 2;
    const bh = txt.height + padY * 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.88);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
    const npcColorInt = Number.parseInt(
      (npcData.color ?? "#C0C0C0").replace("#", ""),
      16,
    );
    const safeColor = Number.isNaN(npcColorInt) ? 0xc0c0c0 : npcColorInt;
    bg.lineStyle(1, safeColor, 0.7);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
    // Tail pointing DOWN from center-bottom of bg rect toward NPC head
    bg.fillStyle(0x000000, 0.88);
    bg.fillTriangle(-5, bh / 2, 5, bh / 2, 0, bh / 2 + 8);

    container.add([bg, txt]);
    this.tipBubble = container;
  }

  private updateNPCInteractPrompt(npcId: string): void {
    if (this.promptBg || this.promptText) return;
    const npc = NPCS.find((entry) => entry.id === npcId);
    if (!npc) return;

    this.promptBg = this.add.graphics();
    this.promptBg.setScrollFactor(0).setDepth(7400);
    this.promptBg.fillStyle(0x040414, 0.94);
    const promptWidth = Math.min(380, this.scale.width - 24);
    const promptX = (this.scale.width - promptWidth) / 2;
    this.promptBg.fillRoundedRect(
      promptX,
      this.scale.height - 58,
      promptWidth,
      38,
      5,
    );
    this.promptBg.lineStyle(2, 0xc0c0c0, 0.85);
    this.promptBg.strokeRoundedRect(
      promptX,
      this.scale.height - 58,
      promptWidth,
      38,
      5,
    );

    this.promptText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 39,
        this.isTouchDevice
          ? `Tap INTERACT to talk to ${npc.name}`
          : `Press E or Enter to talk to ${npc.name}`,
        {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: '"Space Grotesk", monospace',
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(7401);
  }

  // Keep tip bubble positioned above the NPC as they move (Ed, Sam)
  private updateTipBubblePosition(): void {
    if (!this.tipBubble || !this.lastTipNpcId) return;
    const npcObj = this.npcObjects.find((n) => n.npcId === this.lastTipNpcId);
    if (npcObj) {
      this.tipBubble.x = npcObj.x;
      // Keep bubble 90px above NPC center — matching showNPCTipBubble offset
      this.tipBubble.y = npcObj.y - 90;
    }
  }

  // ─────────────────────────────────────────────
  // Building Door Entry (walk-through, Pokemon/Zelda style)
  /** Draw subtle visual cues on door zone positions — purely decorative */
  private drawDoorZoneIndicators(): void {
    const g = this.add.graphics();
    g.setDepth(3.5);
    for (const b of BUILDINGS) {
      const doorW = 14;
      const doorCX = b.x + Math.floor((b.w - doorW) / 2) + doorW / 2;
      const doorBottomY = b.y + b.h;
      // Subtle darker strip just below the door (28px wide, 6px tall)
      g.fillStyle(0x000000, 0.3);
      g.fillRect(doorCX - 14, doorBottomY - 1, 28, 7);
      g.lineStyle(1, b.accentColor, 0.4);
      g.strokeRect(doorCX - 14, doorBottomY - 1, 28, 7);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Architecture contract:
  //   • This method reads ONLY building geometry (x, y, w, h) and id.
  //   • It NEVER reads NPC data, dialogue arrays, or any game state.
  //   • It fires a pure scene transition: scene.scene.start(sceneKey, coords).
  // ─────────────────────────────────────────────────────────────
  private checkBuildingDoorEntry(): void {
    // Only fire when already transitioning is blocked
    if (this.hasEnteredBuilding) return;
    if (this.transitionLock) return;
    if (this.interactionLocked || isTypingInField()) return;

    // ── DIRECTIONAL GATE: only enter on upward movement ──────────────────────
    // Player must be actively facing up to walk into a door, just like Pokemon/Zelda.
    if (this.playerFacing !== "up") return;

    const px = this.player.x;
    const py = this.player.y;
    // Door trigger zone is centered on the door and extends just below it
    const DOOR_HW = 10; // half-width of trigger zone
    const DOOR_HH = 14; // half-height of trigger zone

    for (const b of BUILDINGS) {
      const doorW = 14;
      const doorH = 20;
      const doorX = b.x + Math.floor((b.w - doorW) / 2);
      const doorY = b.y + b.h - doorH - 2;

      // Door trigger: player center must overlap the door rectangle
      const inDoor =
        px + DOOR_HW > doorX &&
        px - DOOR_HW < doorX + doorW &&
        py + DOOR_HH > doorY &&
        py - DOOR_HH < doorY + doorH + 4;

      if (!inDoor) continue;

      const sceneKeyMap: Record<string, string> = {
        resume_tailor: "ResumeTailorScene",
        cover_letter_corner: "CoverLetterScene",
        interview_coach: "InterviewCoachScene",
        item_shop: "ItemShopScene",
      };
      const sceneKey = sceneKeyMap[b.id];
      if (!sceneKey) continue;

      // Lock immediately — 600ms grace window so this cannot re-fire
      this.hasEnteredBuilding = true;
      this.transitionLock = true;
      this.time.delayedCall(600, () => {
        this.transitionLock = false;
      });

      // Exact door-center exterior return position — player spawns just below door on exit
      const doorCX = b.x + Math.floor((b.w - doorW) / 2) + doorW / 2;
      const returnX = doorCX;
      const returnY = b.y + b.h + 32;

      GameBridge.emit("sceneChanged", { scene: "interior" });

      // Stop music immediately so the interior scene starts its track fresh.
      // If we leave town music running or mid-fade, the interior's fadeToTrack
      // may hit the "already playing" guard and stay silent.

      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(sceneKey, { returnX, returnY });
      });
      return;
    }
  }

  // ─────────────────────────────────────────────
  // Interaction
  // ─────────────────────────────────────────────
  private handleInteract(): void {
    if (isTypingInField() || this.interactionLocked || !this.lastNearNPC)
      return;
    const npc = NPCS.find((entry) => entry.id === this.lastNearNPC);
    if (!npc || !Array.isArray(npc.dialogue) || npc.dialogue.length === 0)
      return;

    let selected: NPC = npc;
    if (npc.id === "ed_recruiter") {
      const index = this.edDialogueIndex % npc.dialogue.length;
      this.edDialogueIndex++;
      selected = { ...npc, dialogue: [npc.dialogue[index]!] };
    } else if (npc.id === "sam_sage") {
      const index = this.samDialogueIndex % npc.dialogue.length;
      this.samDialogueIndex++;
      selected = { ...npc, dialogue: [npc.dialogue[index]!] };
    }

    GameBridge.emit("npcInteracted", { npcId: npc.id });
    GameBridge.emit("dialogueOpened", selected);
  }
}
