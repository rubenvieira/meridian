import { DateTime } from 'luxon';
import { state, updateURL } from './state.js';
import { getCellWidth, updateGrid } from './render.js';

const CLICK_THRESHOLD = 5; // px
const DOUBLE_TAP_MS = 350; // ms window for double-tap/double-click
let rafId = null;
let wheelTimeoutId = null;
let lastClickTime = 0;

export function initDrag() {
  const container = document.querySelector('.grid-container');

  container.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // left button only
    // Don't start drag when clicking on the label column
    if (e.target.closest('.tz-label')) return;
    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.dragStartDt = state.selectedDt;
    container.classList.add('dragging');
    container.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  container.addEventListener('pointermove', (e) => {
    if (!state.isDragging) return;
    const deltaX = e.clientX - state.dragStartX;
    const cellWidth = getCellWidth();
    const deltaHours = -deltaX / cellWidth;
    state.selectedDt = state.dragStartDt.plus({ hours: deltaHours });
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        updateGrid();
        rafId = null;
      });
    }
  });

  container.addEventListener('pointerup', (e) => {
    if (!state.isDragging) return;
    cancelAnimationFrame(rafId);
    rafId = null;
    const deltaX = Math.abs(e.clientX - state.dragStartX);
    state.isDragging = false;
    container.classList.remove('dragging');

    if (deltaX < CLICK_THRESHOLD) {
      const tapTime = Date.now();
      if (tapTime - lastClickTime < DOUBLE_TAP_MS) {
        // Double-tap / double-click: reset to now
        state.selectedDt = DateTime.now();
        updateGrid();
        updateURL();
        lastClickTime = 0; // prevent triple-tap triggering again
      } else {
        // Treat as single click — snap to the clicked hour
        handleClick(e);
        lastClickTime = tapTime;
      }
    } else {
      // Snap to nearest hour
      const rounded = state.selectedDt.startOf('hour');
      const nextHour = rounded.plus({ hours: 1 });
      const diffToRounded = Math.abs(state.selectedDt.diff(rounded, 'minutes').minutes);
      const diffToNext = Math.abs(state.selectedDt.diff(nextHour, 'minutes').minutes);
      state.selectedDt = diffToRounded <= diffToNext ? rounded : nextHour;
      updateGrid();
      updateURL(false);
    }
  });

  container.addEventListener('pointercancel', () => {
    state.isDragging = false;
    container.classList.remove('dragging');
  });

  container.addEventListener('wheel', (e) => {
    // Only intercept horizontal wheel scrolls or vertical scrolls on the container itself 
    // to prevent unwanted page navigating/jumping. Trackpads often send deltaX, physical mice send deltaY.
    if (state.isPanelOpen) return;

    e.preventDefault();

    // Use absolute highest delta to support both horizontal trackpad swipes and vertical mouse wheel turns
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    // Smooth pixel shift
    const cellWidth = getCellWidth();
    const deltaHours = delta / cellWidth;

    state.selectedDt = state.selectedDt.plus({ hours: deltaHours });

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        updateGrid();
        rafId = null;
      });
    }

    // Debounce the URL update so we don't spam history during a smooth scroll
    clearTimeout(wheelTimeoutId);
    wheelTimeoutId = setTimeout(() => {
      // Snap to nearest hour after scrolling rests
      const rounded = state.selectedDt.startOf('hour');
      const nextHour = rounded.plus({ hours: 1 });
      const diffToRounded = Math.abs(state.selectedDt.diff(rounded, 'minutes').minutes);
      const diffToNext = Math.abs(state.selectedDt.diff(nextHour, 'minutes').minutes);
      state.selectedDt = diffToRounded <= diffToNext ? rounded : nextHour;

      updateGrid();
      updateURL(false);
    }, 150);
  }, { passive: false });
}

function handleClick(e) {
  const container = document.querySelector('.grid-container');
  const labelWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--label-width'));
  const gridAreaWidth = container.clientWidth - labelWidth;
  const clickXInGrid = e.clientX - container.getBoundingClientRect().left - labelWidth;
  const centerX = gridAreaWidth / 2;
  const cellWidth = getCellWidth();
  const offsetHours = (clickXInGrid - centerX) / cellWidth;

  state.selectedDt = state.selectedDt.plus({ hours: offsetHours }).startOf('hour');
  updateGrid();
  updateURL(false);
}
