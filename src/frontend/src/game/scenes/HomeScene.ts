import { GameBridge } from "@/game/GameBridge";
import { collectBackpack, hasBackpack } from "@/game/playerState";
import { BaseScene } from "@/game/scenes/BaseScene";
import { isTypingInField } from "@/game/utils/inputFocusGuard";
import type { NPC } from "@/types/game";
import Phaser from "phaser";

const W = 800;
const H = 600;

type HomeObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  message: string;
  accent: number;
};

const OBJECTS: HomeObject[] = [
  {
    id: "backpack",
    label: "Backpack",
    x: 650,
    y: 190,
    message:
      "Your Backpack carries preparation tools and every artifact you create between workshops.",
    accent: 0xffbf00,
  },
  {
    id: "desk",
    label: "Planning Desk",
    x: 170,
    y: 180,
    message:
      "A note reads: Start with the opportunity, then gather evidence before you apply.",
    accent: 0x00ffff,
  },
  {
    id: "calendar",
    label: "Calendar",
    x: 390,
    y: 105,
    message:
      "Today: meet the mentors. Tomorrow: turn preparation into an application.",
    accent: 0xff00ff,
  },
  {
    id: "radio",
    label: "Radio",
    x: 260,
    y: 390,
    message:
      "The Career City morning show reminds listeners that progress is built one useful step at a time.",
    accent: 0x39ff14,
  },
  {
    id: "plant",
    label: "Desk Plant",
    x: 100,
    y: 390,
    message: "New growth takes time. So does a strong career story.",
    accent: 0x39ff14,
  },
];

export class HomeScene extends BaseScene {
  private player!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<
    "up" | "down" | "left" | "right",
    Phaser.Input.Keyboard.Key
  >;
  private facing: "up" | "down" | "left" | "right" = "up";
  private nearby: HomeObject | "exit" | null = null;
  private prompt!: Phaser.GameObjects.Text;
  private locked = false;
  private backpackDisplay!: Phaser.GameObjects.Container;
  private joystickActive = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickVec = { x: 0, y: 0 };
  private joystickOuter!: Phaser.GameObjects.Graphics;
  private joystickThumb!: Phaser.GameObjects.Graphics;
  private isTouchDevice = false;

  constructor() {
    super({ key: "HomeScene" });
  }

  create(): void {
    this.setupCamera(W, H);
    this.drawRoom();
    this.drawObjects();
    this.createPlayer();
    this.setupInput();
    this.setupTouchControls();
    this.createPrompt();
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300, 0, 0, 0);
    GameBridge.emit("locationChanged", "home");
    GameBridge.emit("sceneChanged", { scene: "home" });
    if (hasBackpack()) {
      GameBridge.emit("missionCompleted", {
        missionId: "pack_for_the_journey",
      });
    }

