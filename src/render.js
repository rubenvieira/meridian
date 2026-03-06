import { DateTime } from 'luxon';
import { getSelectedTimezones, getTimezonesByIds, getSelectedTimezoneIds, saveSelectedTimezoneIds } from './timezones.js';
import { state } from './state.js';
import { getHourClass } from './colors.js';

const TOTAL_HOURS = 49;
const CENTER_INDEX = 24;

let cellWidth = 60;
let gridAreaWidth = 0;
let rowElements = [];
let reorderInitialized = false;

// Cached DOM references (populated in buildGrid)
let localTimeEl = null;
let nowLabelEl = null;
let backBtnEl = null;

export function getCellWidth() {
  return cellWidth;
}

export function buildGrid() {
  const container = document.querySelector('.grid-rows');
  cellWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-width'));

  container.innerHTML = '';
  container.setAttribute('role', 'grid');
  rowElements = [];

  const timezones = state.sharedTzIds
    ? getTimezonesByIds(state.sharedTzIds)
    : getSelectedTimezones();
  const localZone = DateTime.now().zoneName;

  // Update timezone count badge
  const badge = document.querySelector('.tz-count-badge');
  if (badge) badge.textContent = timezones.length;

  timezones.forEach((tz, index) => {
    const row = document.createElement('div');
    row.className = 'tz-row';
    row.setAttribute('role', 'row');
    row.style.animationDelay = `${index * 30}ms`;

    // Highlight user's local timezone
    if (tz.id === localZone) {
      row.classList.add('local-tz');
    }

    const label = document.createElement('div');
    label.className = 'tz-label';

    const zoneDt = state.selectedDt.setZone(tz.id);
    const abbr = zoneDt.toFormat('ZZZZ');
    const offset = zoneDt.toFormat('ZZ');

    const dstBadge = zoneDt.isInDST ? '<span class="dst-badge">DST</span>' : '';

    label.innerHTML = `
      <span class="tz-drag-handle" aria-label="Drag to reorder">&#x2807;</span>
      <span class="tz-flag">${tz.flag}</span>
      <div class="tz-info">
        <span class="tz-name">${tz.label}${dstBadge}</span>
        <span class="tz-meta">${abbr} · UTC${offset}</span>
      </div>
      <time class="tz-current-time"></time>
    `;

    const strip = document.createElement('div');
    strip.className = 'hour-strip';

    const cells = [];
    for (let i = 0; i < TOTAL_HOURS; i++) {
      const cell = document.createElement('div');
      cell.className = 'hour-cell';
      cell.setAttribute('role', 'gridcell');
      cell.innerHTML = '<span class="hour-text"></span>';
      strip.appendChild(cell);
      cells.push(cell);
    }

    row.appendChild(label);
    row.appendChild(strip);
    container.appendChild(row);

    // Copy time on click
    const timeEl = label.querySelector('.tz-current-time');
    timeEl.addEventListener('click', () => {
      const zoneDtNow = state.selectedDt.setZone(tz.id);
      const text = `${tz.label}: ${zoneDtNow.toFormat('cccc, LLL d, h:mm a ZZZZ')}`;
      navigator.clipboard.writeText(text).then(() => {
        showCopyToast(timeEl);
      });
    });

    rowElements.push({
      tz,
      label,
      strip,
      cells,
      timeEl,
      metaEl: label.querySelector('.tz-meta'),
    });
  });

  // Cache static DOM references
  localTimeEl = document.querySelector('.local-time');
  nowLabelEl = document.querySelector('.now-label');
  backBtnEl = document.querySelector('.back-to-now');

  if (!reorderInitialized) {
    initRowReorder();
    reorderInitialized = true;
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
  const diffMinutes = Math.abs(state.selectedDt.diff(now, 'minutes').minutes);
  const isNearNow = diffMinutes < 2;

  // Update header local time
  if (localTimeEl) {
    if (isNearNow) {
      localTimeEl.textContent = state.selectedDt.toFormat('cccc, LLL d · h:mm a');
    } else {
      localTimeEl.textContent = `Viewing: ${state.selectedDt.toFormat('cccc, LLL d · h:mm a')}`;
    }
  }

  // Update NOW label with actual time
  if (nowLabelEl) {
    nowLabelEl.textContent = now.toFormat('h:mm a');
  }

  // Show/hide back-to-now button
  if (backBtnEl) {
    backBtnEl.classList.toggle('hidden', isNearNow);
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
      cell.setAttribute('aria-label', cellDt.toFormat('cccc, LLLL d, h a ZZZZ'));
      cell.dataset.hour = hour;

      // Working hours indicator (9am–5pm)
      if (hour >= 9 && hour < 17) {
        cell.classList.add('working-hour');
      }

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
    timeEl.setAttribute('datetime', displayDt.toISO());

    // Update meta (abbreviation + offset + relative diff)
    const abbr = selectedInZone.toFormat('ZZZZ');
    const offset = selectedInZone.toFormat('ZZ');
    const localOffset = state.selectedDt.offset; // in minutes
    const tzOffset = selectedInZone.offset; // in minutes
    const diffHours = (tzOffset - localOffset) / 60;
    const diffStr = diffHours === 0 ? '' : diffHours > 0 ? ` · +${diffHours}h` : ` · ${diffHours}h`;
    metaEl.textContent = `${abbr} · UTC${offset}${diffStr}`;

    // Update DST badge
    const nameEl = row.label.querySelector('.tz-name');
    if (nameEl) {
      const existingBadge = nameEl.querySelector('.dst-badge');
      if (selectedInZone.isInDST && !existingBadge) {
        nameEl.insertAdjacentHTML('beforeend', '<span class="dst-badge">DST</span>');
      } else if (!selectedInZone.isInDST && existingBadge) {
        existingBadge.remove();
      }
    }
  }
}

function formatHour(hour) {
  if (hour === 0) return '12a';
  if (hour < 12) return hour + 'a';
  if (hour === 12) return '12p';
  return (hour - 12) + 'p';
}

// Row reorder via drag handle
function initRowReorder() {
  const container = document.querySelector('.grid-rows');
  let dragRow = null;
  let dragIndex = -1;
  let startY = 0;

  container.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.tz-drag-handle');
    if (!handle) return;

    const row = handle.closest('.tz-row');
    if (!row) return;

    e.preventDefault();
    e.stopPropagation();

    dragIndex = [...container.children].indexOf(row);
    dragRow = row;
    startY = e.clientY;

    row.classList.add('row-dragging');
    row.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragRow) return;

    const deltaY = e.clientY - startY;
    dragRow.style.transform = `translateY(${deltaY}px)`;
    dragRow.style.zIndex = '10';

    // Find drop target
    const rows = [...container.querySelectorAll('.tz-row:not(.row-dragging)')];
    for (const r of rows) {
      r.classList.remove('drop-target-above', 'drop-target-below');
    }

    const rowRect = dragRow.getBoundingClientRect();
    const centerY = rowRect.top + rowRect.height / 2;

    for (const r of rows) {
      const rect = r.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (Math.abs(centerY - mid) < rect.height / 2) {
        if (centerY < mid) {
          r.classList.add('drop-target-above');
        } else {
          r.classList.add('drop-target-below');
        }
        break;
      }
    }
  });

  container.addEventListener('pointerup', (e) => {
    if (!dragRow) return;

    dragRow.style.transform = '';
    dragRow.style.zIndex = '';
    dragRow.classList.remove('row-dragging');

    // Find target index
    const rows = [...container.querySelectorAll('.tz-row')];
    let targetIndex = dragIndex;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].classList.contains('drop-target-above')) {
        targetIndex = i > dragIndex ? i - 1 : i;
        rows[i].classList.remove('drop-target-above');
        break;
      }
      if (rows[i].classList.contains('drop-target-below')) {
        targetIndex = i < dragIndex ? i + 1 : i;
        rows[i].classList.remove('drop-target-below');
        break;
      }
    }

    if (targetIndex !== dragIndex && !state.sharedTzIds) {
      const ids = getSelectedTimezoneIds();
      const [moved] = ids.splice(dragIndex, 1);
      ids.splice(targetIndex, 0, moved);
      saveSelectedTimezoneIds(ids);
      buildGrid();
    }

    dragRow = null;
    dragIndex = -1;
  });

  container.addEventListener('pointercancel', () => {
    if (dragRow) {
      dragRow.style.transform = '';
      dragRow.style.zIndex = '';
      dragRow.classList.remove('row-dragging');
      dragRow = null;
      dragIndex = -1;
      container.querySelectorAll('.drop-target-above, .drop-target-below').forEach(r => {
        r.classList.remove('drop-target-above', 'drop-target-below');
      });
    }
  });
}

function showCopyToast(anchorEl) {
  const existing = document.querySelector('.copy-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = 'Copied!';
  document.body.appendChild(toast);

  const rect = anchorEl.getBoundingClientRect();
  toast.style.top = `${rect.top - 30}px`;
  toast.style.left = `${rect.left + rect.width / 2}px`;

  setTimeout(() => toast.remove(), 1500);
}

export function onResize() {
  computeGridWidth();
  updateGrid();
}
