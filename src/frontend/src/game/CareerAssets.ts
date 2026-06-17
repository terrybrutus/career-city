import type Phaser from "phaser";

export type Facing = "up" | "down" | "left" | "right";
export type CharacterKey = "alex" | "adam" | "amelia" | "bob";

export const LIMEZU = {
  interiors: "cc-interiors-32",
  roomBuilder: "cc-room-builder-32",
  office: "cc-office-32",
  exteriorFloors: "cc-exteriors-floors",
  exteriorOffice: "cc-exteriors-office",
  townHome: "cc-town-home",
  townOffice: "cc-town-office",
  officePlant: "cc-office-plant",
  officeChair: "cc-office-chair",
  officeScreen: "cc-office-screen",
  officeDesk: "cc-office-desk",
  officeWorkstation: "cc-office-workstation",
  officeClock: "cc-office-clock",
} as const;

const characterSheets: Record<CharacterKey, string> = {
  alex: "cc-character-alex",
  adam: "cc-character-adam",
  amelia: "cc-character-amelia",
  bob: "cc-character-bob",
};

const runSheets: Record<CharacterKey, string> = {
  alex: "cc-character-alex-run",
  adam: "cc-character-adam-run",
  amelia: "cc-character-amelia-run",
  bob: "cc-character-bob-run",
};

const frameStart: Record<Facing, number> = {
  down: 0,
  up: 6,
  left: 12,
  right: 18,
};

export function preloadCareerAssets(scene: Phaser.Scene): void {
  scene.load.image(
    LIMEZU.interiors,
    "/assets/career-city/limezu/interiors-32.png",
  );
  scene.load.image(
    LIMEZU.roomBuilder,
    "/assets/career-city/limezu/room-builder-32.png",
  );
  scene.load.image(LIMEZU.office, "/assets/career-city/limezu/office-32.png");
  scene.load.image(
    LIMEZU.exteriorFloors,
    "/assets/career-city/limezu/exteriors-floors-mv.png",
  );
  scene.load.image(
    LIMEZU.exteriorOffice,
    "/assets/career-city/limezu/exteriors-office-mv.png",
  );
  scene.load.image(LIMEZU.townHome, "/assets/career-city/limezu/town-home.png");
  scene.load.image(
    LIMEZU.townOffice,
    "/assets/career-city/limezu/town-office-tower.png",
  );
  scene.load.image(
    LIMEZU.officePlant,
    "/assets/career-city/limezu/office-plant.png",
  );
  scene.load.image(
    LIMEZU.officeChair,
    "/assets/career-city/limezu/office-chair-orange.png",
  );
  scene.load.image(
    LIMEZU.officeScreen,
    "/assets/career-city/limezu/office-screen.png",
  );
  scene.load.image(
    LIMEZU.officeDesk,
    "/assets/career-city/limezu/office-desk.png",
  );
  scene.load.image(
    LIMEZU.officeWorkstation,
    "/assets/career-city/limezu/office-workstation.png",
  );
  scene.load.image(
    LIMEZU.officeClock,
    "/assets/career-city/limezu/office-clock.png",
  );

  for (const key of Object.keys(characterSheets) as CharacterKey[]) {
    scene.load.spritesheet(
      characterSheets[key],
      `/assets/career-city/limezu/${key}-16.png`,
      { frameWidth: 16, frameHeight: 32 },
    );
    scene.load.spritesheet(
      runSheets[key],
      `/assets/career-city/limezu/${key}-run-16.png`,
      { frameWidth: 16, frameHeight: 32 },
    );
  }
}

export function createCareerAnimations(scene: Phaser.Scene): void {
  for (const key of Object.keys(runSheets) as CharacterKey[]) {
    for (const facing of Object.keys(frameStart) as Facing[]) {
      const animKey = characterAnimationKey(key, facing);
      if (scene.anims.exists(animKey)) continue;
      const start = frameStart[facing];
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(runSheets[key], {
          start,
          end: start + 5,
        }),
        frameRate: 9,
        repeat: -1,
      });
    }
  }
}

export function characterAnimationKey(
  character: CharacterKey,
  facing: Facing,
): string {
  return `cc-${character}-run-${facing}`;
}

export function createCharacterSprite(
  scene: Phaser.Scene,
  character: CharacterKey,
  facing: Facing,
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(
    0,
    0,
    runSheets[character],
    frameStart[facing],
  );
  sprite.setOrigin(0.5, 0.78);
  sprite.setScale(2);
  return sprite;
}

export function setCharacterMotion(
  sprite: Phaser.GameObjects.Sprite,
  character: CharacterKey,
  facing: Facing,
  moving: boolean,
): void {
  if (moving) {
    const key = characterAnimationKey(character, facing);
    if (sprite.anims.currentAnim?.key !== key || !sprite.anims.isPlaying) {
      sprite.play(key, true);
    }
    return;
  }
  sprite.stop();
  sprite.setTexture(runSheets[character], frameStart[facing]);
}

export function addSheetSprite(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  crop: { x: number; y: number; w: number; h: number },
  scale = 1,
): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, key);
  image.setOrigin(0.5, 1);
  image.setCrop(crop.x, crop.y, crop.w, crop.h);
  image.setDisplaySize(crop.w * scale, crop.h * scale);
  image.setTexture(key);
  return image;
}

export function addPixelFloor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = 0x3f374a,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(fill, 1);
  g.fillRect(x, y, w, h);
  g.lineStyle(1, 0x211c2d, 0.45);
  for (let tx = x; tx <= x + w; tx += 32) g.lineBetween(tx, y, tx, y + h);
  for (let ty = y; ty <= y + h; ty += 32) g.lineBetween(x, ty, x + w, ty);
  return g;
}
