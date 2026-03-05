import { DateTime } from 'luxon';
import { ALL_TIMEZONES, getSelectedTimezoneIds, saveSelectedTimezoneIds } from './timezones.js';
import { state } from './state.js';

let rebuildCallback = null;

export function initPicker(onRebuild) {
  rebuildCallback = onRebuild;

  const addBtn = document.querySelector('.add-tz-btn');
  const panel = document.querySelector('.tz-panel');
  const searchInput = document.querySelector('.tz-search');
  const closeBtn = document.querySelector('.tz-panel-close');

  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (state.isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeBtn.addEventListener('click', () => closePanel());

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (state.isPanelOpen && !panel.contains(e.target) && !addBtn.contains(e.target)) {
      closePanel();
    }
  });

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isPanelOpen) {
      closePanel();
    }
  });

  // Search filtering
  searchInput.addEventListener('input', () => {
    renderTimezoneList(searchInput.value.trim());
  });

  // Select all / deselect all
  const selectAllBtn = document.querySelector('.tz-select-all');
  selectAllBtn.addEventListener('click', () => {
    const selectedIds = getSelectedTimezoneIds();
    const allSelected = ALL_TIMEZONES.every(tz => selectedIds.includes(tz.id));
    if (allSelected) {
      // Deselect all except the first (must keep at least one)
      saveSelectedTimezoneIds([ALL_TIMEZONES[0].id]);
    } else {
      saveSelectedTimezoneIds(ALL_TIMEZONES.map(tz => tz.id));
    }
    renderTimezoneList(searchInput.value.trim());
    if (rebuildCallback) rebuildCallback();
  });

  // Delegate clicks on timezone items
  const list = document.querySelector('.tz-list');
  list.addEventListener('click', (e) => {
    const item = e.target.closest('.tz-item');
    if (!item) return;
    const tzId = item.dataset.tzId;
    toggleTimezone(tzId);
    renderTimezoneList(searchInput.value.trim());
  });
}

function openPanel() {
  state.isPanelOpen = true;
  const panel = document.querySelector('.tz-panel');
  const searchInput = document.querySelector('.tz-search');
  panel.classList.remove('hidden');
  searchInput.value = '';
  renderTimezoneList('');
  // Focus search after animation
  requestAnimationFrame(() => searchInput.focus());
}

function closePanel() {
  state.isPanelOpen = false;
  document.querySelector('.tz-panel').classList.add('hidden');
}

function renderTimezoneList(filter) {
  const list = document.querySelector('.tz-list');
  const selectedIds = getSelectedTimezoneIds();
  const now = DateTime.now();
  const lowerFilter = filter.toLowerCase();

  // Sort: selected first, then alphabetical
  const sorted = [...ALL_TIMEZONES].sort((a, b) => {
    const aSelected = selectedIds.includes(a.id);
    const bSelected = selectedIds.includes(b.id);
    if (aSelected !== bSelected) return aSelected ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  const filtered = lowerFilter
    ? sorted.filter(tz =>
        tz.label.toLowerCase().includes(lowerFilter) ||
        tz.id.toLowerCase().includes(lowerFilter)
      )
    : sorted;

  // Update select all button text
  const selectAllBtn = document.querySelector('.tz-select-all');
  const allSelected = ALL_TIMEZONES.every(tz => selectedIds.includes(tz.id));
  selectAllBtn.textContent = allSelected ? 'Deselect all' : 'Select all';

  list.innerHTML = filtered.map(tz => {
    const isSelected = selectedIds.includes(tz.id);
    const zoneDt = now.setZone(tz.id);
    const offset = zoneDt.toFormat('ZZ');
    const time = zoneDt.toFormat('h:mm a');
    return `
      <div class="tz-item ${isSelected ? 'active' : ''}" data-tz-id="${tz.id}">
        <span class="tz-item-flag">${tz.flag}</span>
        <div class="tz-item-info">
          <span class="tz-item-name">${tz.label}</span>
          <span class="tz-item-offset">UTC${offset} · ${time}</span>
        </div>
        <div class="tz-item-toggle">
          <div class="toggle-track ${isSelected ? 'on' : ''}">
            <div class="toggle-thumb"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTimezone(tzId) {
  const ids = getSelectedTimezoneIds();
  const index = ids.indexOf(tzId);
  if (index >= 0) {
    // Don't allow removing the last timezone
    if (ids.length <= 1) return;
    ids.splice(index, 1);
  } else {
    ids.push(tzId);
  }
  saveSelectedTimezoneIds(ids);
  if (rebuildCallback) rebuildCallback();
}
