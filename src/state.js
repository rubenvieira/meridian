import { DateTime } from 'luxon';

export const state = {
  selectedDt: DateTime.now(),
  isDragging: false,
  dragStartX: 0,
  dragStartDt: null,
  isPanelOpen: false,
  sharedTzIds: null, // non-null when viewing a shared link with timezone selections
  darkenWeekends: getSavedDarkenWeekends(),
};

function getSavedDarkenWeekends() {
  try {
    const saved = localStorage.getItem('meridian-darken-weekends');
    return saved === '1';
  } catch (e) {
    return false;
  }
}

export function saveDarkenWeekends(value) {
  state.darkenWeekends = value;
  try {
    localStorage.setItem('meridian-darken-weekends', value ? '1' : '0');
  } catch (e) {
    // Ignore storage errors
  }
}


/**
 * Parse state from the URL hash.
 * Supports: #t=2026-03-05T18:00&tz=America/New_York,Europe/London
 * Returns { dt, tzIds } where either may be null.
 */
export function getStateFromURL() {
  const hash = window.location.hash.slice(1); // remove #
  if (!hash) return { dt: null, tzIds: null };

  const params = {};
  for (const part of hash.split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      params[part.slice(0, eq)] = part.slice(eq + 1);
    }
  }

  let dt = null;
  if (params.t) {
    const parsed = DateTime.fromISO(params.t);
    if (parsed.isValid) dt = parsed;
  }

  let tzIds = null;
  if (params.tz) {
    tzIds = params.tz.split(',').filter(id => id.length > 0);
    if (tzIds.length === 0) tzIds = null;
  }

  return { dt, tzIds };
}

/**
 * Update the URL hash to reflect the current selectedDt and optionally shared timezones.
 * Clears the hash when within 2 minutes of "now" and no shared timezones.
 */
export function updateURL(useReplace = true) {
  const now = DateTime.now();
  const diffMinutes = Math.abs(state.selectedDt.diff(now, 'minutes').minutes);
  const hasSharedTz = state.sharedTzIds && state.sharedTzIds.length > 0;

  if (diffMinutes < 2 && !hasSharedTz) {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return;
  }

  const parts = [];
  if (diffMinutes >= 2) {
    parts.push(`t=${state.selectedDt.toFormat("yyyy-MM-dd'T'HH:mm")}`);
  }
  if (hasSharedTz) {
    parts.push(`tz=${state.sharedTzIds.join(',')}`);
  }

  const newHash = '#' + parts.join('&');
  if (useReplace) {
    history.replaceState(null, '', newHash);
  } else {
    history.pushState(null, '', newHash);
  }
}
