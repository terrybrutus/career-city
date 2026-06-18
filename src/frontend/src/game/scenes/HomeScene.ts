import {
  type Facing,
  LIMEZU,
  createCharacterSprite,
  setCharacterMotion,
} from "@/game/CareerAssets";
import { GameBridge } from "@/game/GameBridge";
import { collectBackpack, hasBackpack } from "@/game/playerState";
import { BaseScene } from "@/game/scenes/BaseScene";
import { isTypingInField } from "@/game/utils/inputFocusGuard";
import type { NPC } from "@/types/game";
import Phaser from "phaser";

const W = 960;
const H = 540;

type HomeObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  message: string;
};

const OBJECTS: HomeObject[] = [
  {
    id: "backpack",
    label: "Backpack",
    x: 744,
    y: 330,
    radius: 58,
    message:
      "Backpack equipped. It will carry your resume, cover letter, interview notes, and career tools from room to room.",
  },
  {
    id: "desk",
    label: "Planning Desk",
    x: 238,
    y: 184,
    radius: 64,
    message:
      "Your desk has a sticky note: pick a real role, gather evidence, then let each mentor improve one part of the application.",
  },
  {
    id: "calendar",
    label: "Calendar",
    x: 486,
    y: 112,
    radius: 52,
    message:
      "Today's route: pack your Backpack, meet Sam, tailor a resume, build a loadout, practice with Chad, then check in with Ed.",
  },
  {
    id: "radio",
    label: "Radio",
    x: 238,
    y: 378,
    radius: 54,
    message:
      "The morning show is debating whether bullet points should have plot arcs. Sam calls in and says yes.",
  },
  {
    id: "plant",
    label: "Desk Plant",
    x: 124,
    y: 380,
    radius: 48,
    message:
      "Healthy growth: water, light, patience, and fewer vague resume bullets.",
  },
];

export class HomeScene extends BaseScene {
  private player!: Phaser.GameObjects.Container;
  private sprite!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<
    "up" | "down" | "left" | "right",
    Phaser.Input.Keyboard.Key
  >;
  private facing: Facing = "down";
  private nearby: HomeObject | "exit" | null = null;
  private prompt!: Phaser.GameObjects.Text;
  private locked = false;
  private backpackSprite: Phaser.GameObjects.Container | null = null;
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
    g.fillStyle(0x272336, 1);
    g.fillRect(48, 48, W - 96, H - 96);
    g.fillStyle(0x494056, 1);
    g.fillRect(48, 48, W - 96, 84);
    g.lineStyle(4, 0x8f7a5a, 0.9);
    g.strokeRect(48, 48, W - 96, H - 96);
    g.lineStyle(1, 0x786b81, 0.22);
    for (let y = 144; y < H - 48; y += 32) g.lineBetween(48, y, W - 48, y);
    for (let x = 48; x < W - 48; x += 32) g.lineBetween(x, 132, x, H - 48);

