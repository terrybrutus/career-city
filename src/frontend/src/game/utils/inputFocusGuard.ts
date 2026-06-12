/**
 * inputFocusGuard
 *
 * A document-level singleton that tracks whether any text input,
 * textarea, or [contenteditable] element currently has focus.
 *
 * Import { isTypingInField } and check it at the top of every
 * Phaser keyboard handler. If true, return early — do nothing.
 *
 * The guard registers focusin/focusout listeners once on first import,
 * so it's safe to import from multiple scenes.
 */

let _isTypingInField = false;
let _initialized = false;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

function init(): void {
  if (_initialized) return;
  _initialized = true;

  document.addEventListener(
    "focusin",
    (e: FocusEvent) => {
      if (isEditableTarget(e.target)) {
        _isTypingInField = true;
      }
    },
    true,
  );

  document.addEventListener(
    "focusout",
    (e: FocusEvent) => {
      if (isEditableTarget(e.target)) {
        // Use a microtask delay so focus moving between two inputs
        // (e.g. tab key) doesn't briefly clear the flag
        Promise.resolve().then(() => {
          const active = document.activeElement;
          if (!isEditableTarget(active)) {
            _isTypingInField = false;
          }
        });
      }
    },
    true,
  );
}

// Auto-initialise on import
init();

/**
 * Returns true when a text input, textarea, select, or contenteditable
 * element currently has focus.  Use as an early-return guard in every
 * Phaser keyboard event handler.
 *
 * @example
 * if (isTypingInField()) return;
 */
export function isTypingInField(): boolean {
  return _isTypingInField;
}
