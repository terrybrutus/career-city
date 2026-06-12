import type { AssetRegistry } from "@/types/game";

/**
 * Asset registry — all sprite/tileset URLs have been cleared to null/empty
 * because opengameart.org blocks cross-origin requests (CORS).
 * All visuals are rendered procedurally via Phaser Graphics API.
 * Music is generated via Web Audio API in MusicManager.
 */
export const ASSETS: AssetRegistry = {
  player: {
    // Procedural — drawn via Phaser Graphics, no external URL needed
    primary: "",
    fallback: "/assets/images/placeholder.svg",
  },

  npcs: {
    ed: { primary: "", fallback: "/assets/images/placeholder.svg" },
    vera: { primary: "", fallback: "/assets/images/placeholder.svg" },
    chad: { primary: "", fallback: "/assets/images/placeholder.svg" },
    penny: { primary: "", fallback: "/assets/images/placeholder.svg" },
    felix: { primary: "", fallback: "/assets/images/placeholder.svg" },
  },

  tilesets: {
    town: { primary: "", fallback: "/assets/images/placeholder.svg" },
    buildings: { primary: "", fallback: "/assets/images/placeholder.svg" },
  },

  // Music — HTML5 Audio via external URLs (no CORS issues for audio playback)
  music: {
    town_square: "https://opengameart.org/sites/default/files/little_town.ogg",
    resume_tailor: "https://opengameart.org/sites/default/files/JRPG_town.ogg",
    cover_letter_corner:
      "https://opengameart.org/sites/default/files/JRPG_princess.ogg",
    interview_coach:
      "https://opengameart.org/sites/default/files/JRPG_royalCourt.ogg",
    item_shop:
      "https://opengameart.org/sites/default/files/Welcome%20to%20the%20Item%20Shop.ogg",
  },
};

/** Phaser asset keys — use these constants everywhere */
export const ASSET_KEYS = {
  PLAYER: "player_walk",
  NPC_ED: "npc_ed",
  NPC_VERA: "npc_vera",
  NPC_CHAD: "npc_chad",
  NPC_PENNY: "npc_penny",
  NPC_FELIX: "npc_felix",
  TILESET_TOWN: "tileset_town",
  TILESET_BUILDINGS: "tileset_buildings",
} as const;