    const lock = () => {
      this.locked = true;
    };
    const unlock = () => {
      this.locked = false;
    };
    GameBridge.on("dialogueOpened", lock);
    GameBridge.on("dialogueClosed", unlock);
    this.events.once("shutdown", () => {
      GameBridge.off("dialogueOpened", lock);
      GameBridge.off("dialogueClosed", unlock);
      if (this.input.keyboard) {
        this.input.keyboard.off("keydown-E", this.interact, this);
        this.input.keyboard.off("keydown-ENTER", this.interact, this);
        this.input.keyboard.off("keydown-SPACE", this.interact, this);
      }
    });
  }

  update(_time: number, delta: number): void {
    if (!this.locked) this.move(delta);
    this.findNearby();
    this.drawTouchJoystick();
  }

  private drawRoom(): void {
    this.cameras.main.setBackgroundColor(0x171326);
    const g = this.add.graphics();
    g.fillStyle(0x241d35, 1);
    g.fillRect(32, 32, W - 64, H - 64);
    g.fillStyle(0x503b62, 1);
    g.fillRect(32, 32, W - 64, 82);
    g.lineStyle(5, 0xffbf00, 0.55);
    g.strokeRect(32, 32, W - 64, H - 64);
    for (let y = 120; y < H - 32; y += 32) {
      g.lineStyle(1, 0x7a6483, 0.18);
      g.lineBetween(32, y, W - 32, y);
    }
    for (let x = 32; x < W - 32; x += 32) {
      g.lineStyle(1, 0x7a6483, 0.12);
      g.lineBetween(x, 114, x, H - 32);
    }
    g.fillStyle(0x09090f, 1);
    g.fillRect(360, 520, 80, 48);
    g.lineStyle(3, 0x39ff14, 0.8);
    g.strokeRect(360, 520, 80, 48);
    this.add
      .text(400, 508, "TO CAREER CITY", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "12px",
        color: "#39ff14",
      })
      .setOrigin(0.5, 1);
    this.add
      .text(60, 55, "YOUR ROOM", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "20px",
        color: "#ffbf00",
        fontStyle: "bold",
      })
      .setDepth(3);
  }

  private drawObjects(): void {
    const g = this.add.graphics();
    g.fillStyle(0x5b3b26, 1);
    g.fillRect(105, 130, 130, 70);
    g.fillStyle(0x26334c, 1);
    g.fillRect(125, 142, 82, 42);
    g.fillStyle(0xd9e7ff, 1);
    g.fillRect(145, 150, 42, 25);
    g.fillStyle(0x30233d, 1);
    g.fillRect(590, 115, 120, 110);
    g.lineStyle(3, 0xffbf00, 0.7);
    g.strokeRect(590, 115, 120, 110);
    g.fillStyle(0x8c5b2e, 1);
    g.fillRect(620, 155, 52, 60);
    g.fillStyle(0xffbf00, 1);
    g.fillRect(625, 162, 42, 40);
    g.fillStyle(0x63368a, 1);
    g.fillRect(345, 62, 90, 64);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(355, 76, 70, 40);
    g.fillStyle(0x222222, 1);
    g.fillRect(225, 360, 70, 52);
    g.fillStyle(0x39ff14, 1);
    g.fillCircle(245, 385, 8);
    g.fillCircle(275, 385, 8);
    g.fillStyle(0x774422, 1);
    g.fillRect(80, 400, 40, 24);
    g.fillStyle(0x39aa44, 1);
    g.fillCircle(100, 380, 22);
    for (const object of OBJECTS) {
      this.add
        .text(object.x, object.y + 46, object.label.toUpperCase(), {
          fontFamily: '"Space Grotesk", monospace',
          fontSize: "10px",
          color: `#${object.accent.toString(16).padStart(6, "0")}`,
          backgroundColor: "#09090fcc",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5);
    }
    this.backpackDisplay = this.add.container(650, 190).setDepth(4);
    this.updateBackpackDisplay();
  }

  private updateBackpackDisplay(): void {
    this.backpackDisplay.removeAll(true);
    if (hasBackpack()) {
      const text = this.add
        .text(0, 0, "BACKPACK COLLECTED", {
          fontFamily: '"Space Grotesk", monospace',
          fontSize: "10px",
          color: "#39ff14",
          backgroundColor: "#09090f",
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5);
      this.backpackDisplay.add(text);
      return;
    }
    const bag = this.add.graphics();
    bag.fillStyle(0x8c5b2e, 1);
    bag.fillRoundedRect(-16, -20, 32, 40, 6);
    bag.lineStyle(3, 0xffbf00, 1);
    bag.strokeRoundedRect(-16, -20, 32, 40, 6);
    bag.lineBetween(-10, -20, -7, -29);
    bag.lineBetween(10, -20, 7, -29);
    this.backpackDisplay.add(bag);
  }

  private createPlayer(): void {
    this.player = this.add.container(400, 450).setDepth(10);
    this.body = this.add.graphics();
    this.player.add(this.body);
    this.drawPlayer();
  }

  private drawPlayer(): void {
    const g = this.body;
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 13, 20, 6);
    if (hasBackpack()) {
      g.fillStyle(0x8c5b2e, 1);
      g.fillRoundedRect(-9, -7, 18, 18, 3);
      g.lineStyle(2, 0xffbf00, 1);
      g.strokeRoundedRect(-9, -7, 18, 18, 3);
    }
    g.fillStyle(0x226622, 1);
    g.fillRect(-6, -6, 12, 11);
    g.fillStyle(0xf5c5a0, 1);
    g.fillRect(-5, -16, 10, 10);
    g.fillStyle(0x5a3a10, 1);
    g.fillRect(-5, -18, 10, 4);
    if (this.facing !== "up") {
      g.fillStyle(0x000000, 1);
      g.fillRect(-3, -13, 2, 2);
      g.fillRect(1, -13, 2, 2);
    }
    g.fillStyle(0x1a1a5a, 1);
    g.fillRect(-5, 5, 4, 7);
    g.fillRect(1, 5, 4, 7);
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
    this.input.keyboard.on("keydown-E", this.interact, this);
    this.input.keyboard.on("keydown-ENTER", this.interact, this);
    this.input.keyboard.on("keydown-SPACE", this.interact, this);
  }

  private setupTouchControls(): void {
    this.isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.joystickOuter = this.add.graphics().setScrollFactor(0).setDepth(8000);
    this.joystickThumb = this.add.graphics().setScrollFactor(0).setDepth(8001);
    if (!this.isTouchDevice) return;
    const button = this.add
      .text(this.scale.width - 76, this.scale.height - 82, "INTERACT", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#173117",
        padding: { x: 14, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(8100)
      .setInteractive();
    button.on("pointerdown", () => this.interact());
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > this.scale.width / 2) return;
      this.joystickActive = true;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.joystickActive) return;
      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const distance = Math.hypot(dx, dy);
      if (distance)
        this.joystickVec = {
          x: (dx / distance) * Math.min(1, distance / 60),
          y: (dy / distance) * Math.min(1, distance / 60),
        };
    });
    this.input.on("pointerup", () => {
      this.joystickActive = false;
      this.joystickVec = { x: 0, y: 0 };
      this.joystickOuter.clear();
      this.joystickThumb.clear();
    });
  }

  private move(delta: number): void {
    if (isTypingInField()) return;
    const speed = this.getPlayerSpeed() * (delta / 1000);
    let dx = this.joystickActive ? this.joystickVec.x * speed : 0;
    let dy = this.joystickActive ? this.joystickVec.y * speed : 0;
    if (!this.joystickActive) {
      if (this.cursors?.left.isDown || this.wasd?.left.isDown) dx -= speed;
      if (this.cursors?.right.isDown || this.wasd?.right.isDown) dx += speed;
      if (this.cursors?.up.isDown || this.wasd?.up.isDown) dy -= speed;
      if (this.cursors?.down.isDown || this.wasd?.down.isDown) dy += speed;
    }
    if (Math.abs(dx) > Math.abs(dy)) this.facing = dx > 0 ? "right" : "left";
    else if (dy) this.facing = dy > 0 ? "down" : "up";
    this.player.x = this.clamp(this.player.x + dx, 55, W - 55);
    this.player.y = this.clamp(this.player.y + dy, 135, H - 45);
    if (dx || dy) {
      this.drawPlayer();
      GameBridge.emit("playerMoved", { x: this.player.x, y: this.player.y });
    }
  }

  private findNearby(): void {
    let closest: HomeObject | null = null;
    let distance = 72;
    for (const object of OBJECTS) {
      const d = Math.hypot(this.player.x - object.x, this.player.y - object.y);
      if (d < distance) {
        closest = object;
        distance = d;
      }
    }
    const atExit = Math.hypot(this.player.x - 400, this.player.y - 545) < 62;
    this.nearby = atExit ? "exit" : closest;
    if (!this.nearby) {
      this.prompt.setVisible(false);
      return;
    }
    const action = this.isTouchDevice ? "Tap INTERACT" : "E / Enter / Space";
    this.prompt
      .setText(
        this.nearby === "exit"
          ? `${action} - Leave home`
          : `${action} - Inspect ${this.nearby.label}`,
      )
      .setVisible(true);
  }

  private createPrompt(): void {
    this.prompt = this.add
      .text(400, 570, "", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: "#09090fe6",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(9000)
      .setVisible(false);
  }

  private interact(): void {
    if (isTypingInField() || this.locked || !this.nearby) return;
    if (this.nearby === "exit") {
      if (!hasBackpack()) {
        this.openObjectDialogue(
          "FRONT DOOR",
          "You feel like you are forgetting something important. Find your Backpack before leaving.",
        );
        return;
      }
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TownScene", { returnX: 400, returnY: 590 });
      });
      return;
    }
    if (this.nearby.id === "backpack" && !hasBackpack()) {
      collectBackpack();
      this.updateBackpackDisplay();
      this.drawPlayer();
      GameBridge.emit("missionCompleted", {
        missionId: "pack_for_the_journey",
      });
      this.openObjectDialogue(
        "BACKPACK",
        "Backpack equipped. Your saved resumes, cover letters, coaching notes, and preparation tools will travel with you.",
      );
      return;
    }
    this.openObjectDialogue(
      this.nearby.label.toUpperCase(),
      this.nearby.message,
    );
  }

  private openObjectDialogue(speaker: string, text: string): void {
    const objectDialogue: NPC = {
      id: `home_${speaker.toLowerCase().replaceAll(" ", "_")}`,
      name: speaker,
      locationId: "home",
      color: "#ffbf00",
      sprite: "",
      spriteKey: "home_object",
      dialogue: [{ speaker, text }],
    };
    GameBridge.emit("dialogueOpened", objectDialogue);
  }

  private drawTouchJoystick(): void {
    if (!this.joystickActive) return;
    this.joystickOuter.clear();
    this.joystickOuter.lineStyle(3, 0xffffff, 0.5);
    this.joystickOuter.strokeCircle(
      this.joystickOrigin.x,
      this.joystickOrigin.y,
      60,
    );
    this.joystickThumb.clear();
    this.joystickThumb.fillStyle(0xffffff, 0.8);
    this.joystickThumb.fillCircle(
      this.joystickOrigin.x + this.joystickVec.x * 60,
      this.joystickOrigin.y + this.joystickVec.y * 60,
      18,
    );
  }
}
