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
  townResumeStore: "cc-town-resume-store",
  townCoverParlor: "cc-town-cover-parlor",
  townInterviewOffice: "cc-town-interview-office",
  townItemMarket: "cc-town-item-market",
  officePlant: "cc-office-plant",
  officeChair: "cc-office-chair",
  officeScreen: "cc-office-screen",
  officeDesk: "cc-office-desk",
  officeWorkstation: "cc-office-workstation",
  officeClock: "cc-office-clock",
  officeBackpack: "cc-office-backpack",
  officeDoor: "cc-office-door",
  officeCalendar: "cc-office-calendar",
  officeRadio: "cc-office-radio",
  officeLaptop: "cc-office-laptop",
  officeCouch: "cc-office-couch",
  officeWhiteboard: "cc-office-whiteboard",
  townBushRound: "cc-town-bush-round",
  townBushWide: "cc-town-bush-wide",
  townBushTall: "cc-town-bush-tall",
  townBench: "cc-town-bench",
  townFountain: "cc-town-fountain",
  townGardenArch: "cc-town-garden-arch",
  townGardenWall: "cc-town-garden-wall",
  townFlowerVase: "cc-town-flower-vase",
  townSignpost: "cc-town-signpost",
  townStreetLamp: "cc-town-street-lamp",
  townMailbox: "cc-town-mailbox",
  townRoadSign: "cc-town-road-sign",
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
  down: 18,
  up: 6,
  left: 12,
  right: 0,
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
    LIMEZU.townResumeStore,
    "/assets/career-city/limezu/town-resume-store.png",
  );
  scene.load.image(
    LIMEZU.townCoverParlor,
    "/assets/career-city/limezu/town-cover-parlor.png",
  );
  scene.load.image(
    LIMEZU.townInterviewOffice,
    "/assets/career-city/limezu/town-interview-office.png",
  );
  scene.load.image(
    LIMEZU.townItemMarket,
    "/assets/career-city/limezu/town-item-market.png",
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
  scene.load.image(
    LIMEZU.officeBackpack,
    "/assets/career-city/limezu/office-backpack.png",
  );
  scene.load.image(
    LIMEZU.officeDoor,
    "/assets/career-city/limezu/office-door.png",
  );
  scene.load.image(
    LIMEZU.officeCalendar,
    "/assets/career-city/limezu/office-calendar.png",
  );
  scene.load.image(
    LIMEZU.officeRadio,
    "/assets/career-city/limezu/office-radio.png",
  );
  scene.load.image(
    LIMEZU.officeLaptop,
    "/assets/career-city/limezu/office-laptop.png",
  );
  scene.load.image(
    LIMEZU.officeCouch,
    "/assets/career-city/limezu/office-couch.png",
  );
  scene.load.image(
    LIMEZU.officeWhiteboard,
    "/assets/career-city/limezu/office-whiteboard.png",
  );
  scene.load.image(
    LIMEZU.townBushRound,
    "/assets/career-city/limezu/town-bush-round.png",
  );
  scene.load.image(
    LIMEZU.townBushWide,
    "/assets/career-city/limezu/town-bush-wide.png",
  );
  scene.load.image(
    LIMEZU.townBushTall,
    "/assets/career-city/limezu/town-bush-tall.png",
  );
  scene.load.image(
    LIMEZU.townBench,
    "/assets/career-city/limezu/town-bench.png",
  );
  scene.load.image(
    LIMEZU.townFountain,
    "/assets/career-city/limezu/town-fountain.png",
  );
  scene.load.image(
    LIMEZU.townGardenArch,
    "/assets/career-city/limezu/town-garden-arch.png",
  );
  scene.load.image(
    LIMEZU.townGardenWall,
    "/assets/career-city/limezu/town-garden-wall.png",
  );
  scene.load.image(
    LIMEZU.townFlowerVase,
    "/assets/career-city/limezu/town-flower-vase.png",
  );
  scene.load.image(
    LIMEZU.townSignpost,
    "/assets/career-city/limezu/town-signpost.png",
  );
  scene.load.image(
    LIMEZU.townStreetLamp,
    "/assets/career-city/limezu/town-street-lamp.png",
  );
  scene.load.image(
    LIMEZU.townMailbox,
    "/assets/career-city/limezu/town-mailbox.png",
  );
  scene.load.image(
    LIMEZU.townRoadSign,
    "/assets/career-city/limezu/town-road-sign.png",
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