    g.fillStyle(0x191521, 1);
    g.fillRect(434, 462, 92, 36);
    g.lineStyle(3, 0x39ff14, 0.85);
    g.strokeRect(434, 462, 92, 36);
    this.add
      .text(480, 456, "CAREER COMMONS", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "12px",
        color: "#39ff14",
      })
      .setOrigin(0.5, 1);

    this.add
      .text(72, 72, "HOME", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "20px",
        color: "#ffbf00",
        fontStyle: "bold",
      })
      .setDepth(5);
  }

  private drawObjects(): void {
    this.add.image(238, 205, LIMEZU.officeDesk).setScale(2.4).setDepth(2);
    this.add.image(246, 149, LIMEZU.officeScreen).setScale(2.25).setDepth(3);
    this.add.image(124, 381, LIMEZU.officePlant).setScale(2.25).setDepth(3);
    this.add.image(232, 384, LIMEZU.officeScreen).setScale(1.6).setDepth(3);
    this.add.image(486, 116, LIMEZU.officeClock).setScale(2.15).setDepth(3);

    const bed = this.add.graphics();
    bed.setDepth(2);
    bed.fillStyle(0x8a6a4a, 1);
    bed.fillRoundedRect(626, 126, 142, 82, 8);
    bed.fillStyle(0xc8d6f0, 1);
    bed.fillRoundedRect(638, 136, 118, 60, 6);
    bed.fillStyle(0x6f82b5, 1);
    bed.fillRoundedRect(638, 168, 118, 28, 4);

    this.backpackSprite = this.add.container(744, 330).setDepth(4);
    this.updateBackpackDisplay();
  }

  private updateBackpackDisplay(): void {
    if (!this.backpackSprite) return;
    this.backpackSprite.removeAll(true);
    if (hasBackpack()) return;
    const bag = this.add.graphics();
    bag.fillStyle(0x8c5b2e, 1);
    bag.fillRoundedRect(-20, -26, 40, 52, 8);
    bag.fillStyle(0xbe823b, 1);
    bag.fillRoundedRect(-12, -10, 24, 22, 4);
    bag.lineStyle(2, 0x3d2718, 1);
    bag.strokeRoundedRect(-20, -26, 40, 52, 8);
    bag.lineBetween(-12, -26, -7, -38);
    bag.lineBetween(12, -26, 7, -38);
    const label = this.add
      .text(0, 38, "BACKPACK", {
        fontFamily: '"Space Grotesk", monospace',
        fontSize: "12px",
        color: "#ffbf00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0);
    const glow = this.add.graphics();
    glow.lineStyle(2, 0xffbf00, 0.75);
    glow.strokeRoundedRect(-32, -44, 64, 94, 8);
    this.backpackSprite.add([glow, bag, label]);
  }

  private createPlayer(): void {
    this.player = this.add.container(480, 400).setDepth(10);
    this.sprite = createCharacterSprite(this, "alex", this.facing);
    this.player.add(this.sprite);
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
    const positionButton = () =>
      button.setPosition(this.scale.width - 76, this.scale.height - 82);
    this.scale.on("resize", positionButton);
    this.events.once("shutdown", () =>
      this.scale.off("resize", positionButton),
    );
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
    this.player.x = this.clamp(this.player.x + dx, 72, W - 72);
    this.player.y = this.clamp(this.player.y + dy, 150, H - 42);
    setCharacterMotion(this.sprite, "alex", this.facing, Boolean(dx || dy));
    if (dx || dy) {
      GameBridge.emit("playerMoved", { x: this.player.x, y: this.player.y });
    }
  }

  private findNearby(): void {
    let closest: HomeObject | null = null;
    let distance = Number.POSITIVE_INFINITY;
    for (const object of OBJECTS) {
      const d = Math.hypot(this.player.x - object.x, this.player.y - object.y);
      if (d < object.radius && d < distance) {
        closest = object;
        distance = d;
      }
    }
    const atExit = Math.hypot(this.player.x - 480, this.player.y - 492) < 56;
    this.nearby = atExit ? "exit" : closest;
    if (!this.nearby) {
      this.prompt.setVisible(false);
      return;
    }
    const action = this.isTouchDevice ? "Tap Interact" : "E / Enter / Space";
    this.prompt
      .setText(
        this.nearby === "exit"
          ? `${action}: leave home`
          : `${action}: ${this.nearby.label}`,
      )
      .setVisible(true);
  }

  private createPrompt(): void {
    this.prompt = this.add
      .text(480, 512, "", {
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
          "Your Backpack is still by the bed. Grab it before heading into Career City.",
        );
        return;
      }
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TownScene", { returnX: 480, returnY: 520 });
      });
      return;
    }
    if (this.nearby.id === "backpack" && !hasBackpack()) {
      collectBackpack();
      this.updateBackpackDisplay();
      GameBridge.emit("missionCompleted", {
        missionId: "pack_for_the_journey",
      });
      this.openObjectDialogue("BACKPACK", this.nearby.message);
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
