import type { KeyboardEvent } from "react";

const MOVE = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"] as const;

function itemsOf(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("button, a[href]")].filter(
    (el) => !el.hasAttribute("disabled"),
  );
}

/** Move focus among toolbar children. Does not toggle. */
export function toolbarArrowFocus(e: KeyboardEvent<HTMLElement>) {
  if (!MOVE.includes(e.key as (typeof MOVE)[number])) return;
  const items = itemsOf(e.currentTarget);
  if (items.length === 0) return;
  const i = items.indexOf(document.activeElement as HTMLElement);
  let next = Math.max(0, i);
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    next = i < 0 ? 0 : (i + 1) % items.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
  } else if (e.key === "Home") {
    next = 0;
  } else {
    next = items.length - 1;
  }
  e.preventDefault();
  items[next].focus();
}

/** Radiogroup: arrows move focus and select. */
export function radioArrowPick<T extends string>(
  e: KeyboardEvent<HTMLElement>,
  options: readonly T[],
  pick: (value: T) => void,
) {
  if (!MOVE.includes(e.key as (typeof MOVE)[number])) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
  if (items.length === 0) return;
  const i = Math.max(0, items.indexOf(document.activeElement as HTMLButtonElement));
  let next = i;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    next = (i + 1) % items.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    next = (i - 1 + items.length) % items.length;
  } else if (e.key === "Home") {
    next = 0;
  } else {
    next = items.length - 1;
  }
  e.preventDefault();
  items[next]?.focus();
  pick(options[next]);
}
