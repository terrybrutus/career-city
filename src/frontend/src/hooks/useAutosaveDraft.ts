import { useEffect } from "react";

export function loadDraft<T>(key: string, fallback: T): T {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) ?? "{}") };
  } catch {
    return fallback;
  }
}

export function clearDraft(key: string) {
  localStorage.removeItem(key);
}

export function useAutosaveDraft(key: string, value: unknown, dirty: boolean) {
  useEffect(() => {
    if (dirty) localStorage.setItem(key, JSON.stringify(value));
  }, [dirty, key, value]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
