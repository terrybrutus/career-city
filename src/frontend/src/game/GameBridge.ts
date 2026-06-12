/**
 * GameBridge — EventEmitter between Phaser and React.
 * Phaser scenes emit events; React hooks listen and update state.
 */
import type { NPC } from "@/types/game";
import type { MissionId } from "./missions";

export interface GameBridgeEvents {
  playerMoved: { x: number; y: number };
  locationChanged: string | { locationId: string };
  missionCompleted: { missionId: MissionId };
  questUpdated: unknown;
  npcInteracted: { npcId: string };
  dialogueOpened: NPC;
  dialogueClosed: undefined;
  sceneChanged: { scene: string };
  shopItemPurchased: { itemId: string; xpCost: number };
  musicChanged: { track?: string };
  assetsLoaded: undefined;
  interiorEntered: { locationId: string };
  interiorExited: { locationId: string };
  careerToolOpen: { tool: string; npcId?: string };
  careerToolClose: undefined;
  careerProgressUpdated: undefined;
}

type GameBridgeEvent = keyof GameBridgeEvents;
type GameBridgeCallback<E extends GameBridgeEvent> = (
  data: GameBridgeEvents[E],
) => void;

class GameBridgeClass {
  private listeners: Map<
    GameBridgeEvent,
    Set<GameBridgeCallback<GameBridgeEvent>>
  >;

  constructor() {
    this.listeners = new Map();
  }

  on<E extends GameBridgeEvent>(
    event: E,
    callback: GameBridgeCallback<E>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners
      .get(event)!
      .add(callback as GameBridgeCallback<GameBridgeEvent>);
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off<E extends GameBridgeEvent>(
    event: E,
    callback: GameBridgeCallback<E>,
  ): void {
    this.listeners
      .get(event)
      ?.delete(callback as GameBridgeCallback<GameBridgeEvent>);
  }

  emit<E extends GameBridgeEvent>(
    event: E,
    ...args: GameBridgeEvents[E] extends undefined
      ? [] | [undefined]
      : [GameBridgeEvents[E]]
  ): void {
    const data = args[0] as GameBridgeEvents[E];
    const cbs = this.listeners.get(event);
    if (cbs) {
      for (const cb of cbs) {
        cb(data);
      }
    }
  }

  /** Remove all listeners for a specific event */
  clear(event?: GameBridgeEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton
export const GameBridge = new GameBridgeClass();
