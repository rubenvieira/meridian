import { DateTime } from 'luxon';
import { state, getStateFromURL, updateURL, saveDarkenWeekends } from './state.js';
import { buildGrid, updateGrid, onResize } from './render.js';
import { initDrag } from './drag.js';
import { initPicker } from './picker.js';
import { saveSelectedTimezoneIds } from './timezones.js';
import './style.css';

// Restore state from URL hash if present
const urlState = getStateFromURL();
if (urlState.dt) {
  state.selectedDt = urlState.dt;
}
if (urlState.tzIds) {
  state.sharedTzIds = urlState.tzIds;
}

// Set up weekend toggle
const weekendToggle = document.querySelector('#toggle-weekends');
if (weekendToggle) {
  weekendToggle.checked = state.darkenWeekends;
  weekendToggle.addEventListener('change', (e) => {
    saveDarkenWeekends(e.target.checked);
    updateGrid();
  });
}

// Build initial grid
buildGrid();

// Show shared timezone banner if viewing shared link
if (state.sharedTzIds) {
  showSharedBanner();
}

function showSharedBanner() {
  const existing = document.querySelector('.shared-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'shared-banner';
  banner.innerHTML = `
    <span>Viewing shared timezones</span>
    <button class="shared-banner-save">Save these</button>
    <button class="shared-banner-dismiss">Use mine</button>
  `;
  document.querySelector('#app').insertBefore(banner, document.querySelector('.grid-container'));

  banner.querySelector('.shared-banner-save').addEventListener('click', () => {
    saveSelectedTimezoneIds(state.sharedTzIds);
    state.sharedTzIds = null;
    banner.remove();
    buildGrid();
    updateURL();
  });

  banner.querySelector('.shared-banner-dismiss').addEventListener('click', () => {
    state.sharedTzIds = null;
    banner.remove();
    buildGrid();
    updateURL();
  });
}

// Set up drag interaction
initDrag();

// Show drag affordance hint on first visit per session
let dragHintShown = false;
try { dragHintShown = sessionStorage.getItem('meridian-drag-hint-shown'); } catch (e) { }
if (!dragHintShown) {
  const gridContainer = document.querySelector('.grid-container');
  gridContainer.classList.add('show-drag-hint');
  gridContainer.addEventListener('animationend', () => {
    gridContainer.classList.remove('show-drag-hint');
  }, { once: true });
  try { sessionStorage.setItem('meridian-drag-hint-shown', '1'); } catch (e) { }
}

// Show hint on first visit — keyboard shortcuts on desktop, swipe hint on touch devices
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
let shortcutsShown = false;
try { shortcutsShown = sessionStorage.getItem('meridian-shortcuts-shown'); } catch (e) { }
if (!shortcutsShown) {
  const hint = document.createElement('div');
  hint.className = 'shortcuts-hint';
  if (isTouchDevice) {
    hint.textContent = 'Swipe to shift hours · Tap to select · Double-tap to reset';
  } else {
    hint.innerHTML = '<kbd>&larr;</kbd><kbd>&rarr;</kbd> shift hours &middot; double-click to reset &middot; <kbd>Esc</kbd> close panel';
  }
  hint.setAttribute('role', 'status');
  document.querySelector('#app').appendChild(hint);

  const dismiss = () => {
    hint.classList.add('fade-out');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hint.remove();
    } else {
      hint.addEventListener('animationend', () => hint.remove(), { once: true });
    }
  };

  setTimeout(dismiss, 6000);
  document.addEventListener('keydown', dismiss, { once: true });
  hint.addEventListener('click', dismiss);

  try { sessionStorage.setItem('meridian-shortcuts-shown', '1'); } catch (e) { }
}

// Set up timezone picker
initPicker(buildGrid);

// Back to now button
document.querySelector('.back-to-now').addEventListener('click', () => {
  state.selectedDt = DateTime.now();
  updateGrid();
  updateURL();
});

// Double-click grid to reset to now
document.querySelector('.grid-container').addEventListener('dblclick', () => {
  state.selectedDt = DateTime.now();
  updateGrid();
  updateURL();
});

// Keyboard shortcut help modal
let helpModal = null;

function toggleHelp() {
  if (helpModal) {
    helpModal.remove();
    helpModal = null;
    return;
  }
  helpModal = document.createElement('div');
  helpModal.className = 'shortcuts-modal-backdrop';
  helpModal.innerHTML = `
    <div class="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
      <h3>Keyboard Shortcuts</h3>
      <div class="shortcut-row"><kbd>&larr;</kbd> <kbd>&rarr;</kbd><span>Shift hours</span></div>
      <div class="shortcut-row"><span class="shortcut-label">Double-click</span><span>Reset to now</span></div>
      <div class="shortcut-row"><kbd>Esc</kbd><span>Close panel</span></div>
      <div class="shortcut-row"><kbd>&uarr;</kbd> <kbd>&darr;</kbd><span>Navigate timezone list</span></div>
      <div class="shortcut-row"><kbd>Enter</kbd> / <kbd>Space</kbd><span>Toggle timezone</span></div>
      <div class="shortcut-row"><kbd>?</kbd><span>Toggle this help</span></div>
    </div>
  `;
  document.body.appendChild(helpModal);
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) toggleHelp();
  });
}

// Keyboard navigation: Left/Right arrow keys to shift hours
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // Help modal
  if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    e.preventDefault();
    toggleHelp();
    return;
  }

  // Close help modal with Escape
  if (e.key === 'Escape' && helpModal) {
    toggleHelp();
    return;
  }

  if (state.isPanelOpen) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    state.selectedDt = state.selectedDt.minus({ hours: 1 });
    updateGrid();
    updateURL(false);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    state.selectedDt = state.selectedDt.plus({ hours: 1 });
    updateGrid();
    updateURL(false);
  }
});

// Real-time tick — update every minute when not dragging
function tick() {
  if (!state.isDragging) {
    const now = DateTime.now();
    const isAway = Math.abs(state.selectedDt.diff(now, 'minutes').minutes) >= 2;

    if (!isAway) {
      state.selectedDt = now;
      updateGrid();
    }
  }
  scheduleNextTick();
}

function scheduleNextTick() {
  const msUntilNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(tick, msUntilNextMinute);
}

scheduleNextTick();

// Handle resize (debounced)
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(onResize, 150);
});

// Handle URL hash changes (browser back/forward, manual edits)
window.addEventListener('hashchange', () => {
  const urlState = getStateFromURL();
  state.selectedDt = urlState.dt || DateTime.now();

  const hadShared = state.sharedTzIds !== null;
  state.sharedTzIds = urlState.tzIds;

  if (state.sharedTzIds) {
    buildGrid();
    showSharedBanner();
  } else if (hadShared) {
    const banner = document.querySelector('.shared-banner');
    if (banner) banner.remove();
    buildGrid();
  } else {
    updateGrid();
  }
});
