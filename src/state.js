import { DateTime } from 'luxon';

export const state = {
  selectedDt: DateTime.now(),
  isDragging: false,
  dragStartX: 0,
  dragStartDt: null,
  isPanelOpen: false,
};

/**
 * Parse a DateTime from the URL hash (#t=2026-03-05T18:00).
 * Returns null if no valid time is found.
 */
export function getStateFromURL() {
  const hash = window.location.hash;
  if (!hash.startsWith('#t=')) return null;
  const iso = hash.slice(3);
  const dt = DateTime.fromISO(iso);
  return dt.isValid ? dt : null;
}

/**
 * Update the URL hash to reflect the current selectedDt.
 * Clears the hash when within 2 minutes of "now".
 * Uses replaceState to avoid polluting browser history.
 */
export function updateURL(useReplace = true) {
  const now = DateTime.now();
  const diffMinutes = Math.abs(state.selectedDt.diff(now, 'minutes').minutes);

  if (diffMinutes < 2) {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }

  const iso = state.selectedDt.toFormat("yyyy-MM-dd'T'HH:mm");
  const newHash = `#t=${iso}`;
  if (useReplace) {
    history.replaceState(null, '', newHash);
  } else {
    history.pushState(null, '', newHash);
  }
}
