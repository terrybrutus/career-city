/**
 * GameBridge — EventEmitter between Phaser and React.
 * Phaser scenes emit events; React hooks listen and update state.
 */
type GameBridgeEvent =
  | "playerMoved"
  | "locationChanged"
  | "xpGained"
  | "questUpdated"
  | "npcInteracted"
  | "dialogueOpened"
  | "dialogueClosed"
  | "sceneChanged"
  | "shopItemPurchased"
  | "musicChanged"
  | "assetsLoaded"
  | "interiorEntered"
  | "interiorExited"
  | "careerToolOpen"
  | "careerToolClose"
  | "careerProgressUpdated";

type GameBridgeCallback = (data?: unknown) => void;

class GameBridgeClass {
  private listeners: Map<GameBridgeEvent, Set<GameBridgeCallback>>;

  constructor() {
    this.listeners = new Map();
  }

  on(event: GameBridgeEvent, callback: GameBridgeCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: GameBridgeEvent, callback: GameBridgeCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: GameBridgeEvent, data?: unknown): void {
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
