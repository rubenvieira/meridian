export const ALL_TIMEZONES = [
  // Americas
  { id: 'Pacific/Honolulu',       label: 'Honolulu',          flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Anchorage',      label: 'Anchorage',         flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Los_Angeles',    label: 'Pacific Time',      flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Denver',         label: 'Mountain Time',     flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Phoenix',        label: 'Phoenix',           flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Chicago',        label: 'Central Time',      flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/New_York',       label: 'Eastern Time',      flag: '\u{1F1FA}\u{1F1F8}' },
  { id: 'America/Toronto',        label: 'Toronto',           flag: '\u{1F1E8}\u{1F1E6}' },
  { id: 'America/Vancouver',      label: 'Vancouver',         flag: '\u{1F1E8}\u{1F1E6}' },
  { id: 'America/Mexico_City',    label: 'Mexico City',       flag: '\u{1F1F2}\u{1F1FD}' },
  { id: 'America/Bogota',         label: 'Bogot\u00e1',       flag: '\u{1F1E8}\u{1F1F4}' },
  { id: 'America/Lima',           label: 'Lima',              flag: '\u{1F1F5}\u{1F1EA}' },
  { id: 'America/Santiago',       label: 'Santiago',           flag: '\u{1F1E8}\u{1F1F1}' },
  { id: 'America/Sao_Paulo',      label: 'S\u00e3o Paulo',    flag: '\u{1F1E7}\u{1F1F7}' },
  { id: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires', flag: '\u{1F1E6}\u{1F1F7}' },

  // Europe
  { id: 'Atlantic/Reykjavik',     label: 'Reykjavik',         flag: '\u{1F1EE}\u{1F1F8}' },
  { id: 'Europe/London',          label: 'London',            flag: '\u{1F1EC}\u{1F1E7}' },
  { id: 'Europe/Dublin',          label: 'Dublin',            flag: '\u{1F1EE}\u{1F1EA}' },
  { id: 'Europe/Lisbon',          label: 'Lisbon',            flag: '\u{1F1F5}\u{1F1F9}' },
  { id: 'Europe/Paris',           label: 'Paris',             flag: '\u{1F1EB}\u{1F1F7}' },
  { id: 'Europe/Berlin',          label: 'Berlin',            flag: '\u{1F1E9}\u{1F1EA}' },
  { id: 'Europe/Amsterdam',       label: 'Amsterdam',         flag: '\u{1F1F3}\u{1F1F1}' },
  { id: 'Europe/Madrid',          label: 'Madrid',            flag: '\u{1F1EA}\u{1F1F8}' },
  { id: 'Europe/Rome',            label: 'Rome',              flag: '\u{1F1EE}\u{1F1F9}' },
  { id: 'Europe/Zurich',          label: 'Zurich',            flag: '\u{1F1E8}\u{1F1ED}' },
  { id: 'Europe/Stockholm',       label: 'Stockholm',         flag: '\u{1F1F8}\u{1F1EA}' },
  { id: 'Europe/Warsaw',          label: 'Warsaw',            flag: '\u{1F1F5}\u{1F1F1}' },
  { id: 'Europe/Helsinki',        label: 'Helsinki',          flag: '\u{1F1EB}\u{1F1EE}' },
  { id: 'Europe/Athens',          label: 'Athens',            flag: '\u{1F1EC}\u{1F1F7}' },
  { id: 'Europe/Bucharest',       label: 'Bucharest',         flag: '\u{1F1F7}\u{1F1F4}' },
  { id: 'Europe/Istanbul',        label: 'Istanbul',          flag: '\u{1F1F9}\u{1F1F7}' },
  { id: 'Europe/Moscow',          label: 'Moscow',            flag: '\u{1F1F7}\u{1F1FA}' },

  // Africa
  { id: 'Africa/Cairo',           label: 'Cairo',             flag: '\u{1F1EA}\u{1F1EC}' },
  { id: 'Africa/Lagos',           label: 'Lagos',             flag: '\u{1F1F3}\u{1F1EC}' },
  { id: 'Africa/Johannesburg',    label: 'Johannesburg',      flag: '\u{1F1FF}\u{1F1E6}' },
  { id: 'Africa/Nairobi',         label: 'Nairobi',           flag: '\u{1F1F0}\u{1F1EA}' },

  // Middle East & Central Asia
  { id: 'Asia/Dubai',             label: 'Dubai',             flag: '\u{1F1E6}\u{1F1EA}' },
  { id: 'Asia/Riyadh',            label: 'Riyadh',            flag: '\u{1F1F8}\u{1F1E6}' },
  { id: 'Asia/Tehran',            label: 'Tehran',            flag: '\u{1F1EE}\u{1F1F7}' },
  { id: 'Asia/Karachi',           label: 'Karachi',           flag: '\u{1F1F5}\u{1F1F0}' },
  { id: 'Asia/Kolkata',           label: 'India (IST)',       flag: '\u{1F1EE}\u{1F1F3}' },
  { id: 'Asia/Dhaka',             label: 'Dhaka',             flag: '\u{1F1E7}\u{1F1E9}' },

  // East & Southeast Asia
  { id: 'Asia/Bangkok',           label: 'Bangkok',           flag: '\u{1F1F9}\u{1F1ED}' },
  { id: 'Asia/Jakarta',           label: 'Jakarta',           flag: '\u{1F1EE}\u{1F1E9}' },
  { id: 'Asia/Singapore',         label: 'Singapore',         flag: '\u{1F1F8}\u{1F1EC}' },
  { id: 'Asia/Hong_Kong',         label: 'Hong Kong',         flag: '\u{1F1ED}\u{1F1F0}' },
  { id: 'Asia/Shanghai',          label: 'Shanghai',          flag: '\u{1F1E8}\u{1F1F3}' },
  { id: 'Asia/Taipei',            label: 'Taipei',            flag: '\u{1F1F9}\u{1F1FC}' },
  { id: 'Asia/Seoul',             label: 'Seoul',             flag: '\u{1F1F0}\u{1F1F7}' },
  { id: 'Asia/Tokyo',             label: 'Tokyo',             flag: '\u{1F1EF}\u{1F1F5}' },

  // Oceania
  { id: 'Australia/Perth',        label: 'Perth',             flag: '\u{1F1E6}\u{1F1FA}' },
  { id: 'Australia/Sydney',       label: 'Sydney',            flag: '\u{1F1E6}\u{1F1FA}' },
  { id: 'Pacific/Auckland',       label: 'Auckland',          flag: '\u{1F1F3}\u{1F1FF}' },
];

export const DEFAULT_TIMEZONE_IDS = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Helsinki',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const STORAGE_KEY = 'meridian-selected-timezones';

export function getSelectedTimezoneIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const ids = JSON.parse(stored);
      if (Array.isArray(ids) && ids.length > 0) return ids;
    }
  } catch (e) { /* ignore */ }
  return [...DEFAULT_TIMEZONE_IDS];
}

export function saveSelectedTimezoneIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) { /* private browsing or quota exceeded */ }
}

export function getSelectedTimezones() {
  const ids = getSelectedTimezoneIds();
  return ids
    .map(id => ALL_TIMEZONES.find(tz => tz.id === id))
    .filter(Boolean);
}
