const BACKPACK_KEY = "career_city_has_backpack";

export function hasBackpack(): boolean {
  return localStorage.getItem(BACKPACK_KEY) === "true";
}

export function collectBackpack(): void {
  localStorage.setItem(BACKPACK_KEY, "true");
}
