import { DateTime } from 'luxon';
import { getSelectedTimezones } from './timezones.js';
import { state } from './state.js';
import { getHourClass } from './colors.js';

const TOTAL_HOURS = 49;
const CENTER_INDEX = 24;

let cellWidth = 60;
let gridAreaWidth = 0;
let rowElements = [];

export function getCellWidth() {
  return cellWidth;
}

export function buildGrid() {
  const container = document.querySelector('.grid-rows');
  cellWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-width'));

  container.innerHTML = '';
  rowElements = [];

  const timezones = getSelectedTimezones();
  for (const tz of timezones) {
    const row = document.createElement('div');
    row.className = 'tz-row';

    const label = document.createElement('div');
    label.className = 'tz-label';

    const zoneDt = state.selectedDt.setZone(tz.id);
    const abbr = zoneDt.toFormat('ZZZZ');
    const offset = zoneDt.toFormat('ZZ');

    label.innerHTML = `
      <span class="tz-flag">${tz.flag}</span>
      <div class="tz-info">
        <span class="tz-name">${tz.label}</span>
        <span class="tz-meta">${abbr} · UTC${offset}</span>
      </div>
      <span class="tz-current-time"></span>
    `;

    const strip = document.createElement('div');
    strip.className = 'hour-strip';

    const cells = [];
    for (let i = 0; i < TOTAL_HOURS; i++) {
      const cell = document.createElement('div');
      cell.className = 'hour-cell';
      cell.innerHTML = '<span class="hour-text"></span>';
      strip.appendChild(cell);
      cells.push(cell);
    }

    row.appendChild(label);
    row.appendChild(strip);
    container.appendChild(row);

    rowElements.push({
      tz,
      label,
      strip,
      cells,
      timeEl: label.querySelector('.tz-current-time'),
      metaEl: label.querySelector('.tz-meta'),
    });
  }

  computeGridWidth();
  updateGrid();
}

function computeGridWidth() {
  const container = document.querySelector('.grid-container');
  const labelWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--label-width'));
  gridAreaWidth = container.clientWidth - labelWidth;
  cellWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-width'));
}

export function updateGrid() {
  const now = DateTime.now();

  // Update header local time
  const localTimeEl = document.querySelector('.local-time');
  if (localTimeEl) {
    localTimeEl.textContent = state.selectedDt.toFormat('cccc, LLL d · h:mm a');
  }

  // Show/hide back-to-now button
  const backBtn = document.querySelector('.back-to-now');
  if (backBtn) {
    const diffMinutes = Math.abs(state.selectedDt.diff(now, 'minutes').minutes);
    backBtn.classList.toggle('hidden', diffMinutes < 2);
  }

  // Compute translate offset
  // The center cell (index 24) should represent `now`.
  // When selectedDt == now, translateX centers cell 24 in the grid area.
  // When selectedDt differs, we shift accordingly.
  const diffFromNowHours = state.selectedDt.diff(now, 'hours').hours;
  const centerOffsetPx = gridAreaWidth / 2;
  const translateX = centerOffsetPx - (CENTER_INDEX * cellWidth) - (cellWidth / 2) - (diffFromNowHours * cellWidth);

  for (const row of rowElements) {
    const { tz, strip, cells, timeEl, metaEl } = row;

    // Compute the base DateTime for cell 0 in this timezone
    const nowInZone = now.setZone(tz.id);
    const baseDt = nowInZone.startOf('hour').minus({ hours: CENTER_INDEX });

    strip.style.transform = `translateX(${translateX}px)`;

    // Determine which cell index is "selected" (closest to selectedDt)
    const selectedInZone = state.selectedDt.setZone(tz.id);
    const selectedHourIndex = Math.round(selectedInZone.diff(baseDt, 'hours').hours);

    for (let i = 0; i < TOTAL_HOURS; i++) {
      const cellDt = baseDt.plus({ hours: i });
      const hour = cellDt.hour;
      const cell = cells[i];

      // Time class (per-hour color)
      const timeClass = getHourClass(hour);
      cell.className = 'hour-cell ' + timeClass;
      cell.dataset.hour = hour;

      // Selected highlight
      if (i === selectedHourIndex) {
        cell.classList.add('selected');
      }

      // Day boundary
      if (hour === 0) {
        cell.classList.add('day-boundary');
        cell.querySelector('.hour-text').innerHTML =
          `<span class="day-label">${cellDt.toFormat('ccc d')}</span>${formatHour(hour)}`;
      } else {
        cell.querySelector('.hour-text').textContent = formatHour(hour);
      }
    }

    // Update current time display in label
    const displayDt = selectedInZone;
    timeEl.textContent = displayDt.toFormat('h:mm a');

    // Update meta (abbreviation + offset)
    const abbr = selectedInZone.toFormat('ZZZZ');
    const offset = selectedInZone.toFormat('ZZ');
    metaEl.textContent = `${abbr} · UTC${offset}`;
  }
}

function formatHour(hour) {
  if (hour === 0) return '12a';
  if (hour < 12) return hour + 'a';
  if (hour === 12) return '12p';
  return (hour - 12) + 'p';
}

export function onResize() {
  computeGridWidth();
  updateGrid();
}
