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
  const clearBtn = document.querySelector('.tz-search-clear');
  const backdrop = document.querySelector('.tz-panel-backdrop');

  // Clicking backdrop closes panel
  backdrop.addEventListener('click', () => {
    if (state.isPanelOpen) closePanel();
  });

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

  // Escape to close + arrow key nav in panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isPanelOpen) {
      closePanel();
      return;
    }

    // Arrow key navigation within panel items
    if (state.isPanelOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      const items = [...panel.querySelectorAll('.tz-item')];
      const idx = items.indexOf(document.activeElement);
      if (idx >= 0) {
        e.preventDefault();
        const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        if (items[next]) items[next].focus();
      } else if (e.key === 'ArrowDown' && panel.contains(document.activeElement)) {
        e.preventDefault();
        if (items[0]) items[0].focus();
      }
    }

    // Focus trap
    if (state.isPanelOpen && e.key === 'Tab') {
      const focusable = panel.querySelectorAll(
        'button:not(.hidden), input, [tabindex="0"]'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Search filtering with clear button
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    clearBtn.classList.toggle('hidden', val.length === 0);
    renderTimezoneList(val);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    renderTimezoneList('');
    searchInput.focus();
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
    renderTimezoneList(document.querySelector('.tz-search').value.trim());
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

  // Enter/Space on focused tz-item
  list.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.tz-item');
      if (!item) return;
      e.preventDefault();
      const tzId = item.dataset.tzId;
      toggleTimezone(tzId);
      renderTimezoneList(searchInput.value.trim());
      // Re-focus the item at same position
      requestAnimationFrame(() => {
        const items = [...list.querySelectorAll('.tz-item')];
        const match = items.find(el => el.dataset.tzId === tzId);
        if (match) match.focus();
      });
    }
  });
}

function openPanel() {
  state.isPanelOpen = true;
  const panel = document.querySelector('.tz-panel');
  const header = document.querySelector('.header');
  const searchInput = document.querySelector('.tz-search');
  const clearBtn = document.querySelector('.tz-search-clear');

  // Dynamic panel positioning (desktop only — mobile uses bottom: 0)
  if (window.innerWidth > 480) {
    panel.style.top = `${header.offsetHeight}px`;
  } else {
    panel.style.top = 'auto';
  }

  panel.classList.remove('hidden');
  panel.classList.remove('closing');
  document.querySelector('.tz-panel-backdrop').classList.remove('hidden');
  searchInput.value = '';
  clearBtn.classList.add('hidden');
  renderTimezoneList('');
  // Focus search after animation
  requestAnimationFrame(() => searchInput.focus());
}

function closePanel() {
  state.isPanelOpen = false;
  const panel = document.querySelector('.tz-panel');
  document.querySelector('.tz-panel-backdrop').classList.add('hidden');
  panel.classList.add('closing');
  panel.addEventListener('animationend', () => {
    panel.classList.add('hidden');
    panel.classList.remove('closing');
  }, { once: true });
  // Return focus to the trigger button
  document.querySelector('.add-tz-btn').focus();
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

  // Update select all button text with count
  const selectAllBtn = document.querySelector('.tz-select-all');
  const allSelected = ALL_TIMEZONES.every(tz => selectedIds.includes(tz.id));
  const selectedCount = selectedIds.length;
  const totalCount = ALL_TIMEZONES.length;
  selectAllBtn.textContent = allSelected
    ? `Deselect all (${totalCount})`
    : `Select all (${totalCount - selectedCount} more)`;

  // Empty state
  if (filtered.length === 0) {
    const escaped = filter.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    list.innerHTML = `
      <div class="tz-empty-state">
        <p>No timezones match "${escaped}"</p>
      </div>
    `;
    return;
  }

  list.setAttribute('role', 'listbox');
  list.innerHTML = filtered.map(tz => {
    const isSelected = selectedIds.includes(tz.id);
    const zoneDt = now.setZone(tz.id);
    const offset = zoneDt.toFormat('ZZ');
    const time = zoneDt.toFormat('h:mm a');
    return `
      <div class="tz-item ${isSelected ? 'active' : ''}" data-tz-id="${tz.id}" tabindex="0" role="option" aria-selected="${isSelected}">
        <span class="tz-item-flag">${tz.flag}</span>
        <div class="tz-item-info">
          <span class="tz-item-name">${tz.label}</span>
          <span class="tz-item-offset">UTC${offset} · ${time}</span>
        </div>
        <div class="tz-item-toggle">
          <input type="checkbox" class="sr-only" ${isSelected ? 'checked' : ''} aria-label="Toggle ${tz.label}" tabindex="-1" />
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
