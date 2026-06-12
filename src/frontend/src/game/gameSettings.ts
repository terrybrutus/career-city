export type GameSettings = {
  movementSpeed: number;
  joystickSensitivity: number;
  scanlines: boolean;
};

const STORAGE_KEY = "career_city_game_settings";
const DEFAULTS: GameSettings = {
  movementSpeed: 1.25,
  joystickSensitivity: 1.35,
  scanlines: true,
};

export function loadGameSettings(): GameSettings {
  try {
    return {
      ...DEFAULTS,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"),
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveGameSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent("career-city-settings", { detail: settings }),
  );
}
