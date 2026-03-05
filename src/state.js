import { DateTime } from 'luxon';

export const state = {
  selectedDt: DateTime.now(),
  isDragging: false,
  dragStartX: 0,
  dragStartDt: null,
  isPanelOpen: false,
};
