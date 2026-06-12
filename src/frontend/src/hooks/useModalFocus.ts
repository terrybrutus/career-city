import { type RefObject, useEffect } from "react";

const SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    root?.querySelector<HTMLElement>(SELECTOR)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>(SELECTOR)];
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose, ref]);
}
