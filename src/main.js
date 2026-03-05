import { DateTime } from 'luxon';
import { state } from './state.js';
import { buildGrid, updateGrid, onResize } from './render.js';
import { initDrag } from './drag.js';
import { initPicker } from './picker.js';
import './style.css';

// Build initial grid
buildGrid();

// Set up drag interaction
initDrag();

// Show drag affordance hint on first visit per session
if (!sessionStorage.getItem('meridian-drag-hint-shown')) {
  const gridContainer = document.querySelector('.grid-container');
  gridContainer.classList.add('show-drag-hint');
  gridContainer.addEventListener('animationend', () => {
    gridContainer.classList.remove('show-drag-hint');
  }, { once: true });
  sessionStorage.setItem('meridian-drag-hint-shown', '1');
}

// Set up timezone picker
initPicker(buildGrid);

// Back to now button
document.querySelector('.back-to-now').addEventListener('click', () => {
  state.selectedDt = DateTime.now();
  updateGrid();
});

// Double-click grid to reset to now
document.querySelector('.grid-container').addEventListener('dblclick', () => {
  state.selectedDt = DateTime.now();
  updateGrid();
});

// Keyboard navigation: Left/Right arrow keys to shift hours
document.addEventListener('keydown', (e) => {
  if (state.isPanelOpen) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    state.selectedDt = state.selectedDt.minus({ hours: 1 });
    updateGrid();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    state.selectedDt = state.selectedDt.plus({ hours: 1 });
    updateGrid();
  }
});

// Real-time tick — update every minute when not dragging
function tick() {
  if (!state.isDragging) {
    const now = DateTime.now();
    const backBtn = document.querySelector('.back-to-now');
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

// Handle resize
window.addEventListener('resize', onResize);
