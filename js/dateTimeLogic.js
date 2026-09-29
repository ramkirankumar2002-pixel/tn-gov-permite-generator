// =====================================================
// dateTimeLogic.js — All date/time calculations
// =====================================================

/**
 * Format a Date object as "DD-MM-YYYY HH:MM AM/PM"
 */
export function formatDateTime(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  let h = date.getHours();
  const min = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');
  return `${d}-${m}-${y} ${hh}:${min} ${ampm}`;
}

/**
 * Format a Date as "DD-MM-YYYY HH:MM" (24hr, for travelling date display)
 */
export function formatDateTime24(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${d}-${m}-${y} ${h}:${min}`;
}

/**
 * Add minutes to a Date (returns new Date, does not mutate)
 */
export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Subtract minutes from a Date
 */
export function subtractMinutes(date, minutes) {
  return new Date(date.getTime() - minutes * 60000);
}

/**
 * Parse a datetime-local string "YYYY-MM-DDTHH:MM" to Date
 */
export function parseDateTimeLocal(str) {
  return new Date(str);
}

/**
 * Convert current Date to datetime-local input string
 */
export function toDateTimeLocal(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Get dispatch date/time for permit i (0-indexed)
 * Interval = 25 minutes
 */
export function getDispatchTime(startDate, index, intervalMinutes = 25) {
  return addMinutes(startDate, index * intervalMinutes);
}

/**
 * Get travelling date = dispatch - 10 minutes
 */
export function getTravellingDate(dispatchDate) {
  return subtractMinutes(dispatchDate, 10);
}

/**
 * Get required time = travelling + 60 minutes
 * Returns display string: "1 hrs (DD-MM-YYYY HH:MM AM/PM)"
 */
export function getRequiredTime(travellingDate) {
  const req = addMinutes(travellingDate, 60);
  return `1 hrs (${formatDateTime(req)})`;
}
