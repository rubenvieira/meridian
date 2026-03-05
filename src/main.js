import { DateTime } from 'luxon';
import { state, getStateFromURL, updateURL } from './state.js';
import { buildGrid, updateGrid, onResize } from './render.js';
import { initDrag } from './drag.js';
import { initPicker } from './picker.js';
import './style.css';

// Build initial grid
buildGrid();

// Restore time from URL hash if present
const urlDt = getStateFromURL();
if (urlDt) {
  state.selectedDt = urlDt;
  updateGrid();
}

// Set up drag interaction
initDrag();

// Show drag affordance hint on first visit per session
let dragHintShown = false;
try { dragHintShown = sessionStorage.getItem('meridian-drag-hint-shown'); } catch (e) {}
if (!dragHintShown) {
  const gridContainer = document.querySelector('.grid-container');
  gridContainer.classList.add('show-drag-hint');
  gridContainer.addEventListener('animationend', () => {
    gridContainer.classList.remove('show-drag-hint');
  }, { once: true });
  try { sessionStorage.setItem('meridian-drag-hint-shown', '1'); } catch (e) {}
}

// Show keyboard shortcuts hint on first visit
let shortcutsShown = false;
try { shortcutsShown = sessionStorage.getItem('meridian-shortcuts-shown'); } catch (e) {}
if (!shortcutsShown) {
  const hint = document.createElement('div');
  hint.className = 'shortcuts-hint';
  hint.innerHTML = '<kbd>&larr;</kbd><kbd>&rarr;</kbd> shift hours &middot; double-click to reset &middot; <kbd>Esc</kbd> close panel';
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

  try { sessionStorage.setItem('meridian-shortcuts-shown', '1'); } catch (e) {}
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

// Keyboard navigation: Left/Right arrow keys to shift hours
document.addEventListener('keydown', (e) => {
  if (state.isPanelOpen) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
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
  const dt = getStateFromURL();
  if (dt) {
    state.selectedDt = dt;
  } else {
    state.selectedDt = DateTime.now();
  }
  updateGrid();
});
