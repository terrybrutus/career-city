// Core position and location types
export interface PlayerPosition {
  x: number;
  y: number;
}

export type GameLocationId =
  | "town_square"
  | "resume_tailor"
  | "cover_letter_corner"
  | "interview_coach"
  | "item_shop";

export interface GameLocation {
  id: GameLocationId;
  name: string;
  description: string;
  color: string;
  buildingColor: string;
  musicTrack: GameLocationId;
  mapPosition: { x: number; y: number };
  route: string;
  // Legacy compat
  x: number;
  y: number;
}

export interface DialogueEntry {
  text: string;
  speaker: string;
  options?: DialogueOption[];
}

export interface DialogueOption {
  label: string;
  action: "accept_quest" | "decline" | "navigate" | "close";
  payload?: string;
}

export interface NPC {
  id: string;
  name: string;
  locationId: GameLocationId;
  dialogue: DialogueEntry[];
  proximityTips?: string[];
  spriteKey: string;
  sprite: string; // emoji fallback
  color: string;
  questId?: string;
  xpReward?: number;
}

export type QuestStatus = "locked" | "available" | "active" | "completed";

export interface QuestProgress {
  questId: string;
  title: string;
  description: string;
  status: QuestStatus;
  xpReward: number;
  locationId: GameLocationId;
}

export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  locationId: GameLocationId;
  xpReward: number;
}

export interface UserProfile {
  username: string;
  careerLevel: number;
  xp: number;
  xpToNextLevel: number;
  levelTitle: string;
  resumeScore: number;
  interviewScore: number;
  networkScore: number;
  inventory: string[];
}

export interface Resume {
  id: string;
  title: string;
  content: string;
  lastUpdated: number;
  score: number;
  feedback: string[];
}

export interface CoverLetter {
  id: string;
  jobTitle: string;
  company: string;
  content: string;
  lastUpdated: number;
}

export interface InterviewNote {
  id: string;
  question: string;
  answer: string;
  category: string;
  confidence: number;
}

export interface GameState {
  playerPos: PlayerPosition;
  currentLocation: GameLocationId;
  activeNPC: NPC | null;
  dialogueIndex: number;
  isDialogueOpen: boolean;
}

export type GameAction =
  | { type: "MOVE_PLAYER"; payload: PlayerPosition }
  | { type: "ENTER_LOCATION"; payload: GameLocationId }
  | { type: "INTERACT_NPC"; payload: NPC }
  | { type: "ADVANCE_DIALOGUE" }
  | { type: "CLOSE_DIALOGUE" };

// New interior scene events
export interface CareerToolOpenPayload {
  route: string;
}

export interface SceneChangedPayload {
  scene: "town" | "interior";
}

export interface ShopItemPurchasedPayload {
  itemId: string;
  xpCost: number;
}

// Music system
export type MusicTrackMap = Record<GameLocationId, string>;

// Asset registry type
export interface AssetEntry {
  primary: string;
  fallback?: string;
}

export interface AssetRegistry {
  player: AssetEntry;
  npcs: Record<string, AssetEntry>;
  tilesets: Record<string, AssetEntry>;
  music: MusicTrackMap;
}
