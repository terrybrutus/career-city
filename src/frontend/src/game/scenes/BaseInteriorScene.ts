import { NPCS } from "@/data/npcs";
import { GameBridge } from "@/game/GameBridge";
import { hasBackpack } from "@/game/playerState";
import { BaseScene } from "@/game/scenes/BaseScene";
import { isTypingInField } from "@/game/utils/inputFocusGuard";
import type { GameLocationId } from "@/types/game";
import Phaser from "phaser";

// ─────────────────────────────────────────────────────────────
// BaseInteriorScene
// Abstract base for all four building interiors.
// Architecture contract (enforced here, NEVER broken by subclasses):
//   • Door exit zone fires ONLY a scene transition — it NEVER
//     reads any NPC data or dialogue array.
//   • NPC data is loaded in create() ONLY, never during any
//     Phaser scene-transition callback.
//   • No console.log / console.warn anywhere.
// ─────────────────────────────────────────────────────────────

export const ROOM_W = 800;
export const ROOM_H = 600;

// Door visual dimensions at bottom-center of the room
const DOOR_W = 32;
const DOOR_H = 48;
const DOOR_X = ROOM_W / 2 - DOOR_W / 2;
const DOOR_Y = ROOM_H - DOOR_H - 8;

// Exit zone is slightly taller so the player triggers it reliably
const EXIT_ZONE_W = 48;
const EXIT_ZONE_H = 56;
const EXIT_ZONE_X = ROOM_W / 2 - EXIT_ZONE_W / 2;
const EXIT_ZONE_Y = ROOM_H - EXIT_ZONE_H - 4;

// Player spawn position inside the room — well ABOVE the exit zone.
// EXIT_ZONE_Y = ROOM_H - EXIT_ZONE_H - 4 = 540.
// Spawn must be comfortably above 540 so the entry tween never touches the zone.
export const INTERIOR_SPAWN_X = ROOM_W / 2;
export const INTERIOR_SPAWN_Y = ROOM_H - 160;

type SceneData = {
  returnX: number;
  returnY: number;
};

type NpcEntry = {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  npcId: string;
  x: number;
  y: number;
};

export abstract class BaseInteriorScene extends BaseScene {
  // ── subclass must implement these ──────────────────
  protected abstract getLocationId(): GameLocationId;
  /** Career tool identifier for the careerToolOpen event */
  protected abstract getToolId(): string;
  /** Draw the floor, walls, furniture, and call setupInteriorNPC() */
  protected abstract buildRoom(): void;

  // ── private state ──────────────────────────────────
  private returnX = ROOM_W / 2;
  private returnY = ROOM_H - 80;
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.GameObjects.Graphics;
  private playerFacing: "up" | "down" | "left" | "right" = "up";
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private joystickActive = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickVec = { x: 0, y: 0 };
  private joystickGraphics!: Phaser.GameObjects.Graphics;
  private joystickOuter!: Phaser.GameObjects.Graphics;
  private isTouchDevice = false;
  private exitOverlapping = false;
  private hasExited = false;
  // Transition lock — 600ms window after any transition fires; cannot re-fire during this time
  private transitionLock = false;
  // Pauses all player movement when a career tool overlay is open
  private careerToolOpen = false;
  // Grace period — exit zone is disabled for the first 600ms so the entry
  // tween (which starts the player near the door) can never accidentally fire exit.
  private exitGraceMs = 600;
  private exitGraceActive = true;
  // Furniture / wall collision rects (set by buildRoom helpers)
  private wallRects: { x: number; y: number; w: number; h: number }[] = [];
  // NPC state for proximity tips & dialogue
  private npcEntry: NpcEntry | null = null;
  private tipBubble: Phaser.GameObjects.Container | null = null;
  private tipVisible = false;
  private npcTipIdx = 0;
  // Tracks if Space/Enter confirm prompt is visible
  private confirmPromptVisible = false;
  private confirmPromptContainer: Phaser.GameObjects.Container | null = null;
  // Tracks if player was in interact range; resets when they step away
  private npcWasInInteractRange = false;

  // ── lifecycle ──────────────────────────────────────

  create(data?: SceneData): void {
    // Reset per-scene state — Phaser reuses the instance on scene.start()
    this.hasExited = false;
    this.transitionLock = false;
    this.exitOverlapping = false;
    this.exitGraceActive = true;
    this.exitGraceMs = 600;
    this.wallRects = [];
    this.npcEntry = null;
    this.tipBubble = null;
    this.tipVisible = false;
    this.npcTipIdx = 0;
    this.npcWasInInteractRange = false;
    this.confirmPromptVisible = false;
    this.confirmPromptContainer = null;
    this.careerToolOpen = false;

    // Listen for career tool open/close to freeze/unfreeze movement
    const onToolOpen = () => {
      this.careerToolOpen = true;
    };
    const onToolClose = () => {
      this.careerToolOpen = false;
    };
    GameBridge.on("careerToolOpen", onToolOpen);
    GameBridge.on("careerToolClose", onToolClose);
    GameBridge.on("dialogueOpened", onToolOpen);
    GameBridge.on("dialogueClosed", onToolClose);
    // Remove listeners when this scene shuts down
    this.events.once("shutdown", () => {
      GameBridge.off("careerToolOpen", onToolOpen);
      GameBridge.off("careerToolClose", onToolClose);
      GameBridge.off("dialogueOpened", onToolOpen);
      GameBridge.off("dialogueClosed", onToolClose);
    });

    if (data) {
      this.returnX = data.returnX;
      this.returnY = data.returnY;
    }

    this.setupCamera(ROOM_W, ROOM_H);

    // Draw room (subclass adds floor, walls, furniture, NPC)
    this.buildRoom();

    // Draw door visual at bottom-center (always on top of floor)
    this.drawDoorVisual();

    // Create player (spawns just inside door, walks up a few px)
    this.createPlayer();

    // Input
    this.setupInput();
    this.setupJoystick();

    // Exit zone — completely isolated from all NPC data
    this.setupExitZone();

    // CRT overlay

    // Camera follows player; slight zoom for interior feel
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Fade in from black (screen transition effect)
    this.cameras.main.fadeIn(320, 0, 0, 0);

    // Start location music — safe async call, no awaiting in create

    // Belt-and-suspenders: if Phaser ever uses scene.wake() instead of scene.start(),
    // the wake event fires but create() does not — so we wire up music here too.
    this.events.once("wake", (_sys: unknown, wakeData?: SceneData) => {
      if (wakeData) {
        this.returnX = wakeData.returnX;
        this.returnY = wakeData.returnY;
      }
      // Stop whatever is playing and start the building track fresh
      GameBridge.emit("interiorEntered", { locationId: this.getLocationId() });
      GameBridge.emit("locationChanged", this.getLocationId());
    });

    // Emit interior entered event with only the locationId
    GameBridge.emit("interiorEntered", { locationId: this.getLocationId() });
    GameBridge.emit("locationChanged", this.getLocationId());
  }

  update(_time: number, delta: number): void {
    // Tick down grace period before enabling exit checks
    if (this.exitGraceActive) {
      this.exitGraceMs -= delta;
      if (this.exitGraceMs <= 0) {
        this.exitGraceActive = false;
      }
    }
    // Freeze all player movement when career tool overlay is open
    if (!this.careerToolOpen) {
      this.handleMovement(delta);
      this.checkExitOverlap();
    }
    this.checkNpcProximity();
    this.updateJoystickVisual();
  }

  // ── protected helpers subclasses use in buildRoom() ──

  /**
   * Register a rectangular obstacle (wall or furniture) that blocks movement.
   * Call from buildRoom() after drawing the object.
   */
  protected addWallRect(x: number, y: number, w: number, h: number): void {
    this.wallRects.push({ x, y, w, h });
  }

  /**
   * Draw the NPC inside the room and wire up proximity tips + E/Enter dialogue.
   * Must be called from buildRoom() during create() — NEVER from a callback.
   *
   * @param x        world x position
   * @param y        world y position
   * @param npcId    id matching an entry in NPCS array
   * @param gender   "male" | "female"
   * @param primaryColor  hex int e.g. 0x00aaaa
   * @param hairColor     hex int e.g. 0x8844bb
   */
  protected setupInteriorNPC(
    x: number,
    y: number,
    npcId: string,
    gender: "male" | "female",
    primaryColor: number,
    hairColor: number,
  ): void {
    // Load NPC data in create() phase — fail silently if not found
    const npcData = NPCS.find((n) => n.id === npcId);
    if (!npcData) return;
    if (!Array.isArray(npcData.dialogue) || npcData.dialogue.length === 0)
      return;

    const container = this.add.container(x, y);
    container.setDepth(6);

    const g = this.add.graphics();
    if (gender === "female") {
      this.drawFemaleCharacter(g, primaryColor, hairColor);
    } else {
      this.drawMaleCharacter(g, primaryColor, hairColor);
    }
    container.add(g);

    // Name label tight above head
    const label = this.add.text(0, -20, npcData.name, {
      fontSize: "16px",
      color: npcData.color,
      fontFamily: '"Space Grotesk", monospace',
      stroke: "#000000",
      strokeThickness: 3,
    });
    label.setOrigin(0.5, 1);
    container.add(label);

    this.npcEntry = { container, graphics: g, npcId, x, y };

    // Wire up E and Enter keys for NPC dialogue
    // These only fire dialogue — they have ZERO connection to exit logic
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-E", this.handleNpcInteract, this);
      this.input.keyboard.on("keydown-ENTER", this.handleNpcInteract, this);
      this.input.keyboard.on("keydown-SPACE", this.handleNpcInteract, this);
    }
  }

  // ── private implementation ─────────────────────────

  /**
   * Creates the exit zone at the bottom of the room.
   * This method reads ONLY the stored returnX/returnY coordinates.
   * It NEVER touches dialogue arrays, NPC data, or any game state.
   */
  private setupExitZone(): void {
    // Use a simple rectangular overlap check in checkExitOverlap() rather than
    // Phaser Zone physics so it's 100% decoupled from any other system.
    // Nothing here reads dialogue or NPC data.
  }

  private drawDoorVisual(): void {
    const g = this.add.graphics();
    g.setDepth(2);
    // Dark door frame
    g.fillStyle(0x1a0a00, 1);
    g.fillRect(DOOR_X - 4, DOOR_Y - 4, DOOR_W + 8, DOOR_H + 4);
    // Door fill
    g.fillStyle(0x3a1a0a, 1);
    g.fillRect(DOOR_X, DOOR_Y, DOOR_W, DOOR_H);
    // Door outline — accent color from location
    const accentColors: Record<GameLocationId, number> = {
      home: 0x39ff14,
      town_square: 0x39ff14,
      resume_tailor: 0xff00ff,
      cover_letter_corner: 0x00ffff,
      interview_coach: 0xffaa00,
      item_shop: 0x8844ff,
    };
    const accent = accentColors[this.getLocationId()] ?? 0x39ff14;
    g.lineStyle(2, accent, 0.9);
    g.strokeRect(DOOR_X, DOOR_Y, DOOR_W, DOOR_H);
    // Door handle
    g.fillStyle(accent, 1);
    g.fillCircle(DOOR_X + DOOR_W - 5, DOOR_Y + DOOR_H / 2, 2);
    // "EXIT" sign above door
    this.add
      .text(ROOM_W / 2, DOOR_Y - 12, "EXIT", {
        fontSize: "11px",
        color: "#ff4444",
        fontFamily: '"Space Grotesk", monospace',
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(3);
  }

  private createPlayer(): void {
    // Spawn from the door position — start slightly below the spawn point
    // so the entry tween walks the player upward (into the room).
    // INTERIOR_SPAWN_Y is already well above the exit zone, so no accidental trigger.
    this.player = this.add.container(INTERIOR_SPAWN_X, INTERIOR_SPAWN_Y + 30);
    this.player.setDepth(7);

    this.playerBody = this.add.graphics();
    this.drawPlayerCharacter(this.playerBody, "up");
    this.player.add(this.playerBody);

    const glow = this.add.graphics();
    glow.fillStyle(0x39ff14, 0.1);
    glow.fillCircle(0, 0, 16);
    this.player.add(glow);
    this.player.sendToBack(glow);

    // Entry walk-in tween — moves player upward from door position.
    // Grace period (600ms) ensures this tween cannot trigger exit overlap.
    this.tweens.add({
      targets: this.player,
      y: INTERIOR_SPAWN_Y,
      duration: 280,
      ease: "Linear",
    });
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
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
    interact.on("pointerdown", () => this.handleNpcInteract());
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

    this.input.on("pointerup", () => {
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

    let newX = this.clamp(this.player.x + dx, 16, ROOM_W - 16);
    let newY = this.clamp(this.player.y + dy, 16, ROOM_H - 16);

    // Wall / furniture collision
    if (this.collidesWithWall(newX, newY)) {
      if (!this.collidesWithWall(newX, this.player.y)) {
        newY = this.player.y;
      } else if (!this.collidesWithWall(this.player.x, newY)) {
        newX = this.player.x;
      } else {
        newX = this.player.x;
        newY = this.player.y;
      }
    }

    this.player.x = newX;
    this.player.y = newY;

    if (dx !== 0 || dy !== 0) {
      this.drawPlayerCharacter(this.playerBody, this.playerFacing);
      GameBridge.emit("playerMoved", { x: this.player.x, y: this.player.y });
    }
  }

  private collidesWithWall(cx: number, cy: number): boolean {
    const hw = 8;
    const hh = 8;
    for (const r of this.wallRects) {
      if (
        cx + hw > r.x &&
        cx - hw < r.x + r.w &&
        cy + hh > r.y &&
        cy - hh < r.y + r.h
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if player overlaps the exit zone at the bottom of the room.
   * Reads ONLY returnX/returnY — ZERO access to dialogue or NPC data.
   */
  private checkExitOverlap(): void {
    if (this.hasExited) return;
    if (this.transitionLock) return;
    // Do not check during entry grace period — prevents immediate exit on spawn
    if (this.exitGraceActive) return;

    // ── DIRECTIONAL GATE: only exit on downward movement ────────────────────
    // Player must be facing down (walking toward the door) to trigger exit.
    if (this.playerFacing !== "down") return;

    const px = this.player.x;
    const py = this.player.y;
    const hw = 10;
    const hh = 10;

    const inZone =
      px + hw > EXIT_ZONE_X &&
      px - hw < EXIT_ZONE_X + EXIT_ZONE_W &&
      py + hh > EXIT_ZONE_Y &&
      py - hh < EXIT_ZONE_Y + EXIT_ZONE_H;

    if (inZone && !this.exitOverlapping) {
      this.exitOverlapping = true;
      // Set lock immediately to prevent re-entry into this path
      this.transitionLock = true;
      this.time.delayedCall(600, () => {
        this.transitionLock = false;
      });
      this.triggerExit();
    } else if (!inZone) {
      this.exitOverlapping = false;
    }
  }

  /**
   * Transitions back to TownScene.
   * Reads ONLY stored returnX/returnY.
   * NEVER reads dialogue arrays, NPC objects, or any game data.
   */
  private triggerExit(): void {
    if (this.hasExited) return;
    this.hasExited = true;

    // Close any open career tool overlay before transitioning
    if (this.careerToolOpen) {
      this.careerToolOpen = false;
      GameBridge.emit("careerToolClose", undefined);
    }

    // Cleanup keyboard listeners for NPC interaction
    if (this.input.keyboard) {
      this.input.keyboard.off("keydown-E", this.handleNpcInteract, this);
      this.input.keyboard.off("keydown-ENTER", this.handleNpcInteract, this);
      this.input.keyboard.off("keydown-SPACE", this.handleNpcInteract, this);
    }

    // Hide any open tip bubble
    if (this.tipBubble) {
      this.tipBubble.destroy();
      this.tipBubble = null;
    }
    if (this.confirmPromptContainer) {
      this.confirmPromptContainer.destroy();
      this.confirmPromptContainer = null;
    }
    this.confirmPromptVisible = false;

    const locationId = this.getLocationId();

    // Stop current music immediately — TownScene.create() will start town_square clean.
    // Do NOT call fadeToTrack here: it sets currentLocationId to "town_square" before
    // TownScene runs, so TownScene's own fadeToTrack call hits the "already playing" guard
    // and never actually starts the track.

    // Emit exit event — payload contains only locationId, no NPC/dialogue data
    GameBridge.emit("interiorExited", { locationId });
    GameBridge.emit("locationChanged", "town_square");

    // Fade out then switch scene
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Pass the stored exterior position back to TownScene
      // This is only coordinate data — no dialogue, no NPC refs
      this.scene.start("TownScene", {
        returnX: this.returnX,
        returnY: this.returnY,
      });
    });
  }

  // ── NPC proximity & dialogue ───────────────────────

  private checkNpcProximity(): void {
    if (!this.npcEntry) return;
    const d = Math.hypot(
      this.player.x - this.npcEntry.x,
      this.player.y - this.npcEntry.y,
    );
    // Show tip bubble within 100px
    const inTipRange = d < 100;
    if (inTipRange && !this.tipVisible) {
      this.tipVisible = true;
      this.showTipBubble();
    }
    if (!inTipRange && this.tipVisible) {
      this.tipVisible = false;
      if (this.tipBubble) {
        this.tipBubble.destroy();
        this.tipBubble = null;
      }
    }
    // Show/hide confirm prompt at 60px
    const inConfirmRange = d < 60;
    if (
      inConfirmRange &&
      !this.confirmPromptVisible &&
      !this.careerToolOpen &&
      !this.hasExited
    ) {
      this.confirmPromptVisible = true;
      this.showConfirmPrompt();
    } else if (!inConfirmRange && this.confirmPromptVisible) {
      this.confirmPromptVisible = false;
      this.npcWasInInteractRange = false;
      if (this.confirmPromptContainer) {
        this.confirmPromptContainer.destroy();
        this.confirmPromptContainer = null;
      }
    }
    // Career tool opens only on Space/Enter key press (handled in handleNpcInteract)
  }

  private showTipBubble(): void {
    if (!this.npcEntry) return;
    const npcData = NPCS.find((n) => n.id === this.npcEntry!.npcId) as
      | (typeof NPCS)[number]
      | undefined;
    if (!npcData) return;

    // Use interiorProximityTips if available, otherwise fall back to proximityTips
    const tips =
      (npcData as { interiorProximityTips?: string[] }).interiorProximityTips ??
      npcData.proximityTips;
    const tipText =
      Array.isArray(tips) && tips.length > 0
        ? (tips[this.npcTipIdx % tips.length] ?? "")
        : "";
    if (!tipText) return;
    this.npcTipIdx++;

    const { x, y } = this.npcEntry;
    const container = this.add.container(x, y - 80);
    container.setDepth(7200);

    const padX = 16;
    const padY = 10;
    const txt = this.add.text(0, 0, tipText, {
      fontSize: "13px",
      color: "#ffffff",
      fontFamily: '"Space Grotesk", monospace',
      stroke: "#000000",
      strokeThickness: 2,
      wordWrap: { width: 200 },
      align: "center",
    });
    txt.setOrigin(0.5, 0.5);

    const bw = txt.width + padX * 2;
    const bh = txt.height + padY * 2;
    const npcColorInt = Number.parseInt(
      (npcData.color ?? "#C0C0C0").replace("#", ""),
      16,
    );
    const safeColor = Number.isNaN(npcColorInt) ? 0xc0c0c0 : npcColorInt;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.88);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
    bg.lineStyle(1, safeColor, 0.7);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 6);
    bg.fillStyle(0x000000, 0.88);
    bg.fillTriangle(-5, bh / 2, 5, bh / 2, 0, bh / 2 + 8);

    container.add([bg, txt]);
    this.tipBubble = container;
  }

  private showConfirmPrompt(): void {
    if (!this.npcEntry) return;
    const toolLabels: Record<string, string> = {
      "resume-tailor": "Talk to Vera",
      "cover-letter": "Talk to Penny",
      "interview-coach": "Talk to Chad",
      "item-shop": "Talk to Felix",
    };
    const action = this.isTouchDevice
      ? "Tap INTERACT"
      : "Press E, Enter, or Space";
    const label = `${action} - ${toolLabels[this.getToolId()] ?? "Interact"}`;

    const { x, y } = this.npcEntry;
    const container = this.add.container(x, y + 36);
    container.setDepth(7300);

    const padX = 14;
    const padY = 8;
    const txt = this.add.text(0, 0, label, {
      fontSize: "12px",
      color: "#ffffff",
      fontFamily: '"Space Grotesk", monospace',
      stroke: "#000000",
      strokeThickness: 2,
      align: "center",
    });
    txt.setOrigin(0.5, 0.5);

    const bw = txt.width + padX * 2;
    const bh = txt.height + padY * 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
    bg.lineStyle(2, 0xffffff, 0.6);
    bg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);

    container.add([bg, txt]);
    this.confirmPromptContainer = container;
  }

  /**
   * E / Enter handler — opens NPC dialogue.
   * Completely separate code path from exit logic.
   */
  private handleNpcInteract = (): void => {
    // ── TYPING GUARD: never fire while user is typing in a form field ─────────
    if (isTypingInField()) return;
    // Only open career tool when within confirm range AND prompt is showing
    if (this.confirmPromptVisible && !this.careerToolOpen && !this.hasExited) {
      this.npcWasInInteractRange = true;
      if (this.confirmPromptContainer) {
        this.confirmPromptContainer.destroy();
        this.confirmPromptContainer = null;
      }
      this.confirmPromptVisible = false;
      const npcData = NPCS.find((npc) => npc.id === this.npcEntry?.npcId);
      if (npcData) {
        const introductions: Record<string, string> = {
          "resume-tailor":
            "I turn your real experience into a credential recruiters can understand. Ready to tailor your first resume?",
          "cover-letter":
            "A strong cover letter connects your story to one specific opportunity. Ready to write yours?",
          "interview-coach":
            "We train with real questions, clear feedback, and another attempt. Ready to practice?",
          "item-shop":
            "Your XP buys useful career power-ups. I will explain exactly what each one changes.",
        };
        GameBridge.emit("dialogueOpened", {
          ...npcData,
          dialogue: [
            {
              speaker: npcData.name,
              text: introductions[this.getToolId()] ?? "Ready to begin?",
              options: [
                {
                  label: "[START]",
                  action: "open_tool",
                  payload: this.getToolId(),
                },
                { label: "[NOT YET]", action: "close" },
              ],
            },
          ],
        });
      }
      return;
    }
    // Fallback: show NPC dialogue line if in tip range
    if (!this.npcEntry || !this.tipVisible) return;
    const npcData = NPCS.find((n) => n.id === this.npcEntry!.npcId);
    if (!npcData) return;
    if (!Array.isArray(npcData.dialogue) || npcData.dialogue.length === 0)
      return;

    const lineIdx = (this.npcTipIdx ?? 0) % npcData.dialogue.length;
    const singleLine = {
      ...npcData,
      dialogue: [npcData.dialogue[lineIdx]!],
    };
    GameBridge.emit("dialogueOpened", singleLine);
  };

  // ── Character Drawing ──────────────────────────────

  protected drawFemaleCharacter(
    g: Phaser.GameObjects.Graphics,
    bodyColor: number,
    hairColor: number,
  ): void {
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 14, 16, 5);
    g.fillStyle(hairColor, 1);
    g.fillRect(-6, -20, 12, 6);
    g.fillRect(-7, -16, 3, 14);
    g.fillRect(4, -16, 3, 14);
    g.fillRect(-6, -2, 3, 4);
    g.fillRect(3, -2, 3, 4);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -18, 10, 10);
    g.fillStyle(0x333333, 1);
    g.fillRect(-3, -14, 2, 2);
    g.fillRect(1, -14, 2, 2);
    g.fillStyle(0x000000, 1);
    g.fillRect(-4, -15, 1, 1);
    g.fillRect(3, -15, 1, 1);
    g.fillStyle(hairColor, 1);
    g.fillRect(-5, -20, 10, 4);
    g.fillRect(-7, -18, 2, 4);
    g.fillRect(5, -18, 2, 4);
    g.fillStyle(bodyColor, 1);
    g.fillRect(-5, -8, 10, 10);
    g.fillRect(-7, 2, 14, 8);
    g.fillRect(-6, 8, 12, 4);
    g.fillStyle(bodyColor, 1);
    g.fillRect(-8, -7, 3, 7);
    g.fillRect(5, -7, 3, 7);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-8, 0, 3, 3);
    g.fillRect(5, 0, 3, 3);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-4, 12, 3, 5);
    g.fillRect(1, 12, 3, 5);
    g.fillStyle(0x3a2a5a, 1);
    g.fillRect(-5, 17, 5, 3);
    g.fillRect(0, 17, 5, 3);
  }

  protected drawMaleCharacter(
    g: Phaser.GameObjects.Graphics,
    bodyColor: number,
    hairColor: number,
  ): void {
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 14, 18, 5);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -16, 10, 10);
    g.fillStyle(hairColor, 1);
    g.fillRect(-5, -17, 10, 5);
    g.fillRect(-6, -15, 2, 4);
    g.fillRect(4, -15, 2, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(-3, -13, 2, 2);
    g.fillRect(1, -13, 2, 2);
    g.fillStyle(bodyColor, 1);
    g.fillRect(-6, -6, 12, 10);
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(-2, -6, 4, 3);
    g.fillStyle(bodyColor, 1);
    g.fillRect(-9, -5, 3, 8);
    g.fillRect(6, -5, 3, 8);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-9, 3, 3, 3);
    g.fillRect(6, 3, 3, 3);
    g.fillStyle(0x1a2a4a, 1);
    g.fillRect(-5, 4, 4, 7);
    g.fillRect(1, 4, 4, 7);
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(-6, 11, 5, 3);
    g.fillRect(1, 11, 5, 3);
  }

  private drawPlayerCharacter(
    g: Phaser.GameObjects.Graphics,
    facing: "up" | "down" | "left" | "right" = "down",
  ): void {
    g.clear();
    const flip = facing === "left";
    const sx = flip ? -1 : 1;
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 12, 18, 6);
    if (hasBackpack()) {
      g.fillStyle(0x8c5b2e, 1);
      g.fillRoundedRect(-9, -8, 18, 18, 3);
      g.lineStyle(2, 0xffbf00, 1);
      g.strokeRoundedRect(-9, -8, 18, 18, 3);
    }
    g.fillStyle(0x226622, 1);
    g.fillRect(-6 * sx, -6, 12, 10);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -16, 10, 10);
    g.fillStyle(0x5a3a10, 1);
    g.fillRect(-5, -17, 10, 4);
    g.fillRect(-6, -15, 2, 3);
    g.fillRect(4, -15, 2, 3);
    g.fillStyle(0x000000, 1);
    if (facing !== "up") {
      const eyeOff = facing === "right" ? 2 : facing === "left" ? -2 : 0;
      g.fillRect(-3 + eyeOff, -13, 2, 2);
      g.fillRect(1 + eyeOff, -13, 2, 2);
    }
    g.fillStyle(0x1a1a5a, 1);
    g.fillRect(-5, 4, 4, 6);
    g.fillRect(1, 4, 4, 6);
    g.fillStyle(0x4a3a2a, 1);
    g.fillRect(-6, 10, 5, 3);
    g.fillRect(1, 10, 5, 3);
    g.fillStyle(0xaaaaaa, 1);
    const toolX = facing === "left" ? -12 : 8;
    g.fillRect(toolX, -2, 2, 8);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(toolX - 1, -2, 4, 3);
  }
}
